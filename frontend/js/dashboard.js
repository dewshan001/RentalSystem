// @ts-nocheck
requireLogin();
let allItems = [];
async function loadItems() {
    try {
        const response = await getItems();
        allItems = response;
        if (allItems.length === 0) {
            document.getElementById('itemsContainer').innerHTML = '<p class="text-center">No items available</p>';
            return;
        }
        // Populate category filter
        const categories = [...new Set(allItems.map(item => item.category).filter(Boolean))];
        const categorySelect = document.getElementById('categoryFilter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
        displayItems(allItems);
        updateCartSummary();
    }
    catch (error) {
        document.getElementById('itemsContainer').innerHTML = `<p class="text-center" style="color: red;">Error loading items: ${error.message}</p>`;
    }
}
function filterItems() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const filtered = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchInput) ||
            item.category?.toLowerCase().includes(searchInput) ||
            item.itemNumber?.toString().includes(searchInput);
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    displayItems(filtered);
}
function displayItems(items) {
    if (items.length === 0) {
        document.getElementById('itemsContainer').innerHTML = '<p class="text-center">No items found</p>';
        return;
    }
    const html = items.map(item => `
        <div class="item-card">
          <div class="item-image">ðŸ”§</div>
          <div class="item-info">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <div class="item-name">${item.name}</div>
                ${item.itemNumber ? `<div style="font-size: 0.85rem; color: #7f8c8d; margin-bottom: 0.25rem;">Item #${item.itemNumber}</div>` : ''}
              </div>
              <div style="background: #3498db; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">
                ${item.category || 'General'}
              </div>
            </div>
            <div class="item-category" style="font-size: 0.9rem; color: #7f8c8d; margin-bottom: 0.5rem;">
              Available: <strong>${item.quantity}</strong> unit${item.quantity !== 1 ? 's' : ''}
            </div>
            ${item.description ? `<div class="item-description" style="font-size: 0.9rem; margin-bottom: 0.5rem;">${item.description}</div>` : ''}
            <div class="item-price" style="font-size: 1.25rem; color: #27ae60; font-weight: bold; margin-bottom: 0.75rem;">Rs${item.price.toFixed(2)}/day</div>
            <div class="item-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <input type="number" id="qty-${item._id}" value="1" min="1" max="${item.quantity}" placeholder="Qty" style="width: 60px; padding: 0.5rem; border: 1px solid #bdc3c7; border-radius: 4px;">
              <input type="number" id="days-${item._id}" value="1" min="1" placeholder="Days" style="flex: 1; padding: 0.5rem; border: 1px solid #bdc3c7; border-radius: 4px;">
              <button onclick="addItemToCart('${item._id}')" class="success" style="padding: 0.5rem 1rem;">Add to Cart</button>
            </div>
          </div>
        </div>
      `).join('');
    document.getElementById('itemsContainer').innerHTML = html;
}
async function addItemToCart(itemId) {
    try {
        const quantity = parseInt(document.getElementById(`qty-${itemId}`).value) || 1;
        const rentalDays = parseInt(document.getElementById(`days-${itemId}`).value) || 1;
        await addToCart(itemId, quantity, rentalDays);
        showMessage('Item added to cart!', 'success');
        updateCartSummary();
    }
    catch (error) {
        showError(error);
    }
}
async function updateCartSummary() {
    try {
        const cart = await getCart();
        const cartCount = cart.items ? cart.items.length : 0;
        const totalQty = cart.items ? cart.items.reduce((sum, i) => sum + (i.quantity || 1), 0) : 0;
        // Update header badge
        const badge = document.getElementById('cartBadge');
        if (totalQty > 0) {
            badge.textContent = totalQty;
            badge.style.display = 'inline-block';
            // trigger bounce animation
            badge.classList.remove('bounce');
            void badge.offsetWidth; // reflow to restart animation
            badge.classList.add('bounce');
        }
        else {
            badge.style.display = 'none';
        }
        if (cartCount > 0) {
            document.getElementById('cartCount').textContent = cartCount;
            document.getElementById('cartSummary').style.display = 'block';
        }
        else {
            document.getElementById('cartSummary').style.display = 'none';
        }
    }
    catch (error) {
        // Ignore errors
    }
}
loadItems();
