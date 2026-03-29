// @ts-nocheck
let currentOrderId = null;
    let allOrders = [];

    function requireWarehouseManager() {
      if (!isStaffLoggedIn()) {
        window.location.href = '/staff-login';
      }
    }

    function switchTab(tabName) {
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      
      document.getElementById(tabName).classList.add('active');
      event.target.classList.add('active');

      if (tabName === 'confirmed') {
        loadConfirmedOrders();
      } else if (tabName === 'inventory') {
        loadInventorySummary();
      } else if (tabName === 'manage-inventory') {
        loadAllInventory();
      }
    }

    async function loadDashboard() {
      try {
        const response = await fetch('/api/shop-orders/warehouse/dashboard', {
          headers: { 'x-staff-id': localStorage.getItem('staffId') }
        });
        const data = await response.json();

        if (response.ok) {
          document.getElementById('pendingOrders').textContent = data.stats.pending;
          document.getElementById('confirmedToday').textContent = data.stats.confirmedToday || 0;
          document.getElementById('totalOrders').textContent = data.stats.total;
          loadPendingOrders();
        } else {
          showError(data);
        }
      } catch (error) {
        showError(error);
      }
    }

    async function loadPendingOrders() {
      try {
        const response = await fetch('/api/shop-orders/warehouse/all', {
          headers: { 'x-staff-id': localStorage.getItem('staffId') }
        });
        const orders = await response.json();
        allOrders = orders;

        const tbody = document.getElementById('pendingBody');
        if (!orders || orders.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center">No pending orders</td></tr>';
          return;
        }

        tbody.innerHTML = orders.filter(o => o.status === 'pending').map(order => `
          <tr>
            <td>${order.shopId?.name || 'Unknown Shop'}</td>
            <td>${order.itemId?.name || 'Unknown Item'}</td>
            <td>${order.quantity}</td>
            <td>${order.rentalDays}</td>
            <td>Rs. ${order.totalPrice?.toFixed(2) || '0.00'}</td>
            <td>
              <span class="status-badge ${order.orderType === 'customer' ? 'order-type-customer' : 'order-type-warehouse'}">
                ${order.orderType === 'customer' ? 'ðŸ‘¤ Customer' : 'ðŸ“¥ Shop'}
              </span>
            </td>
            <td>
              <button onclick="viewOrderDetails('${order._id}')" class="btn-small" style="background: #3498db; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer;">
                View
              </button>
            </td>
          </tr>
        `).join('');
      } catch (error) {
        showError(error);
      }
    }

    async function loadConfirmedOrders() {
      try {
        const response = await fetch('/api/shop-orders/warehouse/all', {
          headers: { 'x-staff-id': localStorage.getItem('staffId') }
        });
        const orders = await response.json();

        const tbody = document.getElementById('confirmedBody');
        const confirmed = orders.filter(o => o.status === 'confirmed');
        
        if (confirmed.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center">No confirmed orders</td></tr>';
          return;
        }

        tbody.innerHTML = confirmed.map(order => `
          <tr>
            <td>${order.shopId?.name || 'Unknown Shop'}</td>
            <td>${order.itemId?.name || 'Unknown Item'}</td>
            <td>${order.quantity}</td>
            <td>${order.rentalDays}</td>
            <td>Rs. ${order.totalPrice?.toFixed(2) || '0.00'}</td>
            <td>${new Date(order.confirmedAt).toLocaleDateString()}</td>
            <td>
              <span class="status-badge ${order.orderType === 'customer' ? 'order-type-customer' : 'order-type-warehouse'}">
                ${order.orderType === 'customer' ? 'ðŸ‘¤ Customer' : 'ðŸ“¥ Shop'}
              </span>
            </td>
          </tr>
        `).join('');
      } catch (error) {
        showError(error);
      }
    }

    async function loadInventorySummary() {
      try {
        const response = await fetch('/api/shop-orders/warehouse/shop-inventory', {
          headers: { 'x-staff-id': localStorage.getItem('staffId') }
        });
        const data = await response.json();

        const container = document.getElementById('inventorySummary');
        if (!data || data.length === 0) {
          container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #7f8c8d;">No shop inventory data</div>';
          return;
        }

        const html = data.map(item => `
          <div class="inventory-item">
            <div class="shop-name">${item._id.shopName}</div>
            <div class="item-desc">${item._id.itemName}</div>
            <div class="qty">${item.totalQuantity} units</div>
            <div style="font-size: 0.85rem; color: #7f8c8d; margin-top: 0.5rem;">
              ${item.orders} orders
            </div>
          </div>
        `).join('');

        container.innerHTML = html;
      } catch (error) {
        showError(error);
      }
    }

    function viewOrderDetails(orderId) {
      const order = allOrders.find(o => o._id === orderId);
      if (!order) return;

      currentOrderId = orderId;

      document.getElementById('modalShop').textContent = order.shopId?.name || 'Unknown';
      document.getElementById('modalItem').textContent = order.itemId?.name || 'Unknown';
      document.getElementById('modalQty').textContent = order.quantity;
      document.getElementById('modalDays').textContent = order.rentalDays;
      document.getElementById('modalPrice').textContent = 'Rs' + (order.totalPrice?.toFixed(2) || '0.00');
      document.getElementById('modalType').textContent = order.orderType === 'customer' ? 'ðŸ‘¤ Customer Order' : 'ðŸ“¥ Shop Order';

      const customerSection = document.getElementById('customerInfoSection');
      const confirmBtn = document.getElementById('confirmBtn');

      if (order.orderType === 'customer' && order.customerInfo) {
        customerSection.style.display = 'block';
        document.getElementById('modalCustomerName').textContent = order.customerInfo.name || '-';
        document.getElementById('modalCustomerPhone').textContent = order.customerInfo.phone || '-';
        document.getElementById('modalCustomerAddress').textContent = order.customerInfo.address || '-';
      } else {
        customerSection.style.display = 'none';
      }

      confirmBtn.style.display = order.status === 'pending' ? 'block' : 'none';
      document.getElementById('orderModal').classList.add('show');
    }

    function closeModal() {
      document.getElementById('orderModal').classList.remove('show');
      currentOrderId = null;
    }

    async function confirmOrder() {
      if (!currentOrderId) return;

      const confirmBtn = document.getElementById('confirmBtn');
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Confirming...';

      try {
        const response = await fetch(`/api/shop-orders/${currentOrderId}/confirm`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-staff-id': localStorage.getItem('staffId')
          },
          body: JSON.stringify({})
        });

        const data = await response.json();
        if (response.ok) {
          showMessage('Order confirmed successfully!', 'success');
          closeModal();
          loadDashboard();
        } else {
          showError(data);
        }
      } catch (error) {
        showError(error);
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'âœ… Confirm Order';
      }
    }

    window.onclick = function(event) {
      const modal = document.getElementById('orderModal');
      if (event.target === modal) {
        closeModal();
      }
    };

    // Inventory Management Functions
    async function loadAllInventory() {
      try {
        const response = await fetch('/api/items');
        const items = await response.json();
        displayInventory(items);
      } catch (error) {
        showError(error);
      }
    }

    function displayInventory(items) {
      const tbody = document.getElementById('inventoryBody');
      if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No items in inventory</td></tr>';
        return;
      }

      tbody.innerHTML = items.map(item => `
        <tr>
          <td>${item.itemNumber || '-'}</td>
          <td>${item.name}</td>
          <td>${item.category || '-'}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span id="price-${item._id}">Rs. ${item.price.toFixed(2)}</span>
              <input type="number" id="price-input-${item._id}" style="width: 80px; padding: 0.25rem;" value="${item.price}" min="0" step="0.01" style="display: none;">
              <button onclick="togglePriceEdit('${item._id}')" class="btn-small" style="background: #9b59b6; color: white; border: none; padding: 0.35rem 0.65rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                Edit
              </button>
              <button onclick="savePrice('${item._id}')" id="save-price-btn-${item._id}" class="btn-small" style="background: #27ae60; color: white; border: none; padding: 0.35rem 0.65rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem; display: none;">
                Save
              </button>
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span id="qty-${item._id}">${item.quantity}</span>
              <input type="number" id="qty-input-${item._id}" style="width: 60px; padding: 0.25rem;" value="${item.quantity}" min="0" style="display: none;">
              <button onclick="toggleQtyEdit('${item._id}')" class="btn-small" style="background: #3498db; color: white; border: none; padding: 0.35rem 0.65rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                Edit
              </button>
              <button onclick="saveQty('${item._id}')" id="save-btn-${item._id}" class="btn-small" style="background: #27ae60; color: white; border: none; padding: 0.35rem 0.65rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; display: none;">
                Save
              </button>
            </div>
          </td>
          <td>
            <button onclick="deleteItem('${item._id}')" class="btn-small" style="background: #e74c3c; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer;">
              Delete
            </button>
          </td>
        </tr>
      `).join('');
    }

    function toggleQtyEdit(itemId) {
      const qtySpan = document.getElementById(`qty-${itemId}`);
      const qtyInput = document.getElementById(`qty-input-${itemId}`);
      const editBtn = event.target;
      const saveBtn = document.getElementById(`save-btn-${itemId}`);

      if (qtyInput.style.display === 'none') {
        qtySpan.style.display = 'none';
        qtyInput.style.display = 'inline';
        editBtn.textContent = 'Cancel';
        editBtn.style.background = '#95a5a6';
        saveBtn.style.display = 'inline';
      } else {
        qtySpan.style.display = 'inline';
        qtyInput.style.display = 'none';
        editBtn.textContent = 'Edit';
        editBtn.style.background = '#3498db';
        saveBtn.style.display = 'none';
      }
    }

    async function saveQty(itemId) {
      const newQty = parseInt(document.getElementById(`qty-input-${itemId}`).value);

      if (isNaN(newQty) || newQty < 0) {
        showMessage('Please enter a valid quantity', 'error');
        return;
      }

      try {
        const response = await fetch(`/api/items/${itemId}/quantity`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-staff-id': localStorage.getItem('staffId')
          },
          body: JSON.stringify({ quantity: newQty })
        });

        const data = await response.json();
        if (response.ok) {
          showMessage('Quantity updated successfully!', 'success');
          loadAllInventory();
        } else {
          showError(data);
        }
      } catch (error) {
        showError(error);
      }
    }

    function togglePriceEdit(itemId) {
      const priceSpan = document.getElementById(`price-${itemId}`);
      const priceInput = document.getElementById(`price-input-${itemId}`);
      const editBtn = event.target;
      const saveBtn = document.getElementById(`save-price-btn-${itemId}`);

      if (priceInput.style.display === 'none') {
        priceSpan.style.display = 'none';
        priceInput.style.display = 'inline';
        editBtn.textContent = 'Cancel';
        editBtn.style.background = '#95a5a6';
        saveBtn.style.display = 'inline';
      } else {
        priceSpan.style.display = 'inline';
        priceInput.style.display = 'none';
        editBtn.textContent = 'Edit';
        editBtn.style.background = '#9b59b6';
        saveBtn.style.display = 'none';
      }
    }

    async function savePrice(itemId) {
      const newPrice = parseFloat(document.getElementById(`price-input-${itemId}`).value);

      if (isNaN(newPrice) || newPrice < 0) {
        showMessage('Please enter a valid price', 'error');
        return;
      }

      try {
        const response = await fetch(`/api/items/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-staff-id': localStorage.getItem('staffId')
          },
          body: JSON.stringify({ price: newPrice })
        });

        const data = await response.json();
        if (response.ok) {
          showMessage('Price updated successfully!', 'success');
          loadAllInventory();
        } else {
          showError(data);
        }
      } catch (error) {
        showError(error);
      }
    }

    async function addNewItem() {
      const name = document.getElementById('newItemName').value;
      const price = parseFloat(document.getElementById('newItemPrice').value);
      const quantity = parseInt(document.getElementById('newItemQty').value);
      const category = document.getElementById('newItemCategory').value;
      const description = document.getElementById('newItemDesc').value;
      const itemNumber = document.getElementById('newItemNumber').value;

      if (!name || isNaN(price) || isNaN(quantity)) {
        showMessage('Please fill in all required fields', 'error');
        return;
      }

      try {
        const response = await fetch('/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-staff-id': localStorage.getItem('staffId')
          },
          body: JSON.stringify({
            name,
            price,
            quantity,
            category: category || 'General',
            description: description || '',
            itemNumber: itemNumber || undefined
          })
        });

        const data = await response.json();
        if (response.ok) {
          showMessage('Item added successfully!', 'success');
          // Clear form
          document.getElementById('newItemName').value = '';
          document.getElementById('newItemPrice').value = '';
          document.getElementById('newItemQty').value = '';
          document.getElementById('newItemCategory').value = '';
          document.getElementById('newItemDesc').value = '';
          document.getElementById('newItemNumber').value = '';
          loadAllInventory();
        } else {
          showError(data);
        }
      } catch (error) {
        showError(error);
      }
    }

    async function deleteItem(itemId) {
      if (!confirm('Are you sure you want to delete this item?')) {
        return;
      }

      try {
        const response = await fetch(`/api/items/${itemId}`, {
          method: 'DELETE',
          headers: {
            'x-staff-id': localStorage.getItem('staffId')
          }
        });

        const data = await response.json();
        if (response.ok) {
          showMessage('Item deleted successfully!', 'success');
          loadAllInventory();
        } else {
          showError(data);
        }
      } catch (error) {
        showError(error);
      }
    }

    requireWarehouseManager();
    loadDashboard();

