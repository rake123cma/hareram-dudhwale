const express = require('express');
const CowTransfer = require('../models/CowTransfer');
const Cow = require('../models/Cow');
const Investor = require('../models/Investor');
const { auth, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Create transfer request
router.post('/', auth, async (req, res) => {
  try {
    const { cow_id, to_investor_id, transfer_price, payment_method } = req.body;

    // Validate cow ownership
    const cow = await Cow.findById(cow_id);
    if (!cow || cow.investor_id?.toString() !== req.user.investor_id) {
      return res.status(403).json({ message: 'You do not own this cow' });
    }

    // Validate target investor
    const toInvestor = await Investor.findById(to_investor_id);
    if (!toInvestor) {
      return res.status(404).json({ message: 'Target investor not found' });
    }

    // Check if transfer already exists
    const existingTransfer = await CowTransfer.findOne({
      cow_id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingTransfer) {
      return res.status(400).json({ message: 'Transfer already in progress for this cow' });
    }

    const transfer = new CowTransfer({
      cow_id,
      from_investor_id: req.user.investor_id,
      to_investor_id,
      transfer_price: parseFloat(transfer_price),
      payment_method,
      status: 'pending'
    });

    const savedTransfer = await transfer.save();
    await savedTransfer.populate(['cow_id', 'from_investor_id', 'to_investor_id']);

    res.status(201).json(savedTransfer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get transfers for investor
router.get('/my-transfers', auth, async (req, res) => {
  try {
    const transfers = await CowTransfer.find({
      $or: [
        { from_investor_id: req.user.investor_id },
        { to_investor_id: req.user.investor_id }
      ]
    })
    .populate('cow_id', 'listing_id breed')
    .populate('from_investor_id', 'name phone')
    .populate('to_investor_id', 'name phone')
    .sort({ createdAt: -1 });

    res.json(transfers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all transfers (admin)
router.get('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const transfers = await CowTransfer.find()
      .populate('cow_id', 'listing_id breed')
      .populate('from_investor_id', 'name phone')
      .populate('to_investor_id', 'name phone')
      .sort({ createdAt: -1 });

    res.json(transfers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve transfer (admin)
router.patch('/:id/approve', auth, authorizeAdmin, async (req, res) => {
  try {
    const transfer = await CowTransfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

    if (transfer.status !== 'pending') {
      return res.status(400).json({ message: 'Transfer is not pending' });
    }

    // Update transfer
    transfer.status = 'approved';
    transfer.approved_by = req.user.id;
    transfer.approval_date = new Date();
    await transfer.save();

    res.json(transfer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Complete transfer
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const { transaction_id } = req.body;
    const transfer = await CowTransfer.findById(req.params.id);

    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

    // Check if user is involved in transfer
    if (transfer.from_investor_id.toString() !== req.user.investor_id &&
        transfer.to_investor_id.toString() !== req.user.investor_id &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (transfer.status !== 'approved') {
      return res.status(400).json({ message: 'Transfer must be approved first' });
    }

    // Update transfer
    transfer.status = 'completed';
    transfer.transaction_id = transaction_id;
    transfer.payment_status = 'completed';
    await transfer.save();

    // Update cow ownership
    await Cow.findByIdAndUpdate(transfer.cow_id, {
      investor_id: transfer.to_investor_id
    });

    // Update investor portfolios
    await Investor.findByIdAndUpdate(transfer.from_investor_id, {
      $pull: { owned_cows: { cow_id: transfer.cow_id } }
    });

    await Investor.findByIdAndUpdate(transfer.to_investor_id, {
      $push: {
        owned_cows: {
          cow_id: transfer.cow_id,
          investment_date: new Date(),
          investment_amount: transfer.transfer_price,
          status: 'active'
        }
      }
    });

    res.json(transfer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel transfer
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const transfer = await CowTransfer.findById(req.params.id);

    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

    // Check ownership
    if (transfer.from_investor_id.toString() !== req.user.investor_id &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    transfer.status = 'cancelled';
    await transfer.save();

    res.json({ message: 'Transfer cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;