# Database Seeding Guide

## Quick Start

Your rental system now has TWO ways to seed the items database:

### Method 1: Via Web Interface (Recommended)

1. **Start the server**
   ```powershell
   npm start
   ```

2. **Visit the seed admin page**
   ```
   http://localhost:3000/seed-admin
   ```

3. **Click "Check Database Status"** to verify MongoDB connection

4. **Enter the admin key:**
   ```
   SEED_ADMIN_2024
   ```

5. **Click "Seed Database"** - Done! ✅

   You'll see:
   - ✅ Success confirmation
   - Number of items inserted (28)
   - Real-time database status update

---

### Method 2: Command Line (When MongoDB is accessible)

If you have MongoDB Atlas working and accessible:

```powershell
npm run seed
```

This runs the [seed.js](seed.js) script which connects directly to MongoDB and inserts all items.

---

## What Gets Seeded

**28 Tool Items** across 9 categories:

| Category | Items | Total Units |
|----------|-------|-------------|
| Grinders | Angle 4", 4-1/2", 7" | 28 |
| Drills | Drill Machine, Rechargeable, Hammer | 33 |
| Saws | Circular, Marble Cutter, Jig, Mitre, Cut-off, Chain | 32 |
| Breaking Tools | Breaker 5 KG, Demolizer | 15 |
| Finishing | Sander, Orbital Sander | 11 |
| Mixers | Putty Mixer | 10 |
| Power Tools | Router, Planer | 5 |
| Concrete Tools | Electric Poker | 5 |
| Cleaning Equipment | Air Compressor, Washer, Blower | 34 |
| Welding | Arc, Mig, Tig Plants | 21 |

**Total: 194 rental units**

---

## API Endpoints

### Check Database Status
```
GET /api/seed/status

Response:
{
  "status": "success",
  "itemsInDatabase": 28,
  "categories": ["Grinders", "Drills", ...],
  "seedDataAvailable": 28
}
```

### Seed Database
```
POST /api/seed/database

Body:
{
  "adminKey": "SEED_ADMIN_2024"
}

Response:
{
  "message": "Database seeded successfully",
  "itemsInserted": 28,
  "items": [...]
}
```

---

## After Seeding

### 1. Verify in Dashboard
Visit `http://localhost:3000/dashboard` and:
- ✅ See all 28 items
- ✅ Filter by category
- ✅ Search by name/number
- ✅ Add items to cart

### 2. Check Cart Functionality
- Add items with quantity and rental days
- View cart summary
- Proceed to checkout

### 3. Verify Database
- Use MongoDB Compass or Atlas UI
- Check `items` collection for 28 documents
- Verify `itemNumber` field is unique

---

## MongoDB Connection Requirements

The seed admin page requires MongoDB to be connected. Make sure:

1. ✅ MongoDB Atlas cluster is **active** (not paused)
2. ✅ Connection string in `.env` is correct:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   ```
3. ✅ Network allows connection from your IP
4. ✅ Credentials are valid

---

## Troubleshooting

### "Error: querySrv ECONNREFUSED"
- MongoDB Atlas cluster is not accessible
- **Solution:** Check Atlas UI → Cluster Status → Network Access

### "Unauthorized: Invalid admin key"
- Admin key is incorrect
- **Solution:** Use `SEED_ADMIN_2024`

### "Error: connection timeout"
- MongoDB taking too long to respond
- **Solution:** Try again or check MongoDB status

### Database shows items but dashboard is empty
- Items are seeded but frontend not loading
- **Solution:** 
  1. Refresh browser (Ctrl+F5)
  2. Clear cache
  3. Check browser console for errors

---

## Manual Data Entry (Alternative)

If seeding fails, you can manually add items via API:

```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "itemNumber": 1,
    "name": "Angle Grinder 4\"",
    "category": "Grinders",
    "price": 15,
    "quantity": 10,
    "available": true
  }'
```

---

## File Locations

- **Seed Admin Page:** [frontend/seed-admin.html](frontend/seed-admin.html)
- **Seed API Route:** [backend/routes/seed.js](backend/routes/seed.js)
- **Seed Data Script:** [seed.js](seed.js)
- **Server Config:** [backend/server.js](backend/server.js)

---

## Next Steps

1. ✅ Start server: `npm start`
2. ✅ Go to: `http://localhost:3000/seed-admin`
3. ✅ Click "Seed Database"
4. ✅ Visit dashboard: `http://localhost:3000/dashboard`
5. ✅ Register and start renting tools!

---

**Admin Key:** `SEED_ADMIN_2024` (default, can be changed in [backend/routes/seed.js](backend/routes/seed.js))
