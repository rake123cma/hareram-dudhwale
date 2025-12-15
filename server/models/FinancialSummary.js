const mongoose = require('mongoose');

const financialSummarySchema = new mongoose.Schema({
  // Period details
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },

  // Income/Revenue
  total_revenue: { type: Number, default: 0 },
  milk_sales_revenue: { type: Number, default: 0 },
  product_sales_revenue: { type: Number, default: 0 },
  other_income: { type: Number, default: 0 },

  // Expenses
  total_expenses: { type: Number, default: 0 },
  feed_expenses: { type: Number, default: 0 },
  medicine_expenses: { type: Number, default: 0 },
  labor_expenses: { type: Number, default: 0 },
  utility_expenses: { type: Number, default: 0 },
  maintenance_expenses: { type: Number, default: 0 },
  transport_expenses: { type: Number, default: 0 },
  other_expenses: { type: Number, default: 0 },

  // Profit/Loss
  gross_profit: { type: Number, default: 0 },
  net_profit: { type: Number, default: 0 },

  // Cash Flow
  opening_cash_balance: { type: Number, default: 0 },
  closing_cash_balance: { type: Number, default: 0 },
  cash_inflows: { type: Number, default: 0 },
  cash_outflows: { type: Number, default: 0 },

  // Receivables
  total_receivables: { type: Number, default: 0 },
  collected_receivables: { type: Number, default: 0 },
  outstanding_receivables: { type: Number, default: 0 },

  // Payables
  total_payables: { type: Number, default: 0 },
  paid_payables: { type: Number, default: 0 },
  outstanding_payables: { type: Number, default: 0 },

  // Loans
  total_loan_balance: { type: Number, default: 0 },
  loan_repayments: { type: Number, default: 0 },
  new_loans_taken: { type: Number, default: 0 },

  // Investments
  total_investments: { type: Number, default: 0 },
  investment_returns: { type: Number, default: 0 },
  new_investments: { type: Number, default: 0 },

  // Key Ratios
  profit_margin: { type: Number, default: 0 }, // (Net Profit / Total Revenue) * 100
  expense_ratio: { type: Number, default: 0 }, // (Total Expenses / Total Revenue) * 100
  current_ratio: { type: Number, default: 0 }, // Current Assets / Current Liabilities
  debt_to_equity_ratio: { type: Number, default: 0 },

  // Production metrics (for dairy business)
  total_milk_produced: { type: Number, default: 0 }, // in liters
  average_milk_price: { type: Number, default: 0 },
  cost_per_liter: { type: Number, default: 0 },

  // Status
  is_finalized: { type: Boolean, default: false },
  finalized_date: { type: Date },

  // Notes
  notes: { type: String },

  // Metadata
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Indexes for efficient queries
financialSummarySchema.index({ period: 1, start_date: -1 });
financialSummarySchema.index({ end_date: -1 });
financialSummarySchema.index({ is_finalized: 1 });

// Pre-save middleware to calculate derived fields
financialSummarySchema.pre('save', function(next) {
  // Calculate profit
  this.gross_profit = this.total_revenue - this.total_expenses;
  this.net_profit = this.gross_profit + this.other_income - this.other_expenses;

  // Calculate ratios
  if (this.total_revenue > 0) {
    this.profit_margin = (this.net_profit / this.total_revenue) * 100;
    this.expense_ratio = (this.total_expenses / this.total_revenue) * 100;
  }

  // Calculate cost per liter
  if (this.total_milk_produced > 0) {
    this.cost_per_liter = this.total_expenses / this.total_milk_produced;
  }

  next();
});

module.exports = mongoose.model('FinancialSummary', financialSummarySchema);