const express = require('express');
const Investment = require('../models/Investment');
const Cow = require('../models/Cow');
const Investor = require('../models/Investor');
const Reservation = require('../models/Reservation');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get investments for investor
router.get('/my-investments', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ investor_id: req.user.investor_id })
      .populate('cow_id')
      .sort({ createdAt: -1 });
    res.json(investments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all investments (admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const investments = await Investment.find()
      .populate('cow_id', 'listing_id breed')
      .populate('investor_id', 'name phone')
      .sort({ createdAt: -1 });
    res.json(investments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create investment from reservation
router.post('/from-reservation/:reservationId', auth, async (req, res) => {
  try {
    const { payment_method, transaction_id } = req.body;

    // Find the reservation
    const reservation = await Reservation.findById(req.params.reservationId);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    // Check ownership
    if (req.user.role !== 'admin' && reservation.investor_id.toString() !== req.user.investor_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if reservation is active
    if (reservation.status !== 'active') {
      return res.status(400).json({ message: 'Reservation is not active' });
    }

    // Get cow and investor details
    const cow = await Cow.findById(reservation.cow_id);
    const investor = await Investor.findById(reservation.investor_id);

    if (!cow || !investor) {
      return res.status(404).json({ message: 'Cow or investor not found' });
    }

    // Create investment record
    const investment = new Investment({
      cow_id: reservation.cow_id,
      investor_id: reservation.investor_id,
      investment_amount: cow.company_price,
      agreement_signed: false, // Will be updated when agreement is signed
      ownership_certificate_issued: false, // Will be issued later
      payment_method,
      transaction_id,
      payment_status: 'completed' // Assume payment is completed
    });

    const newInvestment = await investment.save();

    // Update cow status and link to investor
    await Cow.findByIdAndUpdate(cow._id, {
      status: 'active',
      investor_id: investor._id,
      investment_amount: cow.company_price,
      reservation_deposit: null,
      reservation_expiry: null,
      investment_start_date: new Date()
    });

    // Update investor portfolio
    await Investor.findByIdAndUpdate(investor._id, {
      $push: {
        owned_cows: {
          cow_id: cow._id,
          investment_date: new Date(),
          investment_amount: cow.company_price,
          current_value: cow.company_price,
          status: 'active'
        }
      },
      $inc: {
        total_invested: cow.company_price,
        current_investments: 1
      }
    });

    // Update reservation status
    await Reservation.findByIdAndUpdate(reservation._id, {
      status: 'converted'
    });

    res.status(201).json(newInvestment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update investment (for agreement signing, certificate issuance)
router.patch('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    if (!investment) return res.status(404).json({ message: 'Investment not found' });

    // Check ownership or admin
    if (req.user.role !== 'admin' && investment.investor_id.toString() !== req.user.investor_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedInvestment = await Investment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedInvestment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get investment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id)
      .populate('cow_id')
      .populate('investor_id', 'name phone email');

    if (!investment) return res.status(404).json({ message: 'Investment not found' });

    // Check ownership or admin
    if (req.user.role !== 'admin' && investment.investor_id._id.toString() !== req.user.investor_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(investment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;