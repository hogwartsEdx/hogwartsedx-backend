// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://hogwartsedx-backend-29may.onrender.com/auth/google/callback"
  },
  async (token, tokenSecret, profile, done) => {
    console.log('GoogleStrategy callback executed');
    try {
      let user = await User.findOne({ googleId: profile.id });
      console.log('User lookup:', user);

      if (!user) {
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          role: 'user'
        });
        await user.save();
        console.log('New user created:', user);
      }
      return done(null, user);
    } catch (err) {
      console.error('Error in GoogleStrategy:', err);
      return done(err, false);
    }
  }
));

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log('Deserializing user with id:', id);
  User.findById(id, (err, user) => {
    if (err) {
      console.error('Error in deserializing user:', err);
    }
    done(err, user);
  });
});

module.exports = passport;
