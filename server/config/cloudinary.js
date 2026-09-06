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
    return {
      folder: 'hamsaad',
      resource_type: isImage ? 'image' : 'raw',
      format: isPDF ? 'pdf' : undefined,
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Helper to get viewable URL from Cloudinary URL
const getViewableUrl = (url) => {
  if (!url) return url;
  // For raw PDFs, ensure the URL ends with .pdf for proper rendering
  if (url.includes('/raw/upload/') && !url.endsWith('.pdf')) {
    return url + '.pdf';
  }
  return url;
};

module.exports = { upload, cloudinary, getViewableUrl };
