const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Customer = require('../models/Customer');

// Configure Google OAuth Strategy with debugging
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: false, // Ensure clean request handling
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔍 Google OAuth Strategy Called');
    console.log('📧 Email:', profile.emails[0]?.value);
    console.log('👤 Name:', profile.displayName);
    
    const email = profile.emails[0].value;
    const googleId = profile.id;
    const name = profile.displayName;
    const profilePicture = profile.photos[0]?.value;

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId }).populate('customer_id');
    
    if (user) {
      console.log('✅ Found existing user with Google ID');
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findOne({ email }).populate('customer_id');
    
    if (user) {
      console.log('✅ Found existing user with email, linking Google account');
      // Link Google account to existing user
      user.googleId = googleId;
      user.provider = 'google';
      user.profilePicture = profilePicture;
      await user.save();
      return done(null, user);
    }

    // Create new customer and user for Google OAuth
    console.log('🆕 Creating new customer and user');
    const customer = new Customer({
      name: name,
      phone: `google-oauth-${googleId}`, // Use Google ID as phone for OAuth users
      email: email,
      category: 'General',
      customer_type: 'guest customer',
      registration_source: 'homepage' // Use existing valid value for OAuth
    });
    await customer.save();

    user = new User({
      username: email,
      email: email,
      googleId: googleId,
      provider: 'google',
      role: 'customer',
      customer_id: customer._id,
      profilePicture: profilePicture
    });
    await user.save();

    done(null, user);
  } catch (err) {
    console.error('❌ Google OAuth Strategy Error:', err);
    done(err, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate('customer_id');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
