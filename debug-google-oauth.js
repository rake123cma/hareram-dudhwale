// Debug script for Google OAuth issues
// Run this locally to check your configuration

require('dotenv').config({ path: './.env' });

console.log('🔍 Google OAuth Configuration Debug');
console.log('=====================================');

// Check environment variables
const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGO_URI'
];

console.log('\n📋 Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ Present' : '❌ MISSING';
  const preview = value ? `(${value.substring(0, 20)}...)` : '';
  console.log(`  ${varName}: ${status} ${preview}`);
});

// Check Google OAuth configuration
console.log('\n🌐 Google OAuth Configuration:');
console.log('  Client ID starts with:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20));
console.log('  Callback URL:', process.env.GOOGLE_CALLBACK_URL);
console.log('  Callback URL format check:', process.env.GOOGLE_CALLBACK_URL?.includes('https://') ? '✅ HTTPS' : '❌ HTTP (should be HTTPS in production)');

// Check JWT token generation
console.log('\n🔐 JWT Configuration:');
try {
  const jwt = require('jsonwebtoken');
  const testToken = jwt.sign({ test: 'data' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('  JWT_SECRET: ✅ Valid (can generate tokens)');

  const testRefreshToken = jwt.sign({ test: 'data' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  console.log('  JWT_REFRESH_SECRET: ✅ Valid (can generate refresh tokens)');
} catch (err) {
  console.log('  JWT_SECRET: ❌ Invalid - cannot generate tokens');
  console.log('  Error:', err.message);
}

// Test database connection
console.log('\n💾 Database Configuration:');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('  MongoDB: ✅ Connected successfully');
  return mongoose.connection.close();
})
.catch(err => {
  console.log('  MongoDB: ❌ Connection failed');
  console.log('  Error:', err.message);
});

// OAuth scope check
console.log('\n🎯 OAuth Scope Analysis:');
console.log('  Required scopes: openid, profile, email');
console.log('  These should match Google Console exactly');

// Summary
console.log('\n📊 Summary:');
console.log('=====================================');
console.log('If you see any ❌ MISSING above, fix those first.');
console.log('If all are ✅ but still getting "Malformed auth code":');
console.log('  1. Check Google Cloud Console OAuth consent screen');
console.log('  2. Verify redirect URIs match exactly');
console.log('  3. Ensure app is published or test users are added');
console.log('  4. Wait 2-3 minutes after Console changes');
console.log('');
console.log('🚀 Quick Test Commands:');
console.log('  curl "http://localhost:5000/api/auth/google-test"');
console.log('  curl "https://your-domain.com/api/auth/google-test"');
