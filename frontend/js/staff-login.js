// @ts-nocheck
const form = document.getElementById('loginForm');
const messageEl = document.getElementById('alert');
const loadingEl = document.getElementById('loading');
const loginBtn = document.getElementById('loginBtn');
// Display alert helper
function showMessage(message, type) {
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    messageEl.style.background = type === 'success' ? '#d4edda' : '#feeced';
    messageEl.style.color = type === 'success' ? '#155724' : '#dc3545';
    messageEl.style.borderColor = type === 'success' ? '#c3e6cb' : '#f5c6cb';
}
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    messageEl.style.display = 'none';
    if (!email || !password) {
        showMessage('Please enter email and password', 'error');
        return;
    }
    try {
        loadingEl.style.display = 'block';
        loginBtn.disabled = true;
        const response = await fetch('/api/staff/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        loadingEl.style.display = 'none';
        loginBtn.disabled = false;
        if (!response.ok) {
            showMessage(data.message || 'Login failed', 'error');
            console.error('Login failed:', data);
            return;
        }
        // Store staff info in localStorage
        localStorage.setItem('staffId', data.staffId);
        localStorage.setItem('staffName', data.staff.name);
        localStorage.setItem('staffEmail', data.staff.email);
        localStorage.setItem('staffRole', data.staff.role);
        if (data.token)
            localStorage.setItem('token', data.token);
        showMessage('Login successful! Redirecting...', 'success');
        // Redirect based on role
        setTimeout(() => {
            if (data.staff.role === 'admin') {
                window.location.href = '/admin-dashboard';
            }
            else if (data.staff.role === 'shop') {
                window.location.href = '/shop-dashboard';
            }
            else if (data.staff.role === 'warehouse') {
                window.location.href = '/warehouse-dashboard';
            }
            else if (data.staff.role === 'billing') {
                window.location.href = '/billing-dashboard';
            }
            else {
                showMessage('Unknown role: ' + data.staff.role, 'error');
            }
        }, 800);
    }
    catch (error) {
        loadingEl.style.display = 'none';
        loginBtn.disabled = false;
        console.error('Login error:', error);
        showMessage('Error connecting to server', 'error');
    }
});
