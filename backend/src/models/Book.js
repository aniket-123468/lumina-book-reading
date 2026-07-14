const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  author: { type: String },
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  coverUrl: { type: String },
  totalPages: { type: Number, required: true },
  lastReadPage: { type: Number, default: 1 },
  fileSizeBytes: { type: Number },
  addedAt: { type: Date, default: Date.now }
});

bookSchema.index({ userId: 1, addedAt: -1 });

module.exports = mongoose.model('Book', bookSchema);
