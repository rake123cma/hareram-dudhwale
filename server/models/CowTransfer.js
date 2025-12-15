const mongoose = require('mongoose');

const cowTransferSchema = new mongoose.Schema({
  cow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },

  // Transfer parties
  from_investor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },
  to_investor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },

  // Transfer details
  transfer_price: { type: Number, required: true },
  transfer_date: { type: Date, default: Date.now },
  agreed_date: { type: Date },

  // KYC and verification
  kyc_verified: { type: Boolean, default: false },
  kyc_documents: [{ type: String }], // file paths

  // Payment details
  payment_method: { type: String, enum: ['bank_transfer', 'upi', 'cash'], required: true },
  transaction_id: { type: String },
  payment_status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },

  // Agreement
  agreement_signed: { type: Boolean, default: false },
  agreement_document: { type: String }, // file path

  // Status
  status: { type: String, enum: ['pending', 'approved', 'completed', 'cancelled'], default: 'pending' },

  // Audit trail
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who approved
  approval_date: { type: Date },

  // Notes
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CowTransfer', cowTransferSchema);