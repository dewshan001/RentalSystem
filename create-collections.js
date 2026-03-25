import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectionDB } from './backend/config/db.js';
import { User } from './backend/models/User.js';
import { Item } from './backend/models/Item.js';
import { Cart } from './backend/models/Cart.js';
import { Rental } from './backend/models/Rental.js';

dotenv.config();

async function createCollections() {
  try {
    await connectionDB();
    console.log('✅ Connected to MongoDB');

    // Create collections by accessing the model
    const collections = [
      { name: 'users', model: User },
      { name: 'items', model: Item },
      { name: 'carts', model: Cart },
      { name: 'rentals', model: Rental }
    ];

    for (const collection of collections) {
      try {
        await collection.model.collection.drop();
        console.log(`🗑️ Dropped existing ${collection.name} collection`);
      } catch (error) {
        // Collection might not exist yet
      }
    }

    // Create new collections by creating indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    console.log('📦 Created users collection with email index');

    await Item.collection.createIndex({ name: 1 });
    console.log('📦 Created items collection with name index');

    await Cart.collection.createIndex({ userId: 1 }, { unique: true });
    console.log('📦 Created carts collection with userId index');

    await Rental.collection.createIndex({ userId: 1 });
    console.log('📦 Created rentals collection with userId index');

    // Display schema information
    console.log('\n✨ Collections Created Successfully!\n');
    console.log('📋 Collections Overview:');
    console.log('─'.repeat(60));

    console.log('\n1️⃣  USERS Collection');
    console.log('   Fields: name, email, password, phone, address, city, state, zipCode');
    console.log('   Indexes: email (unique)');

    console.log('\n2️⃣  ITEMS Collection');
    console.log('   Fields: name, description, price, category, quantity, available, image');
    console.log('   Indexes: name');

    console.log('\n3️⃣  CARTS Collection');
    console.log('   Fields: userId, items(itemId, quantity, rentalDays), timestamps');
    console.log('   Indexes: userId (unique)');

    console.log('\n4️⃣  RENTALS Collection');
    console.log('   Fields: userId, itemId, quantity, rentalDays, startDate, endDate, totalPrice, status');
    console.log('   Indexes: userId');

    console.log('\n─'.repeat(60));
    console.log('✅ All collections created successfully!\n');

    // Display MongoDB database info
    const db = mongoose.connection.db;
    const stats = await db.stats();
    console.log('📊 Database Stats:');
    console.log(`   - Database: ${stats.db}`);
    console.log(`   - Collections: ${stats.collections}`);
    console.log(`   - Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating collections:', error.message);
    process.exit(1);
  }
}

createCollections();
