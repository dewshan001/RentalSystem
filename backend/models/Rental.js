import mongoose from 'mongoose';

const rentalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for shop orders
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, default: 1 },
  rentalDays: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['active', 'completed', 'cancelled', 'pending', 'confirmed', 'closed'], default: 'active' },
  orderType: { type: String, enum: ['customer', 'shop-to-warehouse'], default: 'customer' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }, // Shop manager's staff ID
  customerInfo: {
    name: String,
    phone: String,
    address: String
  },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }, // Warehouse manager who confirmed
  confirmedAt: Date,
  notes: String,
  // Invoice & payment fields
  invoiceNumber: { type: String },
  advancePayment: { type: Number, default: 0 },
  actualReturnDate: { type: Date },
  actualDays: { type: Number },
  finalAmount: { type: Number },
  balanceDue: { type: Number },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  closedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Rental = mongoose.model('Rental', rentalSchema);
