// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const emailError = document.getElementById('emailError');
            emailError.style.display = 'none';
            if (!email || !password) {
                showAlert('Please fill in both email and password', 'error');
                return;
            }
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify({
                        id: data.user.id,
                        name: data.user.name,
                        role: data.user.role
                    }));
                    showAlert('Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        if (data.user.role === 'admin')
                            window.location.href = '/admin-dashboard';
                        else if (['warehouse', 'shop', 'billing', 'staff'].includes(data.user.role))
                            window.location.href = `/${data.user.role}-dashboard`;
                        else
                            window.location.href = '/dashboard';
                    }, 1500);
                }
                else {
                    showAlert(data.message || 'Login failed', 'error');
                }
            }
            catch (error) {
                console.error('Login error:', error);
                showAlert('Cannot connect to server', 'error');
            }
        });
    }
});
// We also need showAlert definition on modern styling
function showAlert(message, type) {
    const alertDiv = document.getElementById('alert');
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    alertDiv.style.background = type === 'success' ? '#d4edda' : '#feeced';
    alertDiv.style.color = type === 'success' ? '#155724' : '#dc3545';
    alertDiv.style.borderColor = type === 'success' ? '#c3e6cb' : '#f5c6cb';
}
