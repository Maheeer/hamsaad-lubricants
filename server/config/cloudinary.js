const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
    const isPDF   = /\.pdf$/i.test(file.originalname);
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return {
      folder: 'hamsaad',
      resource_type: isImage ? 'image' : 'raw',
      type: 'upload',
      access_mode: 'public',
      public_id: isImage ? uniqueId : (isPDF ? `${uniqueId}.pdf` : uniqueId),
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { upload, cloudinary };
