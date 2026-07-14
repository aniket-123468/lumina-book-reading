const mongoose = require('mongoose');

const readingStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  currentPage: { type: Number, default: 1 },
  fontSize: { type: Number, default: 18 },
  lineHeight: { type: Number, default: 1.6 },
  theme: { type: String, enum: ['light', 'warm-cream', 'dark'], default: 'light' },
}, {
  timestamps: true
});

readingStateSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('ReadingState', readingStateSchema);
