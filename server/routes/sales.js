const express = require('express');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const { auth, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all sales
router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find().populate('customer_id');
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create sale
router.post('/', auth, authorizeAdmin, async (req, res) => {
  const sale = new Sale(req.body);
  try {
    const newSale = await sale.save();
    // Update customer balance
    await Customer.findByIdAndUpdate(req.body.customer_id, { $inc: { balance_due: req.body.total_amount } });
    res.status(201).json(newSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update sale
router.put('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(sale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete sale
router.delete('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark sale as paid
router.put('/:id/mark-paid', auth, authorizeAdmin, async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, { paid: true }, { new: true });
    // Update customer balance
    await Customer.findByIdAndUpdate(sale.customer_id, { $inc: { balance_due: -sale.total_amount } });
    res.json(sale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;