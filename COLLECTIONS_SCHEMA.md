# MongoDB Collections Schema

This document describes all MongoDB collections used in the RentalSystem.

## Collections Overview

The RentalSystem uses 4 main collections:

1. **users** - Customer accounts
2. **items** - Rental items catalog
3. **carts** - Shopping carts
4. **rentals** - Rental orders/bookings

---

## 1. Users Collection

Stores customer account information and profile details.

### Schema Definition

```javascript
{
  _id: ObjectId,                    // Automatic MongoDB ID
  name: String (required),          // Customer full name
  email: String (required, unique), // Email address
  password: String (required),      // User password
  phone: String,                    // Phone number
  address: String,                  // Home address
  city: String,                     // City
  state: String,                    // State/Province
  zipCode: String,                  // Postal code
  createdAt: Date,                  // Account creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

### Indexes

- `email: 1` (UNIQUE) - Ensures email uniqueness

### Example Document

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password_here",
  "phone": "+1-555-0123",
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "createdAt": "2024-02-19T10:30:00Z",
  "updatedAt": "2024-02-19T10:30:00Z"
}
```

### Queries

```javascript
// Find user by email
db.users.findOne({ email: "john@example.com" })

// Find user by ID
db.users.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })

// Update user profile
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $set: { phone: "+1-555-0456", city: "Los Angeles" } }
)

// Count total users
db.users.countDocuments()
```

---

## 2. Items Collection

Stores all available rental items with pricing and availability.

### Schema Definition

```javascript
{
  _id: ObjectId,              // Automatic MongoDB ID
  name: String (required),    // Item name
  description: String,        // Item description
  price: Number (required),   // Price per day (in dollars)
  category: String,           // Item category
  quantity: Number (default: 1), // Available quantity
  available: Boolean (default: true), // Availability status
  image: String,              // Image URL (optional)
  createdAt: Date,            // Creation timestamp
  updatedAt: Date             // Last update timestamp
}
```

### Indexes

- `name: 1` - For faster name-based searches

### Example Document

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "name": "Mountain Bike",
  "description": "High-performance mountain bike with suspension",
  "price": 25,
  "category": "Sports",
  "quantity": 5,
  "available": true,
  "image": "https://example.com/bike.jpg",
  "createdAt": "2024-02-19T10:30:00Z",
  "updatedAt": "2024-02-19T10:30:00Z"
}
```

### Queries

```javascript
// Get all available items
db.items.find({ available: true })

// Find items by category
db.items.find({ category: "Sports" })

// Find items by name
db.items.findOne({ name: "Mountain Bike" })

// Update item quantity
db.items.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439012") },
  { $set: { quantity: 10, updatedAt: new Date() } }
)

// Get items with price range
db.items.find({ price: { $gte: 20, $lte: 50 } })
```

---

## 3. Carts Collection

Stores shopping cart data for each customer.

### Schema Definition

```javascript
{
  _id: ObjectId,                    // Automatic MongoDB ID
  userId: ObjectId (required),      // Reference to user
  items: [{                         // Array of cart items
    itemId: ObjectId (required),    // Reference to item
    quantity: Number (default: 1),  // Quantity ordered
    rentalDays: Number (default: 1), // Number of rental days
    addedAt: Date                   // When added to cart
  }],
  createdAt: Date,                  // Cart creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

### Indexes

- `userId: 1` (UNIQUE) - One cart per user

### Example Document

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "items": [
    {
      "itemId": ObjectId("507f1f77bcf86cd799439012"),
      "quantity": 2,
      "rentalDays": 3,
      "addedAt": "2024-02-19T15:45:00Z"
    },
    {
      "itemId": ObjectId("507f1f77bcf86cd799439014"),
      "quantity": 1,
      "rentalDays": 5,
      "addedAt": "2024-02-19T16:00:00Z"
    }
  ],
  "createdAt": "2024-02-19T15:45:00Z",
  "updatedAt": "2024-02-19T16:00:00Z"
}
```

### Queries

```javascript
// Get user's cart
db.carts.findOne({ userId: ObjectId("507f1f77bcf86cd799439011") })

// Add item to cart
db.carts.updateOne(
  { userId: ObjectId("507f1f77bcf86cd799439011") },
  { 
    $push: { 
      items: {
        itemId: ObjectId("507f1f77bcf86cd799439012"),
        quantity: 1,
        rentalDays: 3,
        addedAt: new Date()
      }
    },
    $set: { updatedAt: new Date() }
  }
)

// Remove item from cart
db.carts.updateOne(
  { userId: ObjectId("507f1f77bcf86cd799439011") },
  { 
    $pull: { items: { itemId: ObjectId("507f1f77bcf86cd799439012") } }
  }
)

