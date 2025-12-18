const mongoose = require('mongoose');

const simplePaymentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['payable', 'receivable'],
    required: true
  }, // Whether this is a payment made or received
  person_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'person_model'
  }, // Reference to either SimplePayable or SimpleReceivable
  person_model: {
    type: String,
    required: true,
    enum: ['SimplePayable', 'SimpleReceivable']
  },
  person_name: { type: String, required: true }, // Cached name for display
  amount: { type: Number, required: true }, // Payment amount
  payment_date: { type: Date, required: true },
  payment_method: {
    type: String,
    enum: ['cash', 'online', 'cheque', 'upi'],
    required: true
  },
  notes: { type: String }, // Optional notes
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('SimplePayment', simplePaymentSchema);