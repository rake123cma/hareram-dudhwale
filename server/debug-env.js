const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🔍 GOOGLE OAUTH CONFIGURATION DEBUG');
console.log('=====================================');

// Check all Google OAuth environment variables
console.log('\n📋 Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 
  `✅ PRESENT (${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...)` : '❌ MISSING');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 
  `✅ PRESENT (${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...)` : '❌ MISSING');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || '❌ NOT SET (using default)');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NOT SET (using default)');

// Check callback URL configuration
const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";
console.log('\n🔗 Callback URL Analysis:');
console.log('Current callback URL:', callbackURL);
console.log('Expected format: http://localhost:5000/api/auth/google/callback');
console.log('Match:', callbackURL === "http://localhost:5000/api/auth/google/callback" ? '✅ YES' : '❌ NO');

console.log('\n🚨 COMMON ISSUES & SOLUTIONS:');
console.log('================================');
console.log('1. OAuth Consent Screen not completed');
console.log('   - Go to: https://console.cloud.google.com/apis/credentials/consent');
console.log('   - Complete all required fields');
console.log('   - Add scopes: userinfo.email, userinfo.profile');

console.log('\n2. App in Testing Mode');
console.log('   - If app is in testing mode, only added test users can login');
console.log('   - Add your email as test user in OAuth consent screen');

console.log('\n3. Redirect URI Mismatch');
console.log('   - In Google Console, add this exact redirect URI:');
console.log(`   - ${callbackURL}`);

console.log('\n4. Missing Scopes');
console.log('   - Ensure these scopes are added: openid, profile, email');

console.log('\n📝 STEP-BY-STEP FIX:');
console.log('====================');
console.log('1. Visit: https://console.cloud.google.com/apis/credentials');
console.log('2. Click on your OAuth 2.0 Client ID');
console.log('3. Add this exact redirect URI:', callbackURL);
console.log('4. Save changes');
console.log('5. Wait 2-3 minutes for changes to propagate');
console.log('6. Test again');

console.log('\n✅ VERIFICATION CHECKLIST:');
console.log('===========================');
console.log('□ OAuth consent screen is completed');
console.log('□ Your email is added as test user (if in testing mode)');
console.log('□ Redirect URI exactly matches:', callbackURL);
console.log('□ Required scopes are added: openid, profile, email');
console.log('□ Client ID and Secret are correctly copied');
console.log('□ Waited 2-3 minutes after making changes');

module.exports = { process };