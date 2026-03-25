import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectionDB } from './config/db.js';
import dns from 'node:dns';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import cartRoutes from './routes/cart.js';
import rentalRoutes from './routes/rentals.js';
import staffRoutes from './routes/staff.js';
import seedRoutes from './routes/seed.js';
import shopOrderRoutes from './routes/shop-orders.js';
import billingRoutes from './routes/billing.js';

dotenv.config();
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.join(__dirname, '..', 'frontend');

// Middleware
app.use(express.json());
app.use(express.static(frontendDir));

await connectionDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/shop-orders', shopOrderRoutes);
app.use('/api/billing', billingRoutes);

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(frontendDir, 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendDir, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(frontendDir, 'dashboard.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(frontendDir, 'profile.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(frontendDir, 'cart.html'));
});
// Staff routes
app.get('/staff-login', (req, res) => {
  res.sendFile(path.join(frontendDir, 'staff-login.html'));
});

app.get('/register-admin', (req, res) => {
  res.sendFile(path.join(frontendDir, 'register-admin.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(frontendDir, 'admin-dashboard.html'));
});

app.get('/shop-dashboard', (req, res) => {
  res.sendFile(path.join(frontendDir, 'shop-dashboard.html'));
});

app.get('/warehouse-dashboard', (req, res) => {
  res.sendFile(path.join(frontendDir, 'warehouse-dashboard.html'));
});

app.get('/billing-dashboard', (req, res) => {
  res.sendFile(path.join(frontendDir, 'billing-dashboard.html'));
});

app.get('/seed-admin', (req, res) => {
  res.sendFile(path.join(frontendDir, 'seed-admin.html'));
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
