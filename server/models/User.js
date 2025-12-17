const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, sparse: true },
  password: { type: String },
  role: { type: String, enum: ['admin', 'customer', 'investor'], required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // for milk customers
  investor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' }, // for investors
  address: { type: String },
  mobile: { type: String },
  email: { type: String, sparse: true },
  whatsapp: { type: String },
  // OAuth fields
  googleId: { type: String, sparse: true },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  profilePicture: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
