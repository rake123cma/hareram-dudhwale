const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  unit: { type: String, enum: ['liters', 'kg', 'pieces', 'dozen'], required: true },
  default_price: { type: Number, required: true, min: 0 },
  description: { type: String },
  images: [{ type: String }], // Array of base64 image strings, max 5
  stock_quantity: { type: Number, default: 0, min: 0 },
  min_stock_level: { type: Number, default: 0, min: 0 },
  is_active: { type: Boolean, default: true },
  is_advance_bookable: { type: Boolean, default: false },
  is_special_product: { type: Boolean, default: false },
  advance_booking_available_from: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);