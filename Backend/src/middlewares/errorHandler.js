// src/middlewares/errorHandler.js
// Centralized error handler. Mount this LAST in app.js (after all routes)
// so any error thrown/passed to next(err) anywhere in the app lands here
// with a consistent JSON response, instead of Express's default HTML crash page.

const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error:', err.message);

  // Multer file-size/type errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }

  // Fallback — anything unexpected
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;