const Highlight = require('../models/Highlight');

const createHighlight = async (req, res) => {
  try {
    const { bookId, pageNumber, text, color, boundingRect } = req.body;

    const highlight = await Highlight.create({
      userId: req.user._id,
      bookId,
      pageNumber,
      text,
      color: color || '#FFD54F',
      boundingRect
    });

    res.status(201).json(highlight);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAllHighlights = async (req, res) => {
  try {
    const highlights = await Highlight.find({ userId: req.user._id }).populate('bookId', 'title author coverUrl').sort({ createdAt: -1 });
    res.json(highlights);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getHighlights = async (req, res) => {
  try {
    const { bookId } = req.params;
    const highlights = await Highlight.find({ userId: req.user._id, bookId });
    res.json(highlights);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findOne({ _id: req.params.id, userId: req.user._id });
    if (!highlight) {
      return res.status(404).json({ message: 'Highlight not found' });
    }

    await Highlight.deleteOne({ _id: highlight._id });
    res.json({ message: 'Highlight removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createHighlight,
  getAllHighlights,
  getHighlights,
  deleteHighlight
};
