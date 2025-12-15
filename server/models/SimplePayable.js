const mongoose = require('mongoose');

const simplePayableSchema = new mongoose.Schema({
  person_name: { type: String, required: true }, // Who you owe money to
  amount: { type: Number, required: true }, // Total amount owed
  description: { type: String, required: true }, // What for (e.g., "2 cows purchased")
  due_date: { type: Date }, // When payment is due
  paid_amount: { type: Number, default: 0 }, // How much already paid
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Virtual for balance due
simplePayableSchema.virtual('balance_due').get(function() {
  return this.amount - this.paid_amount;
});

// Pre-save middleware to update status
simplePayableSchema.pre('save', function(next) {
  if (this.paid_amount >= this.amount) {
    this.status = 'paid';
  } else if (this.paid_amount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }
  next();
});

module.exports = mongoose.model('SimplePayable', simplePayableSchema);