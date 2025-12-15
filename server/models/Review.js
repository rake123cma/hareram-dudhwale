const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customer_name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review_text: {
    type: String,
    required: true,
    maxlength: 500
  },
  location: {
    type: String,
    default: ''
  },
  is_approved: {
    type: Boolean,
    default: false
  },
  is_featured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for efficient queries
reviewSchema.index({ is_approved: 1, createdAt: -1 });
reviewSchema.index({ customer_id: 1 });

module.exports = mongoose.model('Review', reviewSchema);