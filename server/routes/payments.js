const express = require('express');
const Payment = require('../models/Payment');
const PaymentSettings = require('../models/PaymentSettings');
const { auth, authorizeAdmin, authorizeCustomer } = require('../middleware/auth');

const router = express.Router();

// Get active payment settings (public for customers to view)
router.get('/settings', async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne({ is_active: true });
    if (!settings) {
      return res.status(404).json({ message: 'Payment settings not configured' });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Create/Update payment settings
router.post('/settings', auth, authorizeAdmin, async (req, res) => {
  try {
    const { account_number, account_holder_name, bank_name, ifsc_code, upi_id, qr_code_image } = req.body;

    // Deactivate existing settings
    await PaymentSettings.updateMany({ is_active: true }, { is_active: false });

    // Create new settings
    const settings = new PaymentSettings({
      account_number,
      account_holder_name,
      bank_name,
      ifsc_code,
      upi_id,
      qr_code_image,
      is_active: true,
      created_by: req.user.id
    });

    const newSettings = await settings.save();
    res.status(201).json(newSettings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Customer: Submit payment
router.post('/submit', auth, authorizeCustomer, async (req, res) => {
  try {
    const { amount, bill_month, payment_screenshot, transaction_id, notes } = req.body;

    const payment = new Payment({
      date: new Date(),
      customer_id: req.user.customer_id,
      amount: parseFloat(amount),
      method: 'online',
      payment_type: 'bill_payment',
      bill_month,
      payment_screenshot,
      transaction_id,
      notes,
      status: 'pending'
    });

    const newPayment = await payment.save();
    res.status(201).json(newPayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Customer: Get their payment history
router.get('/my-payments', auth, authorizeCustomer, async (req, res) => {
  try {
    const payments = await Payment.find({ customer_id: req.user.customer_id })
      .sort({ createdAt: -1 })
      .populate('approved_by', 'username');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get all pending payments
router.get('/pending', auth, authorizeAdmin, async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('customer_id', 'name phone')
      .populate('approved_by', 'username');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer: Get their approved payments
router.get('/my-approved', auth, authorizeCustomer, async (req, res) => {
  try {
    const payments = await Payment.find({
      customer_id: req.user.customer_id,
      status: 'approved'
    }).sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer: Get their pending payments
router.get('/my-pending', auth, authorizeCustomer, async (req, res) => {
  try {
    const payments = await Payment.find({
      customer_id: req.user.customer_id,
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Approve or reject payment
router.put('/:id/status', auth, authorizeAdmin, async (req, res) => {
  try {
    const { status, rejection_reason } = req.body;

    const updateData = {
      status,
      approved_by: req.user.id,
      approved_at: new Date()
    };

    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const payment = await Payment.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('customer_id', 'name phone')
      .populate('approved_by', 'username');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // If payment is approved, update customer balance
    if (status === 'approved') {
      const Customer = require('../models/Customer');
      await Customer.findByIdAndUpdate(payment.customer_id, {
        $inc: { balance_due: -payment.amount }
      });
    }

    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Get all payments
router.get('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate('customer_id', 'name phone')
      .populate('approved_by', 'username');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;