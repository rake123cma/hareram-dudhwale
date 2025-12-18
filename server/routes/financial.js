const express = require('express');
const { auth, authorizeAdmin } = require('../middleware/auth');
const BankTransaction = require('../models/BankTransaction');
const Loan = require('../models/Loan');
const LoanPayment = require('../models/LoanPayment');
const Vendor = require('../models/Vendor');
const Account = require('../models/Account');
const FinancialSummary = require('../models/FinancialSummary');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Payout = require('../models/Payout');

// Simple financial management models
const SimplePayable = require('../models/SimplePayable');
const SimpleReceivable = require('../models/SimpleReceivable');
const SimplePayment = require('../models/SimplePayment');
const Income = require('../models/Income');

const router = express.Router();

// ==================== ACCOUNT MANAGEMENT ENDPOINTS ====================

// Get all accounts
router.get('/accounts', auth, async (req, res) => {
  try {
    const { status, account_type } = req.query;
    let query = {};

    if (status) query.status = status;
    if (account_type) query.account_type = account_type;

    const accounts = await Account.find(query).sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new account
router.post('/accounts', auth, async (req, res) => {
  try {
    // If this is set as default, unset other defaults
    if (req.body.is_default) {
      await Account.updateMany({ is_default: true }, { is_default: false });
    }

    const accountData = {
      ...req.body,
      created_by: req.user.id
    };

    // For payables and receivables, set current_balance to opening_balance
    if (req.body.account_type === 'payable' || req.body.account_type === 'receivable') {
      accountData.current_balance = req.body.opening_balance || 0;
    }

    const account = new Account(accountData);

    const savedAccount = await account.save();
    res.status(201).json(savedAccount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update account
router.put('/accounts/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    // If this is set as default, unset other defaults
    if (req.body.is_default) {
      await Account.updateMany(
        { is_default: true, _id: { $ne: req.params.id } },
        { is_default: false }
      );
    }

    const account = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json(account);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete account
router.delete('/accounts/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });

    // Check if account has transactions
    const transactionCount = await BankTransaction.countDocuments({
      $or: [
        { bank_name: account.bank_name, account_number: account.account_number },
        { related_entity_type: 'account', related_entity_id: account._id }
      ]
    });

    if (transactionCount > 0) {
      return res.status(400).json({ message: 'Cannot delete account with existing transactions' });
    }

    await Account.findByIdAndDelete(req.params.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get account by ID
router.get('/accounts/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== BANK TRANSACTION ENDPOINTS ====================

// Get all bank transactions
router.get('/bank-transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, bank_name, type, start_date, end_date } = req.query;

    let query = {};

    if (bank_name) query.bank_name = bank_name;
    if (type) query.type = type;
    if (start_date && end_date) {
      query.date = { $gte: new Date(start_date), $lte: new Date(end_date) };
    }

    const transactions = await BankTransaction.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('recorded_by', 'name');

    const total = await BankTransaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new bank transaction
router.post('/bank-transactions', auth, async (req, res) => {
  try {
    const transaction = new BankTransaction({
      ...req.body,
      recorded_by: req.user.id
    });

    const savedTransaction = await transaction.save();

    // Update account balance if account_id is provided
    if (req.body.account_id) {
      const account = await Account.findById(req.body.account_id);
      if (account) {
        // Calculate new balance
        const amount = parseFloat(req.body.amount);
        let balanceChange = 0;

        if (req.body.type === 'deposit' || req.body.type === 'transfer_in') {
          balanceChange = amount;
        } else if (req.body.type === 'withdrawal' || req.body.type === 'transfer_out') {
          balanceChange = -amount;
        }

        account.current_balance += balanceChange;
        account.last_transaction_date = new Date();
        await account.save();

        // Update transaction with calculated balance
        savedTransaction.balance_after = account.current_balance;
        await savedTransaction.save();
      }
    }

    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update bank transaction
router.put('/bank-transactions/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const transaction = await BankTransaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete bank transaction
router.delete('/bank-transactions/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const transaction = await BankTransaction.findByIdAndDelete(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current bank balance
router.get('/bank-balance', auth, authorizeAdmin, async (req, res) => {
  try {
    const { bank_name, account_number } = req.query;

    let matchQuery = {};
    if (bank_name) matchQuery.bank_name = bank_name;
    if (account_number) matchQuery.account_number = account_number;

    const balances = await BankTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { bank_name: '$bank_name', account_number: '$account_number' },
          balance: {
            $sum: {
              $cond: [
                { $in: ['$type', ['deposit', 'transfer_in']] },
                '$amount',
                { $multiply: ['$amount', -1] }
              ]
            }
          },
          last_transaction: { $max: '$date' }
        }
      },
      {
        $project: {
          bank_name: '$_id.bank_name',
          account_number: '$_id.account_number',
          balance: 1,
          last_transaction: 1,
          _id: 0
        }
      }
    ]);

    res.json(balances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== LOAN MANAGEMENT ENDPOINTS ====================

// Get all loans
router.get('/loans', auth, authorizeAdmin, async (req, res) => {
  try {
    const { status, lender_name } = req.query;
    let query = {};

    if (status) query.status = status;
    if (lender_name) query.lender_name = lender_name;

    const loans = await Loan.find(query).sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new loan
router.post('/loans', auth, authorizeAdmin, async (req, res) => {
  try {
    const loan = new Loan({
      ...req.body,
      created_by: req.user.id
    });

    const savedLoan = await loan.save();
    res.status(201).json(savedLoan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update loan
router.put('/loans/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json(loan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get loan by ID
router.get('/loans/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== LOAN PAYMENT ENDPOINTS ====================

// Get all loan payments
router.get('/loan-payments', auth, authorizeAdmin, async (req, res) => {
  try {
    const { loan_id, start_date, end_date } = req.query;
    let query = {};

    if (loan_id) query.loan_id = loan_id;
    if (start_date && end_date) {
      query.payment_date = { $gte: new Date(start_date), $lte: new Date(end_date) };
    }

    const payments = await LoanPayment.find(query)
      .populate('loan_id', 'loan_name lender_name')
      .sort({ payment_date: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new loan payment
router.post('/loan-payments', auth, authorizeAdmin, async (req, res) => {
  try {
    const { loan_id, payment_amount, payment_date } = req.body;

    // Find the loan
    const loan = await Loan.findById(loan_id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Calculate principal and interest components
    let principal_component = 0;
    let interest_component = 0;

    // Calculate interest component based on EMI and tenure
    const emi_amount = loan.emi_amount || calculateLoanEMI(
      loan.principal_amount,
      loan.interest_rate,
      loan.tenure_months,
      loan.repayment_frequency
    );

    // Simple interest calculation (could be enhanced based on payment frequency)
    const interest_rate_monthly = loan.interest_rate / 100 / 12;
    interest_component = Math.min(payment_amount, loan.outstanding_balance * interest_rate_monthly);
    principal_component = payment_amount - interest_component;

    // Ensure we don't pay more than outstanding balance
    principal_component = Math.min(principal_component, loan.outstanding_balance);

    const loanPayment = new LoanPayment({
      ...req.body,
      payment_amount: parseFloat(payment_amount),
      principal_component,
      interest_component,
      recorded_by: req.user.id
    });

    const savedPayment = await loanPayment.save();
    const populatedPayment = await LoanPayment.findById(savedPayment._id)
      .populate('loan_id', 'loan_name lender_name outstanding_balance');

    res.status(201).json(populatedPayment);
  } catch (error) {
    console.error('Error creating loan payment:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get loan payment by ID
router.get('/loan-payments/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const payment = await LoanPayment.findById(req.params.id)
      .populate('loan_id');
    if (!payment) return res.status(404).json({ message: 'Loan payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update loan payment
router.put('/loan-payments/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const payment = await LoanPayment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ message: 'Loan payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete loan payment
router.delete('/loan-payments/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const payment = await LoanPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Loan payment not found' });

    await LoanPayment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Loan payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function for EMI calculation (duplicate from frontend for backend)
function calculateLoanEMI(principal, annualRate, tenureMonths, frequency = 'monthly') {
  const principalAmount = parseFloat(principal) || 0;
  const rate = parseFloat(annualRate) || 0;
  const months = parseInt(tenureMonths) || 1;

  if (principalAmount <= 0 || rate <= 0 || months <= 1) return 0;

  const monthlyRate = rate / 100 / 12;
  const emi = (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
              (Math.pow(1 + monthlyRate, months) - 1);

  let adjustedEMI = emi;
  switch (frequency) {
    case 'quarterly':
      adjustedEMI = emi * 3;
      break;
    case 'half_yearly':
      adjustedEMI = emi * 6;
      break;
    case 'yearly':
      adjustedEMI = emi * 12;
      break;
    default:
      adjustedEMI = emi;
  }

  return Math.round(adjustedEMI);
};

// ==================== VENDOR MANAGEMENT ENDPOINTS ====================

// Get all vendors
router.get('/vendors', auth, authorizeAdmin, async (req, res) => {
  try {
    const { status, vendor_type } = req.query;
    let query = {};

    if (status) query.status = status;
    if (vendor_type) query.vendor_type = vendor_type;

    const vendors = await Vendor.find(query).sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new vendor
router.post('/vendors', auth, authorizeAdmin, async (req, res) => {
  try {
    const vendor = new Vendor({
      ...req.body,
      created_by: req.user.id
    });

    const savedVendor = await vendor.save();
    res.status(201).json(savedVendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update vendor
router.put('/vendors/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== FINANCIAL DASHBOARD ENDPOINTS ====================

// Get financial overview
router.get('/overview', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get current month financial data
    const [
      monthlyRevenue,
      monthlyExpenses,
      outstandingReceivables,
      outstandingPayables,
      bankBalances,
      activeLoans
    ] = await Promise.all([
      // Monthly revenue from payments
      Payment.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Monthly expenses
      Expense.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Outstanding receivables (customer payments due)
      Payment.aggregate([
        { $lookup: { from: 'customers', localField: 'customer_id', foreignField: '_id', as: 'customer' } },
        { $unwind: '$customer' },
        { $match: { 'customer.balance_due': { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$customer.balance_due' } } }
      ]),

      // Outstanding payables (vendor balances)
      Vendor.aggregate([
        { $match: { outstanding_balance: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$outstanding_balance' } } }
      ]),

      // Bank balances
      BankTransaction.aggregate([
        {
          $group: {
            _id: { bank_name: '$bank_name', account_number: '$account_number' },
            balance: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['deposit', 'transfer_in']] },
                  '$amount',
                  { $multiply: ['$amount', -1] }
                ]
              }
            }
          }
        }
      ]),

      // Active loans
      Loan.find({ status: 'active' }).select('loan_name outstanding_balance next_payment_date')
    ]);

    const overview = {
      monthly_revenue: monthlyRevenue[0]?.total || 0,
      monthly_expenses: monthlyExpenses[0]?.total || 0,
      net_profit: (monthlyRevenue[0]?.total || 0) - (monthlyExpenses[0]?.total || 0),
      outstanding_receivables: outstandingReceivables[0]?.total || 0,
      outstanding_payables: outstandingPayables[0]?.total || 0,
      bank_balances: bankBalances,
      active_loans: activeLoans,
      current_ratio: outstandingPayables[0]?.total ?
        ((outstandingReceivables[0]?.total || 0) + (bankBalances.reduce((sum, b) => sum + b.balance, 0))) / outstandingPayables[0].total : 0
    };

    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payables summary
router.get('/payables', auth, async (req, res) => {
  try {
    // Get payables from Account model (accounts with type 'payable')
    const accountPayables = await Account.find({
      account_type: 'payable',
      created_by: req.user.id
    }).sort({ createdAt: -1 });

    // Transform to match expected format
    const payables = accountPayables.map(account => ({
      _id: account._id,
      name: account.account_name,
      outstanding_balance: account.current_balance || 0, // current_balance is the outstanding amount
      payment_terms: '30_days',
      last_payment_date: account.last_transaction_date,
      vendor_type: 'General Supplier'
    }));

    res.json(payables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get receivables summary
router.get('/receivables', auth, async (req, res) => {
  try {
    // Get receivables from Account model (accounts with type 'receivable')
    const accountReceivables = await Account.find({
      account_type: 'receivable',
      created_by: req.user.id
    }).sort({ createdAt: -1 });

    // Transform to match expected format
    const receivables = accountReceivables.map(account => ({
      _id: account._id,
      customer_name: account.account_name,
      total_due: account.current_balance || 0, // current_balance is the outstanding amount
      last_payment_date: account.last_transaction_date
    }));

    res.json(receivables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== FINANCIAL SUMMARY ENDPOINTS ====================

// Get financial summaries
router.get('/summaries', auth, authorizeAdmin, async (req, res) => {
  try {
    const { period, start_date, end_date } = req.query;
    let query = {};

    if (period) query.period = period;
    if (start_date && end_date) {
      query.start_date = { $gte: new Date(start_date) };
      query.end_date = { $lte: new Date(end_date) };
    }

    const summaries = await FinancialSummary.find(query).sort({ start_date: -1 });
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate financial summary
router.post('/summaries/generate', auth, authorizeAdmin, async (req, res) => {
  try {
    const { period, start_date, end_date } = req.body;

    // Check if summary already exists
    const existing = await FinancialSummary.findOne({ period, start_date, end_date });
    if (existing) {
      return res.status(400).json({ message: 'Summary already exists for this period' });
    }

    // Calculate financial data for the period
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    const [
      revenueData,
      expenseData,
      bankTransactions,
      loanData
    ] = await Promise.all([
      // Revenue calculations
      Payment.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: null,
            total_revenue: { $sum: '$amount' }
          }
        }
      ]),

      // Expense calculations
      Expense.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' }
          }
        }
      ]),

      // Bank transactions
      BankTransaction.find({ date: { $gte: startDate, $lte: endDate } }),

      // Loan data
      Loan.find({ status: 'active' })
    ]);

    // Process expense data by category
    const expenseCategories = {};
    expenseData.forEach(expense => {
      expenseCategories[expense._id] = expense.amount;
    });

    // Calculate cash flow
    const cashInflows = bankTransactions
      .filter(t => ['deposit', 'transfer_in'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const cashOutflows = bankTransactions
      .filter(t => ['withdrawal', 'transfer_out'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalLoanBalance = loanData.reduce((sum, loan) => sum + loan.outstanding_balance, 0);

    // Create financial summary
    const summary = new FinancialSummary({
      period,
      start_date: startDate,
      end_date: endDate,
      total_revenue: revenueData[0]?.total_revenue || 0,
      feed_expenses: expenseCategories.feed || 0,
      medicine_expenses: expenseCategories.medicine || 0,
      labor_expenses: expenseCategories.labour || 0,
      utility_expenses: expenseCategories.electricity || 0,
      maintenance_expenses: expenseCategories.maintenance || 0,
      transport_expenses: expenseCategories.transport || 0,
      other_expenses: Object.values(expenseCategories).reduce((sum, val) => sum + val, 0) -
                     (expenseCategories.feed || 0) -
                     (expenseCategories.medicine || 0) -
                     (expenseCategories.labour || 0) -
                     (expenseCategories.electricity || 0) -
                     (expenseCategories.maintenance || 0) -
                     (expenseCategories.transport || 0),
      total_expenses: Object.values(expenseCategories).reduce((sum, val) => sum + val, 0),
      cash_inflows: cashInflows,
      cash_outflows: cashOutflows,
      total_loan_balance: totalLoanBalance,
      created_by: req.user.id
    });

    const savedSummary = await summary.save();
    res.status(201).json(savedSummary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== SIMPLE FINANCIAL MANAGEMENT ENDPOINTS ====================

// Get all simple payables (alias for frontend compatibility)
router.get('/payables', auth, async (req, res) => {
  try {
    const payables = await SimplePayable.find({ created_by: req.user.id }).sort({ createdAt: -1 });
    res.json(payables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new simple payable (alias for frontend compatibility)
router.post('/payables', auth, async (req, res) => {
  try {
    const payable = new SimplePayable({
      ...req.body,
      created_by: req.user.id
    });

    const savedPayable = await payable.save();
    res.status(201).json(savedPayable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all simple payables
router.get('/payables-simple', auth, async (req, res) => {
  try {
    const payables = await SimplePayable.find({ created_by: req.user.id }).sort({ createdAt: -1 });
    res.json(payables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new simple payable
router.post('/payables-simple', auth, async (req, res) => {
  try {
    const payable = new SimplePayable({
      ...req.body,
      created_by: req.user.id
    });

    const savedPayable = await payable.save();
    res.status(201).json(savedPayable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update simple payable
router.put('/payables-simple/:id', auth, async (req, res) => {
  try {
    const payable = await SimplePayable.findOneAndUpdate(
      { _id: req.params.id, created_by: req.user.id },
      req.body,
      { new: true }
    );
    if (!payable) return res.status(404).json({ message: 'Payable not found' });
    res.json(payable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete simple payable
router.delete('/payables-simple/:id', auth, async (req, res) => {
  try {
    const payable = await SimplePayable.findOneAndDelete({
      _id: req.params.id,
      created_by: req.user.id
    });
    if (!payable) return res.status(404).json({ message: 'Payable not found' });
    res.json({ message: 'Payable deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all simple receivables (alias for frontend compatibility)
router.get('/receivables', auth, async (req, res) => {
  try {
    const receivables = await SimpleReceivable.find({ created_by: req.user.id }).sort({ createdAt: -1 });
    res.json(receivables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new simple receivable (alias for frontend compatibility)
router.post('/receivables', auth, async (req, res) => {
  try {
    const receivable = new SimpleReceivable({
      ...req.body,
      created_by: req.user.id
    });

    const savedReceivable = await receivable.save();
    res.status(201).json(savedReceivable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all simple receivables
router.get('/receivables-simple', auth, async (req, res) => {
  try {
    const receivables = await SimpleReceivable.find({ created_by: req.user.id }).sort({ createdAt: -1 });
    res.json(receivables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new simple receivable
router.post('/receivables-simple', auth, async (req, res) => {
  try {
    const receivable = new SimpleReceivable({
      ...req.body,
      created_by: req.user.id
    });

    const savedReceivable = await receivable.save();
    res.status(201).json(savedReceivable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update simple receivable
router.put('/receivables-simple/:id', auth, async (req, res) => {
  try {
    const receivable = await SimpleReceivable.findOneAndUpdate(
      { _id: req.params.id, created_by: req.user.id },
      req.body,
      { new: true }
    );
    if (!receivable) return res.status(404).json({ message: 'Receivable not found' });
    res.json(receivable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete simple receivable
router.delete('/receivables-simple/:id', auth, async (req, res) => {
  try {
    const receivable = await SimpleReceivable.findOneAndDelete({
      _id: req.params.id,
      created_by: req.user.id
    });
    if (!receivable) return res.status(404).json({ message: 'Receivable not found' });
    res.json({ message: 'Receivable deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all simple payments
router.get('/payments', auth, async (req, res) => {
  try {
    const payments = await SimplePayment.find({ created_by: req.user.id })
      .populate('person_id')
      .sort({ payment_date: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new simple payment
router.post('/payments', auth, async (req, res) => {
  try {
    const { type, person_id, amount } = req.body;

    // Determine the model based on type
    const Model = type === 'payable' ? SimplePayable : SimpleReceivable;
    const person = await Model.findOne({ _id: person_id, created_by: req.user.id });

    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    // Update the person's paid/received amount
    if (type === 'payable') {
      person.paid_amount += parseFloat(amount);
    } else {
      person.received_amount += parseFloat(amount);
    }
    await person.save();

    // Create payment record
    const payment = new SimplePayment({
      ...req.body,
      person_name: person.person_name,
      person_model: type === 'payable' ? 'SimplePayable' : 'SimpleReceivable',
      created_by: req.user.id
    });

    const savedPayment = await payment.save();
    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete simple payment
router.delete('/payments/:id', auth, async (req, res) => {
  try {
    const payment = await SimplePayment.findOne({
      _id: req.params.id,
      created_by: req.user.id
    });

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Reverse the payment amount
    const Model = payment.type === 'payable' ? SimplePayable : SimpleReceivable;
    const person = await Model.findById(payment.person_id);

    if (person) {
      if (payment.type === 'payable') {
        person.paid_amount -= payment.amount;
      } else {
        person.received_amount -= payment.amount;
      }
      await person.save();
    }

    await SimplePayment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted and amounts reversed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== INCOME ENDPOINTS ====================

// Get all income records
router.get('/income', auth, async (req, res) => {
  try {
    const income = await Income.find({ created_by: req.user.id }).sort({ date: -1 });
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new income record
router.post('/income', auth, async (req, res) => {
  try {
    const income = new Income({
      ...req.body,
      created_by: req.user.id
    });

    const savedIncome = await income.save();
    res.status(201).json(savedIncome);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update income record
router.put('/income/:id', auth, async (req, res) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, created_by: req.user.id },
      req.body,
      { new: true }
    );
    if (!income) return res.status(404).json({ message: 'Income record not found' });
    res.json(income);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete income record
router.delete('/income/:id', auth, async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      created_by: req.user.id
    });
    if (!income) return res.status(404).json({ message: 'Income record not found' });
    res.json({ message: 'Income record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== TRANSACTION ENDPOINTS ====================

// Get all transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await BankTransaction.find({ recorded_by: req.user.id })
      .sort({ date: -1 })
      .populate('account_id');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new transaction
router.post('/transactions', auth, async (req, res) => {
  try {
    const { account_id, type, amount, description, date, account_type } = req.body;

    // Find the account
    const account = await Account.findById(account_id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Calculate balance change based on account type
    const transactionAmount = parseFloat(amount);
    let balanceChange = 0;

    if (account.account_type === 'payable') {
      // For payables: current_balance represents outstanding amount owed
      // debit (payment made) reduces outstanding balance
      if (type === 'debit') {
        balanceChange = -transactionAmount; // Payment made reduces outstanding balance
      } else if (type === 'credit') {
        balanceChange = transactionAmount; // Invoice received increases outstanding balance
      }
    } else if (account.account_type === 'receivable') {
      // For receivables: current_balance represents outstanding amount owed to you
      // credit (payment received) reduces outstanding balance
      if (type === 'credit') {
        balanceChange = -transactionAmount; // Payment received reduces outstanding balance
      } else if (type === 'debit') {
        balanceChange = transactionAmount; // Invoice sent increases outstanding balance
      }
    } else {
      // For bank/cash accounts: standard accounting
      if (type === 'debit') {
        // Debit reduces balance (money going out)
        balanceChange = -transactionAmount;
      } else if (type === 'credit') {
        // Credit increases balance (money coming in)
        balanceChange = transactionAmount;
      }
    }

    // Update account balance
    const oldBalance = account.current_balance || 0;
    account.current_balance = oldBalance + balanceChange;
    account.last_transaction_date = new Date(date);
    await account.save();

    // Create bank transaction record for audit trail
    const transaction = new BankTransaction({
      date: new Date(date),
      type: type === 'debit' ? 'withdrawal' : 'deposit',
      amount: transactionAmount,
      description,
      bank_name: account.bank_name || 'Internal',
      account_number: account.account_number || account._id.toString(),
      payment_method: 'internal',
      balance_after: account.current_balance,
      recorded_by: req.user.id,
      related_entity_type: 'account',
      related_entity_id: account_id
    });

    const savedTransaction = await transaction.save();

    // Calculate outstanding balance for display
    const outstanding_balance = account.account_type === 'payable' || account.account_type === 'receivable'
      ? account.current_balance || 0  // For payables/receivables, current_balance IS the outstanding balance
      : account.current_balance;

    res.status(201).json({
      transaction: savedTransaction,
      account: {
        _id: account._id,
        account_name: account.account_name,
        current_balance: account.current_balance,
        outstanding_balance: outstanding_balance
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
