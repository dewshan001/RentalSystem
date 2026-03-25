# RentalSystem

A complete rental platform where customers can browse items, add them to cart, and rent them. Built with Node.js, Express, and MongoDB.

## Features

### User Features
- **Landing Page** - Beautiful home page showcasing the platform
- **User Registration** - Create a new account with email and password
- **User Login** - Secure login for existing customers
- **Dashboard** - Browse available rental items and add to cart
- **Shopping Cart** - Manage cart items with quantity and rental duration
- **Profile Management** - Update personal information and address
- **Rental Management** - View active and past rentals, cancel rentals
- **Account Management** - Delete account when needed

### Admin Features
- Create, read, update, and delete rental items
- Manage item quantities and prices
- View all rentals

## Project Structure

```
RentalSystem/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Item.js            # Item schema
│   │   ├── Cart.js            # Cart schema
│   │   └── Rental.js          # Rental/Order schema
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── items.js           # Item routes
│   │   ├── cart.js            # Cart routes
│   │   └── rentals.js         # Rental routes
│   └── server.js              # Express server
├── frontend/
│   ├── index.html             # Landing page
│   ├── register.html          # Registration page
│   ├── login.html             # Login page
│   ├── dashboard.html         # Dashboard with items
│   ├── cart.html              # Shopping cart
│   ├── profile.html           # Profile management
│   ├── styles.css             # Global styles
│   └── utils.js               # API utilities
├── .env                       # Environment variables
├── .env.example               # Example env file
├── seed.js                    # Database seeding script
├── package.json               # Dependencies
└── README.md                  # This file
```

## MongoDB Collections

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Items Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,         // Price per day
  category: String,
  quantity: Number,
  available: Boolean,
  image: String,         // Optional
  createdAt: Date,
  updatedAt: Date
}
```

### Cart Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  items: [{
    itemId: ObjectId (ref: Item),
    quantity: Number,
    rentalDays: Number,
    addedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Rentals Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  itemId: ObjectId (ref: Item),
  quantity: Number,
  rentalDays: Number,
  startDate: Date,
  endDate: Date,
  totalPrice: Number,
  status: String,        // 'active', 'completed', 'cancelled'
  createdAt: Date,
  updatedAt: Date
}
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud connection)
- npm or yarn

### Setup Steps

1. **Clone/Navigate to the project**
   ```bash
   cd RentalSystem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update `MONGO_URI` with your MongoDB connection string
   ```bash
   MONGO_URI=mongodb://localhost:27017/rental_system
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

5. **Seed the database with sample items**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:3000`

## Available Scripts

```bash
npm run dev      # Start the development server
npm run start    # Start the production server
npm run seed     # Seed database with sample items
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)
- `DELETE /api/auth/account` - Delete user account (requires auth)

### Items
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create item (admin)
- `PUT /api/items/:id` - Update item (admin)
- `DELETE /api/items/:id` - Delete item (admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/remove` - Remove item from cart
- `POST /api/cart/clear` - Clear entire cart

### Rentals
- `POST /api/rentals/create` - Create rental
- `GET /api/rentals` - Get user rentals
- `PUT /api/rentals/:id/cancel` - Cancel rental

## User Flow

1. **Guest visits landing page** → Sees platform features
2. **User registers** → Account created, redirected to dashboard
3. **User browses items** → Can see all available rental items
4. **User adds to cart** → Specifies quantity and rental days
5. **User reviews cart** → Can modify quantities, rental days, or remove items
6. **User checks out** → Rentals are created, cart is cleared
7. **User views rentals** → Can see active and past rentals in profile
8. **User can update profile** → Change personal information
9. **User can cancel rental** → If rental is still active
10. **User can delete account** → Removes all account data

## Authentication

The system uses a simple token-based authentication where:
- User ID is stored in browser's localStorage
- User ID is sent in request headers as `x-user-id`
- Backend verifies the user exists for protected routes

**Note:** For production, implement proper JWT token-based authentication.

## Future Enhancements

- [ ] JWT token-based authentication
- [ ] Email verification
- [ ] Payment gateway integration
- [ ] Rental reservations (specific dates)
- [ ] Item reviews and ratings
- [ ] Wishlist feature
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Image uploads for items
- [ ] Advanced search and filtering

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGO_URI in .env file
- Verify MongoDB connection string format

### Items not showing
- Run `npm run seed` to add sample items
- Check database connection

### Port already in use
- Change PORT in .env file
- Or kill the process using port 3000

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
