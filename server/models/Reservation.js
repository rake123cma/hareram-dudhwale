const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  cow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
  investor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },

  // Reservation details
  deposit_amount: { type: Number, required: true },
  reservation_date: { type: Date, default: Date.now },
  expiry_date: { type: Date, required: true }, // usually 72 hours

  // Payment details
  payment_method: { type: String, enum: ['upi', 'card', 'bank_transfer'], required: true },
  transaction_id: { type: String },
  payment_status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },

  // Status
  status: { type: String, enum: ['active', 'expired', 'converted', 'cancelled'], default: 'active' },

  // Notes
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);