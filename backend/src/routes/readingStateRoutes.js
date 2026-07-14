const express = require('express');
const { protect } = require('../middleware/auth');
const { updateReadingState, getReadingState } = require('../controllers/readingStateController');

const router = express.Router();

router.route('/')
  .put(protect, updateReadingState);

router.route('/:bookId')
  .get(protect, getReadingState);

module.exports = router;
