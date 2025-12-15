const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash', 'online'], default: 'online' },
  payment_type: { type: String, enum: ['bill_payment', 'advance'], default: 'bill_payment' },
  bill_month: { type: String }, // YYYY-MM format for bill payments
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  payment_screenshot: { type: String }, // Base64 encoded image
  transaction_id: { type: String },
  notes: { type: String },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at: { type: Date },
  rejection_reason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);