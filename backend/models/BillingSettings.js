import mongoose from 'mongoose';

const billingSettingsSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', unique: true },
  lateFeePercentage: { type: Number, default: 0 },       // Extra % on top of daily rate per overdue day (0 = just regular daily rate)
  returnDeadlineHour: { type: Number, default: 9 },       // 9:00 AM
  returnDeadlineMinute: { type: Number, default: 0 },
  archiveAfterDays: { type: Number, default: 365 },       // Auto-archive records older than this
  updatedAt: { type: Date, default: Date.now },
});

export const BillingSettings = mongoose.model('BillingSettings', billingSettingsSchema);
