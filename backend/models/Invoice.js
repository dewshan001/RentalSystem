import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },

  // Customer info (denormalized for invoice permanence)
  customerName: { type: String },
  customerPhone: { type: String },
  customerAddress: { type: String },

  // Item info (denormalized)
  itemName: { type: String },
  itemCategory: { type: String },
  pricePerDay: { type: Number, required: true },
  quantity: { type: Number, default: 1 },

  // Rental duration
  agreedDays: { type: Number, required: true },
  actualDays: { type: Number },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  returnDate: { type: Date },

  // Financial breakdown
  rentalCharge: { type: Number, required: true },    // pricePerDay * qty * agreedDays
  lateFee: { type: Number, default: 0 },             // pricePerDay * qty * extraDays
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },      // rentalCharge + lateFee - discount
  advancePaid: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },           // total payments received
  balanceDue: { type: Number, default: 0 },

  // Status
  status: { 
    type: String, 
    enum: ['draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled', 'archived'],
    default: 'issued'
  },

  // Meta
  notes: { type: String },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  archivedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

invoiceSchema.index({ shopId: 1, status: 1 });
invoiceSchema.index({ customerName: 'text', invoiceNumber: 'text' });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
