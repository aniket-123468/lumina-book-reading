const ReadingState = require('../models/ReadingState');
const Book = require('../models/Book');

const updateReadingState = async (req, res) => {
  try {
    const { bookId, lastReadPage, scrollPosition } = req.body;

    let state = await ReadingState.findOne({ userId: req.user._id, bookId });

    if (!state) {
      state = await ReadingState.create({
        userId: req.user._id,
        bookId,
        lastReadPage: lastReadPage || 1,
        scrollPosition: scrollPosition || 0
      });
    } else {
      if (lastReadPage) state.lastReadPage = lastReadPage;
      if (scrollPosition !== undefined) state.scrollPosition = scrollPosition;
      await state.save();
    }

    // Also update book lastReadPage
    await Book.findByIdAndUpdate(bookId, { lastReadPage: state.lastReadPage });

    res.json(state);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getReadingState = async (req, res) => {
  try {
    const { bookId } = req.params;
    const state = await ReadingState.findOne({ userId: req.user._id, bookId });
    
    if (!state) {
      return res.status(404).json({ message: 'No reading state found' });
    }

    res.json(state);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  updateReadingState,
  getReadingState
};
