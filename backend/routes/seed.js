import express from 'express';
import { Item } from '../models/Item.js';

const router = express.Router();

const seedItems = [
  // Item 1: Angle Grinder 4" - 10 units
  { itemNumber: 1, name: 'Angle Grinder 4"', category: 'Grinders', price: 15, quantity: 10, available: true },
  
  // Item 2: Angle Grinder 4-1/2" - 10 units
  { itemNumber: 2, name: 'Angle Grinder 4-1/2"', category: 'Grinders', price: 18, quantity: 10, available: true },
  
  // Item 3-4: Angle Grinder 7" - 5+3 = 8 units
  { itemNumber: 3, name: 'Angle Grinder 7"', category: 'Grinders', price: 22, quantity: 5, available: true },
  { itemNumber: 4, name: 'Angle Grinder 7"', category: 'Grinders', price: 22, quantity: 3, available: true },
  
  // Item 5: Drill Machine - 15 units
  { itemNumber: 5, name: 'Drill Machine', category: 'Drills', price: 20, quantity: 15, available: true },
  
  // Item 6: Rechargeable Drill - 3 units
  { itemNumber: 6, name: 'Rechargeable Drill', category: 'Drills', price: 25, quantity: 3, available: true },
  
  // Item 7: Hiltty (Hammer Drill) - 15 units
  { itemNumber: 7, name: 'Hiltty (Hammer Drill)', category: 'Drills', price: 28, quantity: 15, available: true },
  
  // Item 8: Breaker 5 KG - 10 units
  { itemNumber: 8, name: 'Breaker 5 KG', category: 'Breaking Tools', price: 30, quantity: 10, available: true },
  
  // Item 9: Demolizer - 5 units
  { itemNumber: 9, name: 'Demolizer', category: 'Breaking Tools', price: 35, quantity: 5, available: true },
  
  // Item 10: Putty Mixer - 10 units
  { itemNumber: 10, name: 'Putty Mixer', category: 'Mixers', price: 18, quantity: 10, available: true },
  
  // Item 11: Circular Saw - 10 units
  { itemNumber: 11, name: 'Circular Saw', category: 'Saws', price: 20, quantity: 10, available: true },
  
  // Item 12: Marble Cutter - 5 units
  { itemNumber: 12, name: 'Marble Cutter', category: 'Saws', price: 40, quantity: 5, available: true },
  
  // Item 13: Sander 4" - 3 units
  { itemNumber: 13, name: 'Sander 4"', category: 'Finishing', price: 22, quantity: 3, available: true },
  
  // Item 14: Sander - 5 units
  { itemNumber: 14, name: 'Sander', category: 'Finishing', price: 20, quantity: 5, available: true },
  
  // Item 15: Orbital Sander - 3 units
  { itemNumber: 15, name: 'Orbital Sander', category: 'Finishing', price: 25, quantity: 3, available: true },
  
  // Item 16: Mitre Saw - 4 units
  { itemNumber: 16, name: 'Mitre Saw', category: 'Saws', price: 32, quantity: 4, available: true },
  
  // Item 17: Cut-off Saw - 5 units
  { itemNumber: 17, name: 'Cut-off Saw', category: 'Saws', price: 30, quantity: 5, available: true },
  
  // Item 18: Jig Saw - 5 units
  { itemNumber: 18, name: 'Jig Saw', category: 'Saws', price: 22, quantity: 5, available: true },
  
  // Item 19: Chain Saw - 3 units
  { itemNumber: 19, name: 'Chain Saw', category: 'Saws', price: 35, quantity: 3, available: true },
  
  // Item 20: Router - 2 units
  { itemNumber: 20, name: 'Router', category: 'Power Tools', price: 28, quantity: 2, available: true },
  
  // Item 21: Planer - 3 units
  { itemNumber: 21, name: 'Planer', category: 'Power Tools', price: 32, quantity: 3, available: true },
  
  // Item 22: Electric Poker - 5 units
  { itemNumber: 22, name: 'Electric Poker', category: 'Concrete Tools', price: 18, quantity: 5, available: true },
  
  // Item 23: Blower - 5 units
  { itemNumber: 23, name: 'Blower', category: 'Cleaning Equipment', price: 12, quantity: 5, available: true },
  
  // Item 24: High Pressure Washer Small - 9 units
  { itemNumber: 24, name: 'High Pressure Washer Small', category: 'Cleaning Equipment', price: 20, quantity: 9, available: true },
  
  // Item 25: Air Compressor - 20 units
  { itemNumber: 25, name: 'Air Compressor', category: 'Cleaning Equipment', price: 30, quantity: 20, available: true },
  
  // Item 26: Arc Welding Plant - 15 units
  { itemNumber: 26, name: 'Arc Welding Plant', category: 'Welding', price: 85, quantity: 15, available: true },
  
  // Item 27: Mig Welding Plant - 3 units
  { itemNumber: 27, name: 'Mig Welding Plant', category: 'Welding', price: 95, quantity: 3, available: true },
  
  // Item 28: Tig Welding Plant - 3 units
  { itemNumber: 28, name: 'Tig Welding Plant', category: 'Welding', price: 120, quantity: 3, available: true },
];

// Admin seed endpoint - Seeds database with initial items
router.post('/database', async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    // Simple admin key check (should be improved with proper authentication)
    if (adminKey !== process.env.ADMIN_SEED_KEY && adminKey !== 'SEED_ADMIN_2024') {
      return res.status(401).json({ message: 'Unauthorized: Invalid admin key' });
    }

    // Clear existing items
    await Item.deleteMany({});
    console.log('Cleared existing items');

    // Insert seed items
    const result = await Item.insertMany(seedItems);
    console.log(`Inserted ${result.length} items`);

    res.json({ 
      message: 'Database seeded successfully',
      itemsInserted: result.length,
      items: result
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ 
      message: 'Error seeding database', 
      error: error.message 
    });
  }
});

// Get seed status endpoint
router.get('/status', async (req, res) => {
  try {
    const itemCount = await Item.countDocuments();
    const categories = await Item.distinct('category');
    
    res.json({
      status: 'success',
      itemsInDatabase: itemCount,
      categories: categories,
      seedDataAvailable: seedItems.length
    });
  } catch (error) {
    console.error('Seed status error:', error.message);
    
    let errorMessage = 'Failed to check database';
    
    if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'MongoDB connection refused - cluster may be offline or IP not whitelisted';
    } else if (error.message.includes('ENOTFOUND')) {
      errorMessage = 'MongoDB connection failed - check MongoDB URI in .env';
    } else if (error.message.includes('authentication failed')) {
      errorMessage = 'MongoDB authentication failed - check username/password';
    } else if (error.message.includes('querySrv')) {
      errorMessage = 'MongoDB Atlas DNS lookup failed - check connection string';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      details: error.message,
      errorType: error.name
    });
  }
});

export default router;
