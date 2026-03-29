// @ts-nocheck
const staffHeaders = () => ({ 'Content-Type': 'application/json', 'x-staff-id': localStorage.getItem('staffId') });
let rentalsCache = [];
// â”€â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function init() {
    if (!isStaffLoggedIn()) {
        window.location.href = '/staff-login';
        return;
    }
    loadSummary();
    loadInvoices();
    loadPayments();
    loadCredits();
    loadOverdue();
    loadRentalsForGenerate();
    loadSettings();
}
// â”€â”€â”€ Tab switching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function switchTab(id, btn) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
}
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
// â”€â”€â”€ Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadSummary() {
    try {
        const r = await fetch('/api/billing/summary', { headers: staffHeaders() });
        const d = await r.json();
        document.getElementById('statRevenue').textContent = 'Rs. ' + (d.totals.totalRevenue || 0).toFixed(2);
        document.getElementById('statCollected').textContent = 'Rs. ' + (d.totals.totalCollected || 0).toFixed(2);
        document.getElementById('statOutstanding').textContent = 'Rs. ' + (d.totals.totalOutstanding || 0).toFixed(2);
        document.getElementById('statOverdue').textContent = d.overdueCount || 0;
        document.getElementById('statInvoices').textContent = d.totals.totalInvoices || 0;
        document.getElementById('statDaily').textContent = 'Rs. ' + (d.daily.dailyCollection || 0).toFixed(2);
        document.getElementById('statMonthly').textContent = 'Rs. ' + (d.monthly.monthlyCollection || 0).toFixed(2);
        document.getElementById('statLateFees').textContent = 'Rs. ' + (d.totals.totalLateFees || 0).toFixed(2);
    }
    catch (e) {
        console.error(e);
    }
}
// â”€â”€â”€ Invoices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadInvoices() {
    try {
        const search = document.getElementById('invSearch').value;
        const status = document.getElementById('invStatus').value;
        let url = '/api/billing/invoices?';
        if (search)
            url += 'search=' + encodeURIComponent(search) + '&';
        if (status)
            url += 'status=' + status;
        const r = await fetch(url, { headers: staffHeaders() });
        const invoices = await r.json();
        const tbody = document.getElementById('invBody');
        if (!invoices.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No invoices found</td></tr>';
            return;
        }
        tbody.innerHTML = invoices.map(inv => `
          <tr>
            <td style="font-size:0.8rem;">${inv.invoiceNumber}</td>
            <td>${inv.customerName || '-'}</td>
            <td>${inv.itemName || '-'}</td>
            <td>Rs. ${inv.totalAmount.toFixed(2)}</td>
            <td>Rs. ${inv.amountPaid.toFixed(2)}</td>
            <td style="font-weight:bold; color:${inv.balanceDue > 0 ? '#e74c3c' : '#27ae60'};">Rs. ${inv.balanceDue.toFixed(2)}</td>
            <td><span class="badge badge-${inv.status}">${inv.status.replace('_', ' ')}</span></td>
            <td>${new Date(inv.createdAt).toLocaleDateString()}</td>
            <td style="white-space:nowrap;">
              <button class="btn-xs btn-blue" onclick="viewInvoice('${inv._id}')">ðŸ“„</button>
              ${!['paid', 'cancelled', 'archived'].includes(inv.status) ? `
                <button class="btn-xs btn-green" onclick="openPaymentModal('${inv._id}', ${inv.balanceDue.toFixed(2)}, '${inv.invoiceNumber}', '${inv.customerName || ''}')">ðŸ’µ</button>
                <button class="btn-xs btn-orange" onclick="openEditInvoice('${inv._id}', ${inv.discount}, ${inv.agreedDays}, '${(inv.notes || '').replace(/'/g, "\\'")}')">âœï¸</button>
                <button class="btn-xs btn-red" onclick="cancelInvoice('${inv._id}')">âŒ</button>
              ` : ''}
            </td>
          </tr>
        `).join('');
    }
    catch (e) {
        console.error(e);
    }
}
// â”€â”€â”€ View Invoice Detail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function viewInvoice(id) {
    try {
        const r = await fetch('/api/billing/invoices/' + id, { headers: staffHeaders() });
        const inv = await r.json();
        const isLate = (inv.actualDays || inv.agreedDays) > inv.agreedDays;
        const extraDays = Math.max(0, (inv.actualDays || 0) - inv.agreedDays);
        document.getElementById('invoiceModalBody').innerHTML = `
          <div style="text-align:center; margin-bottom:1rem;">
            <strong style="font-size:1.2rem;">${inv.invoiceNumber}</strong><br>
            <span class="badge badge-${inv.status}">${inv.status.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div class="inv-section">
            <h4>Customer</h4>
            <div class="inv-row"><span>Name:</span><span>${inv.customerName || '-'}</span></div>
            <div class="inv-row"><span>Phone:</span><span>${inv.customerPhone || '-'}</span></div>
            <div class="inv-row"><span>Address:</span><span>${inv.customerAddress || '-'}</span></div>
          </div>
          <div class="inv-section">
            <h4>Rental Details</h4>
            <div class="inv-row"><span>Item:</span><span>${inv.itemName} (${inv.itemCategory || 'General'})</span></div>
            <div class="inv-row"><span>Price/Day:</span><span>Rs. ${inv.pricePerDay.toFixed(2)}</span></div>
            <div class="inv-row"><span>Quantity:</span><span>${inv.quantity}</span></div>
            <div class="inv-row"><span>Agreed Days:</span><span>${inv.agreedDays}</span></div>
            ${inv.actualDays ? `<div class="inv-row ${isLate ? 'late' : ''}"><span>Actual Days:</span><span>${inv.actualDays}${isLate ? ' âš ï¸ OVERDUE' : ''}</span></div>` : ''}
            <div class="inv-row"><span>Start:</span><span>${new Date(inv.startDate).toLocaleDateString()}</span></div>
            <div class="inv-row"><span>End:</span><span>${new Date(inv.endDate).toLocaleDateString()}</span></div>
            ${inv.returnDate ? `<div class="inv-row"><span>Returned:</span><span>${new Date(inv.returnDate).toLocaleString()}</span></div>` : ''}
          </div>
          <div class="inv-section">
            <h4>Financial Breakdown</h4>
            <div class="inv-row"><span>Rental Charge (${inv.agreedDays} days):</span><span>Rs. ${inv.rentalCharge.toFixed(2)}</span></div>
            ${inv.lateFee > 0 ? `<div class="inv-row late"><span>Late Fee (${extraDays} extra day${extraDays > 1 ? 's' : ''}):</span><span>Rs. ${inv.lateFee.toFixed(2)}</span></div>` : ''}
            ${inv.discount > 0 ? `<div class="inv-row" style="color:#27ae60;"><span>Discount:</span><span>- Rs. ${inv.discount.toFixed(2)}</span></div>` : ''}
            <div class="inv-row total"><span>Total Amount:</span><span>Rs. ${inv.totalAmount.toFixed(2)}</span></div>
            <div class="inv-row" style="color:#27ae60;"><span>Advance Paid:</span><span>Rs. ${inv.advancePaid.toFixed(2)}</span></div>
            <div class="inv-row" style="color:#3498db;"><span>Total Paid:</span><span>Rs. ${inv.amountPaid.toFixed(2)}</span></div>
            <div class="inv-row total"><span>Balance Due:</span><span style="color:${inv.balanceDue > 0 ? '#e74c3c' : '#27ae60'};">Rs. ${inv.balanceDue.toFixed(2)}</span></div>
          </div>
        `;
        document.getElementById('invoiceModal').classList.add('show');
    }
    catch (e) {
        showError(e);
    }
}
// Payments 
async function loadPayments() {
    try {
        const r = await fetch('/api/billing/payments', { headers: staffHeaders() });
        const payments = await r.json();
        const tbody = document.getElementById('payBody');
        if (!payments.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No payments</td></tr>';
            return;
        }
        tbody.innerHTML = payments.map(p => `
          <tr>
            <td style="font-size:0.8rem;">${p.paymentNumber}</td>
            <td style="font-size:0.8rem;">${p.invoiceId?.invoiceNumber || '-'}</td>
            <td>${p.customerName || '-'}</td>
            <td style="font-weight:bold; color:#27ae60;">Rs. ${p.amount.toFixed(2)}</td>
            <td><span class="badge badge-${p.paymentType === 'advance' ? 'partial' : 'paid'}">${p.paymentType}</span></td>
            <td>${p.paymentMethod}</td>
            <td>${new Date(p.createdAt).toLocaleString()}</td>
            <td>${p.receivedBy?.name || '-'}</td>
          </tr>
        `).join('');
    }
    catch (e) {
        console.error(e);
    }
}
// Credits 
async function loadCredits() {
    try {
        const search = document.getElementById('credSearch').value;
        const status = document.getElementById('credStatus').value;
        let url = '/api/billing/credits?';
        if (search)
            url += 'search=' + encodeURIComponent(search) + '&';
        if (status)
            url += 'status=' + status;
        const r = await fetch(url, { headers: staffHeaders() });
        const credits = await r.json();
        const tbody = document.getElementById('credBody');
        if (!credits.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No credit records</td></tr>';
            return;
        }
        tbody.innerHTML = credits.map(c => `
          <tr>
            <td>${c.customerName}</td>
            <td>${c.customerPhone || '-'}</td>
            <td>Rs. ${c.totalOwed.toFixed(2)}</td>
            <td>Rs. ${c.totalPaid.toFixed(2)}</td>
            <td style="font-weight:bold; color:${c.balance > 0 ? '#e74c3c' : '#27ae60'};">Rs. ${c.balance.toFixed(2)}</td>
            <td><span class="badge badge-${c.status}">${c.status}</span></td>
            <td>${c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString() : '-'}</td>
            <td>
              ${c.status === 'settled' ? `<button class="btn-xs btn-green" onclick="clearCredit('${c._id}')">âœ… Clear</button>` : ''}
              ${['outstanding', 'partial'].includes(c.status) ? `<button class="btn-xs btn-green" onclick="markCreditPaid('${c._id}')">ðŸ’° Mark as Paid</button>` : ''}
              ${['outstanding', 'partial'].includes(c.status) && c.invoiceId ? `<button class="btn-xs btn-blue" onclick="viewInvoice('${c.invoiceId._id || c.invoiceId}')">ðŸ“„</button>` : ''}
            </td>
          </tr>
        `).join('');
    }
    catch (e) {
        console.error(e);
    }
}
//  Overdue 
async function loadOverdue() {
    try {
        const r = await fetch('/api/billing/overdue', { headers: staffHeaders() });
        const items = await r.json();
        const tbody = document.getElementById('overdueBody');
        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No overdue invoices ðŸŽ‰</td></tr>';
            return;
        }
        const now = new Date();
        tbody.innerHTML = items.map(inv => {
            const daysOver = Math.ceil((now - new Date(inv.endDate)) / 86400000);
            return `
          <tr>
            <td style="font-size:0.8rem;">${inv.invoiceNumber}</td>
            <td>${inv.customerName || '-'}</td>
            <td>${inv.itemName || '-'}</td>
            <td>${new Date(inv.endDate).toLocaleDateString()}</td>
            <td style="color:#e74c3c; font-weight:bold;">${daysOver} day${daysOver > 1 ? 's' : ''}</td>
            <td style="font-weight:bold;">Rs. ${inv.balanceDue.toFixed(2)}</td>
            <td>
              <button class="btn-xs btn-orange" onclick="recalcLateFee('${inv._id}')">ðŸ”„ Recalc</button>
              <button class="btn-xs btn-green" onclick="openPaymentModal('${inv._id}', ${inv.balanceDue.toFixed(2)}, '${inv.invoiceNumber}', '${inv.customerName || ''}')">ðŸ’µ Pay</button>
            </td>
          </tr>`;
        }).join('');
    }
    catch (e) {
        console.error(e);
    }
}
//Generate Invoice 
async function loadRentalsForGenerate() {
    try {
        const r = await fetch('/api/shop-orders/shop/my-orders', { headers: staffHeaders() });
        rentalsCache = await r.json();
        const sel = document.getElementById('genRentalId');
        sel.innerHTML = '<option value="">-- Select Order --</option>' +
            rentalsCache.map(o => {
                const cust = o.customerInfo?.name || 'N/A';
                const item = o.itemId?.name || 'N/A';
                return `<option value="${o._id}">[${o.status}] ${item} - ${cust} (${o.rentalDays}d)</option>`;
            }).join('');
    }
    catch (e) {
        console.error(e);
    }
}
function previewRentalForInvoice() {
    const id = document.getElementById('genRentalId').value;
    const preview = document.getElementById('genPreview');
    if (!id) {
        preview.style.display = 'none';
        return;
    }
    const o = rentalsCache.find(r => r._id === id);
    if (!o)
        return;
    const price = o.itemId?.price || 0;
    const charge = price * o.quantity * o.rentalDays;
    const adv = o.advancePayment || 0;
    preview.style.display = 'block';
    preview.innerHTML = `
        <strong>${o.itemId?.name}</strong> | Customer: ${o.customerInfo?.name || 'N/A'}<br>
        Price/Day: Rs. ${price.toFixed(2)} | Qty: ${o.quantity} | Days: ${o.rentalDays}<br>
        Rental Charge: <strong>Rs. ${charge.toFixed(2)}</strong> | Advance: Rs. ${adv.toFixed(2)}<br>
        Status: <span class="badge badge-${o.status === 'closed' ? 'paid' : 'issued'}">${o.status}</span>
        ${o.status === 'closed' && o.actualDays > o.rentalDays ? `<br><span style="color:#e74c3c;">âš ï¸ Overdue: ${o.actualDays - o.rentalDays} extra day(s)</span>` : ''}
      `;
}
async function generateInvoice() {
    const rentalId = document.getElementById('genRentalId').value;
    if (!rentalId) {
        showMessage('Select a rental order', 'error');
        return;
    }
    try {
        const r = await fetch('/api/billing/generate-invoice/' + rentalId, {
            method: 'POST',
            headers: staffHeaders(),
            body: JSON.stringify({ discount: parseFloat(document.getElementById('genDiscount').value) || 0 })
        });
        const d = await r.json();
        if (r.ok) {
            showMessage(d.message || 'Invoice generated!', 'success');
            refresh();
            viewInvoice(d.invoice._id);
        }
        else {
            showError(d);
        }
    }
    catch (e) {
        showError(e);
    }
}
// â”€â”€â”€ Payment Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openPaymentModal(invoiceId, balance, invNum, custName) {
    document.getElementById('payInvoiceId').value = invoiceId;
    document.getElementById('payAmount').value = balance;
    document.getElementById('payInfo').innerHTML = `Invoice: <strong>${invNum}</strong> | Customer: ${custName} | Balance: <strong style="color:#e74c3c;">Rs. ${parseFloat(balance).toFixed(2)}</strong>`;
    document.getElementById('payNotes').value = '';
    document.getElementById('paymentModal').classList.add('show');
}
async function submitPayment() {
    const invoiceId = document.getElementById('payInvoiceId').value;
    const amount = parseFloat(document.getElementById('payAmount').value);
    if (!amount || amount <= 0) {
        showMessage('Enter a valid amount', 'error');
        return;
    }
    try {
        const r = await fetch('/api/billing/record-payment/' + invoiceId, {
            method: 'POST',
            headers: staffHeaders(),
            body: JSON.stringify({
                amount,
                paymentMethod: document.getElementById('payMethod').value,
                notes: document.getElementById('payNotes').value,
            })
        });
        const d = await r.json();
        if (r.ok) {
            showMessage('Payment recorded!', 'success');
            closeModal('paymentModal');
            refresh();
        }
        else {
            showError(d);
        }
    }
    catch (e) {
        showError(e);
    }
}
// â”€â”€â”€ Edit Invoice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openEditInvoice(id, discount, days, notes) {
    document.getElementById('editInvId').value = id;
    document.getElementById('editDiscount').value = discount || 0;
    document.getElementById('editDays').value = days;
    document.getElementById('editNotes').value = notes || '';
    document.getElementById('editInvModal').classList.add('show');
}
async function submitEditInvoice() {
    const id = document.getElementById('editInvId').value;
    try {
        const r = await fetch('/api/billing/invoices/' + id, {
            method: 'PUT',
            headers: staffHeaders(),
            body: JSON.stringify({
                discount: parseFloat(document.getElementById('editDiscount').value) || 0,
                agreedDays: parseInt(document.getElementById('editDays').value),
                notes: document.getElementById('editNotes').value,
            })
        });
        const d = await r.json();
        if (r.ok) {
            showMessage('Invoice updated!', 'success');
            closeModal('editInvModal');
            refresh();
        }
        else {
            showError(d);
        }
    }
    catch (e) {
        showError(e);
    }
}
// â”€â”€â”€ Cancel Invoice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function cancelInvoice(id) {
    const reason = prompt('Reason for cancellation:');
    if (reason === null)
        return;
    try {
        const r = await fetch('/api/billing/invoices/' + id + '/cancel', {
            method: 'PUT',
            headers: staffHeaders(),
            body: JSON.stringify({ reason })
        });
        const d = await r.json();
        if (r.ok) {
            showMessage('Invoice cancelled', 'success');
            refresh();
        }
        else {
            showError(d);
        }
    }
    catch (e) {
        showError(e);
    }
}
// â”€â”€â”€ Recalc Late Fee â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function recalcLateFee(id) {
    try {
        const r = await fetch('/api/billing/recalculate-late-fee/' + id, {
            method: 'PUT', headers: staffHeaders()
        });
        const d = await r.json();
        if (r.ok) {
            showMessage('Late fee recalculated', 'success');
            refresh();
        }
        else {
            showError(d);
        }
    }
    catch (e) {
        showError(e);
    }
}
// â”€â”€â”€ Mark Credit as Paid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function markCreditPaid(id) {
    if (!confirm('Mark this credit as fully paid?'))
        return;
    try {
        const r = await fetch('/api/billing/credits/' + id + '/mark-paid', {
            method: 'PUT',
            headers: { ...staffHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMethod: 'cash' })
        });
        const d = await r.json();
        if (r.ok) {
            showMessage('Credit marked as paid', 'success');
            refresh();
        }
        else {
            showError(d);
        }
    }
    catch (e) {
        showError(e);
    }
}
// â”€â”€â”€ Clear Credit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function clearCredit(id) {
    if (!confirm('Clear this settled credit record?'))
        return;
    try {
        const r = await fetch('/api/billing/credits/' + id + '/clear', {
            method: 'PUT', headers: staffHeaders()
        });
        const d = await r.json();
        if (r.ok) {
            showMessage('Credit cleared', 'success');
            refresh();
        }
        else {
            showError(d);
        }
    }
    catch (e) {
        showError(e);
    }
}
// â”€â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadSettings() {
    try {
        const r = await fetch('/api/billing/settings', { headers: staffHeaders() });
        const s = await r.json();
        document.getElementById('setLateFee').value = s.lateFeePercentage || 0;
        document.getElementById('setDeadlineHour').value = s.returnDeadlineHour ?? 9;
        document.getElementById('setArchiveDays').value = s.archiveAfterDays || 365;
    }
    catch (e) {
        console.error(e);
    }
}
async function saveSettings() {
    try {
        const r = await fetch('/api/billing/settings', {
            method: 'PUT',
            headers: staffHeaders(),
            body: JSON.stringify({
                lateFeePercentage: parseFloat(document.getElementById('setLateFee').value) || 0,
                returnDeadlineHour: parseInt(document.getElementById('setDeadlineHour').value) || 9,
                archiveAfterDays: parseInt(document.getElementById('setArchiveDays').value) || 365,
            })
        });
        if (r.ok)
            showMessage('Settings saved!', 'success');
    }
    catch (e) {
        showError(e);
    }
}
async function archiveRecords() {
    if (!confirm('Archive all paid invoices older than the configured retention period?'))
        return;
    try {
        const r = await fetch('/api/billing/archive', { method: 'POST', headers: staffHeaders() });
        const d = await r.json();
        if (r.ok) {
            showMessage(d.message, 'success');
            refresh();
        }
        else {
            showError(d);
        }
    }
    catch (e) {
        showError(e);
    }
}
// â”€â”€â”€ Refresh all â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function refresh() {
    loadSummary();
    loadInvoices();
    loadPayments();
    loadCredits();
    loadOverdue();
    loadRentalsForGenerate();
}
init();
