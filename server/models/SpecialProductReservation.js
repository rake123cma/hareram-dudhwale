const mongoose = require('mongoose');

const specialProductReservationSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

  // Reservation details
  quantity: { type: Number, required: true, min: 1 },
  reservation_date: { type: Date, default: Date.now },
  expected_delivery_date: { type: Date },

  // Payment details
  deposit_amount: { type: Number, required: true, min: 0 },
  total_amount: { type: Number, required: true, min: 0 },
  payment_method: { type: String, enum: ['upi', 'card', 'bank_transfer', 'cash'], required: true },
  transaction_id: { type: String },
  payment_status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },

  // Status
  status: { type: String, enum: ['active', 'delivered', 'cancelled', 'expired'], default: 'active' },

  // Notes
  notes: { type: String },
  special_instructions: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SpecialProductReservation', specialProductReservationSchema);