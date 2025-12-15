const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  investor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },
  cow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },

  // Payout details
  payout_type: {
    type: String,
    enum: ['monthly', 'exit', 'divestment', 'insurance_claim'],
    required: true
  },
  amount: { type: Number, required: true },
  payout_date: { type: Date, default: Date.now },

  // Period details (for monthly payouts)
  period_start: { type: Date },
  period_end: { type: Date },
  total_milk_produced: { type: Number },
  total_revenue: { type: Number },
  total_expenses: { type: Number },
  investor_share: { type: Number },
  company_share: { type: Number },

  // Payment details
  payment_method: { type: String, enum: ['bank_transfer', 'upi', 'cheque'], required: true },
  transaction_id: { type: String },
  payment_status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  paid_date: { type: Date },

  // Bank details
  bank_account: {
    account_number: String,
    ifsc_code: String,
    account_holder_name: String
  },

  // Statement
  statement_generated: { type: Boolean, default: false },
  statement_document: { type: String }, // PDF file path

  // Notes
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);