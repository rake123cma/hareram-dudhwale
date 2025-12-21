const express = require('express');
const SpecialProductReservation = require('../models/SpecialProductReservation');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { auth, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all special product reservations (admin only)
router.get('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const reservations = await SpecialProductReservation.find()
      .populate('product_id', 'name category is_special_product is_advance_bookable')
      .populate('customer_id', 'name phone email')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create special product reservation (customer can create, admin can create)
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, customer_id, quantity, expected_delivery_date, deposit_amount, total_amount, payment_method, transaction_id, notes, special_instructions } = req.body || {};

    // Validate product exists and is special/advance bookable
    const product = await Product.findById(product_id);
    if (!product || !product.is_special_product || !product.is_advance_bookable) {
      return res.status(400).json({ message: 'Invalid product for advance booking' });
    }

    // Validate customer exists
    const customer = await Customer.findById(customer_id);
    if (!customer) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    const reservationData = {
      product_id,
      customer_id,
      quantity: parseInt(quantity),
      deposit_amount: parseFloat(deposit_amount),
      total_amount: parseFloat(total_amount),
      payment_method,
      transaction_id,
      notes,
      special_instructions
    };

    // Only set expected_delivery_date if provided (admin can set it later)
    if (expected_delivery_date) {
      reservationData.expected_delivery_date = new Date(expected_delivery_date);
    }

    const reservation = new SpecialProductReservation(reservationData);

    const newReservation = await reservation.save();
    await newReservation.populate('product_id', 'name category');
    await newReservation.populate('customer_id', 'name phone');

    res.status(201).json(newReservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update reservation status (admin only)
router.put('/:id/status', auth, authorizeAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await SpecialProductReservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('product_id', 'name').populate('customer_id', 'name phone');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update payment status (admin only)
router.put('/:id/payment', auth, authorizeAdmin, async (req, res) => {
  try {
    const { payment_status, transaction_id } = req.body;
    const updateData = { payment_status };
    if (transaction_id) updateData.transaction_id = transaction_id;

    const reservation = await SpecialProductReservation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('product_id', 'name').populate('customer_id', 'name phone');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update delivery date (admin only)
router.put('/:id/delivery-date', auth, authorizeAdmin, async (req, res) => {
  try {
    const { expected_delivery_date } = req.body;
    const updateData = {};

    if (expected_delivery_date) {
      updateData.expected_delivery_date = new Date(expected_delivery_date);
    } else {
      updateData.$unset = { expected_delivery_date: 1 }; // Remove the field if empty
    }

    const reservation = await SpecialProductReservation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('product_id', 'name').populate('customer_id', 'name phone');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete reservation (admin only)
router.delete('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    await SpecialProductReservation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reservation deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current customer's special reservations
router.get('/my-reservations', auth, async (req, res) => {
  try {
    const reservations = await SpecialProductReservation.find({ customer_id: req.user.customer_id })
      .populate('product_id', 'name category is_special_product is_advance_bookable')
      .populate('customer_id', 'name phone email')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get reservations by customer (customer can view their own, admin can view all)
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const query = { customer_id: req.params.customerId };

    // If not admin, only show own reservations
    if (!req.user.isAdmin) {
      // Assuming customer authentication, check if user owns this customer record
      // For now, allow admin only to view specific customer reservations
      return res.status(403).json({ message: 'Access denied' });
    }

    const reservations = await SpecialProductReservation.find(query)
      .populate('product_id', 'name category is_special_product is_advance_bookable')
      .populate('customer_id', 'name phone email')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;