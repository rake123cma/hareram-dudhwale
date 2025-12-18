const express = require('express');
const Investor = require('../models/Investor');
const Cow = require('../models/Cow');
const { auth, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all investors (admin only)
router.get('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const investors = await Investor.find().populate('owned_cows.cow_id', 'listing_id breed status');
    res.json(investors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get investor profile
router.get('/profile', auth, async (req, res) => {
  try {
    const investor = await Investor.findById(req.user.investor_id);
    if (!investor) return res.status(404).json({ message: 'Investor not found' });
    res.json(investor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get investor portfolio
router.get('/portfolio', auth, async (req, res) => {
  try {
    const investor = await Investor.findById(req.user.investor_id)
      .populate('owned_cows.cow_id');

    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    res.json({
      portfolio: investor.owned_cows,
      summary: {
        total_invested: investor.total_invested,
        current_value: investor.current_investments,
        total_returns: investor.total_returns,
        total_payouts: investor.total_payouts_received
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create investor (admin only or registration)
router.post('/', async (req, res) => {
  const investor = new Investor(req.body);
  try {
    const newInvestor = await investor.save();
    res.status(201).json(newInvestor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update investor
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user can update this investor
    if (req.user.role !== 'admin' && req.user.investor_id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const investor = await Investor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!investor) return res.status(404).json({ message: 'Investor not found' });
    res.json(investor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get investor payouts
router.get('/payouts', auth, async (req, res) => {
  try {
    const Payout = require('../models/Payout');
    const payouts = await Payout.find({ investor_id: req.user.investor_id })
      .populate('cow_id', 'listing_id breed')
      .sort({ createdAt: -1 });

    res.json(payouts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get complete investment history (including sold/exited cows)
router.get('/history', auth, async (req, res) => {
  try {
    const Investment = require('../models/Investment');
    const MilkRecord = require('../models/MilkRecord');
    const Expense = require('../models/Expense');
    const Payout = require('../models/Payout');

    // Get all investments (active and completed)
    const investments = await Investment.find({ investor_id: req.user.investor_id })
      .populate('cow_id')
      .sort({ createdAt: -1 });

    const history = [];

    for (const investment of investments) {
      // Get milk records for this cow
      const milkRecords = await MilkRecord.find({
        cow_id: investment.cow_id._id
      }).sort({ date: -1 });

      // Get expenses for this cow
      const expenses = await Expense.find({
        $or: [
          { cow_id: investment.cow_id._id },
          { cow_id: { $exists: false } } // General expenses
        ]
      }).sort({ date: -1 });

      // Get payouts for this investment
      const payouts = await Payout.find({
        investor_id: req.user.investor_id,
        cow_id: investment.cow_id._id
      }).sort({ createdAt: -1 });

      history.push({
        investment: investment,
        milk_history: milkRecords,
        expense_history: expenses,
        payout_history: payouts,
        summary: {
          total_milk_produced: milkRecords.reduce((sum, r) => sum + (r.total_daily_liters || 0), 0),
          total_revenue: milkRecords.reduce((sum, r) => sum + (r.daily_revenue || 0), 0),
          total_expenses: expenses.reduce((sum, e) => sum + e.amount, 0),
          total_payouts: payouts.reduce((sum, p) => sum + p.amount, 0),
          investment_duration: investment.exit_date ?
            Math.ceil((new Date(investment.exit_date) - new Date(investment.investment_date)) / (1000 * 60 * 60 * 24)) :
            Math.ceil((new Date() - new Date(investment.investment_date)) / (1000 * 60 * 60 * 24))
        }
      });
    }

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get investor by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id)
      .populate('owned_cows.cow_id', 'listing_id breed status current_market_price');

    if (!investor) return res.status(404).json({ message: 'Investor not found' });

    // Hide sensitive info for non-admin users
    if (req.user.role !== 'admin' && req.user.investor_id !== req.params.id) {
      const { bank_account, aadhar_number, pan_number, ...publicData } = investor.toObject();
      return res.json(publicData);
    }

    res.json(investor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;