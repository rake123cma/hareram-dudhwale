const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  product_type: { type: String, enum: ['milk', 'eggs', 'paneer', 'ghee', 'mithai'], required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  invoice_number: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);