// Clear cart
db.carts.updateOne(
  { userId: ObjectId("507f1f77bcf86cd799439011") },
  { $set: { items: [] } }
)
```

---

## 4. Rentals Collection

Stores all rental orders/bookings placed by customers.

### Schema Definition

```javascript
{
  _id: ObjectId,                    // Automatic MongoDB ID
  userId: ObjectId (required),      // Reference to user (customer)
  itemId: ObjectId (required),      // Reference to rented item
  quantity: Number (default: 1),    // Quantity rented
  rentalDays: Number (required),    // Duration in days
  startDate: Date (required),       // Rental start date
  endDate: Date (required),         // Rental end date
  totalPrice: Number (required),    // Total rental cost
  status: String (enum: ['active', 'completed', 'cancelled'], default: 'active'),
  createdAt: Date,                  // Order creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

### Indexes

- `userId: 1` - For finding user's rentals
- `itemId: 1` - For finding rentals of specific items
- `status: 1` - For finding rentals by status

### Example Document

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "itemId": ObjectId("507f1f77bcf86cd799439012"),
  "quantity": 2,
  "rentalDays": 3,
  "startDate": "2024-02-19T12:00:00Z",
  "endDate": "2024-02-22T12:00:00Z",
  "totalPrice": 150,
  "status": "active",
  "createdAt": "2024-02-19T10:30:00Z",
  "updatedAt": "2024-02-19T10:30:00Z"
}
```

### Queries

```javascript
// Get user's all rentals
db.rentals.find({ userId: ObjectId("507f1f77bcf86cd799439011") })

// Get active rentals for a user
db.rentals.find({ 
  userId: ObjectId("507f1f77bcf86cd799439011"),
  status: "active"
})

// Get rentals by status
db.rentals.find({ status: "active" })

// Update rental status
db.rentals.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439015") },
  { $set: { status: "cancelled", updatedAt: new Date() } }
)

// Get completed rentals by date range
db.rentals.find({
  status: "completed",
  createdAt: { 
    $gte: ISODate("2024-02-01"),
    $lte: ISODate("2024-02-28")
  }
})

// Calculate total revenue
db.rentals.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
])
```

---

## Collection Relationships

### Relationships Diagram

```
┌─────────────────┐
│     Users       │
│   (customers)   │
└────────┬────────┘
         │ userId
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
    ┌────────┐      ┌──────────┐       ┌─────────┐
    │ Carts  │      │ Rentals  │       │ Items   │
    │(active)│      │(orders)  │       │(catalog)│
    └────────┘      └──────────┘       └─────────┘
         │                 │                 ▲
         │                 │                 │
         └─────────────────┴────itemId───────┘
```

### Query Examples with Joins

```javascript
// Get user's cart with item details
db.carts.aggregate([
  { $match: { userId: ObjectId("507f1f77bcf86cd799439011") } },
  {
    $lookup: {
      from: "items",
      localField: "items.itemId",
      foreignField: "_id",
      as: "itemDetails"
    }
  }
])

// Get user's complete rental history with item names
db.rentals.aggregate([
  { $match: { userId: ObjectId("507f1f77bcf86cd799439011") } },
  {
    $lookup: {
      from: "items",
      localField: "itemId",
      foreignField: "_id",
      as: "itemInfo"
    }
  },
  { $unwind: "$itemInfo" },
  {
    $project: {
      itemName: "$itemInfo.name",
      rentalDays: 1,
      totalPrice: 1,
      status: 1,
      startDate: 1,
      endDate: 1
    }
  }
])

// Get all rentals with user and item information
db.rentals.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "userInfo"
    }
  },
  {
    $lookup: {
      from: "items",
      localField: "itemId",
      foreignField: "_id",
      as: "itemInfo"
    }
  },
  { $unwind: "$userInfo" },
  { $unwind: "$itemInfo" },
  {
    $project: {
      customerName: "$userInfo.name",
      itemName: "$itemInfo.name",
      rentalDays: 1,
      totalPrice: 1,
      status: 1
    }
  }
])
```

---

## Data Migration & Backup

### Backup Collections

```bash
# Backup MongoDB database
mongodump --db rental_system --out ./backups

# Restore collections
mongorestore --db rental_system ./backups/rental_system
```

### Export Collections to JSON

```bash
# Export users collection
mongoexport --db rental_system --collection users --out users.json

# Export all collections
mongoexport --db rental_system --collection items --out items.json
mongoexport --db rental_system --collection carts --out carts.json
mongoexport --db rental_system --collection rentals --out rentals.json
```

---

## Performance Considerations

### Recommended Indexes

All collections already have optimal indexes:

- **users**: UNIQUE index on `email`
- **items**: Index on `name` for fast searches
- **carts**: UNIQUE index on `userId` (one cart per user)
- **rentals**: Indexes on `userId` and `status` for common queries

### Query Optimization Tips

1. Always filter by indexed fields when possible
2. Use aggregation pipeline for complex queries
3. Limit returned fields with projection
4. Use proper pagination for large result sets
5. Monitor slow queries with MongoDB profiler

### Storage Estimates

```
Typical Document Sizes:
- User: ~300 bytes
- Item: ~400 bytes
- Cart (with 5 items): ~600 bytes
- Rental: ~350 bytes

For 10,000 users with 2,000 items:
- Users: ~3 MB
- Items: ~0.8 MB
- Carts: ~6 MB
- Rentals: ~3.5 MB
Total: ~13.3 MB
```

---

## Collection Maintenance

### Regular Maintenance Tasks

```javascript
// Delete old completed rentals (older than 1 year)
db.rentals.deleteMany({
  status: "completed",
  createdAt: { $lt: new Date(Date.now() - 365*24*60*60*1000) }
})

// Clean up orphaned carts (no user exists)
db.carts.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
    }
  },
  { $match: { user: { $size: 0 } } }
])

// Reindex collections
db.users.reIndex()
db.items.reIndex()
db.carts.reIndex()
db.rentals.reIndex()
```

---

## Next Steps

1. Run `npm run create-collections` to create the collections
2. Run `npm run seed` to add sample data
3. Start the server: `npm run dev`
4. Access the application at http://localhost:3000
