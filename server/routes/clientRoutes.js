const express  = require('express');
const router   = express.Router();
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
const { upload } = require('../config/cloudinary');

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
