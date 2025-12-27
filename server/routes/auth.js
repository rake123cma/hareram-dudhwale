const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const Customer = require('../models/Customer');

// Temporary OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Helper function to generate JWT tokens for OAuth users
const generateOAuthTokens = (user) => {
  const token = jwt.sign({ id: user._id, role: user.role, customer_id: user.customer_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { token, refreshToken };
};

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

// Admin registration endpoint
router.post('/register-admin-user', async (req, res) => {
  const { username, password, email, name, mobile } = req.body;

  // Validate password complexity
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    // Check if admin user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Admin user already exists with this username' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
    }

    // Create admin user
    const user = new User({
      username,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      email: email || undefined,
      mobile: mobile || undefined,
      address: name ? `Admin: ${name}` : undefined
    });

    await user.save();

    res.status(201).json({ 
      message: 'Admin user registered successfully',
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Enhanced Login with proper error handling and security
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Input validation
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  if (username.length < 3 || password.length < 1) {
    return res.status(400).json({ message: 'Invalid username or password format' });
  }
  
  try {
    console.log('🔐 Login attempt for username:', username);
    
    const user = await User.findOne({ username });
    console.log('👤 User found:', !!user, user ? `Role: ${user.role}` : 'No user');

    if (!user) {
      console.log('❌ Login failed: User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!user.password) {
      console.log('❌ Login failed: No password set');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔑 Password validation:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate tokens
    const token = jwt.sign({ id: user._id, role: user.role, customer_id: user.customer_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    
    console.log('✅ Login successful for:', username);
    
    res.json({
      token,
      refreshToken,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error('💥 Login error:', err.message);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
});

// Enhanced Email/Password/Phone Authentication with security checks
router.post('/email-login', async (req, res) => {
  const { email, password } = req.body;
  
  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email/Mobile and password are required' });
  }
  
  if (password.length < 1) {
    return res.status(400).json({ message: 'Password is required' });
  }
  
  try {
    console.log('🔐 Login attempt for:', email);
    
    // Determine if input is email or mobile number
    const isEmail = email.includes('@');
    const isMobile = /^\d{10}$/.test(email.replace(/\s+/g, ''));
    
    if (!isEmail && !isMobile) {
      console.log('❌ Invalid input format');
      return res.status(400).json({ message: 'Please enter a valid email address or 10-digit mobile number' });
    }
    
    let searchQuery;
    if (isEmail) {
      // Search by email or username
      searchQuery = { $or: [{ email: email }, { username: email }] };
      console.log('📧 Searching by email/username:', email);
    } else {
      // Search by mobile number - need to find customer first, then user
      console.log('📱 Searching by mobile number:', email);
      
      // First find customer by phone
      const customer = await Customer.findOne({ phone: email });
      if (!customer) {
        console.log('❌ Customer not found with mobile:', email);
        return res.status(401).json({ message: 'Invalid email/mobile or password' });
      }
      
      // Then find user by customer_id
      searchQuery = { customer_id: customer._id };
      console.log('👤 Found customer, searching for user:', customer._id);
    }
    
    const user = await User.findOne(searchQuery);
    console.log('👤 User found:', !!user, user ? `Role: ${user.role}, Has password: ${!!user.password}` : 'No user');

    if (!user) {
      console.log('❌ Login failed: User not found');
      return res.status(401).json({ message: 'Invalid email/mobile or password' });
    }

    // Check if user has a password (not just OAuth users)
    if (!user.password) {
      console.log('❌ Login failed: OAuth-only user');
      return res.status(401).json({ message: 'Please use Google OAuth or contact admin to set a password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔑 Password validation:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid email/mobile or password' });
    }

    // Generate tokens
    const token = jwt.sign({ id: user._id, role: user.role, customer_id: user.customer_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    
    console.log('✅ Login successful for:', email);

    res.json({
      token,
      refreshToken,
      user: { id: user._id, username: user.username, role: user.role, email: user.email }
    });
  } catch (err) {
    console.error('💥 Email login error:', err.message);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
});

// Register with email/password (alternative to OTP)
router.post('/email-register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Validate password complexity
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email: email }, { username: email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if customer exists with phone (optional)
    let customer = null;
    if (phone) {
      customer = await Customer.findOne({ phone });
      if (!customer) {
        // Create customer if phone provided but doesn't exist
        customer = new Customer({
          name,
          phone,
          email,
          category: 'General',
          customer_type: 'guest customer'
        });
        await customer.save();
      }
    } else {
      // Create customer without phone
      customer = new Customer({
        name,
        email,
        category: 'General',
        customer_type: 'guest customer'
      });
      await customer.save();
    }

    // Create user account
    const user = new User({
      username: email,
      email: email,
      password: await bcrypt.hash(password, 10),
      role: 'customer',
      customer_id: customer._id
    });
    await user.save();

    // Generate tokens immediately (no OTP required)
    const token = jwt.sign({ id: user._id, role: user.role, customer_id: user.customer_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      refreshToken,
      user: { id: user._id, username: user.username, role: user.role, email: user.email }
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

// Admin password change (for logged in admins)
router.post('/change-admin-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  // Validate password complexity
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    // Find admin user
    const user = await User.findOne({ username, role: 'admin' });
    
    if (!user) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
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

// Google OAuth Routes

// Initiate Google OAuth for customers
router.get('/google', (req, res, next) => {
  try {
    console.log('Google OAuth initiation - Environment check:');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
    console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
    
    // Only allow customer OAuth, not admin
    req.session = req.session || {};
    req.session.userType = 'customer';
    
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account'
    })(req, res, next);
  } catch (err) {
    console.error('Google OAuth initiation error:', err);
    res.redirect('/login?error=oauth_init_failed');
  }
});

// Google OAuth callback
router.get('/google/callback', 
  (req, res, next) => {
    // Add debugging for the authorization code
    console.log('🔍 OAuth Callback Debug:');
    console.log('📋 Query params:', req.query);
    console.log('🔑 Auth code present:', !!req.query.code);
    console.log('🔑 Code length:', req.query.code ? req.query.code.length : 0);
    console.log('🎯 State:', req.query.state);
    
    // Fix: Decode HTML entities and URL encoding in the authorization code
    if (req.query.code) {
      // First decode URL encoding (%2F -> /)
      req.query.code = decodeURIComponent(req.query.code);
      // Then decode any remaining HTML entities (&#x2F; -> /)
      req.query.code = req.query.code.replace(/&#x2F;/g, '/');
      console.log('🔧 Fixed code:', req.query.code);
    }
    
    // Continue with passport authentication
    next();
  },
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: '/login?error=oauth_failed' 
  }),
  async (req, res) => {
    try {
      const user = req.user;
      console.log('✅ OAuth Success - User:', user.email);
      
      // Generate JWT tokens
      const { token, refreshToken } = generateOAuthTokens(user);
      
      // Create redirect URL with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/oauth-success?token=${token}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify({
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email
      }))}`;
      
      console.log('🚀 Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (err) {
      console.error('❌ OAuth callback error:', err);
      res.redirect('/login?error=oauth_failed');
    }
  }
);

// Debug endpoint for authentication troubleshooting
router.get('/debug-users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude passwords for security
    console.log('👥 Total users in database:', users.length);
    
    const userSummary = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      customer_id: user.customer_id
    }));
    
    res.json({
      totalUsers: users.length,
      users: userSummary,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('💥 Debug error:', err.message);
    res.status(500).json({ message: 'Failed to fetch user data' });
  }
});

// Check Google OAuth status
router.get('/google/status', (req, res) => {
  res.json({ 
    enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL)
  });
});


module.exports = router;
