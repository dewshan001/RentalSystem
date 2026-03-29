// @ts-nocheck
const form = document.getElementById('registerForm');
    const messageEl = document.getElementById('message');
    const loadingEl = document.getElementById('loading');
    const registerBtn = document.getElementById('registerBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      if (!name || !email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
      }

      if (password.length < 4) {
        showMessage('Password must be at least 4 characters long', 'error');
        return;
      }

      try {
        loadingEl.style.display = 'block';
        registerBtn.disabled = true;

        const response = await fetch('/api/staff/register-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          showMessage(data.message || 'Registration failed', 'error');
          if (data.message && data.message.includes('already exists')) {
            setTimeout(() => {
              window.location.href = '/staff-login';
            }, 2000);
          }
          return;
        }

        showMessage('Admin registered successfully! Redirecting to login...', 'success');

        // Redirect to staff login after 2 seconds
        setTimeout(() => {
          window.location.href = '/staff-login';
        }, 2000);
      } catch (error) {
        showMessage('Error connecting to server: ' + error.message, 'error');
      } finally {
        loadingEl.style.display = 'none';
        registerBtn.disabled = false;
      }
    });

    function showMessage(msg, type) {
      messageEl.textContent = msg;
      messageEl.className = `message ${type} show`;
      setTimeout(() => {
        messageEl.classList.remove('show');
      }, 5000);
    }

