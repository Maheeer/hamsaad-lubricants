const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — we upload to Cloudinary manually
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/i;
    const ext = file.originalname.split('.').pop().toLowerCase();
    allowed.test(ext) ? cb(null, true) : cb(new Error('Only images and PDFs are allowed.'));
  },
});

// Upload buffer to Cloudinary and return secure URL
const uploadToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(originalname);
    const isPDF   = /\.pdf$/i.test(originalname);
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const uploadOptions = {
      folder: 'hamsaad',
      resource_type: isImage ? 'image' : 'raw',
      public_id: isImage ? uniqueId : (isPDF ? `${uniqueId}.pdf` : uniqueId),
      type: 'upload',
      access_mode: 'public',
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    });

    stream.end(buffer);
  });
};

module.exports = { upload, uploadToCloudinary, cloudinary };
