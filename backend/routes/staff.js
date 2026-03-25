import express from 'express';
import { Staff } from '../models/Staff.js';

const router = express.Router();

// Middleware to verify staff token
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
    req.staffRole = staff.role;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Middleware to verify admin
export const verifyAdmin = async (req, res, next) => {
  const staffId = req.headers['x-staff-id'];
  if (!staffId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
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

// Register First Admin (only if no admin exists)
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if any admin exists
    const adminExists = await Staff.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists. Please use staff login.' });
    }

    // Check if email is already in use
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create admin
    const newAdmin = new Staff({
      name,
      email,
      password,
      role: 'admin',
      isActive: true,
    });
    await newAdmin.save();

    res.status(201).json({
      message: 'Admin registered successfully',
      staffId: newAdmin._id,
      staff: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering admin', error: error.message });
  }
});

// Initialize Admin - Debug endpoint to ensure admin exists and is properly configured
router.get('/init-admin', async (req, res) => {
  try {
    // Check if admin exists
    let admin = await Staff.findOne({ email: 'admin@admin.com' });
    
    if (admin) {
      // Admin exists, but make sure it's not broken
      let updated = false;
      
      if (admin.password !== 'admin') {
        admin.password = 'admin';
        updated = true;
      }
      
      if (!admin.isActive) {
        admin.isActive = true;
        updated = true;
      }
      
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        updated = true;
      }
      
      if (updated) {
        await admin.save();
      }
      
      return res.json({
        status: 'success',
        message: 'Admin account verified and ready',
        email: 'admin@admin.com',
        password: 'admin',
        updated: updated
      });
    } else {
      // Create new admin
      const newAdmin = new Staff({
        name: 'Admin User',
        email: 'admin@admin.com',
        password: 'admin',
        role: 'admin',
        isActive: true,
      });
      
      await newAdmin.save();
      
      return res.json({
        status: 'created',
        message: 'Admin account created successfully',
        email: 'admin@admin.com',
        password: 'admin'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Error initializing admin', 
      error: error.message 
    });
  }
});

// Staff Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const staff = await Staff.findOne({ email });
    if (!staff || staff.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!staff.isActive) {
      return res.status(403).json({ message: 'Your account is inactive' });
    }

    res.json({
      message: 'Login successful',
      staffId: staff._id,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Admin: Register new staff
router.post('/register-staff', verifyAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    if (!['warehouse', 'shop'].includes(role)) {
      return res.status(400).json({ message: 'Role must be "warehouse" or "shop"' });
    }

    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const newStaff = new Staff({
      name,
      email,
      password,
      role,
      isActive: true,
    });
    await newStaff.save();

    res.status(201).json({
      message: 'Staff registered successfully',
      staffId: newStaff._id,
      staff: {
        id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering staff', error: error.message });
  }
});

// Admin: Get all staff
router.get('/all-staff', verifyAdmin, async (req, res) => {
  try {
    const staff = await Staff.find({ role: { $ne: 'admin' } }, '-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff', error: error.message });
  }
});

// Admin: Delete staff
router.delete('/staff/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findByIdAndDelete(id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting staff', error: error.message });
  }
});

// Admin: Deactivate/Activate staff
router.put('/staff/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const staff = await Staff.findByIdAndUpdate(
      id,
      { isActive, updatedAt: Date.now() },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({
      message: 'Staff status updated successfully',
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating staff status', error: error.message });
  }
});

// Get staff profile
router.get('/profile', verifyStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId);
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

export default router;
