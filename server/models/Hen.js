const mongoose = require('mongoose');

const henSchema = new mongoose.Schema({
  name: { type: String, required: true },
  breed: { type: String },
  date_of_birth: { type: Date },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  last_vaccination_date: { type: Date },
  health_notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Hen', henSchema);