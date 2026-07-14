const Book = require('../models/Book');
const mongoose = require('mongoose');

const uploadBook = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, author, totalPages, coverUrl } = req.body;

    // Manually upload the file buffer to GridFS
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'pdfs'
    });

    const uploadStream = bucket.openUploadStream(req.file.originalname);
    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      try {
        const book = await Book.create({
          userId: req.user._id,
          title: title || req.file.originalname,
          author: author || 'Unknown Author',
          fileId: uploadStream.id,
          coverUrl: coverUrl || '',
          totalPages: parseInt(totalPages, 10) || 1,
          fileSizeBytes: req.file.size
        });
        res.status(201).json(book);
      } catch (err) {
        console.error('Error creating book doc:', err);
        res.status(500).json({ message: 'Error saving book details' });
      }
    });

    uploadStream.on('error', (err) => {
      console.error('GridFS Upload Error:', err);
      res.status(500).json({ message: 'Error saving file' });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getBooks = async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user._id }).sort({ addedAt: -1 });
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getBook = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.user._id });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getBookFile = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.user._id });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'pdfs'
    });

    const downloadStream = bucket.openDownloadStream(book.fileId);
    
    res.set('Content-Type', 'application/pdf');
    downloadStream.pipe(res);

    downloadStream.on('error', (err) => {
      console.error(err);
      res.status(404).json({ message: 'File not found' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteBook = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.user._id });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'pdfs'
    });

    await bucket.delete(book.fileId);
    await Book.deleteOne({ _id: book._id });

    res.json({ message: 'Book removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  uploadBook,
  getBooks,
  getBook,
  getBookFile,
  deleteBook
};
