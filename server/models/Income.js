const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  source: { type: String, required: true }, // Who gave the money
  amount: { type: Number, required: true }, // Amount received
  description: { type: String }, // What for
  date: { type: Date, required: true },
  category: {
    type: String,
    enum: ['milk_sales', 'product_sales', 'investment_returns', 'subsidies', 'other_income'],
    required: true
  },
  payment_method: {
    type: String,
    enum: ['cash', 'online', 'cheque', 'upi'],
    default: 'cash'
  },
  reference_number: { type: String }, // Transaction ID, cheque number, etc.
  notes: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Index for efficient queries
incomeSchema.index({ date: -1 });
incomeSchema.index({ category: 1 });
incomeSchema.index({ source: 1 });

module.exports = mongoose.model('Income', incomeSchema);