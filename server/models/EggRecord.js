const mongoose = require('mongoose');

const eggRecordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  hen_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hen', required: true },
  eggs_produced: { type: Number, required: true },
  total_daily_eggs: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('EggRecord', eggRecordSchema);