const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        return done(null, user);
      }

      // Check if user exists with the same email but no googleId
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Link google account to existing email
        user.googleId = profile.id;
        user.avatarUrl = profile.photos[0]?.value || user.avatarUrl;
        await user.save();
        return done(null, user);
      }

      // Create new user
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        avatarUrl: profile.photos[0]?.value
      });

      done(null, user);
    } catch (error) {
      console.error(error);
      done(error, null);
    }
  }
));

module.exports = passport;
