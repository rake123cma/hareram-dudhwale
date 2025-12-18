const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  // Loan basic details
  loan_name: { type: String, required: true }, // e.g., "Working Capital Loan 2024"
  lender_name: { type: String, required: true }, // Bank or financial institution
  loan_type: {
    type: String,
    enum: ['business', 'agricultural', 'equipment', 'working_capital', 'personal'],
    required: true
  },

  // Loan amounts
  principal_amount: { type: Number, required: true },
  outstanding_balance: { type: Number, required: true }, // Updated as payments are made
  interest_rate: { type: Number, required: true }, // Annual interest rate in percentage

  // Loan terms
  loan_date: { type: Date, required: true },
  maturity_date: { type: Date, required: true },
  tenure_months: { type: Number, required: true },

  // Repayment details
  repayment_frequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'],
    default: 'monthly'
  },
  emi_amount: { type: Number }, // Calculated EMI amount
  total_interest_payable: { type: Number },
  total_amount_payable: { type: Number },

  // Account details
  loan_account_number: { type: String },
  bank_name: { type: String },
  branch_name: { type: String },

  // Status
  status: {
    type: String,
    enum: ['active', 'closed', 'defaulted', 'restructured'],
    default: 'active'
  },

  // Security/Collateral
  collateral_details: { type: String },
  guarantor_details: { type: String },

  // Documents
  loan_agreement_document: { type: String }, // file path
  sanction_letter_document: { type: String }, // file path

  // Payment tracking
  next_payment_date: { type: Date },
  last_payment_date: { type: Date },
  total_paid_principal: { type: Number, default: 0 },
  total_paid_interest: { type: Number, default: 0 },

  // Risk indicators
  dpd_days: { type: Number, default: 0 }, // Days past due
  risk_category: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },

  // Notes and remarks
  notes: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Indexes for efficient queries
loanSchema.index({ status: 1 });
loanSchema.index({ maturity_date: 1 });
loanSchema.index({ next_payment_date: 1 });
loanSchema.index({ lender_name: 1 });

// Pre-save middleware to calculate totals
loanSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('principal_amount') || this.isModified('interest_rate') || this.isModified('tenure_months')) {
    // Simple EMI calculation (can be enhanced)
    const principal = this.principal_amount;
    const rate = this.interest_rate / 100 / 12; // Monthly rate
    const time = this.tenure_months;

    if (rate > 0) {
      this.emi_amount = Math.round((principal * rate * Math.pow(1 + rate, time)) / (Math.pow(1 + rate, time) - 1));
    } else {
      this.emi_amount = Math.round(principal / time);
    }

    this.total_interest_payable = Math.round(this.emi_amount * time - principal);
    this.total_amount_payable = this.principal_amount + this.total_interest_payable;
  }
  next();
});

module.exports = mongoose.model('Loan', loanSchema);