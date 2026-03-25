import express from 'express';
import { User } from '../models/User.js';
import { Staff } from '../models/Staff.js';

const router = express.Router();

// Inline admin guard (avoids cross-route import issues)
const verifyAdmin = async (req, res, next) => {
  const staffId = req.headers['x-staff-id'];
  if (!staffId) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const staff = await Staff.findById(staffId);
    if (!staff || staff.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.staffId = staffId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Middleware to verify token (simple JWT-like approach with localStorage)
export const verifyUser = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.userId = userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Middleware to verify staff member
export const verifyStaff = async (req, res, next) => {
  const staffId = req.headers['x-staff-id'];
  if (!staffId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(401).json({ message: 'Staff not found' });
    }
    req.staffId = staffId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const newUser = new User({ name, email, password, phone });
    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      userId: newUser._id,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      userId: user._id,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Get user profile
router.get('/profile', verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', verifyUser, async (req, res) => {
  try {
    const { name, phone, address, city, state, zipCode } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, phone, address, city, state, zipCode, updatedAt: Date.now() },
      { new: true }
    );
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Delete account
router.delete('/account', verifyUser, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

// Admin: Get all users
router.get('/all-users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Admin: Delete a user
router.delete('/users/:id', verifyAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

export default router;
