// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
      const registerForm = document.getElementById('registerForm');
      if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const name = document.getElementById('name').value.trim();
          const email = document.getElementById('email').value.trim();
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const phone = document.getElementById('phone').value.trim();
          
          const passwordMatchError = document.getElementById('passwordMatchError');
          const emailError = document.getElementById('emailError');
          const phoneError = document.getElementById('phoneError');
          
          let hasError = false;

          passwordMatchError.style.display = 'none';
          emailError.style.display = 'none';
          phoneError.style.display = 'none';

          if (password !== confirmPassword) {
            passwordMatchError.textContent = 'Passwords do not match';
            passwordMatchError.style.display = 'block';
            hasError = true;
          }

          if (phone && !/^\d{10}$/.test(phone)) {
            phoneError.textContent = 'Phone must be 10 digits';
            phoneError.style.display = 'block';
            hasError = true;
          }

          if (hasError) return;

          try {
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, password, phone, role: 'user' })
            });
            const data = await response.json();
            
            if (response.ok) {
              showAlert('Registration successful! Redirecting to login...', 'success');
              setTimeout(() => {
                window.location.href = '/login';
              }, 2000);
            } else {
              showAlert(data.message || 'Registration failed', 'error');
            }
          } catch (error) {
            console.error('Registration error:', error);
            showAlert('Cannot connect to server', 'error');
          }
        });
      }
    });

    // Defining showAlert function locally overrides utils.js generic one if any, or supports page local
    function showAlert(message, type) {
      const alertDiv = document.getElementById('alert');
      alertDiv.textContent = message;
      alertDiv.style.display = 'block';
      alertDiv.style.background = type === 'success' ? '#d4edda' : '#feeced';
      alertDiv.style.color = type === 'success' ? '#155724' : '#dc3545';
      alertDiv.style.borderColor = type === 'success' ? '#c3e6cb' : '#f5c6cb';
    }

