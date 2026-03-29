// @ts-nocheck
/* â”€â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let staffData = [];
let paymentData = [];
let invoiceMatches = [];
let selectedInvoice = null;
let barChartInst = null;
let pieChartInst = null;
/* â”€â”€â”€ Chart.js defaults (dark theme) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
Chart.defaults.color = 'rgba(224,242,254,0.55)';
Chart.defaults.borderColor = 'rgba(255,255,255,0.07)';
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.font.size = 12;
function cssVar(name, fallback) {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v || fallback;
}
function syncChartDefaults() {
    if (typeof Chart === 'undefined')
        return;
    Chart.defaults.color = cssVar('--chart-ticks', 'rgba(224,242,254,0.55)');
    Chart.defaults.borderColor = cssVar('--chart-grid', 'rgba(255,255,255,0.07)');
}
/* â”€â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function navigate(el) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    el.classList.add('active');
    const view = el.dataset.view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    const titles = { dashboard: 'Dashboard', staff: 'Staff Management', users: 'User Management', payments: 'Payment Management', settings: 'Settings' };
    document.getElementById('pageTitle').textContent = titles[view] || view;
    if (view === 'dashboard')
        buildCharts();
    if (view === 'users')
        loadUserList();
    if (view === 'payments')
        initPayments();
    if (view === 'settings')
        initSettings();
}
/* â”€â”€â”€ Theme (Light/Dark) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function applyTheme(theme) {
    const t = (theme === 'light') ? 'light' : 'dark';
    document.body.setAttribute('data-theme', t);
    localStorage.setItem('adminTheme', t);
    const lbl = document.getElementById('themeToggleLabel');
    if (lbl)
        lbl.textContent = t === 'light' ? 'Light mode' : 'Dark mode';
    syncChartDefaults();
    if (barChartInst || pieChartInst)
        buildCharts();
}
function toggleTheme() {
    const current = document.body.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
}
/* â”€â”€â”€ Auth & load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
window.addEventListener('load', () => {
    applyTheme(localStorage.getItem('adminTheme') || 'dark');
    const staffId = localStorage.getItem('staffId');
    const staffRole = localStorage.getItem('staffRole');
    const staffName = localStorage.getItem('staffName') || 'Admin';
    if (!staffId || staffRole !== 'admin') {
        window.location.href = '/staff-login';
        return;
    }
    document.getElementById('adminName').textContent = staffName;
    document.getElementById('adminAvatar').textContent = staffName.charAt(0).toUpperCase();
    loadStaffList();
    loadUserList();
    loadPayments();
});
/* â”€â”€â”€ Payments (Admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function staffHeadersJson() {
    return {
        'Content-Type': 'application/json',
        'x-staff-id': localStorage.getItem('staffId'),
    };
}
function staffHeaders() {
    return { 'x-staff-id': localStorage.getItem('staffId') };
}
function initPayments() {
    const msg = document.getElementById('paymentFormMessage');
    if (msg)
        msg.classList.remove('show');
    const hint = document.getElementById('payInvoiceHint');
    if (hint)
        hint.textContent = '';
    if (!paymentData.length)
        loadPayments();
}
function openPaymentModal() {
    const modal = document.getElementById('recordPaymentModal');
    if (!modal)
        return;
    const msg = document.getElementById('paymentFormMessage');
    if (msg)
        msg.classList.remove('show');
    document.getElementById('paySearch').value = '';
    document.getElementById('payInvoiceSelect').innerHTML = '<option value="">Search to load invoicesâ€¦</option>';
    document.getElementById('payInvoiceHint').textContent = '';
    document.getElementById('payInvoiceId').value = '';
    document.getElementById('payAmount').value = '';
    document.getElementById('payNotes').value = '';
    selectedInvoice = null;
    invoiceMatches = [];
    modal.classList.add('show');
    setTimeout(() => {
        const el = document.getElementById('paySearch');
        if (el)
            el.focus();
    }, 0);
}
function closePaymentModal() {
    const modal = document.getElementById('recordPaymentModal');
    if (!modal)
        return;
    modal.classList.remove('show');
}
function onPaymentModalBgClick(e) {
    if (e.target && e.target.id === 'recordPaymentModal')
        closePaymentModal();
}
async function searchInvoices() {
    const q = (document.getElementById('paySearch').value || '').trim();
    const msg = document.getElementById('paymentFormMessage');
    const hint = document.getElementById('payInvoiceHint');
    const sel = document.getElementById('payInvoiceSelect');
    selectedInvoice = null;
    document.getElementById('payInvoiceId').value = '';
    if (!q) {
        showMessage(msg, 'Enter a search term', 'error');
        return;
    }
    try {
        sel.innerHTML = '<option value="">Searchingâ€¦</option>';
        const url = '/api/billing/invoices?search=' + encodeURIComponent(q) + '&limit=50';
        const res = await fetch(url, { headers: staffHeaders() });
        const data = await res.json();
        if (!res.ok) {
            showMessage(msg, data.message || 'Search failed', 'error');
            sel.innerHTML = '<option value="">Search to load invoicesâ€¦</option>';
            return;
        }
        const invoices = Array.isArray(data) ? data : [];
        invoiceMatches = invoices
            .filter(inv => inv && inv.status !== 'cancelled' && inv.status !== 'archived')
            .filter(inv => (typeof inv.balanceDue === 'number' ? inv.balanceDue : 0) > 0);
        if (!invoiceMatches.length) {
            sel.innerHTML = '<option value="">No unpaid invoices found</option>';
            if (hint)
                hint.textContent = '';
            showMessage(msg, 'No unpaid invoices match that search', 'error');
            return;
        }
        sel.innerHTML = '<option value="">Select an invoiceâ€¦</option>' + invoiceMatches.map(inv => {
            const invNum = inv.invoiceNumber || '(no #)';
            const cust = inv.customerName || 'Unknown';
            const bal = typeof inv.balanceDue === 'number' ? inv.balanceDue : 0;
            return `<option value="${inv._id}">${invNum} | ${cust} | Balance: Rs. ${bal.toFixed(2)}</option>`;
        }).join('');
        if (hint)
            hint.textContent = invoiceMatches.length + ' invoice(s) found';
    }
    catch (err) {
        showMessage(msg, 'Error: ' + err.message, 'error');
        sel.innerHTML = '<option value="">Search to load invoicesâ€¦</option>';
        if (hint)
            hint.textContent = '';
    }
}
function onInvoiceSelected() {
    const sel = document.getElementById('payInvoiceSelect');
    const id = sel.value;
    const hint = document.getElementById('payInvoiceHint');
    selectedInvoice = invoiceMatches.find(inv => inv._id === id) || null;
    document.getElementById('payInvoiceId').value = selectedInvoice ? selectedInvoice._id : '';
    if (!selectedInvoice) {
        document.getElementById('payAmount').value = '';
        if (hint)
            hint.textContent = '';
        return;
    }
    const bal = typeof selectedInvoice.balanceDue === 'number' ? selectedInvoice.balanceDue : 0;
    document.getElementById('payAmount').value = bal.toFixed(2);
    if (hint)
        hint.textContent = `Selected: ${selectedInvoice.invoiceNumber || ''} | Balance Due: Rs. ${bal.toFixed(2)}`;
}
document.getElementById('recordPaymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const loading = document.getElementById('paymentFormLoading');
    const msg = document.getElementById('paymentFormMessage');
    const invoiceId = document.getElementById('payInvoiceId').value;
    const amount = parseFloat(document.getElementById('payAmount').value);
    const paymentMethod = document.getElementById('payMethod').value;
    const notes = (document.getElementById('payNotes').value || '').trim();
    if (!invoiceId || !selectedInvoice) {
        showMessage(msg, 'Select an invoice first', 'error');
        return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        showMessage(msg, 'Enter a valid amount', 'error');
        return;
    }
    const balanceDue = typeof selectedInvoice.balanceDue === 'number' ? selectedInvoice.balanceDue : 0;
    if (balanceDue <= 0) {
        showMessage(msg, 'This invoice has no balance due', 'error');
        return;
    }
    if (amount - balanceDue > 0.00001) {
        showMessage(msg, `Amount cannot exceed balance due (Rs. ${balanceDue.toFixed(2)})`, 'error');
        return;
    }
    if (notes.length > 500) {
        showMessage(msg, 'Notes too long (max 500 characters)', 'error');
        return;
    }
    try {
        loading.style.display = 'block';
        const res = await fetch('/api/billing/record-payment/' + invoiceId, {
            method: 'POST',
            headers: staffHeadersJson(),
            body: JSON.stringify({ amount, paymentMethod, notes }),
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(msg, data.message || 'Payment failed', 'error');
            return;
        }
        showMessage(msg, 'Payment recorded successfully!', 'success');
        document.getElementById('payNotes').value = '';
        closePaymentModal();
        loadPayments();
    }
    catch (err) {
        showMessage(msg, 'Error: ' + err.message, 'error');
    }
    finally {
        loading.style.display = 'none';
    }
});
async function loadPayments() {
    const loading = document.getElementById('paymentListLoading');
    const msg = document.getElementById('paymentListMessage');
    if (!loading)
        return;
    try {
        loading.style.display = 'block';
        const res = await fetch('/api/billing/payments?limit=200', { headers: staffHeaders() });
        const data = await res.json();
        if (!res.ok)
            throw new Error(data.message || 'Failed to load payments');
        paymentData = Array.isArray(data) ? data : [];
        filterPayments();
    }
    catch (err) {
        showMessage(msg, 'Error loading payments: ' + err.message, 'error');
    }
    finally {
        loading.style.display = 'none';
    }
}
function renderPaymentTable(list = paymentData) {
    const tbody = document.getElementById('paymentTableBody');
    const count = document.getElementById('paymentCount');
    if (count)
        count.textContent = `${list.length} payment${list.length !== 1 ? 's' : ''}`;
    if (!tbody)
        return;
    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">No payments found</td></tr>';
        return;
    }
    tbody.innerHTML = list.map(p => {
        const invNum = p.invoiceId?.invoiceNumber || '-';
        const receivedBy = p.receivedBy?.name || '-';
        const amount = typeof p.amount === 'number' ? p.amount : 0;
        const date = p.createdAt ? new Date(p.createdAt).toLocaleString() : '-';
        const method = p.paymentMethod || '-';
        const type = p.paymentType || '-';
        const badgeClass = type === 'advance' || type === 'partial' ? 'inactive' : 'active';
        return `
          <tr>
            <td style="font-size:12px">${p.paymentNumber || '-'}</td>
            <td style="font-size:12px">${invNum}</td>
            <td>${p.customerName || '-'}</td>
            <td><strong>Rs. ${amount.toFixed(2)}</strong></td>
            <td><span class="badge ${badgeClass}">${type}</span></td>
            <td>${method}</td>
            <td style="font-size:12px">${date}</td>
            <td>${receivedBy}</td>
            <td><div class="action-buttons">
              <button class="btn btn-danger btn-sm" onclick="deletePayment('${p._id}','${(p.paymentNumber || '').replace(/'/g, "&#39;")}')">Delete</button>
            </div></td>
          </tr>
        `;
    }).join('');
}
function filterPayments() {
    const q = (document.getElementById('payFilterText')?.value || '').toLowerCase();
    const method = document.getElementById('payFilterMethod')?.value || '';
    const from = document.getElementById('payFilterFrom')?.value || '';
    const to = document.getElementById('payFilterTo')?.value || '';
    let fromDate = null;
    let toDate = null;
    if (from)
        fromDate = new Date(from + 'T00:00:00');
    if (to)
        toDate = new Date(to + 'T23:59:59');
    const filtered = paymentData.filter(p => {
        if (!p)
            return false;
        if (method && (p.paymentMethod || '') !== method)
            return false;
        if (fromDate || toDate) {
            const d = p.createdAt ? new Date(p.createdAt) : null;
            if (!d || Number.isNaN(d.getTime()))
                return false;
            if (fromDate && d < fromDate)
                return false;
            if (toDate && d > toDate)
                return false;
        }
        if (!q)
            return true;
        const paymentNum = (p.paymentNumber || '').toLowerCase();
        const invNum = (p.invoiceId?.invoiceNumber || '').toLowerCase();
        const cust = (p.customerName || '').toLowerCase();
        return paymentNum.includes(q) || invNum.includes(q) || cust.includes(q);
    });
    renderPaymentTable(filtered);
}
async function deletePayment(id, paymentNumber) {
    const msg = document.getElementById('paymentListMessage');
    if (!confirm(`Delete payment ${paymentNumber || ''}? This will reverse the invoice totals.`))
        return;
    const reason = (prompt('Enter a delete reason (required):') || '').trim();
    if (!reason) {
        showMessage(msg, 'Delete reason is required', 'error');
        return;
    }
    try {
        const res = await fetch('/api/billing/payments/' + id, {
            method: 'DELETE',
            headers: staffHeadersJson(),
            body: JSON.stringify({ reason }),
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(msg, data.message || 'Delete failed', 'error');
            return;
        }
        showMessage(msg, 'Payment deleted', 'success');
        loadPayments();
    }
    catch (err) {
        showMessage(msg, 'Error: ' + err.message, 'error');
    }
}
/* â”€â”€â”€ Load staff (feeds both table & charts) â”€â”€â”€â”€â”€â”€â”€ */
async function loadStaffList() {
    document.getElementById('listLoading').style.display = 'block';
    try {
        const res = await fetch('/api/staff/all-staff', {
            headers: { 'x-staff-id': localStorage.getItem('staffId') },
        });
        staffData = await res.json();
        updateStats();
        renderTable();
        buildCharts();
    }
    catch (err) {
        showMessage(document.getElementById('staffListMessage'), 'Error: ' + err.message, 'error');
    }
    finally {
        document.getElementById('listLoading').style.display = 'none';
    }
}
/* â”€â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function updateStats() {
    const active = staffData.filter(s => s.isActive).length;
    const depts = [...new Set(staffData.map(s => s.role))].length;
    document.getElementById('s-total').textContent = staffData.length;
    document.getElementById('s-active').textContent = active;
    document.getElementById('s-depts').textContent = depts;
}
/* â”€â”€â”€ Charts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function buildCharts() {
    buildBarChart();
    buildPieChart();
}
function buildBarChart() {
    const counts = {};
    staffData.forEach(s => { counts[s.role] = (counts[s.role] || 0) + 1; });
    const labels = Object.keys(counts).map(r => r.charAt(0).toUpperCase() + r.slice(1));
    const values = Object.values(counts);
    const COLORS_BG = ['rgba(37,99,235,0.55)', 'rgba(14,165,233,0.5)', 'rgba(139,92,246,0.48)', 'rgba(245,158,11,0.48)'];
    const COLORS_BORDER = ['rgba(37,99,235,1)', 'rgba(14,165,233,1)', 'rgba(139,92,246,1)', 'rgba(245,158,11,1)'];
    const ctx = document.getElementById('barChart').getContext('2d');
    if (barChartInst)
        barChartInst.destroy();
    barChartInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                    label: 'Staff Count',
                    data: values,
                    backgroundColor: COLORS_BG,
                    borderColor: COLORS_BORDER,
                    borderWidth: 1.5,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: cssVar('--chart-tooltip-bg', 'rgba(5,10,25,0.9)'),
                    borderColor: cssVar('--chart-tooltip-border', 'rgba(37,99,235,0.4)'),
                    borderWidth: 1,
                    titleColor: cssVar('--chart-tooltip-title', '#bfdbfe'),
                    bodyColor: cssVar('--chart-tooltip-body', '#e0f2fe'),
                    padding: 10,
                }
            },
            scales: {
                x: { grid: { color: cssVar('--chart-grid', 'rgba(255,255,255,0.05)') }, ticks: { color: cssVar('--chart-ticks', 'rgba(224,242,254,0.55)') } },
                y: {
                    grid: { color: cssVar('--chart-grid', 'rgba(255,255,255,0.05)') },
                    ticks: { color: cssVar('--chart-ticks', 'rgba(224,242,254,0.55)'), stepSize: 1, precision: 0 },
                    beginAtZero: true,
                }
            }
        }
    });
    // Custom legend
    const legend = document.getElementById('barLegend');
    legend.innerHTML = labels.map((l, i) => `<div class="legend-item">
          <div class="legend-dot" style="background:${COLORS_BORDER[i]}"></div>${l}
        </div>`).join('');
}
function buildPieChart() {
    const active = staffData.filter(s => s.isActive).length;
    const inactive = staffData.length - active;
    const ctx = document.getElementById('pieChart').getContext('2d');
    if (pieChartInst)
        pieChartInst.destroy();
    pieChartInst = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Inactive'],
            datasets: [{
                    data: [active, inactive],
                    backgroundColor: ['rgba(16,185,129,0.5)', 'rgba(100,116,139,0.45)'],
                    borderColor: ['rgba(16,185,129,0.9)', 'rgba(100,116,139,0.8)'],
                    borderWidth: 1.5,
                    hoverOffset: 6,
                }]
        },
        options: {
            responsive: true,
            cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: cssVar('--chart-tooltip-bg', 'rgba(5,10,25,0.9)'),
                    borderColor: cssVar('--chart-tooltip-border', 'rgba(37,99,235,0.4)'),
                    borderWidth: 1,
                    titleColor: cssVar('--chart-tooltip-title', '#bfdbfe'),
                    bodyColor: cssVar('--chart-tooltip-body', '#e0f2fe'),
                    padding: 10,
                }
            }
        }
    });
    document.getElementById('pieLegend').innerHTML = `
        <div class="legend-item"><div class="legend-dot" style="background:rgba(16,185,129,0.9)"></div>Active (${active})</div>
        <div class="legend-item"><div class="legend-dot" style="background:rgba(100,116,139,0.8)"></div>Inactive (${inactive})</div>
      `;
}
/* â”€â”€â”€ Render table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function renderTable(list = staffData) {
    const tbody = document.getElementById('staffTableBody');
    const count = document.getElementById('staffCount');
    if (count)
        count.textContent = `${list.length} staff member${list.length !== 1 ? 's' : ''}`;
    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">No staff members yet</td></tr>';
        return;
    }
    tbody.innerHTML = list.map(s => `
        <tr>
          <td>${s.name}</td>
          <td>${s.email}</td>
          <td><span class="badge ${s.role}">${s.role.charAt(0).toUpperCase() + s.role.slice(1)}</span></td>
          <td><span class="badge ${s.isActive ? 'active' : 'inactive'}">${s.isActive ? 'Active' : 'Inactive'}</span></td>
          <td>${new Date(s.createdAt).toLocaleDateString()}</td>
          <td><div class="action-buttons">
            <button class="btn btn-danger btn-sm" onclick="deleteStaff('${s._id}','${s.name}')">Delete</button>
          </div></td>
        </tr>
      `).join('');
}
function filterStaff() {
    const q = (document.getElementById('staffSearch')?.value || '').toLowerCase();
    if (!q) {
        renderTable(staffData);
        return;
    }
    renderTable(staffData.filter(s => (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q)));
}
/* â”€â”€â”€ Register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('staffName').value;
    const email = document.getElementById('staffEmail').value;
    const password = document.getElementById('staffPassword').value;
    const role = document.getElementById('staffRole').value;
    const loading = document.getElementById('registerLoading');
    const msg = document.getElementById('registerMessage');
    try {
        loading.style.display = 'block';
        const res = await fetch('/api/staff/register-staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-staff-id': localStorage.getItem('staffId') },
            body: JSON.stringify({ name, email, password, role }),
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(msg, data.message || 'Registration failed', 'error');
            return;
        }
        showMessage(msg, 'Staff registered successfully!', 'success');
        document.getElementById('registerForm').reset();
        closeRegisterModal();
        loadStaffList();
    }
    catch (err) {
        showMessage(msg, 'Error: ' + err.message, 'error');
    }
    finally {
        loading.style.display = 'none';
    }
});
function openRegisterModal() {
    const modal = document.getElementById('registerStaffModal');
    if (!modal)
        return;
    const msg = document.getElementById('registerMessage');
    if (msg)
        msg.classList.remove('show');
    modal.classList.add('show');
    setTimeout(() => {
        const name = document.getElementById('staffName');
        if (name)
            name.focus();
    }, 0);
}
function closeRegisterModal() {
    const modal = document.getElementById('registerStaffModal');
    if (!modal)
        return;
    modal.classList.remove('show');
}
function onRegisterModalBgClick(e) {
    if (e.target && e.target.id === 'registerStaffModal')
        closeRegisterModal();
}
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape')
        closeRegisterModal();
});
/* â”€â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function deleteStaff(id, name) {
    if (!confirm(`Delete ${name}?`))
        return;
    try {
        const res = await fetch(`/api/staff/staff/${id}`, {
            method: 'DELETE', headers: { 'x-staff-id': localStorage.getItem('staffId') },
        });
        const data = await res.json();
        const msg = document.getElementById('staffListMessage');
        if (!res.ok) {
            showMessage(msg, data.message || 'Delete failed', 'error');
            return;
        }
        showMessage(msg, 'Staff deleted successfully', 'success');
        loadStaffList();
    }
    catch (err) {
        showMessage(document.getElementById('staffListMessage'), 'Error: ' + err.message, 'error');
    }
}
/* â”€â”€â”€ User list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let userData = [];
async function loadUserList() {
    const loading = document.getElementById('userLoading');
    const msg = document.getElementById('userListMessage');
    if (!loading)
        return;
    try {
        loading.style.display = 'block';
        const res = await fetch('/api/auth/all-users', {
            headers: { 'x-staff-id': localStorage.getItem('staffId') },
        });
        if (!res.ok)
            throw new Error((await res.json()).message);
        userData = await res.json();
        document.getElementById('s-users').textContent = userData.length;
        renderUserTable(userData);
    }
    catch (err) {
        showMessage(msg, 'Error loading users: ' + err.message, 'error');
    }
    finally {
        loading.style.display = 'none';
    }
}
function renderUserTable(list) {
    const tbody = document.getElementById('userTableBody');
    const count = document.getElementById('userCount');
    if (count)
        count.textContent = `${list.length} user${list.length !== 1 ? 's' : ''}`;
    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">No users found</td></tr>';
        return;
    }
    tbody.innerHTML = list.map((u, i) => `
        <tr>
          <td style="color:var(--text-secondary)">${i + 1}</td>
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
          <td>${u.phone || '<span style="color:var(--text-secondary)">â€”</span>'}</td>
          <td>${[u.city, u.state].filter(Boolean).join(', ') || '<span style="color:var(--text-secondary)">â€”</span>'}</td>
          <td>${new Date(u.createdAt).toLocaleDateString()}</td>
          <td><div class="action-buttons">
            <button class="btn btn-danger btn-sm" onclick="deleteUser('${u._id}','${u.name}')">Delete</button>
          </div></td>
        </tr>
      `).join('');
}
function filterUsers() {
    const q = document.getElementById('userSearch').value.toLowerCase();
    renderUserTable(userData.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
}
async function deleteUser(id, name) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`))
        return;
    try {
        const res = await fetch(`/api/auth/users/${id}`, {
            method: 'DELETE',
            headers: { 'x-staff-id': localStorage.getItem('staffId') },
        });
        const data = await res.json();
        const msg = document.getElementById('userListMessage');
        if (!res.ok) {
            showMessage(msg, data.message || 'Delete failed', 'error');
            return;
        }
        showMessage(msg, `User "${name}" deleted`, 'success');
        loadUserList();
    }
    catch (err) {
        showMessage(document.getElementById('userListMessage'), 'Error: ' + err.message, 'error');
    }
}
/* â”€â”€â”€ Add User (Admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function openUserModal() {
    const modal = document.getElementById('registerUserModal');
    if (!modal)
        return;
    const msg = document.getElementById('userCreateMessage');
    if (msg)
        msg.classList.remove('show');
    modal.classList.add('show');
    setTimeout(() => {
        const el = document.getElementById('newUserName');
        if (el)
            el.focus();
    }, 0);
}
function closeUserModal() {
    const modal = document.getElementById('registerUserModal');
    if (!modal)
        return;
    modal.classList.remove('show');
}
function onUserModalBgClick(e) {
    if (e.target && e.target.id === 'registerUserModal')
        closeUserModal();
}
document.getElementById('createUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const loading = document.getElementById('createUserLoading');
    const msg = document.getElementById('userCreateMessage');
    const name = (document.getElementById('newUserName').value || '').trim();
    const email = (document.getElementById('newUserEmail').value || '').trim();
    const password = document.getElementById('newUserPassword').value || '';
    const phone = (document.getElementById('newUserPhone').value || '').trim();
    if (!name) {
        showMessage(msg, 'Name is required', 'error');
        return;
    }
    if (!email) {
        showMessage(msg, 'Email is required', 'error');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage(msg, 'Enter a valid email', 'error');
        return;
    }
    if (!password || password.length < 6) {
        showMessage(msg, 'Password must be at least 6 characters', 'error');
        return;
    }
    if (phone && phone.length > 30) {
        showMessage(msg, 'Phone is too long', 'error');
        return;
    }
    try {
        loading.style.display = 'block';
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone }),
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(msg, data.message || 'Create user failed', 'error');
            return;
        }
        showMessage(msg, 'User created successfully!', 'success');
        document.getElementById('createUserForm').reset();
        closeUserModal();
        loadUserList();
    }
    catch (err) {
        showMessage(msg, 'Error: ' + err.message, 'error');
    }
    finally {
        loading.style.display = 'none';
    }
});
/* â”€â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function initSettings() {
    const name = localStorage.getItem('staffName') || '';
    document.getElementById('newName').value = name;
}
async function saveName(e) {
    e.preventDefault();
    const name = document.getElementById('newName').value.trim();
    const msg = document.getElementById('nameMsg');
    if (!name) {
        showMessage(msg, 'Name cannot be empty', 'error');
        return;
    }
    try {
        const res = await fetch('/api/staff/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-staff-id': localStorage.getItem('staffId') },
            body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(msg, data.message || 'Update failed', 'error');
            return;
        }
        localStorage.setItem('staffName', name);
        document.getElementById('adminName').textContent = name;
        document.getElementById('adminAvatar').textContent = name.charAt(0).toUpperCase();
        showMessage(msg, 'Name updated successfully!', 'success');
    }
    catch (err) {
        showMessage(msg, 'Error: ' + err.message, 'error');
    }
}
async function savePassword(e) {
    e.preventDefault();
    const curPw = document.getElementById('curPw').value;
    const newPw = document.getElementById('newPw').value;
    const confPw = document.getElementById('confPw').value;
    const msg = document.getElementById('pwMsg');
    const rules = getPasswordRules(newPw);
    if (!rules.every(r => r.ok)) {
        showMessage(msg, 'Password does not meet all requirements', 'error');
        return;
    }
    if (newPw !== confPw) {
        showMessage(msg, 'Passwords do not match', 'error');
        return;
    }
    try {
        const res = await fetch('/api/staff/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-staff-id': localStorage.getItem('staffId') },
            body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(msg, data.message || 'Update failed', 'error');
            return;
        }
        showMessage(msg, 'Password changed successfully!', 'success');
        document.getElementById('pwForm').reset();
        checkStrength();
    }
    catch (err) {
        showMessage(msg, 'Error: ' + err.message, 'error');
    }
}
function getPasswordRules(pw) {
    return [
        { id: 'r-len', ok: pw.length >= 8 },
        { id: 'r-up', ok: /[A-Z]/.test(pw) },
        { id: 'r-num', ok: /[0-9]/.test(pw) },
        { id: 'r-sym', ok: /[^A-Za-z0-9]/.test(pw) },
    ];
}
function checkStrength() {
    const pw = document.getElementById('newPw').value;
    const rules = getPasswordRules(pw);
    const score = rules.filter(r => r.ok).length; // 0-4
    // Update rule items
    const labels = [
        'At least 8 characters',
        'One uppercase letter',
        'One number',
        'One special character (!@#$â€¦)',
    ];
    rules.forEach((r, i) => {
        const li = document.getElementById(r.id);
        li.textContent = (r.ok ? '  âœ“ ' : '  âœ• ') + labels[i];
        li.classList.toggle('ok', r.ok);
    });
    // Strength bars
    const bars = ['sb1', 'sb2', 'sb3', 'sb4'];
    const classes = ['', 'weak', 'fair', 'good', 'strong'];
    const barClass = score === 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : score === 4 ? 'strong' : '';
    const colors = { weak: '#ef4444', fair: '#f59e0b', good: '#3b82f6', strong: '#10b981' };
    const labelTxt = { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' };
    bars.forEach((id, idx) => {
        const b = document.getElementById(id);
        b.className = 'str-bar' + (score > idx ? ' ' + barClass : '');
    });
    const lbl = document.getElementById('strLabel');
    lbl.textContent = score > 0 ? labelTxt[barClass] || '' : '';
    lbl.style.color = colors[barClass] || 'transparent';
    checkMatch();
}
function checkMatch() {
    const newPw = document.getElementById('newPw').value;
    const confPw = document.getElementById('confPw').value;
    const lbl = document.getElementById('matchLabel');
    if (!confPw) {
        lbl.textContent = '';
        return;
    }
    if (newPw === confPw) {
        lbl.textContent = 'âœ“ Passwords match';
        lbl.style.color = 'rgba(16,185,129,0.9)';
    }
    else {
        lbl.textContent = 'âœ• Passwords do not match';
        lbl.style.color = 'rgba(239,68,68,0.85)';
    }
}
/* â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function showMessage(el, msg, type) {
    el.textContent = (type === 'success' ? 'âœ“  ' : 'âœ•  ') + msg;
    el.className = `message ${type} show`;
    setTimeout(() => el.classList.remove('show'), 5000);
}
function logout() {
    localStorage.clear();
    window.location.href = '/staff-login';
}
