const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔍 GOOGLE OAUTH CONFIGURATION CHECK (UPDATED)');
console.log('===============================================');

const config = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  frontendURL: process.env.FRONTEND_URL
};

console.log('\n✅ CURRENT CONFIGURATION:');
console.log('-------------------------');
console.log('Client ID:', config.clientId ? `✅ PRESENT (${config.clientId.substring(0, 20)}...)` : '❌ MISSING');
console.log('Client Secret:', config.clientSecret ? `✅ PRESENT (${config.clientSecret.substring(0, 10)}...)` : '❌ MISSING');
console.log('Callback URL:', config.callbackURL || '❌ NOT SET');
console.log('Frontend URL:', config.frontendURL || '❌ NOT SET');

console.log('\n🎯 EXPECTED VALUES (NEW):');
console.log('-------------------------');
console.log('GOOGLE_CLIENT_ID=552482128074-aofdcmdbf5lu6eec688v1vcjbv19dtba.apps.googleusercontent.com');
console.log('GOOGLE_CLIENT_SECRET=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');
console.log('GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback');
console.log('FRONTEND_URL=http://localhost:3000');

console.log('\n🔧 VERIFICATION:');
console.log('---------------');
console.log('✅ Client ID matches:', config.clientId === '552482128074-aofdcmdbf5lu6eec688v1vcjbv19dtba.apps.googleusercontent.com');
console.log('✅ Client Secret matches:', config.clientSecret === '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');
console.log('✅ Callback URL matches:', config.callbackURL === 'http://localhost:5000/api/auth/google/callback');
console.log('✅ Frontend URL matches:', config.frontendURL === 'http://localhost:3000');

if (config.clientId && config.clientSecret && config.callbackURL) {
  console.log('\n✅ Configuration appears complete!');
  console.log('🚀 Ready to test Google OAuth with new credentials!');
  console.log('📋 What you need to ensure in Google Cloud Console:');
  console.log('   ✅ OAuth consent screen completed');
  console.log('   ✅ Test user added: rake123cma@gmail.com');
  console.log('   ✅ Required scopes added: openid, userinfo.email, userinfo.profile');
  console.log('   ✅ Redirect URI added: http://localhost:5000/api/auth/google/callback');
  console.log('   ✅ Waited 2-3 minutes after changes');
  console.log('\n🎯 Ready to test! Start your server and try Google login.');
} else {
  console.log('\n❌ Configuration incomplete - missing environment variables');
}