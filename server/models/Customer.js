const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  pincode: { type: String },
  billing_type: { type: String, enum: ['subscription', 'per_liter'] },
  billing_frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
  delivery_time: { type: String, enum: ['morning', 'evening', 'both'], default: 'morning' },
  subscription_amount: { type: Number },
  price_per_liter: { type: Number },
  balance_due: { type: Number, default: 0 },
  category: { type: String, required: true },
  customer_type: { type: String, enum: ['guest customer', 'daily milk customer'], default: 'daily milk customer' },
  registration_source: { type: String, enum: ['admin', 'homepage'], default: 'admin' },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);