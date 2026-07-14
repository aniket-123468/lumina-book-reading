const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../config/upload');
const { uploadBook, getBooks, getBook, getBookFile, deleteBook } = require('../controllers/bookController');

const router = express.Router();

router.route('/')
  .get(protect, getBooks)
  .post(protect, upload.single('pdf'), uploadBook);

router.route('/:id')
  .get(protect, getBook)
  .delete(protect, deleteBook);

router.route('/:id/file')
  .get(protect, getBookFile);

module.exports = router;
