const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name: { type: String, required: true }, // Store customer name for records
  billing_period: { type: String, required: true }, // Format: YYYY-MM
  billing_type: { type: String, enum: ['subscription', 'per_liter'], required: true },
  total_amount: { type: Number, required: true },
  total_liters: { type: Number, default: 0 }, // For per_liter billing
  price_per_liter: { type: Number, default: 0 }, // For per_liter billing
  delivered_days: { type: Number, default: 0 }, // For subscription billing (prorated)
  total_days: { type: Number, default: 0 }, // Total days in billing period
  proration_factor: { type: Number, default: 1 }, // For subscription billing (delivered_days / total_days)
  status: { type: String, enum: ['paid', 'unpaid', 'overdue'], default: 'unpaid' },
  due_date: { type: Date, required: true },
  invoice_number: { type: String, required: true, unique: true },
  payment_date: { type: Date },
  payment_method: { type: String, enum: ['cash', 'online', 'cheque', 'bank_transfer'], default: 'cash' },
  payments: [{
    amount: { type: Number, required: true },
    payment_date: { type: Date, default: Date.now },
    payment_method: { type: String, enum: ['cash', 'online', 'cheque', 'bank_transfer'], default: 'cash' },
    transaction_id: { type: String },
    notes: { type: String },
    recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recorded_at: { type: Date, default: Date.now }
  }],
  notes: { type: String }
}, { timestamps: true });

// Compound index to ensure one bill per customer per billing period
billSchema.index({ customer_id: 1, billing_period: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);