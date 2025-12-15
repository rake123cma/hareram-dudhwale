const express = require('express');
const EggRecord = require('../models/EggRecord');
const { auth, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all egg records
router.get('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const records = await EggRecord.find().populate('hen_id');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create egg record
router.post('/', auth, authorizeAdmin, async (req, res) => {
  const record = new EggRecord(req.body);
  try {
    const newRecord = await record.save();
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update egg record
router.put('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const record = await EggRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete egg record
router.delete('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    await EggRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Egg record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;