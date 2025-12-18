const mongoose = require('mongoose');

const bankTransactionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer_in', 'transfer_out'],
    required: true
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },

  // Bank account details
  bank_name: { type: String, required: true },
  account_number: { type: String, required: true },
  ifsc_code: { type: String },

  // Transaction details
  transaction_id: { type: String },
  reference_number: { type: String },
  payment_method: {
    type: String,
    enum: ['cash', 'cheque', 'online', 'upi', 'bank_transfer', 'internal'],
    required: true
  },

  // Link to account
  account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },

  // Link to related entities
  related_entity_type: {
    type: String,
    enum: ['customer_payment', 'supplier_payment', 'expense', 'payout', 'investment', 'loan', 'account', 'other']
  },
  related_entity_id: { type: mongoose.Schema.Types.ObjectId },

  // Balance after transaction
  balance_after: { type: Number },

  // Recorded by
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Supporting documents
  receipt_document: { type: String }, // file path
  notes: { type: String }
}, { timestamps: true });

// Index for efficient queries
bankTransactionSchema.index({ date: -1 });
bankTransactionSchema.index({ bank_name: 1, account_number: 1 });
bankTransactionSchema.index({ type: 1 });

module.exports = mongoose.model('BankTransaction', bankTransactionSchema);