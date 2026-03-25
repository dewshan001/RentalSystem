// Local storage keys
const STORAGE_KEY = 'rentalSystem_userId';

// API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem(STORAGE_KEY) || ''
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`/api${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API Error');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Auth helpers
function setUserId(userId) {
  localStorage.setItem(STORAGE_KEY, userId);
}

function getUserId() {
  return localStorage.getItem(STORAGE_KEY);
}

function logout() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = '/login';
}

function staffLogout() {
  localStorage.removeItem('staffId');
  localStorage.removeItem('staffName');
  localStorage.removeItem('staffEmail');
  localStorage.removeItem('staffRole');
  window.location.href = '/staff-login';
}

function isLoggedIn() {
  return !!localStorage.getItem(STORAGE_KEY);
}

function isStaffLoggedIn() {
  return !!localStorage.getItem('staffId');
}

// Auth endpoints
async function register(name, email, password, phone) {
  return apiCall('/auth/register', 'POST', { name, email, password, phone });
}

async function login(email, password) {
  return apiCall('/auth/login', 'POST', { email, password });
}

async function getProfile() {
  return apiCall('/auth/profile');
}

async function updateProfile(data) {
  return apiCall('/auth/profile', 'PUT', data);
}

async function deleteAccount() {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    return;
  }
  return apiCall('/auth/account', 'DELETE');
}

// Items endpoints
async function getItems() {
  return apiCall('/items');
}

async function getItem(id) {
  return apiCall(`/items/${id}`);
}

// Cart endpoints
async function getCart() {
  return apiCall('/cart');
}

async function addToCart(itemId, quantity = 1, rentalDays = 1) {
  return apiCall('/cart/add', 'POST', { itemId, quantity, rentalDays });
}

async function removeFromCart(itemId) {
  return apiCall('/cart/remove', 'POST', { itemId });
}

async function clearCart() {
  return apiCall('/cart/clear', 'POST');
}

// Rentals endpoints
async function createRental(itemId, quantity, rentalDays, totalPrice) {
  return apiCall('/rentals/create', 'POST', { itemId, quantity, rentalDays, totalPrice });
}

async function getRentals() {
  return apiCall('/rentals');
}

async function cancelRental(id) {
  return apiCall(`/rentals/${id}/cancel`, 'PUT');
}

// UI helpers
function showMessage(message, type = 'success') {
  const alert = document.getElementById('alert');
  if (alert) {
    alert.textContent = message;
    alert.className = `alert show alert-${type}`;
    setTimeout(() => {
      alert.classList.remove('show');
    }, 5000);
  }
}

function showError(error) {
  showMessage(error.message || 'An error occurred', 'error');
}

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = '/login';
  }
}

function updateNavbar() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  if (isLoggedIn()) {
    navLinks.innerHTML = `
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/cart">Cart</a></li>
      <li><a href="/profile">Profile</a></li>
      <li><a href="#" onclick="logout(); return false;">Logout</a></li>
    `;
  } else {
    navLinks.innerHTML = `
      <li><a href="/register">Register</a></li>
      <li><a href="/login">Login</a></li>
    `;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Skip navbar update for auth pages and staff dashboards
  const authPages = ['/register', '/login', '/staff-login', '/register-admin'];
  const isAuthPage = authPages.some(page => window.location.pathname === page);
  
  if (!window.location.pathname.includes('dashboard') && !isAuthPage) {
    updateNavbar();
  }
});
