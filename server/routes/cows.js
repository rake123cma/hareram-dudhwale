const express = require('express');
const Cow = require('../models/Cow');
const { auth, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all cows (admin only)
router.get('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const cows = await Cow.find();
    res.json(cows);
  } catch (err) {
    console.error('Error fetching cows:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get upcoming cows for investors - removed as not needed for breeding only

// Get cow by ID with full details
router.get('/:id', auth, async (req, res) => {
  try {
    const cow = await Cow.findById(req.params.id);
    if (!cow) return res.status(404).json({ message: 'Cow not found' });
    res.json(cow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create cow listing (admin only)
router.post('/', auth, authorizeAdmin, async (req, res) => {
  const cow = new Cow(req.body);
  try {
    const newCow = await cow.save();
    res.status(201).json(newCow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update cow (admin only)
router.put('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Convert string dates to Date objects for breeding fields
    if (updateData.last_insemination_date) {
      const dateParts = updateData.last_insemination_date.split('-');
      updateData.last_insemination_date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    }
    if (updateData.date_of_birth) {
      const dateParts = updateData.date_of_birth.split('-');
      updateData.date_of_birth = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    }
    if (updateData.date_of_entry) {
      const dateParts = updateData.date_of_entry.split('-');
      updateData.date_of_entry = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    }

    const cow = await Cow.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!cow) return res.status(404).json({ message: 'Cow not found' });
    res.json(cow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update cow status (admin only)
router.patch('/:id/status', auth, authorizeAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const cow = await Cow.findByIdAndUpdate(
      req.params.id,
      { status, health_notes: notes },
      { new: true }
    );
    if (!cow) return res.status(404).json({ message: 'Cow not found' });
    res.json(cow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Performance route removed - not needed for breeding only functionality

// Add calving record to cow
router.post('/:id/calving', auth, authorizeAdmin, async (req, res) => {
  try {
    const { calving_date, calf_gender, calf_name, calf_status, notes } = req.body;

    const calvingRecord = {
      calving_date: new Date(calving_date),
      calf_gender,
      calf_name,
      calf_status,
      notes
    };

    const cow = await Cow.findByIdAndUpdate(
      req.params.id,
      {
        $push: { calving_records: calvingRecord },
        status: 'active', // Reset to active after calving
        pregnancy_status: false,
        last_insemination_date: null, // Clear insemination date
        expected_calving_date: null // Clear expected date
      },
      { new: true }
    );

    if (!cow) return res.status(404).json({ message: 'Cow not found' });
    res.json(cow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update milk production status
router.patch('/:id/milk-status', auth, authorizeAdmin, async (req, res) => {
  try {
    const { is_milking, lactation_start_date, lactation_end_date } = req.body;

    const updateData = { is_milking };

    if (lactation_start_date) {
      updateData.lactation_start_date = new Date(lactation_start_date);
    }
    if (lactation_end_date) {
      updateData.lactation_end_date = new Date(lactation_end_date);
      updateData.status = 'dry'; // Mark as dry when lactation ends
      updateData.dry_start_date = new Date();
    }

    const cow = await Cow.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!cow) return res.status(404).json({ message: 'Cow not found' });
    res.json(cow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get cow statistics and history
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const cow = await Cow.findById(req.params.id);
    if (!cow) return res.status(404).json({ message: 'Cow not found' });

    // Get milk records for this cow
    const milkRecords = await MilkRecord.find({ cow_id: req.params.id })
      .sort({ date: -1 })
      .limit(30); // Last 30 days

    const stats = {
      cow: {
        listing_id: cow.listing_id,
        name: cow.name,
        type: cow.type,
        date_of_entry: cow.date_of_entry,
        total_calvings: cow.total_calvings,
        total_milk_produced: cow.total_milk_produced,
        current_status: cow.status,
        is_milking: cow.is_milking
      },
      calving_history: cow.calving_records,
      recent_milk_records: milkRecords
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add insemination record to cow
router.post('/:id/insemination', auth, authorizeAdmin, async (req, res) => {
  try {
    const {
      insemination_date,
      semen_type,
      semen_batch,
      technician_name,
      cost,
      notes
    } = req.body;

    // Handle empty cost field
    let parsedCost = 0;
    if (cost && cost !== '' && !isNaN(parseFloat(cost))) {
      parsedCost = parseFloat(cost);
    }

    const inseminationRecord = {
      insemination_date: new Date(insemination_date),
      semen_type,
      semen_batch: semen_batch || '',
      technician_name: technician_name || '',
      cost: parsedCost,
      notes: notes || ''
    };

    const cow = await Cow.findByIdAndUpdate(
      req.params.id,
      {
        $push: { insemination_records: inseminationRecord },
        last_insemination_date: new Date(insemination_date),
        status: 'active' // अभी तक प्रेग्नेंट कन्फर्म नहीं
      },
      { new: true }
    );

    if (!cow) return res.status(404).json({ message: 'गाय नहीं मिली' });

    res.json(cow);
  } catch (err) {
    console.error('Error adding insemination record:', err);
    res.status(400).json({ message: err.message });
  }
});

// Confirm pregnancy for cow
router.patch('/:id/pregnancy-confirm', auth, authorizeAdmin, async (req, res) => {
  try {
    const { confirmed_date } = req.body;

    const cow = await Cow.findByIdAndUpdate(
      req.params.id,
      {
        pregnancy_status: true,
        pregnancy_confirmed_date: new Date(confirmed_date),
        status: 'pregnant'
      },
      { new: true }
    );

    if (!cow) return res.status(404).json({ message: 'गाय नहीं मिली' });
    res.json(cow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add calving record to cow
router.post('/:id/calving', auth, authorizeAdmin, async (req, res) => {
  try {
    const {
      calving_date,
      calf_gender,
      calf_name,
      calf_status,
      calf_weight,
      notes
    } = req.body;

    const calvingRecord = {
      calving_date: new Date(calving_date),
      calf_gender,
      calf_name,
      calf_status,
      calf_weight: parseFloat(calf_weight),
      notes
    };

    const cow = await Cow.findByIdAndUpdate(
      req.params.id,
      {
        $push: { calving_records: calvingRecord },
        status: 'active',
        pregnancy_status: false,
        last_insemination_date: null,
        expected_calving_date: null,
        lactation_start_date: new Date(calving_date),
        is_milking: true
      },
      { new: true }
    );

    if (!cow) return res.status(404).json({ message: 'गाय नहीं मिली' });
    res.json(cow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add deworming record to cow
router.post('/:id/deworming', auth, authorizeAdmin, async (req, res) => {
  try {
    const {
      date,
      medicine_name,
      dosage,
      cost,
      next_due_date,
      notes
    } = req.body;

    const dewormingRecord = {
      date: new Date(date),
      medicine_name,
      dosage,
      cost: parseFloat(cost),
      next_due_date: next_due_date ? new Date(next_due_date) : null,
      notes
    };

    const cow = await Cow.findByIdAndUpdate(
      req.params.id,
      {
        $push: { deworming_records: dewormingRecord },
        last_deworming_date: new Date(date)
      },
      { new: true }
    );

    if (!cow) return res.status(404).json({ message: 'गाय नहीं मिली' });
    res.json(cow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete cow (admin only)
router.delete('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    await Cow.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cow deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
