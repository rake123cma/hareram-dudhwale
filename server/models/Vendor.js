const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  // Basic vendor information
  name: { type: String, required: true },
  contact_person: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },

  // Business details
  gst_number: { type: String },
  pan_number: { type: String },
  vendor_type: {
    type: String,
    enum: ['feed_supplier', 'cow_purchase', 'medicine_supplier', 'veterinary_services', 'equipment_supplier', 'general_supplier', 'other'],
    required: true
  },

  // Payment terms
  payment_terms: {
    type: String,
    enum: ['immediate', '7_days', '15_days', '30_days', '45_days', '60_days'],
    default: '30_days'
  },
  credit_limit: { type: Number, default: 0 },

  // Monthly payment plan for cow purchases
  monthly_installment: { type: Number },
  installment_months: { type: Number },
  first_payment_date: { type: Date },
  payment_frequency: {
    type: String,
    enum: ['monthly', 'quarterly'],
    default: 'monthly'
  },

  // Bank details for payments
  bank_name: { type: String },
  account_number: { type: String },
  ifsc_code: { type: String },
  account_holder_name: { type: String },

  // Transaction tracking
  total_purchases: { type: Number, default: 0 },
  total_paid: { type: Number, default: 0 },
  outstanding_balance: { type: Number, default: 0 },
  last_payment_date: { type: Date },
  last_purchase_date: { type: Date },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted'],
    default: 'active'
  },

  // Rating and notes
  rating: { type: Number, min: 1, max: 5 },
  notes: { type: String },

  // Documents
  agreement_document: { type: String }, // file path
  gst_certificate: { type: String }, // file path

  // Metadata
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Indexes for efficient queries
vendorSchema.index({ name: 1 });
vendorSchema.index({ vendor_type: 1 });
vendorSchema.index({ status: 1 });
vendorSchema.index({ outstanding_balance: -1 });

// Virtual for current balance
vendorSchema.virtual('current_balance').get(function() {
  return this.total_purchases - this.total_paid;
});

// Pre-save middleware to update outstanding balance
vendorSchema.pre('save', function(next) {
  this.outstanding_balance = this.total_purchases - this.total_paid;
  next();
});

module.exports = mongoose.model('Vendor', vendorSchema);
