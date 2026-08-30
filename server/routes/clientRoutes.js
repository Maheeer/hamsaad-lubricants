const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { verifyClientToken } = require('../middleware/clientMiddleware');
const {
  getClientProducts,
  createClientOrder,
  getClientOrders,
  getClientOrderDetail,
  uploadPaymentReceipt,
  getBankDetails,
  lodgeComplaint,
  getClientComplaints,
  replyToComplaint,
  getClientNotifications,
  markNotificationsRead,
} = require('../controllers/clientController');
const { clientLogin, clientChangePassword, getClientProfile } = require('../controllers/clientAuth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only images and PDFs are allowed.'));
  },
});

// Public
router.post('/login', clientLogin);

// Protected
router.use(verifyClientToken);

router.get('/profile',         getClientProfile);
router.put('/change-password', clientChangePassword);

router.get('/products',    getClientProducts);
router.get('/bank-details', getBankDetails);

router.post('/orders',                              createClientOrder);
router.get('/orders',                               getClientOrders);
router.get('/orders/:id',                           getClientOrderDetail);
router.post('/orders/:id/upload-receipt', upload.single('receipt'), uploadPaymentReceipt);

router.post('/complaints',            lodgeComplaint);
router.get('/complaints',             getClientComplaints);
router.post('/complaints/:id/reply',  replyToComplaint);

router.get('/notifications',       getClientNotifications);
router.put('/notifications/read',  markNotificationsRead);

module.exports = router;
