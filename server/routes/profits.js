const express = require('express');
const MilkRecord = require('../models/MilkRecord');
const Expense = require('../models/Expense');
const Cow = require('../models/Cow');
const Payout = require('../models/Payout');
const { auth, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Calculate daily profits for all active cows
router.post('/calculate-daily', auth, authorizeAdmin, async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    // Set to start of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all milk records for the day
    const milkRecords = await MilkRecord.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('cow_id');

    // Get all expenses for the day
    const expenses = await Expense.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const results = [];

    for (const milkRecord of milkRecords) {
      if (!milkRecord.cow_id || milkRecord.cow_id.status !== 'active') continue;

      const cow = milkRecord.cow_id;

      // Calculate cow-specific expenses
      const cowExpenses = expenses.filter(expense =>
        expense.cow_id && expense.cow_id.toString() === cow._id.toString()
      );

      // Calculate general expenses (distributed among all active cows)
      const generalExpenses = expenses.filter(expense => !expense.cow_id);
      const generalExpensePerCow = generalExpenses.length > 0 ?
        generalExpenses.reduce((sum, exp) => sum + exp.amount, 0) / milkRecords.length : 0;

      // Total expenses for this cow
      const totalCowExpenses = cowExpenses.reduce((sum, exp) => sum + exp.amount, 0) + generalExpensePerCow;

      // Calculate profit
      const revenue = milkRecord.daily_revenue || 0;
      const profit = revenue - totalCowExpenses;

      // Profit sharing
      const investorShare = profit * 0.4; // 40%
      const companyShare = profit * 0.6; // 60%

      // Update cow's profit tracking
      await Cow.findByIdAndUpdate(cow._id, {
        $inc: {
          current_profit: profit,
          total_expenses: totalCowExpenses
        }
      });

      results.push({
        cow_id: cow._id,
        cow_listing: cow.listing_id,
        date: targetDate,
        revenue: revenue,
        expenses: totalCowExpenses,
        profit: profit,
        investor_share: investorShare,
        company_share: companyShare,
        milk_produced: milkRecord.total_daily_liters
      });
    }

    res.json({
      date: targetDate,
      total_cows: results.length,
      results: results,
      summary: {
        total_revenue: results.reduce((sum, r) => sum + r.revenue, 0),
        total_expenses: results.reduce((sum, r) => sum + r.expenses, 0),
        total_profit: results.reduce((sum, r) => sum + r.profit, 0),
        total_investor_share: results.reduce((sum, r) => sum + r.investor_share, 0),
        total_company_share: results.reduce((sum, r) => sum + r.company_share, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate monthly payouts
router.post('/generate-monthly-payouts', auth, authorizeAdmin, async (req, res) => {
  try {
    const { month, year } = req.body;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all active cows with investors
    const activeCows = await Cow.find({
      status: 'active',
      investor_id: { $exists: true, $ne: null }
    }).populate('investor_id');

    const payouts = [];

    for (const cow of activeCows) {
      // Calculate monthly totals for this cow
      const milkRecords = await MilkRecord.find({
        cow_id: cow._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const expenses = await Expense.find({
        $or: [
          { cow_id: cow._id },
          { cow_id: { $exists: false } } // General expenses
        ],
        date: { $gte: startDate, $lte: endDate }
      });

      const totalMilk = milkRecords.reduce((sum, record) => sum + (record.total_daily_liters || 0), 0);
      const totalRevenue = milkRecords.reduce((sum, record) => sum + (record.daily_revenue || 0), 0);

      // Calculate expenses (cow-specific + share of general)
      const cowSpecificExpenses = expenses.filter(exp => exp.cow_id?.toString() === cow._id.toString());
      const generalExpenses = expenses.filter(exp => !exp.cow_id);

      const totalCowExpenses = cowSpecificExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const generalExpenseShare = generalExpenses.length > 0 ?
        generalExpenses.reduce((sum, exp) => sum + exp.amount, 0) / activeCows.length : 0;

      const totalExpenses = totalCowExpenses + generalExpenseShare;
      const monthlyProfit = totalRevenue - totalExpenses;
      const investorShare = monthlyProfit * 0.4;

      if (investorShare > 0) {
        // Create payout record
        const payout = new Payout({
          investor_id: cow.investor_id._id,
          cow_id: cow._id,
          payout_type: 'monthly',
          amount: investorShare,
          period_start: startDate,
          period_end: endDate,
          total_milk_produced: totalMilk,
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          investor_share: investorShare,
          company_share: monthlyProfit * 0.6,
          payment_method: 'bank_transfer',
          payment_status: 'pending'
        });

        await payout.save();
        payouts.push(payout);
      }
    }

    res.json({
      month: month,
      year: year,
      payouts_generated: payouts.length,
      total_amount: payouts.reduce((sum, p) => sum + p.amount, 0)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get profit history for a cow
router.get('/cow/:cowId', auth, async (req, res) => {
  try {
    const cow = await Cow.findById(req.params.cowId);

    if (!cow) return res.status(404).json({ message: 'Cow not found' });

    // Check ownership or admin
    if (req.user.role !== 'admin' && cow.investor_id?.toString() !== req.user.investor_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get recent milk records and expenses
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const milkRecords = await MilkRecord.find({
      cow_id: req.params.cowId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });

    const expenses = await Expense.find({
      $or: [
        { cow_id: req.params.cowId },
        { cow_id: { $exists: false } }
      ],
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });

    res.json({
      cow: {
        listing_id: cow.listing_id,
        total_profit: cow.current_profit,
        total_milk: cow.total_milk_produced,
        total_revenue: cow.total_revenue,
        total_expenses: cow.total_expenses
      },
      recent_records: milkRecords,
      recent_expenses: expenses
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;