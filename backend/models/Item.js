import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  itemNumber: { type: Number, unique: true, sparse: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true }, // price per day
  category: { type: String },
  quantity: { type: Number, default: 1 },
  available: { type: Boolean, default: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Item = mongoose.model('Item', itemSchema);
