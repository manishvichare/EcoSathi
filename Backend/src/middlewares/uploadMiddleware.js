// src/middlewares/uploadMiddleware.js
// Multer config for complaint photo uploads using Cloudinary storage.

const multer = require('multer');
const { storage } = require('../config/cloudinary');

// Only accept image files, max 5MB — keeps things fast for a hackathon demo
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, or WEBP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Wrapper to seamlessly support both 'image' and 'photo' field names
const originalSingle = upload.single.bind(upload);
upload.single = function (fieldName) {
  if (fieldName === 'image' || fieldName === 'photo') {
    const fieldsUpload = upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'photo', maxCount: 1 },
    ]);
    return (req, res, next) => {
      fieldsUpload(req, res, (err) => {
        if (err) return next(err);
        if (req.files) {
          req.file = req.files['image']?.[0] || req.files['photo']?.[0];
        }
        next();
      });
    };
  }
  return originalSingle(fieldName);
};

module.exports = upload;