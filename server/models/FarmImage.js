const mongoose = require('mongoose');

const farmImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('FarmImage', farmImageSchema);