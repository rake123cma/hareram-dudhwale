const mongoose = require('mongoose');

const dailyAttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  status: { type: String, enum: ['present', 'absent'], required: true },
  milk_quantity: { type: Number, default: 0, min: 0 }, // in liters
  additional_products: [{
    product_type: { type: String, enum: ['milk', 'eggs', 'paneer', 'ghee', 'mithai'], required: true },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    total_amount: { type: Number, required: true }
  }],
  notes: { type: String },
  recorded_by: { type: String, default: 'admin' } // admin user who recorded this
}, { timestamps: true });

// Compound index to ensure one attendance record per customer per date
dailyAttendanceSchema.index({ date: 1, customer_id: 1 }, { unique: true });

module.exports = mongoose.model('DailyAttendance', dailyAttendanceSchema);