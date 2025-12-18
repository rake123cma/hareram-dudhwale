const express = require('express');
const Reservation = require('../models/Reservation');
const Cow = require('../models/Cow');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get reservations for investor
router.get('/my-reservations', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find({ investor_id: req.user.investor_id })
      .populate('cow_id', 'listing_id breed estimated_daily_milk company_price status')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all reservations (admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const reservations = await Reservation.find()
      .populate('cow_id', 'listing_id breed company_price status')
      .populate('investor_id', 'name phone')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create reservation
router.post('/', auth, async (req, res) => {
  try {
    const { cow_id, deposit_amount, payment_method, transaction_id } = req.body;

    // Check if cow is available
    const cow = await Cow.findById(cow_id);
    if (!cow || cow.status !== 'available') {
      return res.status(400).json({ message: 'Cow not available for reservation' });
    }

    // Check if investor already has active reservation for this cow
    const existingReservation = await Reservation.findOne({
      cow_id,
      investor_id: req.user.investor_id,
      status: 'active'
    });

    if (existingReservation) {
      return res.status(400).json({ message: 'You already have an active reservation for this cow' });
    }

    // Set expiry (72 hours from now)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 72);

    const reservation = new Reservation({
      cow_id,
      investor_id: req.user.investor_id,
      deposit_amount,
      expiry_date: expiryDate,
      payment_method,
      transaction_id,
      payment_status: 'completed' // Assume payment is completed for now
    });

    const newReservation = await reservation.save();

    // Update cow status
    await Cow.findByIdAndUpdate(cow_id, {
      status: 'reserved',
      reservation_deposit: deposit_amount,
      reservation_expiry: expiryDate
    });

    res.status(201).json(newReservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Cancel reservation
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    // Check ownership
    if (req.user.role !== 'admin' && reservation.investor_id.toString() !== req.user.investor_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update reservation
    reservation.status = 'cancelled';
    await reservation.save();

    // Update cow status back to available
    await Cow.findByIdAndUpdate(reservation.cow_id, {
      status: 'available',
      reservation_deposit: null,
      reservation_expiry: null
    });

    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Process expired reservations (admin job)
router.post('/process-expired', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const expiredReservations = await Reservation.find({
      status: 'active',
      expiry_date: { $lt: new Date() }
    });

    for (const reservation of expiredReservations) {
      reservation.status = 'expired';
      await reservation.save();

      // Update cow status
      await Cow.findByIdAndUpdate(reservation.cow_id, {
        status: 'available',
        reservation_deposit: null,
        reservation_expiry: null
      });
    }

    res.json({ message: `${expiredReservations.length} reservations processed` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;