const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');

// Temporary OTP storage (in production, use Redis or database)
const otpStore = new Map();

const router = express.Router();

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;
  try {
    // Check if customer exists
    const customer = await Customer.findOne({ phone: mobile });

    if (!customer) {
      return res.status(404).json({ message: 'Mobile number not registered. Please register first.' });
    }

    // Check if user account exists
    const user = await User.findOne({ customer_id: customer._id });
    if (!user) {
      return res.status(404).json({ message: 'User account not found. Please contact admin.' });
    }

    const otp = generateOTP();
    otpStore.set(mobile, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 minutes expiry

    // In production, send SMS here

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp } = req.body;
  try {
    const storedOTP = otpStore.get(mobile);

    if (!storedOTP || storedOTP.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP expired or invalid' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Find customer and user
    const customer = await Customer.findOne({ phone: mobile });
    const user = await User.findOne({ customer_id: customer._id });

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Generate JWT token and refresh token
    const token = jwt.sign({ id: user._id, role: user.role, customer_id: user.customer_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Clear OTP
    otpStore.delete(mobile);

    res.json({
      token,
      refreshToken,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Password validation function
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (password.length < minLength) {
    return 'Password must be at least 8 characters long';
  }
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!hasNumbers) {
    return 'Password must contain at least one number';
  }
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character';
  }
  return null;
};

// Register with OTP
router.post('/register', async (req, res) => {
  const { name, phone, email, address, pincode, password, billing_type, subscription_amount, price_per_liter } = req.body;

  // Validate password complexity
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer already exists with this phone number' });
    }

    // Create customer with optional billing info (will be set by admin later)
    const customer = new Customer({
      name,
      phone,
      email,
      address,
      pincode,
      category: 'General', // Default category for registration
      billing_type: billing_type || undefined, // Optional - set by admin later
      subscription_amount: subscription_amount ? parseFloat(subscription_amount) : undefined,
      price_per_liter: price_per_liter ? parseFloat(price_per_liter) : undefined,
      customer_type: 'guest customer' // Default type - admin can change later
    });
    await customer.save();

    // Create user account with provided password
    const user = new User({
      username: phone,
      password: await bcrypt.hash(password, 10),
      role: 'customer',
      customer_id: customer._id
    });
    await user.save();

    // Generate and store OTP
    const otp = generateOTP();
    otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    // In production, send SMS here

    res.status(201).json({ message: 'Registration successful. OTP sent to your mobile.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy register endpoint (for admin use)
router.post('/register-admin', async (req, res) => {
  const { name, phone, email, address, password, billing_type, subscription_amount } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = new Customer({ name, phone, email, address, billing_type, subscription_amount });
    await customer.save();
    const user = new User({ username: phone, password: hashedPassword, role: 'customer', customer_id: customer._id });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });

    // Check password
    const isValidPassword = user && await bcrypt.compare(password, user.password);

    if (!user || !isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role, customer_id: user.customer_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      refreshToken,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot password - send OTP
router.post('/forgot-password', async (req, res) => {
  const { mobile } = req.body;
  try {
    // Check if customer exists
    const customer = await Customer.findOne({ phone: mobile });

    if (!customer) {
      return res.status(404).json({ message: 'Mobile number not registered. Please register first.' });
    }

    // Check if user account exists
    const user = await User.findOne({ customer_id: customer._id });
    if (!user) {
      return res.status(404).json({ message: 'User account not found. Please contact admin.' });
    }

    const otp = generateOTP();
    otpStore.set(mobile, { otp, expiresAt: Date.now() + 5 * 60 * 1000, type: 'reset' }); // 5 minutes expiry, mark as reset

    // In production, send SMS here

    res.json({ message: 'OTP sent successfully for password reset' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset password - verify OTP and update password
router.post('/reset-password', async (req, res) => {
  const { mobile, otp, newPassword } = req.body;

  // Validate password complexity
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    const storedOTP = otpStore.get(mobile);

    if (!storedOTP || storedOTP.type !== 'reset' || storedOTP.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP expired or invalid' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Find customer and user
    const customer = await Customer.findOne({ phone: mobile });
    const user = await User.findOne({ customer_id: customer._id });

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Clear OTP
    otpStore.delete(mobile);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { id: user._id, role: user.role, customer_id: user.customer_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;