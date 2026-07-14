const multer = require('multer');

// Use memory storage instead of multer-gridfs-storage.
// multer-gridfs-storage is outdated and throws "The database connection must be open to store files"
// with modern Mongoose/MongoDB drivers. We will handle GridFS upload manually in the controller.
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
