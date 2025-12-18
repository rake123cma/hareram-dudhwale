const mongoose = require('mongoose');

const simpleReceivableSchema = new mongoose.Schema({
  person_name: { type: String, required: true }, // Who owes you money
  amount: { type: Number, required: true }, // Total amount owed to you
  description: { type: String, required: true }, // What for (e.g., "Milk bill for March")
  due_date: { type: Date }, // When payment is due
  received_amount: { type: Number, default: 0 }, // How much already received
  status: {
    type: String,
    enum: ['pending', 'partial', 'received'],
    default: 'pending'
  },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Virtual for balance due
simpleReceivableSchema.virtual('balance_due').get(function() {
  return this.amount - this.received_amount;
});

// Pre-save middleware to update status
simpleReceivableSchema.pre('save', function(next) {
  if (this.received_amount >= this.amount) {
    this.status = 'received';
  } else if (this.received_amount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }
  next();
});

module.exports = mongoose.model('SimpleReceivable', simpleReceivableSchema);