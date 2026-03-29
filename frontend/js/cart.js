// @ts-nocheck
requireLogin();
async function loadCart() {
    try {
        const cart = await getCart();
        displayCart(cart);
    }
    catch (error) {
        document.getElementById('cartContent').innerHTML = `<p style="color: red;">Error loading cart: ${error.message}</p>`;
    }
}
function displayCart(cart) {
    const items = cart.items || [];
    if (items.length === 0) {
        document.getElementById('cartContent').innerHTML = `
          <div class="card">
            <p class="text-center">Your cart is empty</p>
            <p class="text-center"><a href="/dashboard" class="btn">Continue Shopping</a></p>
          </div>
        `;
        document.getElementById('cartTotal').style.display = 'none';
        return;
    }
    let subtotal = 0;
    const html = items.map(item => {
        const itemData = item.itemId;
        const itemTotal = itemData.price * item.quantity * item.rentalDays;
        subtotal += itemTotal;
        return `
          <div class="card">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start;">
              <div>
                <h3>${itemData.name}</h3>
                <p>${itemData.description || 'No description'}</p>
                <p class="text-center" style="margin-top: 1rem;">
                  <strong>Rs${itemData.price.toFixed(2)}</strong>/day
                </p>
              </div>
              <div>
                <div style="margin-bottom: 0.5rem;">
                  <label>Quantity:</label>
                  <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity('${item.itemId._id}', this.value)">
                </div>
                <div style="margin-bottom: 0.5rem;">
                  <label>Rental Days:</label>
                  <input type="number" value="${item.rentalDays}" min="1" onchange="updateDays('${item.itemId._id}', this.value)">
                </div>
                <div style="margin-bottom: 1rem;">
                  <strong>Item Total: Rs${itemTotal.toFixed(2)}</strong>
                </div>
                <button onclick="removeItem('${item.itemId._id}')" class="danger" style="width: 100%;">Remove</button>
              </div>
            </div>
          </div>
        `;
    }).join('');
    document.getElementById('cartContent').innerHTML = html;
    document.getElementById('subtotal').textContent = 'Rs' + subtotal.toFixed(2);
    document.getElementById('total').textContent = 'Rs' + subtotal.toFixed(2);
    document.getElementById('cartTotal').style.display = 'block';
}
async function removeItem(itemId) {
    try {
        await removeFromCart(itemId);
        showMessage('Item removed', 'success');
        loadCart();
    }
    catch (error) {
        showError(error);
    }
}
async function updateQuantity(itemId, quantity) {
    // Reload cart to update
    loadCart();
}
async function updateDays(itemId, days) {
    // Reload cart to update
    loadCart();
}
async function clearCart() {
    if (!confirm('Are you sure you want to clear the cart?'))
        return;
    try {
        await apiCall('/cart/clear', 'POST');
        showMessage('Cart cleared', 'success');
        loadCart();
    }
    catch (error) {
        showError(error);
    }
}
async function checkout() {
    try {
        const cart = await getCart();
        const items = cart.items || [];
        if (items.length === 0) {
            showMessage('Cart is empty', 'error');
            return;
        }
        // Create rentals for each item
        for (const cartItem of items) {
            const itemData = cartItem.itemId;
            const totalPrice = itemData.price * cartItem.quantity * cartItem.rentalDays;
            await createRental(itemData._id, cartItem.quantity, cartItem.rentalDays, totalPrice);
        }
        // Clear cart
        await clearCart();
        showMessage('Rental created successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/profile';
        }, 1500);
    }
    catch (error) {
        showError(error);
    }
}
loadCart();
