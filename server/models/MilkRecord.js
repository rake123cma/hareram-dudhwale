const mongoose = require('mongoose');

const milkRecordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  cow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow', required: true },

  // Morning session
  morning_liters: { type: Number, default: 0 },
  morning_fat: { type: Number }, // percentage
  morning_snf: { type: Number }, // percentage

  // Evening session
  evening_liters: { type: Number, default: 0 },
  evening_fat: { type: Number }, // percentage
  evening_snf: { type: Number }, // percentage

  // Daily totals (calculated)
  total_daily_liters: { type: Number, default: 0 },
  average_fat: { type: Number },
  average_snf: { type: Number },

  // Revenue calculation
  milk_rate: { type: Number }, // ₹ per liter
  daily_revenue: { type: Number, default: 0 },

  // Notes
  notes: { type: String },

  // Recorded by
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Pre-save middleware to calculate totals
milkRecordSchema.pre('save', function(next) {
  this.total_daily_liters = (this.morning_liters || 0) + (this.evening_liters || 0);

  // Calculate average fat and SNF
  const morningWeight = this.morning_liters || 0;
  const eveningWeight = this.evening_liters || 0;
  const totalWeight = morningWeight + eveningWeight;

  if (totalWeight > 0) {
    this.average_fat = ((this.morning_fat || 0) * morningWeight + (this.evening_fat || 0) * eveningWeight) / totalWeight;
    this.average_snf = ((this.morning_snf || 0) * morningWeight + (this.evening_snf || 0) * eveningWeight) / totalWeight;
  }

  // Calculate revenue if rate is provided
  if (this.milk_rate && this.total_daily_liters) {
    this.daily_revenue = this.milk_rate * this.total_daily_liters;
  }

  next();
});

module.exports = mongoose.model('MilkRecord', milkRecordSchema);