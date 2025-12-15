const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  cow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },
  investor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },

  // Investment details
  investment_amount: { type: Number, required: true }, // full payment
  investment_date: { type: Date, default: Date.now },

  // Agreement
  agreement_signed: { type: Boolean, default: false },
  agreement_date: { type: Date },
  agreement_document: { type: String }, // file path

  // Ownership certificate
  ownership_certificate_issued: { type: Boolean, default: false },
  certificate_number: { type: String },
  certificate_date: { type: Date },
  certificate_document: { type: String }, // file path

  // Payment details
  payment_method: { type: String, enum: ['upi', 'card', 'bank_transfer'], required: true },
  transaction_id: { type: String },
  payment_status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },

  // Status
  status: { type: String, enum: ['active', 'completed', 'transferred'], default: 'active' },

  // Exit details
  exit_date: { type: Date },
  exit_value: { type: Number },
  total_returns: { type: Number, default: 0 },
  total_payouts: { type: Number, default: 0 },

  // Profit sharing
  investor_share_percentage: { type: Number, default: 40 },
  company_share_percentage: { type: Number, default: 60 }
}, { timestamps: true });

module.exports = mongoose.model('Investment', investmentSchema);