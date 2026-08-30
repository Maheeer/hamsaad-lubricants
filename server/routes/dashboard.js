const express = require('express');
const router  = express.Router();
const {
  getDashboardStats,
  getSalesTrend,
  getDashboardLowStock,
  getRecentOrders,
  getPaymentSummary,
  getTopProducts
} = require('../controllers/dashboardController');
const { verifyToken, adminOrManager } = require('../middleware/auth');

router.use(verifyToken);
router.use(adminOrManager);

router.get('/stats',           getDashboardStats);
router.get('/sales-trend',     getSalesTrend);
router.get('/low-stock',       getDashboardLowStock);
router.get('/recent-orders',   getRecentOrders);
router.get('/payment-summary', getPaymentSummary);
router.get('/top-products',    getTopProducts);

module.exports = router;
