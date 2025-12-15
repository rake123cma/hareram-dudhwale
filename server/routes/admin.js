const express = require('express');
const User = require('../models/User');
const FarmImage = require('../models/FarmImage');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/farm-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'farm-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get admin settings
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      address: user.address || '',
      mobile: user.mobile || '',
      email: user.email || '',
      whatsapp: user.whatsapp || ''
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update admin settings
router.put('/settings', requireAdmin, async (req, res) => {
  try {
    const { address, mobile, email, whatsapp } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { address, mobile, email, whatsapp },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Settings updated successfully',
      settings: {
        address: user.address,
        mobile: user.mobile,
        email: user.email,
        whatsapp: user.whatsapp
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all farm images
router.get('/farm-images', async (req, res) => {
  try {
    const images = await FarmImage.find({ is_active: true }).sort({ order: 1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload farm image
router.post('/farm-images', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/farm-images/${req.file.filename}`;

    const image = new FarmImage({
      url: imageUrl,
      filename: req.file.filename,
      title: req.body.title || '',
      description: req.body.description || '',
      order: parseInt(req.body.order) || 0
    });

    await image.save();
    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update farm image
router.put('/farm-images/:id', requireAdmin, async (req, res) => {
  try {
    const { title, description, order, is_active } = req.body;

    const image = await FarmImage.findByIdAndUpdate(
      req.params.id,
      { title, description, order, is_active },
      { new: true }
    );

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.json(image);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete farm image
router.delete('/farm-images/:id', requireAdmin, async (req, res) => {
  try {
    const image = await FarmImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../uploads/farm-images', image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await FarmImage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;