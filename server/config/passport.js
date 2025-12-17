const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Customer = require('../models/Customer');

// Validate environment variables
const validateConfig = () => {
  const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (!process.env.GOOGLE_CALLBACK_URL) {
    console.warn('GOOGLE_CALLBACK_URL not set, using default: http://localhost:5000/api/auth/google/callback');
  }
};

try {
  validateConfig();
} catch (error) {
  console.error('❌ Google OAuth Configuration Error:', error.message);
  console.error('Please check your .env file and ensure all required variables are set.');
}

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    scope: ['openid', 'profile', 'email'],
    passReqToCallback: true,
    proxy: true
  },
  async (req, request, accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔐 Google OAuth callback received');
      console.log('📧 Profile info:', {
        id: profile.id,
        email: profile.emails ? profile.emails[0].value : 'no email',
        displayName: profile.displayName,
        provider: profile.provider,
        verified: profile.emails ? profile.emails[0].verified : false
      });

      // Additional validation
      if (!profile.emails || profile.emails.length === 0) {
        throw new Error('No email found in Google profile');
      }

      const userEmail = profile.emails[0].value;
      if (!userEmail) {
        throw new Error('Email is required but not provided');
      }

      // Check if user exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        console.log('✅ Found existing user by Google ID:', user._id);
        return done(null, user);
      } else {
        console.log('🔍 No user found with Google ID, checking by email');
        // Check if user exists with this email
        user = await User.findOne({ email: userEmail });

        if (user) {
          console.log('✅ Found existing user by email, linking Google ID');
          // User exists with email, link Google ID
          user.googleId = profile.id;
          user.provider = 'google';
          user.profilePicture = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
          await user.save();
          return done(null, user);
        } else {
          console.log('🆕 Creating new user from Google profile');
          // New user, create customer and user accounts
          const customer = new Customer({
            name: profile.displayName || userEmail.split('@')[0],
            email: userEmail,
            category: 'General',
            customer_type: 'guest customer'
          });
          console.log('👤 Creating customer...');
          await customer.save();

          console.log('👤 Creating user...');
          user = new User({
            username: userEmail, // Use email as username for OAuth users
            email: userEmail,
            role: 'customer',
            customer_id: customer._id,
            googleId: profile.id,
            provider: 'google',
            profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
          });
          await user.save();

          console.log('✅ New user created successfully:', user._id);
          return done(null, user);
        }
      }
    } catch (err) {
      console.error('❌ Google OAuth strategy error:', err);
      
      // Provide specific error messages for common issues
      if (err.message.includes('Malformed auth code')) {
        console.error('🚨 AUTH CODE ERROR: This usually indicates:');
        console.error('   1. OAuth consent screen not completed');
        console.error('   2. App in testing mode - add test users');
        console.error('   3. Redirect URI mismatch in Google Console');
        console.error('   4. Client ID/Secret mismatch');
      }
      
      return done(err, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
