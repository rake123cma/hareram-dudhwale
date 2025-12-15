const express = require('express');
const Reminder = require('../models/Reminder');
const { auth, authorizeAdmin, authorizeCustomer } = require('../middleware/auth');

const router = express.Router();

// Create reminder (admin only)
router.post('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const reminder = new Reminder({
      ...req.body,
      created_by: req.user.id
    });
    const newReminder = await reminder.save();
    res.status(201).json(newReminder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get reminders for customer
router.get('/my-reminders', auth, authorizeCustomer, async (req, res) => {
  try {
    const reminders = await Reminder.find({
      customer_id: req.user.customer_id,
      is_read: false
    }).sort({ createdAt: -1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark reminder as read
router.put('/:id/read', auth, authorizeCustomer, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, customer_id: req.user.customer_id },
      { is_read: true },
      { new: true }
    );
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all reminders (admin only)
router.get('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const reminders = await Reminder.find()
      .populate('customer_id', 'name phone')
      .populate('bill_id', 'invoice_number total_amount')
      .sort({ createdAt: -1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete reminder (admin only)
router.delete('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;