const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  bill_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: false
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['payment_reminder', 'general', 'delivery'],
    default: 'general'
  },
  is_read: {
    type: Boolean,
    default: false
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reminder', reminderSchema);