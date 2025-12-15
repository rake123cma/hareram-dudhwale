const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'customer', 'investor'], required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // for milk customers
  investor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' }, // for investors
  address: { type: String },
  mobile: { type: String },
  email: { type: String },
  whatsapp: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);