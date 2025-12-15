const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  // Account basic information
  account_name: { type: String, required: true }, // e.g., "Main Bank Account", "Petty Cash"
  account_type: {
    type: String,
    enum: ['bank_account', 'cash_account', 'credit_card', 'digital_wallet', 'receivable', 'payable', 'loan', 'income', 'expense', 'other'],
    required: true
  },

  // Bank details (for bank accounts)
  bank_name: { type: String },
  account_number: { type: String },
  ifsc_code: { type: String },
  branch_name: { type: String },

  // Account details
  description: { type: String },
  opening_balance: { type: Number, default: 0 },
  current_balance: { type: Number, default: 0 },

  // Account holder details
  account_holder_name: { type: String },
  contact_number: { type: String },
  email: { type: String },

  // Status and settings
  status: {
    type: String,
    enum: ['active', 'inactive', 'closed'],
    default: 'active'
  },
  is_default: { type: Boolean, default: false }, // Default account for transactions

  // Transaction limits and settings
  daily_limit: { type: Number },
  monthly_limit: { type: Number },
  currency: { type: String, default: 'INR' },

  // Integration details (for future use)
  integration_type: { type: String }, // e.g., 'razorpay', 'stripe', 'manual'
  integration_id: { type: String },

  // Audit fields
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  last_transaction_date: { type: Date }
}, { timestamps: true });

// Indexes for efficient queries
accountSchema.index({ account_type: 1 });
accountSchema.index({ status: 1 });
accountSchema.index({ is_default: 1 });

// Pre-save middleware to set current balance initially
accountSchema.pre('save', function(next) {
  if (this.isNew && this.current_balance === 0) {
    this.current_balance = this.opening_balance;
  }
  next();
});

// Virtual for account display name
accountSchema.virtual('display_name').get(function() {
  if (this.account_type === 'bank_account') {
    return `${this.account_name} (${this.bank_name} - ${this.account_number?.slice(-4)})`;
  }
  return this.account_name;
});

module.exports = mongoose.model('Account', accountSchema);