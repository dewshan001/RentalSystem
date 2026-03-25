import mongoose from 'mongoose';

const creditSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String },

  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental' },

  totalOwed: { type: Number, required: true },
  totalPaid: { type: Number, default: 0 },
  balance: { type: Number, required: true },

  status: { type: String, enum: ['outstanding', 'partial', 'settled', 'cleared'], default: 'outstanding' },

  lastPaymentDate: { type: Date },
  settledAt: { type: Date },
  clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  clearedAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

creditSchema.index({ customerPhone: 1, shopId: 1 });
creditSchema.index({ status: 1, shopId: 1 });

export const Credit = mongoose.model('Credit', creditSchema);
