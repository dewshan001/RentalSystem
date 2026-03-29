// @ts-nocheck
requireLogin();

    async function loadProfile() {
      try {
        const profile = await getProfile();
        document.getElementById('name').value = profile.name;
        document.getElementById('email').value = profile.email;
        document.getElementById('phone').value = profile.phone || '';
        document.getElementById('address').value = profile.address || '';
        document.getElementById('city').value = profile.city || '';
        document.getElementById('state').value = profile.state || '';
        document.getElementById('zipCode').value = profile.zipCode || '';
      } catch (error) {
        showError(error);
      }
    }

    async function loadRentals() {
      try {
        const rentals = await getRentals();

        if (!rentals || rentals.length === 0) {
          document.getElementById('rentalsContent').innerHTML = '<p class="text-center">No active rentals</p>';
          return;
        }

        const html = rentals.map(rental => {
          const startDate = new Date(rental.startDate).toLocaleDateString();
          const endDate = new Date(rental.endDate).toLocaleDateString();
          const itemName = rental.itemId?.name || 'Unknown Item';

          return `
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                  <h4>${itemName}</h4>
                  <p><small>Status: <strong>${rental.status}</strong></small></p>
                  <p><small>Start: ${startDate}</small></p>
                  <p><small>End: ${endDate}</small></p>
                  <p><strong>Total: Rs${rental.totalPrice.toFixed(2)}</strong></p>
                </div>
                ${rental.status === 'active' ? `
                  <button onclick="cancelRentalItem('${rental._id}')" class="danger" style="font-size: 0.85rem; padding: 0.5rem;">Cancel</button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');

        document.getElementById('rentalsContent').innerHTML = html;
      } catch (error) {
        showError(error);
      }
    }

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const data = {
          name: document.getElementById('name').value,
          phone: document.getElementById('phone').value,
          address: document.getElementById('address').value,
          city: document.getElementById('city').value,
          state: document.getElementById('state').value,
          zipCode: document.getElementById('zipCode').value,
        };

        await updateProfile(data);
        showMessage('Profile updated successfully!', 'success');
      } catch (error) {
        showError(error);
      }
    });

    async function cancelRentalItem(rentalId) {
      if (!confirm('Are you sure you want to cancel this rental?')) return;

      try {
        await cancelRental(rentalId);
        showMessage('Rental cancelled', 'success');
        loadRentals();
      } catch (error) {
        showError(error);
      }
    }

    async function deleteAccount() {
      const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
      if (!confirmDelete) return;

      const confirmAgain = confirm('This will permanently delete your account and all associated data. Are you absolutely sure?');
      if (!confirmAgain) return;

      try {
        await apiCall('/auth/account', 'DELETE');
        showMessage('Account deleted successfully', 'success');
        setTimeout(() => {
          logout();
        }, 1500);
      } catch (error) {
        showError(error);
      }
    }

    loadProfile();
    loadRentals();

