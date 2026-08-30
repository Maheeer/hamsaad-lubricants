const express = require('express');
const router  = express.Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const {
  getSettings,
  updateSettings,
  approvePaymentReceipt,
  getAllComplaints,
  replyToComplaint,
  getPriceAlerts,
  sendPriceNotification,
  getActivityLog,
} = require('../controllers/settingsController');

router.use(verifyToken);
router.use(adminOnly);

router.get('/',                           getSettings);
router.put('/',                           updateSettings);
router.post('/approve-payment/:order_id', approvePaymentReceipt);
router.get('/complaints',                 getAllComplaints);
router.post('/complaints/:id/reply',      replyToComplaint);
router.get('/price-alerts',               getPriceAlerts);
router.post('/notify-price',              sendPriceNotification);

router.get('/activity-log', getActivityLog);

module.exports = router;
