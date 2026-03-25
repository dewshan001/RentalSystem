import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, required: true, unique: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },

  customerName: { type: String },
  customerPhone: { type: String },

  amount: { type: Number, required: true },
  paymentType: { type: String, enum: ['advance', 'partial', 'full', 'settlement'], default: 'full' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'bank_transfer', 'other'], default: 'cash' },

  notes: { type: String },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deleteReason: { type: String },

  createdAt: { type: Date, default: Date.now },
});

paymentSchema.index({ invoiceId: 1 });
paymentSchema.index({ shopId: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
