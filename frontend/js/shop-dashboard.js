// @ts-nocheck
let allItems = [];
function requireShopManager() {
    if (!isStaffLoggedIn()) {
        window.location.href = '/staff-login';
    }
}
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    if (tabName === 'inventory') {
        loadInventory();
    }
}
async function loadDashboard() {
    try {
        const response = await fetch('/api/shop-orders/shop/dashboard', {
            headers: { 'x-staff-id': localStorage.getItem('staffId') }
        });
        const data = await response.json();
        if (response.ok) {
            document.getElementById('totalOrders').textContent = data.stats.myOrders;
            document.getElementById('pendingOrders').textContent = data.stats.pending;
            document.getElementById('confirmedOrders').textContent = data.stats.confirmed;
            document.getElementById('closedOrders').textContent = data.stats.closed || 0;
            displayOrders(data.recentOrders);
        }
        else {
            showError(data);
        }
    }
    catch (error) {
        showError(error);
    }
}
async function loadInventory() {
    try {
        const response = await fetch('/api/items', {
            headers: { 'x-staff-id': localStorage.getItem('staffId') }
        });
        allItems = await response.json();
        const html = allItems.map(item => `
          <div class="item-card">
            <div class="item-image">ðŸ“¦</div>
            <div class="item-info">
              <div class="item-name">${item.name}</div>
              <div class="item-category">${item.category || 'General'}</div>
              <div style="color: #27ae60; font-weight: bold; margin: 0.5rem 0;">Rs. ${item.price.toFixed(2)}/day</div>
              <div style="color: #7f8c8d; font-size: 0.9rem;">Available: <strong>${item.quantity}</strong></div>
            </div>
          </div>
        `).join('');
        document.getElementById('inventoryGrid').innerHTML = html;
        populateItemSelects(allItems);
    }
    catch (error) {
        showError(error);
    }
}
function populateItemSelects(items) {
    document.getElementById('customerItemId').innerHTML = '<option value="">-- Select Item --</option>' +
        items.map(item => `<option value="${item._id}" data-price="${item.price}">${item.name} (Rs.${item.price}/day)</option>`).join('');
}
function displayOrders(orders) {
    const tbody = document.getElementById('ordersBody');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No orders</td></tr>';
        return;
    }
    tbody.innerHTML = orders.map(order => {
        const customerName = order.customerInfo?.name || '-';
        const advance = order.advancePayment || 0;
        const invoiceNum = order.invoiceNumber || '-';
        const canClose = ['pending', 'confirmed', 'active'].includes(order.status);
        return `
        <tr>
          <td style="font-size:0.8rem;">${invoiceNum}</td>
          <td>${customerName}</td>
          <td>${order.itemId?.name || 'N/A'}</td>
          <td>${order.quantity}</td>
          <td>${order.status === 'closed' ? (order.actualDays || order.rentalDays) : order.rentalDays}</td>
          <td>Rs. ${advance.toFixed(2)}</td>
          <td>Rs. ${order.status === 'closed' ? (order.finalAmount || order.totalPrice).toFixed(2) : order.totalPrice.toFixed(2)}</td>
          <td>${order.orderType === 'shop-to-warehouse' ? 'ðŸ“¥ Warehouse' : 'ðŸ‘¤ Customer'}</td>
          <td><span class="status-badge status-${order.status}">${order.status}</span></td>
          <td style="white-space: nowrap;">
            <button onclick="viewInvoice('${order._id}')" class="btn btn-small" style="background:#3498db;">ðŸ“„ View</button>
            ${order.status === 'pending' ? `<button onclick="confirmOrder('${order._id}')" class="btn btn-small" style="background:#27ae60;">âœ… Confirm</button>` : ''}
            ${canClose ? `<button onclick="closeOrder('${order._id}')" class="btn btn-small" style="background:#e74c3c;">ðŸ”’ Close</button>` : ''}
            ${order.status !== 'closed' ? `<button onclick="deleteOrder('${order._id}')" class="btn btn-small" style="background:#95a5a6;">ðŸ—‘ï¸ Delete</button>` : ''}
          </td>
        </tr>`;
    }).join('');
}
// ---------- Invoice Modal ----------
function closeInvoiceModal() {
    document.getElementById('invoiceModal').classList.remove('show');
}
// ---------- Confirm Order ----------
async function confirmOrder(orderId) {
    if (!confirm('Confirm this order?'))
        return;
    try {
        const response = await fetch(`/api/shop-orders/${orderId}/confirm`, {
            method: 'PUT',
            headers: {
                'x-staff-id': localStorage.getItem('staffId')
            }
        });
        const data = await response.json();
        if (response.ok) {
            showMessage('Order confirmed!', 'success');
            loadDashboard();
        }
        else {
            showError(data);
        }
    }
    catch (error) {
        showError(error);
    }
}
// ---------- Delete Order ----------
async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.'))
        return;
    try {
        const response = await fetch(`/api/shop-orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'x-staff-id': localStorage.getItem('staffId')
            }
        });
        const data = await response.json();
        if (response.ok) {
            showMessage('Order deleted successfully!', 'success');
            loadDashboard();
        }
        else {
            showError(data);
        }
    }
    catch (error) {
        showError(error);
    }
}
async function viewInvoice(orderId) {
    try {
        const response = await fetch(`/api/shop-orders/shop/invoice/${orderId}`, {
            headers: { 'x-staff-id': localStorage.getItem('staffId') }
        });
        const order = await response.json();
        if (!response.ok) {
            showError(order);
            return;
        }
        renderInvoice(order);
        document.getElementById('invoiceModal').classList.add('show');
    }
    catch (error) {
        showError(error);
    }
}
function renderInvoice(order) {
    const isClosed = order.status === 'closed';
    const itemName = order.itemId?.name || 'N/A';
    const pricePerDay = order.itemId?.price || 0;
    const advance = order.advancePayment || 0;
    const agreedDays = order.rentalDays;
    const actualDays = order.actualDays || agreedDays;
    const isOverdue = actualDays > agreedDays;
    const totalPrice = isClosed ? (order.finalAmount || order.totalPrice) : order.totalPrice;
    const balanceDue = isClosed ? (order.balanceDue ?? (totalPrice - advance)) : (order.totalPrice - advance);
    document.getElementById('invoiceNumberHeader').textContent = order.invoiceNumber || '';
    let html = `
        <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem;">
          <div>
            <strong>Customer:</strong> ${order.customerInfo?.name || 'N/A'}<br>
            <strong>Phone:</strong> ${order.customerInfo?.phone || '-'}<br>
            <strong>Address:</strong> ${order.customerInfo?.address || '-'}
          </div>
          <div style="text-align:right;">
            <strong>Date:</strong> ${new Date(order.startDate).toLocaleDateString()}<br>
            <strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span><br>
            ${isClosed ? `<strong>Closed:</strong> ${new Date(order.closedAt).toLocaleString()}<br>` : ''}
            ${isClosed && isOverdue ? `<span style="color:#e74c3c; font-weight:bold;">âš ï¸ OVERDUE (${actualDays - agreedDays} extra day${actualDays - agreedDays > 1 ? 's' : ''})</span>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Price/Day</th>
              <th>Qty</th>
              <th>Agreed Days</th>
              ${isClosed ? '<th>Actual Days</th>' : ''}
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${itemName}</td>
              <td>Rs. ${pricePerDay.toFixed(2)}</td>
              <td>${order.quantity}</td>
              <td>${agreedDays}</td>
              ${isClosed ? `<td${isOverdue ? ' style="color:#e74c3c;font-weight:bold;"' : ''}>${actualDays}</td>` : ''}
              <td style="text-align:right;">Rs. ${totalPrice.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="invoice-totals">
          <div class="row">
            <span>Estimated Total (${agreedDays} days):</span>
            <span>Rs. ${(pricePerDay * order.quantity * agreedDays).toFixed(2)}</span>
          </div>
          ${isClosed && isOverdue ? `
          <div class="row overdue">
            <span>Overdue Charge (${actualDays - agreedDays} extra day${actualDays - agreedDays > 1 ? 's' : ''}):</span>
            <span>Rs. ${(pricePerDay * order.quantity * (actualDays - agreedDays)).toFixed(2)}</span>
          </div>` : ''}
          <div class="row" style="font-weight:600;">
            <span>Final Amount${isClosed ? '' : ' (estimated)'}:</span>
            <span>Rs. ${totalPrice.toFixed(2)}</span>
          </div>
          <div class="row" style="color:#27ae60;">
            <span>Advance Paid:</span>
            <span>- Rs. ${advance.toFixed(2)}</span>
          </div>
          <div class="row total">
            <span>Balance Due:</span>
            <span style="color:${balanceDue > 0 ? '#e74c3c' : '#27ae60'};">Rs. ${balanceDue.toFixed(2)}</span>
          </div>
        </div>

        ${!isClosed ? `
        <div style="margin-top:1.5rem; padding:1rem; background:#fff3cd; border-radius:6px; text-align:center;">
          <strong>â³ Order is still open.</strong><br>
          Final invoice will be generated when the order is closed.<br>
          <small>Note: If the item is returned after 9:00 AM, an extra day will be charged.</small>
        </div>` : `
        <div style="margin-top:1.5rem; padding:1rem; background:#d5f4e6; border-radius:6px; text-align:center;">
          <strong>âœ… Order Closed</strong><br>
          <small>Returned: ${new Date(order.actualReturnDate).toLocaleString()}</small>
        </div>`}
      `;
    document.getElementById('invoiceBody').innerHTML = html;
}
// ---------- Close Order ----------
async function closeOrder(orderId) {
    if (!confirm('Are you sure you want to close this order? This will calculate the final amount including any overdue charges.'))
        return;
    try {
        const response = await fetch(`/api/shop-orders/shop/close-order/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-staff-id': localStorage.getItem('staffId')
            }
        });
        const data = await response.json();
        if (response.ok) {
            showMessage('Order closed successfully!', 'success');
            loadDashboard();
            // Auto open the final invoice
            setTimeout(() => viewInvoice(orderId), 500);
        }
        else {
            showError(data);
        }
    }
    catch (error) {
        showError(error);
    }
}
// ---------- Cost calculators ----------
document.getElementById('customerItemId')?.addEventListener('change', updateCustomerCost);
document.getElementById('customerQty')?.addEventListener('input', updateCustomerCost);
document.getElementById('customerDays')?.addEventListener('input', updateCustomerCost);
function updateCustomerCost() {
    const item = allItems.find(i => i._id === document.getElementById('customerItemId').value);
    if (item) {
        const cost = item.price * (parseInt(document.getElementById('customerQty').value) || 1) * (parseInt(document.getElementById('customerDays').value) || 1);
        document.getElementById('customerCost').textContent = cost.toFixed(2);
    }
}
async function createCustomerOrder() {
    const itemId = document.getElementById('customerItemId').value;
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    if (!itemId || !customerName || !customerPhone) {
        showMessage('Fill all required fields', 'error');
        return;
    }
    try {
        const response = await fetch('/api/shop-orders/shop/customer-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-staff-id': localStorage.getItem('staffId')
            },
            body: JSON.stringify({
                itemId,
                quantity: parseInt(document.getElementById('customerQty').value) || 1,
                rentalDays: parseInt(document.getElementById('customerDays').value) || 1,
                customerName,
                customerPhone,
                customerAddress: document.getElementById('customerAddress').value,
                advancePayment: parseFloat(document.getElementById('customerAdvance').value) || 0
            })
        });
        const data = await response.json();
        if (response.ok) {
            showMessage('Customer order created!', 'success');
            // Auto-show the invoice for the new order
            viewInvoice(data.order._id);
            loadDashboard();
            // Reset form
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            document.getElementById('customerAddress').value = '';
            document.getElementById('customerAdvance').value = '0';
            document.getElementById('customerItemId').value = '';
            document.getElementById('customerQty').value = '1';
            document.getElementById('customerDays').value = '7';
            document.getElementById('customerCost').textContent = '0.00';
        }
        else {
            showError(data);
        }
    }
    catch (error) {
        showError(error);
    }
}
requireShopManager();
loadInventory();
loadDashboard();
