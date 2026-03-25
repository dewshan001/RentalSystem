import express from 'express';
import { Rental } from '../models/Rental.js';
import { verifyUser } from './auth.js';

const router = express.Router();

// Create rental
router.post('/create', verifyUser, async (req, res) => {
  try {
    const { itemId, quantity, rentalDays, totalPrice } = req.body;

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + rentalDays * 24 * 60 * 60 * 1000);

    const newRental = new Rental({
      userId: req.userId,
      itemId,
      quantity,
      rentalDays,
      startDate,
      endDate,
      totalPrice,
      status: 'active'
    });

    await newRental.save();
    res.status(201).json({ message: 'Rental created successfully', rental: newRental });
  } catch (error) {
    res.status(500).json({ message: 'Error creating rental', error: error.message });
  }
});

// Get user rentals
router.get('/', verifyUser, async (req, res) => {
  try {
    const rentals = await Rental.find({ userId: req.userId }).populate('itemId');
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rentals', error: error.message });
  }
});

// Cancel rental
router.put('/:id/cancel', verifyUser, async (req, res) => {
  try {
    const rental = await Rental.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', updatedAt: Date.now() },
      { new: true }
    );
    res.json({ message: 'Rental cancelled successfully', rental });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling rental', error: error.message });
  }
});

export default router;
