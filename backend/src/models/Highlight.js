const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  page: { type: Number, required: true },
  color: { type: String, enum: ['yellow', 'green', 'pink', 'blue'], required: true },
  textSnippet: { type: String },
  rects: [{
    x: Number,
    y: Number,
    w: Number,
    h: Number
  }],
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

highlightSchema.index({ bookId: 1, page: 1 });

module.exports = mongoose.model('Highlight', highlightSchema);
