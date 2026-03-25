import express from 'express';
import { Cart } from '../models/Cart.js';
import { verifyUser } from './auth.js';

const router = express.Router();

// Get cart
router.get('/', verifyUser, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId }).populate('items.itemId');
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
});

// Add to cart
router.post('/add', verifyUser, async (req, res) => {
  try {
    const { itemId, quantity, rentalDays } = req.body;

    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.itemId.toString() === itemId);
    if (existingItem) {
      existingItem.quantity += quantity || 1;
      existingItem.rentalDays = rentalDays || 1;
    } else {
      cart.items.push({ itemId, quantity: quantity || 1, rentalDays: rentalDays || 1 });
    }

    await cart.save();
    res.json({ message: 'Item added to cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
});

// Remove from cart
router.post('/remove', verifyUser, async (req, res) => {
  try {
    const { itemId } = req.body;

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.itemId.toString() !== itemId);
    await cart.save();

    res.json({ message: 'Item removed from cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from cart', error: error.message });
  }
});

// Clear cart
router.post('/clear', verifyUser, async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.userId },
      { items: [] },
      { new: true }
    );
    res.json({ message: 'Cart cleared', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
});

export default router;
