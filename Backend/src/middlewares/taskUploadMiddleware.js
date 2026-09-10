// src/middlewares/taskUploadMiddleware.js
// Multer config for task evidence uploads.
// Supports both single photo evidence ('evidence' or 'photo')
// and two-stage Before/After evidence ('before_evidence' and 'after_evidence').

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'tasks');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.fieldname}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  },
});

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
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

// Middleware supporting single evidence OR before/after evidence fields
const taskUpload = upload.fields([
  { name: 'evidence', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'before_evidence', maxCount: 1 },
  { name: 'after_evidence', maxCount: 1 },
]);

module.exports = taskUpload;
