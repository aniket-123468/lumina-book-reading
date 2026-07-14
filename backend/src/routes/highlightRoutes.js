const express = require('express');
const { protect } = require('../middleware/auth');
const { createHighlight, getAllHighlights, getHighlights, deleteHighlight } = require('../controllers/highlightController');

const router = express.Router();

router.route('/')
  .get(protect, getAllHighlights)
  .post(protect, createHighlight);

router.route('/:bookId')
  .get(protect, getHighlights);

router.route('/:id')
  .delete(protect, deleteHighlight);

module.exports = router;
