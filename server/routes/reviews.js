const express = require('express');
const Review = require('../models/Review');
const Customer = require('../models/Customer');
const { auth, authorizeCustomer, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get approved reviews for public display (no auth required)
router.get('/approved', async (req, res) => {
  try {
    const reviews = await Review.find({ is_approved: true })
      .sort({ createdAt: -1 })
      .limit(10); // Limit to 10 reviews for performance

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all reviews (admin only)
router.get('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('customer_id', 'name phone')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit a review (customer only)
router.post('/', auth, authorizeCustomer, async (req, res) => {
  try {
    const { rating, review_text, location } = req.body;

    // Validate required fields
    if (!rating || !review_text) {
      return res.status(400).json({ message: 'Rating and review text are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Get customer details
    const customer = await Customer.findById(req.user.customer_id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if customer already submitted a review
    const existingReview = await Review.findOne({ customer_id: req.user.customer_id });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already submitted a review' });
    }

    // Create new review
    const review = new Review({
      customer_id: req.user.customer_id,
      customer_name: customer.name,
      rating: parseInt(rating),
      review_text: review_text.trim(),
      location: location || customer.address || ''
    });

    const savedReview = await review.save();
    res.status(201).json({
      message: 'Review submitted successfully! It will be published after admin approval.',
      review: savedReview
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get customer's own review (customer only)
router.get('/my-review', auth, authorizeCustomer, async (req, res) => {
  try {
    const review = await Review.findOne({ customer_id: req.user.customer_id });
    if (!review) {
      return res.status(404).json({ message: 'No review found' });
    }
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve/reject review (admin only)
router.put('/:id/approve', auth, authorizeAdmin, async (req, res) => {
  try {
    const { is_approved, is_featured } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { is_approved, is_featured },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete review (admin only)
router.delete('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;