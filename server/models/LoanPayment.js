const mongoose = require('mongoose');

const loanPaymentSchema = new mongoose.Schema({
  loan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  payment_date: {
    type: Date,
    required: true
  },
  payment_amount: {
    type: Number,
    required: true,
    min: 0
  },
  principal_component: {
    type: Number,
    required: true,
    min: 0
  },
  interest_component: {
    type: Number,
    required: true,
    min: 0
  },
  payment_method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'use_dale'],
    default: 'cash'
  },
  payment_reference: {
    type: String
  },
  description: {
    type: String
  },
  bank_name: {
    type: String
  },
  account_number: {
    type: String
  },
  payment_status: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'reversed'],
    default: 'completed'
  },
  recorded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Indexes for performance
loanPaymentSchema.index({ loan_id: 1, payment_date: -1 });
loanPaymentSchema.index({ payment_date: -1 });

// Post-save hook to update loan outstanding balance
loanPaymentSchema.post('save', async function(doc) {
  try {
    const Loan = mongoose.model('Loan');
    const loan = await Loan.findById(doc.loan_id);

    if (!loan) return;

    // Subtract the principal component from outstanding balance
    loan.outstanding_balance = Math.max(0, loan.outstanding_balance - doc.principal_component);

    // Update next payment date (assume monthly for now)
    const nextDate = new Date(doc.payment_date);
    nextDate.setMonth(nextDate.getMonth() + 1);
    loan.next_payment_date = nextDate;

    // Update last payment date
    loan.last_payment_date = doc.payment_date;

    // Update total paid amounts
    loan.total_paid_principal = (loan.total_paid_principal || 0) + doc.principal_component;
    loan.total_paid_interest = (loan.total_paid_interest || 0) + doc.interest_component;

    // Check if loan is fully paid
    if (loan.outstanding_balance <= 0.01) { // Allow for rounding differences
      loan.status = 'closed';
      loan.outstanding_balance = 0;
    }

    await loan.save();
  } catch (error) {
    console.error('Error updating loan balance after payment:', error);
  }
});

// Post-remove hook to reverse payment impact
loanPaymentSchema.post('findOneAndDelete', async function(doc) {
  try {
    if (!doc) return;

    const Loan = mongoose.model('Loan');
    const loan = await Loan.findById(doc.loan_id);

    if (!loan) return;

    // Add back the principal component to outstanding balance
    loan.outstanding_balance = loan.outstanding_balance + doc.principal_component;

    // Update total paid amounts
    loan.total_paid_principal = Math.max(0, (loan.total_paid_principal || 0) - doc.principal_component);
    loan.total_paid_interest = Math.max(0, (loan.total_paid_interest || 0) - doc.interest_component);

    // If loan was closed, reopen it
    if (loan.status === 'closed' && loan.outstanding_balance > 0.01) {
      loan.status = 'active';
    }

    await loan.save();
  } catch (error) {
    console.error('Error reversing loan balance after payment deletion:', error);
  }
});

module.exports = mongoose.model('LoanPayment', loanPaymentSchema);
