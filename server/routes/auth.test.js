const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('./auth');
const User = require('../models/User');
const Customer = require('../models/Customer');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes Integration Tests', () => {
  let testCustomer;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test-db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Set test environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Customer.deleteMany({});

    // Create test customer and user
    testCustomer = new Customer({
      name: 'Test Customer',
      phone: '1234567890',
      email: 'test@example.com',
      address: 'Test Address',
      pincode: '834001',
      category: 'General'
    });
    await testCustomer.save();

    const hashedPassword = await bcrypt.hash('testpassword', 10);
    testUser = new User({
      username: 'testuser',
      password: hashedPassword,
      role: 'customer',
      customer_id: testCustomer._id
    });
    await testUser.save();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new customer successfully', async () => {
      const newCustomer = {
        name: 'New Customer',
        phone: '9876543210',
        email: 'new@example.com',
        address: 'New Address',
        pincode: '834002',
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newCustomer)
        .expect(201);

      expect(response.body.message).toContain('Registration successful');

      // Verify customer was created
      const customer = await Customer.findOne({ phone: '9876543210' });
      expect(customer).toBeTruthy();
      expect(customer.name).toBe('New Customer');

      // Verify user was created
      const user = await User.findOne({ customer_id: customer._id });
      expect(user).toBeTruthy();
      expect(user.role).toBe('customer');
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordCustomer = {
        name: 'Weak Pass Customer',
        phone: '9876543211',
        email: 'weak@example.com',
        address: 'Weak Address',
        pincode: '834003',
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordCustomer)
        .expect(400);

      expect(response.body.message).toContain('Password must be at least 8 characters');
    });

    it('should reject duplicate phone number', async () => {
      const duplicateCustomer = {
        name: 'Duplicate Customer',
        phone: '1234567890', // Same as test customer
        email: 'duplicate@example.com',
        address: 'Duplicate Address',
        pincode: '834004',
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateCustomer)
        .expect(400);

      expect(response.body.message).toContain('Customer already exists');
    });

    it('should handle server errors gracefully', async () => {
      // Mock Customer.findOne to throw error
      const originalFindOne = Customer.findOne;
      Customer.findOne = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const customerData = {
        name: 'Error Customer',
        phone: '9876543212',
        email: 'error@example.com',
        address: 'Error Address',
        pincode: '834005',
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(customerData)
        .expect(500);

      expect(response.body.message).toBe('Database error');

      // Restore original method
      Customer.findOne = originalFindOne;
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'testpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.role).toBe('customer');
    });

    it('should accept dummy password for testing', async () => {
      const loginData = {
        username: 'testuser',
        password: 'customer123' // dummy password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.role).toBe('customer');
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'password'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/send-otp', () => {
    it('should send OTP for registered customer', async () => {
      const otpData = {
        mobile: '1234567890'
      };

      const response = await request(app)
        .post('/api/auth/send-otp')
        .send(otpData)
        .expect(200);

      expect(response.body.message).toBe('OTP sent successfully');
    });

    it('should reject OTP for unregistered mobile', async () => {
      const otpData = {
        mobile: '9999999999'
      };

      const response = await request(app)
        .post('/api/auth/send-otp')
        .send(otpData)
        .expect(404);

      expect(response.body.message).toContain('Mobile number not registered');
    });

    it('should reject OTP for customer without user account', async () => {
      // Create customer without user account
      const customerWithoutUser = new Customer({
        name: 'No User Customer',
        phone: '8888888888',
        category: 'General'
      });
      await customerWithoutUser.save();

      const otpData = {
        mobile: '8888888888'
      };

      const response = await request(app)
        .post('/api/auth/send-otp')
        .send(otpData)
        .expect(404);

      expect(response.body.message).toContain('User account not found');
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    let storedOTP;

    beforeEach(() => {
      // Mock OTP store - we need to access the internal otpStore
      // For testing, we'll mock the route behavior
      storedOTP = '123456';
    });

    it('should verify valid OTP successfully', async () => {
      // First send OTP to store it
      await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: '1234567890' });

      // Mock the otpStore for verification
      const authModule = require('./auth');
      authModule.otpStore = new Map();
      authModule.otpStore.set('1234567890', {
        otp: '123456',
        expiresAt: Date.now() + 5 * 60 * 1000
      });

      const verifyData = {
        mobile: '1234567890',
        otp: '123456'
      };

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send(verifyData)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should reject expired OTP', async () => {
      const authModule = require('./auth');
      authModule.otpStore = new Map();
      authModule.otpStore.set('1234567890', {
        otp: '123456',
        expiresAt: Date.now() - 1000 // Expired
      });

      const verifyData = {
        mobile: '1234567890',
        otp: '123456'
      };

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send(verifyData)
        .expect(400);

      expect(response.body.message).toContain('OTP expired');
    });

    it('should reject invalid OTP', async () => {
      const authModule = require('./auth');
      authModule.otpStore = new Map();
      authModule.otpStore.set('1234567890', {
        otp: '123456',
        expiresAt: Date.now() + 5 * 60 * 1000
      });

      const verifyData = {
        mobile: '1234567890',
        otp: '999999' // Wrong OTP
      };

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send(verifyData)
        .expect(400);

      expect(response.body.message).toBe('Invalid OTP');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.token).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({})
        .expect(401);

      expect(response.body.message).toBe('Refresh token required');
    });
  });
});