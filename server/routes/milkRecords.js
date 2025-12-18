const express = require('express');
const MilkRecord = require('../models/MilkRecord');
const Cow = require('../models/Cow');
const { auth, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all milk records
router.get('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const records = await MilkRecord.find().populate('cow_id');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create milk record
router.post('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const recordData = { ...req.body };

    // Convert date string to Date object
    if (recordData.date) {
      recordData.date = new Date(recordData.date);
    }

    // Convert numeric fields
    if (recordData.morning_liters) recordData.morning_liters = parseFloat(recordData.morning_liters);
    if (recordData.evening_liters) recordData.evening_liters = parseFloat(recordData.evening_liters);
    if (recordData.morning_fat) recordData.morning_fat = parseFloat(recordData.morning_fat);
    if (recordData.evening_fat) recordData.evening_fat = parseFloat(recordData.evening_fat);
    if (recordData.morning_snf) recordData.morning_snf = parseFloat(recordData.morning_snf);
    if (recordData.evening_snf) recordData.evening_snf = parseFloat(recordData.evening_snf);
    if (recordData.milk_rate) recordData.milk_rate = parseFloat(recordData.milk_rate);

    // Set recorded_by to current user
    recordData.recorded_by = req.user.id;

    const record = new MilkRecord(recordData);
    const newRecord = await record.save();

    // Update cow's current milk production
    await Cow.findByIdAndUpdate(recordData.cow_id, {
      current_daily_milk: newRecord.total_daily_liters,
      $inc: {
        total_milk_produced: newRecord.total_daily_liters,
        total_revenue: newRecord.daily_revenue || 0
      }
    });

    res.status(201).json(newRecord);
  } catch (err) {
    console.error('Error creating milk record:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update milk record
router.put('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const record = await MilkRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete milk record
router.delete('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    await MilkRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Milk record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;