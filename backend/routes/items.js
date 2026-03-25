import express from 'express';
import { Item } from '../models/Item.js';
import { Staff } from '../models/Staff.js';

const router = express.Router();

// Verify warehouse manager
const verifyWarehouse = async (req, res, next) => {
  const staffId = req.headers['x-staff-id'];
  if (!staffId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const staff = await Staff.findById(staffId);
    if (!staff || staff.role !== 'warehouse') {
      return res.status(403).json({ message: 'Only warehouse manager can access this' });
    }
    req.staffId = staffId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

// Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
});

// Create item (warehouse manager)
router.post('/', verifyWarehouse, async (req, res) => {
  try {
    const { name, description, price, category, quantity, itemNumber } = req.body;

    if (!name || !price || !quantity) {
      return res.status(400).json({ message: 'Name, price, and quantity are required' });
    }

    const newItem = new Item({ name, description, price, category, quantity, itemNumber });
    await newItem.save();
    res.status(201).json({ message: 'Item created successfully', item: newItem });
  } catch (error) {
    res.status(500).json({ message: 'Error creating item', error: error.message });
  }
});

// Update item (warehouse manager)
router.put('/:id', verifyWarehouse, async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Error updating item', error: error.message });
  }
});

// Update item quantity (warehouse manager)
router.put('/:id/quantity', verifyWarehouse, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { quantity: quantity, updatedAt: Date.now() },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Quantity updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Error updating quantity', error: error.message });
  }
});

// Delete item (warehouse manager)
router.delete('/:id', verifyWarehouse, async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
});

export default router;
