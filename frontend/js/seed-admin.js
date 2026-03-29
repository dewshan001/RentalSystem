// @ts-nocheck
// Items preview data
const seedItems = [
    { itemNumber: 1, name: 'Angle Grinder 4"', category: 'Grinders', quantity: 10, price: 15 },
    { itemNumber: 2, name: 'Angle Grinder 4-1/2"', category: 'Grinders', quantity: 10, price: 18 },
    { itemNumber: 3, name: 'Angle Grinder 7"', category: 'Grinders', quantity: 5, price: 22 },
    { itemNumber: 4, name: 'Angle Grinder 7"', category: 'Grinders', quantity: 3, price: 22 },
    { itemNumber: 5, name: 'Drill Machine', category: 'Drills', quantity: 15, price: 20 },
    { itemNumber: 6, name: 'Rechargeable Drill', category: 'Drills', quantity: 3, price: 25 },
    { itemNumber: 7, name: 'Hiltty (Hammer Drill)', category: 'Drills', quantity: 15, price: 28 },
    { itemNumber: 8, name: 'Breaker 5 KG', category: 'Breaking Tools', quantity: 10, price: 30 },
    { itemNumber: 9, name: 'Demolizer', category: 'Breaking Tools', quantity: 5, price: 35 },
    { itemNumber: 10, name: 'Putty Mixer', category: 'Mixers', quantity: 10, price: 18 },
    { itemNumber: 11, name: 'Circular Saw', category: 'Saws', quantity: 10, price: 20 },
    { itemNumber: 12, name: 'Marble Cutter', category: 'Saws', quantity: 5, price: 40 },
    { itemNumber: 13, name: 'Sander 4"', category: 'Finishing', quantity: 3, price: 22 },
    { itemNumber: 14, name: 'Sander', category: 'Finishing', quantity: 5, price: 20 },
    { itemNumber: 15, name: 'Orbital Sander', category: 'Finishing', quantity: 3, price: 25 },
    { itemNumber: 16, name: 'Mitre Saw', category: 'Saws', quantity: 4, price: 32 },
    { itemNumber: 17, name: 'Cut-off Saw', category: 'Saws', quantity: 5, price: 30 },
    { itemNumber: 18, name: 'Jig Saw', category: 'Saws', quantity: 5, price: 22 },
    { itemNumber: 19, name: 'Chain Saw', category: 'Saws', quantity: 3, price: 35 },
    { itemNumber: 20, name: 'Router', category: 'Power Tools', quantity: 2, price: 28 },
    { itemNumber: 21, name: 'Planer', category: 'Power Tools', quantity: 3, price: 32 },
    { itemNumber: 22, name: 'Electric Poker', category: 'Concrete Tools', quantity: 5, price: 18 },
    { itemNumber: 23, name: 'Blower', category: 'Cleaning Equipment', quantity: 5, price: 12 },
    { itemNumber: 24, name: 'High Pressure Washer Small', category: 'Cleaning Equipment', quantity: 9, price: 20 },
    { itemNumber: 25, name: 'Air Compressor', category: 'Cleaning Equipment', quantity: 20, price: 30 },
    { itemNumber: 26, name: 'Arc Welding Plant', category: 'Welding', quantity: 15, price: 85 },
    { itemNumber: 27, name: 'Mig Welding Plant', category: 'Welding', quantity: 3, price: 95 },
    { itemNumber: 28, name: 'Tig Welding Plant', category: 'Welding', quantity: 3, price: 120 },
];
function displayItemsList() {
    const listHtml = seedItems.map(item => `<div class="item-row">
          <strong>#${item.itemNumber}</strong> - ${item.name} 
          <span style="color: #7f8c8d;">(${item.category}, Qty: ${item.quantity}, Rs${item.price}/day)</span>
        </div>`).join('');
    document.getElementById('itemsList').innerHTML = listHtml;
}
async function checkStatus() {
    try {
        const response = await fetch('/api/seed/status');
        const data = await response.json();
        const statusDiv = document.getElementById('statusDisplay');
        const statsDiv = document.getElementById('statsDisplay');
        const itemCount = document.getElementById('itemCount');
        const categoryCount = document.getElementById('categoryCount');
        const troubleshoot = document.getElementById('troubleshoot');
        const seedNote = document.getElementById('seedNote');
        if (response.ok) {
            statusDiv.innerHTML = `
            <strong>âœ… Database Connected</strong><br>
            Items in database: ${data.itemsInDatabase}<br>
            Categories: ${data.categories.join(', ') || 'None'}
          `;
            statusDiv.className = 'status-box info';
            troubleshoot.style.display = 'none';
            seedNote.style.display = 'none';
            itemCount.textContent = data.itemsInDatabase;
            categoryCount.textContent = data.categories.length;
            statsDiv.style.display = 'grid';
        }
        else {
            throw new Error(data.message);
        }
    }
    catch (error) {
        const statusDiv = document.getElementById('statusDisplay');
        const troubleshoot = document.getElementById('troubleshoot');
        const statsDiv = document.getElementById('statsDisplay');
        const seedNote = document.getElementById('seedNote');
        statusDiv.innerHTML = `
          <strong>âŒ Not Connected</strong><br>
          <small>${error.message}</small>
        `;
        statusDiv.className = 'status-box error';
        troubleshoot.style.display = 'block';
        seedNote.style.display = 'block';
        statsDiv.style.display = 'none';
    }
}
async function seedDatabase() {
    const adminKey = document.getElementById('adminKey').value;
    const statusDiv = document.getElementById('seedStatus');
    if (!adminKey.trim()) {
        statusDiv.innerHTML = '<strong>âŒ Error:</strong> Please enter admin key';
        statusDiv.className = 'status-box error';
        return;
    }
    statusDiv.innerHTML = '<strong>â³ Seeding database...</strong>';
    statusDiv.className = 'status-box info';
    try {
        const response = await fetch('/api/seed/database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ adminKey })
        });
        const data = await response.json();
        if (response.ok) {
            statusDiv.innerHTML = `
            <strong>âœ… Success!</strong><br>
            ${data.message}<br>
            Items inserted: ${data.itemsInserted}
          `;
            statusDiv.className = 'status-box success';
            // Update status display
            setTimeout(checkStatus, 1000);
        }
        else {
            throw new Error(data.message);
        }
    }
    catch (error) {
        statusDiv.innerHTML = `<strong>âŒ Error:</strong> ${error.message}`;
        statusDiv.className = 'status-box error';
    }
}
// Initialize
displayItemsList();
checkStatus();
