const express = require('express');
const MilkRecord = require('../models/MilkRecord');
const EggRecord = require('../models/EggRecord');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Customer = require('../models/Customer');
const DailyAttendance = require('../models/DailyAttendance');
const { auth, authorizeAdmin } = require('../middleware/auth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const router = express.Router();

// Daily report
router.get('/daily', auth, authorizeAdmin, async (req, res) => {
  const { date } = req.query;
  try {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const milkTotal = await MilkRecord.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$total_daily_liters' } } }
    ]);

    const eggTotal = await EggRecord.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$total_daily_eggs' } } }
    ]);

    const salesTotal = await Sale.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);

    const expensesTotal = await Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const report = {
      date,
      milk_produced: milkTotal[0]?.total || 0,
      eggs_produced: eggTotal[0]?.total || 0,
      sales: salesTotal[0]?.total || 0,
      expenses: expensesTotal[0]?.total || 0,
      net_profit: (salesTotal[0]?.total || 0) - (expensesTotal[0]?.total || 0)
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Monthly income report from sales
router.get('/monthly-income', auth, authorizeAdmin, async (req, res) => {
  const { year } = req.query;
  try {
    const startYear = parseInt(year);
    const endYear = startYear + 1;

    const monthlyIncome = await Income.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startYear, 0, 1),
            $lt: new Date(endYear, 0, 1)
          },
          category: { $in: ['milk_sales', 'product_sales'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total_income: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format the results
    const report = monthlyIncome.map(item => ({
      year: item._id.year,
      month: item._id.month,
      month_name: new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'long' }),
      total_income: item.total_income,
      transaction_count: item.count
    }));

    res.json({
      year: startYear,
      monthly_income: report
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Monthly milk customer attendance report
router.get('/monthly-attendance', auth, authorizeAdmin, async (req, res) => {
  const { year, month } = req.query;
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const billMonth = `${year}-${month.toString().padStart(2, '0')}`;

    // Get all active customers
    const allCustomers = await Customer.find({ is_active: true }, 'name price_per_liter balance_due');

    const attendanceRecords = await DailyAttendance.find({
      date: { $gte: startDate, $lt: endDate }
    }).populate('customer_id', 'name price_per_liter').sort({ 'customer_id.name': 1, date: 1 });

    // Get payments for this month
    const payments = await Payment.find({
      bill_month: billMonth,
      status: 'approved'
    });

    // Group payments by customer
    const paymentMap = new Map();
    payments.forEach(payment => {
      const customerId = payment.customer_id.toString();
      if (!paymentMap.has(customerId)) {
        paymentMap.set(customerId, { paid: 0, advance: 0 });
      }
      if (payment.payment_type === 'advance') {
        paymentMap.get(customerId).advance += payment.amount;
      } else {
        paymentMap.get(customerId).paid += payment.amount;
      }
    });

    // Group by customer
    const customerMap = new Map();

    attendanceRecords.forEach(record => {
      const customerId = record.customer_id._id.toString();
      const customerName = record.customer_id.name;
      const customerRate = record.customer_id.price_per_liter || 0;
      const date = record.date.getDate();
      const milkQuantity = record.milk_quantity || 0;

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          name: customerName,
          rate: customerRate,
          attendance: {},
          total_milk: 0,
          total_amount: 0,
          paid_amount: 0,
          advance_amount: 0,
          dues_amount: 0
        });
      }

      customerMap.get(customerId).attendance[date] = milkQuantity;
      customerMap.get(customerId).total_milk += milkQuantity;
    });

    // Calculate totals and add payment info
    const customers = Array.from(customerMap.values()).map(customer => {
      const customerId = allCustomers.find(c => c.name === customer.name)?._id?.toString();
      const paymentInfo = paymentMap.get(customerId) || { paid: 0, advance: 0 };

      customer.total_amount = customer.total_milk * customer.rate;
      customer.paid_amount = paymentInfo.paid;
      customer.advance_amount = paymentInfo.advance;
      customer.dues_amount = customer.total_amount - customer.paid_amount;

      return customer;
    });

    // Calculate grand totals
    const grandTotal = customers.reduce((acc, customer) => ({
      total_milk: acc.total_milk + customer.total_milk,
      total_amount: acc.total_amount + customer.total_amount,
      paid_amount: acc.paid_amount + customer.paid_amount,
      advance_amount: acc.advance_amount + customer.advance_amount,
      dues_amount: acc.dues_amount + customer.dues_amount
    }), { total_milk: 0, total_amount: 0, paid_amount: 0, advance_amount: 0, dues_amount: 0 });

    res.json({
      year: parseInt(year),
      month: parseInt(month),
      month_name: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
      customers,
      grand_total: grandTotal
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CSV export
router.get('/csv', auth, authorizeAdmin, async (req, res) => {
  try {
    const sales = await Sale.find().populate('customer_id');
    const csvWriter = createCsvWriter({
      path: 'report.csv',
      header: [
        { id: 'date', title: 'Date' },
        { id: 'customer_name', title: 'Customer' },
        { id: 'product_type', title: 'Product' },
        { id: 'quantity', title: 'Quantity' },
        { id: 'total_amount', title: 'Amount' },
        { id: 'paid', title: 'Paid' }
      ]
    });

    const records = sales.map(sale => ({
      date: sale.date.toISOString().split('T')[0],
      customer_name: sale.customer_id.name,
      product_type: sale.product_type,
      quantity: sale.quantity,
      total_amount: sale.total_amount,
      paid: sale.paid ? 'Yes' : 'No'
    }));

    await csvWriter.writeRecords(records);
    res.download('report.csv');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;