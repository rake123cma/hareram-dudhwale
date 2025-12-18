// Production Environment Verification Script
// Tests the Render.com production setup

require('dotenv').config({ path: './.env' });

console.log('🔍 Production Environment Verification');
console.log('=====================================');
console.log('Environment: Production (Render.com)');
console.log('Timestamp:', new Date().toISOString());
console.log('');

// Test critical environment variables
const criticalVars = {
  'NODE_ENV': 'production',
  'MONGO_URI': process.env.MONGO_URI,
  'JWT_SECRET': process.env.JWT_SECRET,
  'JWT_REFRESH_SECRET': process.env.JWT_REFRESH_SECRET,
  'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
  'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
  'GOOGLE_CALLBACK_URL': process.env.GOOGLE_CALLBACK_URL,
  'FRONTEND_URL': process.env.FRONTEND_URL,
  'CORS_ORIGIN': process.env.CORS_ORIGIN
};

console.log('📋 Critical Environment Variables:');
console.log('-----------------------------------');

let allGood = true;

Object.entries(criticalVars).forEach(([key, value]) => {
  if (!value || value.includes('your_') || value.includes('placeholder')) {
    console.log(`❌ ${key}: Missing or placeholder value`);
    allGood = false;
  } else {
    // Show partial values for security
    const displayValue = value.length > 50 ? 
      value.substring(0, 20) + '...' + value.substring(value.length - 10) : 
      value;
    console.log(`✅ ${key}: ${displayValue}`);
  }
});

console.log('');

// Test JWT token generation
console.log('🔐 JWT Token Generation Test:');
console.log('------------------------------');

try {
  const jwt = require('jsonwebtoken');
  
  const testPayload = { userId: 'test', role: 'customer' };
  
  const accessToken = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('✅ Access token generation: SUCCESS');
  
  const refreshToken = jwt.sign({ userId: 'test' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  console.log('✅ Refresh token generation: SUCCESS');
  
  // Test token verification
  const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
  console.log('✅ Token verification: SUCCESS');
  
} catch (error) {
  console.log('❌ JWT test failed:', error.message);
  allGood = false;
}

console.log('');

// Test database connection
console.log('💾 Database Connection Test:');
console.log('-----------------------------');

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connection: SUCCESS');
  return mongoose.connection.close();
})
.catch(err => {
  console.log('❌ MongoDB connection: FAILED');
  console.log('Error:', err.message);
  allGood = false;
});

console.log('');

// OAuth Configuration Analysis
console.log('🎯 Google OAuth Configuration Analysis:');
console.log('----------------------------------------');

const expectedCallback = 'https://hareram-dudhwale.onrender.com/api/auth/google/callback';
const actualCallback = process.env.GOOGLE_CALLBACK_URL;

if (actualCallback === expectedCallback) {
  console.log('✅ Callback URL: CORRECT for Render.com');
} else {
  console.log('❌ Callback URL: INCORRECT');
  console.log(`   Expected: ${expectedCallback}`);
  console.log(`   Actual: ${actualCallback}`);
  allGood = false;
}

// Check if production URLs are used
if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('hareram-dudhwale.onrender.com')) {
  console.log('✅ Frontend URL: CORRECT for Render.com');
} else {
  console.log('❌ Frontend URL: May not be correct for production');
}

console.log('');

// Google Cloud Console Requirements
console.log('☁️  Google Cloud Console Requirements:');
console.log('---------------------------------------');
console.log('✅ Client ID: Present and configured');
console.log('✅ Client Secret: Present and configured');
console.log('✅ Callback URL: Configured for production');
console.log('');
console.log('📝 Manual verification needed:');
console.log('1. OAuth consent screen completed');
console.log('2. Redirect URI added: https://hareram-dudhwale.onrender.com/api/auth/google/callback');
console.log('3. App published or test users added');
console.log('4. Required scopes: openid, profile, email');

console.log('');
console.log('🔗 Useful Links:');
console.log('----------------');
console.log('Google Cloud Console: https://console.cloud.google.com/apis/credentials');
console.log('OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent');
console.log('Test your OAuth: https://hareram-dudhwale.onrender.com/api/auth/google-test');

console.log('');
console.log('📊 Final Assessment:');
console.log('====================');

if (allGood) {
  console.log('🎉 ALL SYSTEMS GO! Your environment is properly configured.');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Deploy to Render.com with these environment variables');
  console.log('2. Test Google OAuth in production');
  console.log('3. Monitor logs for any issues');
  console.log('');
  console.log('⚠️  If you still get 500 errors, check:');
  console.log('- Google Cloud Console OAuth consent screen');
  console.log('- Redirect URIs match exactly');
  console.log('- App is published or test users are added');
} else {
  console.log('⚠️  Some issues detected. Please fix the ❌ items above.');
}

console.log('');
console.log('=====================================');
console.log('Verification complete!');