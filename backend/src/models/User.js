const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { 
    type: String, 
    required: function() { return !this.googleId; }
  },
  googleId: { type: String, default: null },
  avatarUrl: { type: String, default: null },
  refreshTokenVersion: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
