# RentalSystem - Complete Setup Guide

This is a full-featured rental platform where customers can register, login, browse items, add to cart, and manage rentals.

## ✨ Features

- **Landing Page** - Beautiful homepage
- **User Registration & Login** - Create and manage accounts
- **Dashboard** - Browse and add items to cart
- **Shopping Cart** - Manage rental cart
- **Profile Management** - Update user information
- **Rental Management** - View and cancel rentals
- **Account Deletion** - Remove account when needed

## 🗄️ MongoDB Collections

The system automatically creates these collections:

1. **users** - Customer accounts
2. **items** - Rental items catalog
3. **carts** - Shopping carts
4. **rentals** - Active and past rentals

## 📋 Prerequisites

- **Node.js** >= 14 (https://nodejs.org/)
- **MongoDB** (Choose one):
  - Local: https://www.mongodb.com/try/download/community
  - Cloud: https://www.mongodb.com/cloud/atlas (Free tier available)
- **VS Code Extensions** (Optional but recommended):
  - MongoDB for VS Code: https://marketplace.visualstudio.com/items?itemName=mongodb.mongodb-vscode

## 🚀 Setup Steps

### Step 1: Install Dependencies

From the project root directory, run:

```bash
npm install
```

### Step 2: Configure MongoDB Connection

Create/update `.env` file in project root with your MongoDB connection string:

```dotenv
MONGO_URI=mongodb://localhost:27017/rental_system
PORT=3000
JWT_SECRET=your_secret_key_here
```

#### MongoDB Connection String Examples:

**Local MongoDB:**
```
mongodb://localhost:27017/rental_system
```

**MongoDB Atlas (Cloud):**
```
mongodb+srv://username:password@cluster.mongodb.net/rental_system?retryWrites=true&w=majority
```

### Step 3: Start MongoDB (If Using Local)

#### Windows:
1. If installed via MSI, MongoDB should auto-start as a service
2. Or run: `mongod` (if added to PATH)

#### macOS:
```bash
brew services start mongodb-community
```

#### Linux:
```bash
sudo systemctl start mongod
```

**Verify MongoDB is running:**
```bash
mongo --eval "db.version()"
```

### Step 4: Seed Sample Data

Add sample rental items to the database:

```bash
npm run seed
```

This will insert 8 sample items (bikes, cameras, electronics, etc.)

### Step 5: Start the Server

```bash
npm run dev
```

Expected output:
```
MongoDB Connected: localhost
Server running on http://localhost:3000
```

## 🌐 Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## 📝 Project Structure

```
RentalSystem/
├── backend/
│   ├── config/db.js              # MongoDB connection config
│   ├── models/                   # Data schemas
│   │   ├── User.js
│   │   ├── Item.js
│   │   ├── Cart.js
│   │   └── Rental.js
│   ├── routes/                   # API endpoints
│   │   ├── auth.js              # Register, login, profile
│   │   ├── items.js             # Item management
│   │   ├── cart.js              # Shopping cart
│   │   └── rentals.js           # Rental management
│   └── server.js                # Express app & routes
├── frontend/
│   ├── index.html               # Landing page
│   ├── register.html            # Registration
│   ├── login.html               # Login
│   ├── dashboard.html           # Browse items & add to cart
│   ├── cart.html                # Shopping cart
│   ├── profile.html             # Profile & rentals
│   ├── styles.css               # Styling
│   └── utils.js                 # API helper functions
├── .env                         # Environment config
├── package.json                 # Dependencies & scripts
├── seed.js                      # Sample data seeder
└── README.md                    # Full documentation
```

## 🔑 Available Scripts

```bash
npm run dev      # Start server (port 3000)
npm run start    # Production start
npm run seed     # Add sample items to database
```

## 📌 User Workflow

1. **Visit landing page** (http://localhost:3000)
2. **Register account** - Click "Create Account" button
3. **Auto redirect to dashboard** - After registration
4. **Browse items** - View all available rental items
5. **Add to cart** - Specify quantity and rental days
6. **View cart** - http://localhost:3000/cart
7. **Checkout** - Creates rentals from cart items
8. **View profile** - http://localhost:3000/profile
   - View active rentals
   - Update profile information
   - Cancel rentals
   - Delete account

## 🔐 Authentication

- Uses simple token-based auth with localStorage
- User ID sent in `x-user-id` header for protected endpoints
- **Note:** For production, implement proper JWT authentication

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running. Start with `mongod` or check MongoDB service.

### Port 3000 Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Change PORT in `.env` or kill the process using port 3000

### Items Not Showing on Dashboard
**Solution:** Run `npm run seed` to add sample items

### Cannot GET /dashboard
**Solution:** Must be logged in. Register first at `/register`

## 📱 Pages and Routes

| Page | URL | Description |
|------|-----|-------------|
| Landing | / | Home page |
| Register | /register | Create new account |
| Login | /login | Sign in |
| Dashboard | /dashboard | Browse items (protected) |
| Cart | /cart | Shopping cart (protected) |
| Profile | /profile | Profile & rentals (protected) |

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/profile` - Get profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `DELETE /api/auth/account` - Delete account (protected)

### Items
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get single item

### Cart
- `GET /api/cart` - Get cart (protected)
- `POST /api/cart/add` - Add to cart (protected)
- `POST /api/cart/remove` - Remove from cart (protected)
- `POST /api/cart/clear` - Clear cart (protected)

### Rentals
- `POST /api/rentals/create` - Create rental (protected)
- `GET /api/rentals` - Get rentals (protected)
- `PUT /api/rentals/:id/cancel` - Cancel rental (protected)

## 💡 Testing the System

### Test Account (After Seeding)
- Create your own account via registration page

### Test Items
After running `npm run seed`, you'll have:
- Mountain Bike ($25/day)
- Laptop ($50/day)
- Camping Tent ($35/day)
- DSLR Camera ($45/day)
- Surfboard ($20/day)
- Electric Scooter ($30/day)
- Gaming Console ($40/day)
- Projector ($60/day)

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MDN Web Docs](https://developer.mozilla.org/)

## ❓ Common Questions

**Q: Can I use a different database?**
A: Yes, modify `backend/config/db.js` to use your preferred database.

**Q: How do I add more items?**
A: Edit `seed.js` to add more items, then run `npm run seed`

**Q: How do I change the port?**
A: Update `PORT=3000` in `.env` file

**Q: Can I deploy this to production?**
A: Yes, but implement proper JWT authentication and use environment-specific configurations

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review README.md for more details
3. Check your MongoDB connection
4. Verify all dependencies are installed

---

**Happy Renting! 🎉**
