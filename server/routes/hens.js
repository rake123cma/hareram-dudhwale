const express = require('express');
const Hen = require('../models/Hen');
const { auth, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all hens
router.get('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const hens = await Hen.find();
    res.json(hens);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create hen
router.post('/', auth, authorizeAdmin, async (req, res) => {
  const hen = new Hen(req.body);
  try {
    const newHen = await hen.save();
    res.status(201).json(newHen);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update hen
router.put('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const hen = await Hen.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(hen);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete hen
router.delete('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    await Hen.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hen deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;