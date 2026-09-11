// src/config/cloudinary.js
// Cloudinary configuration and Multer CloudinaryStorage instance

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? process.env.CLOUDINARY_CLOUD_NAME.trim() : '',
  api_key: process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.trim() : '',
  api_secret: process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.trim() : '',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'EcoSathi/complaints',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

module.exports = { cloudinary, storage };
