const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
  // Personal info
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  address: { type: String },
  pincode: { type: String },

  // KYC details
  aadhar_number: { type: String },
  pan_number: { type: String },
  bank_account: {
    account_number: String,
    ifsc_code: String,
    bank_name: String,
    account_holder_name: String
  },

  // Investment profile
  total_invested: { type: Number, default: 0 },
  current_investments: { type: Number, default: 0 }, // active cows
  total_returns: { type: Number, default: 0 },
  total_payouts_received: { type: Number, default: 0 },

  // Status
  is_active: { type: Boolean, default: true },
  registration_date: { type: Date, default: Date.now },

  // Portfolio
  owned_cows: [{
    cow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow' },
    investment_date: Date,
    investment_amount: Number,
    current_value: Number,
    status: { type: String, enum: ['active', 'sold', 'transferred'], default: 'active' }
  }],

  // Transaction history
  transactions: [{
    type: { type: String, enum: ['investment', 'payout', 'transfer_in', 'transfer_out'] },
    amount: Number,
    date: Date,
    cow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow' },
    description: String,
    reference_id: String // payout_id, transfer_id, etc.
  }],

  // Notifications preferences
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    daily_updates: { type: Boolean, default: true },
    weekly_reports: { type: Boolean, default: true },
    monthly_statements: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Investor', investorSchema);