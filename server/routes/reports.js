const express = require('express');
const router = express.Router();
const {
  getDailyOpeningStock,
  getDailySalesByBrand,
  getDailySalesByProduct,
  getDailyClosingStock,
  getDailyStockSummary,
  getFullSalesReport,
  getReportFilters
} = require('../controllers/reportsController');
const { verifyToken, adminOnly, adminOrManager } = require('../middleware/auth');

router.use(verifyToken);

// Daily Report tabs
router.get('/daily/opening-stock',  adminOrManager, getDailyOpeningStock);
router.get('/daily/sales-by-brand', adminOrManager, getDailySalesByBrand);
router.get('/daily/sales-by-product', adminOrManager, getDailySalesByProduct);
router.get('/daily/closing-stock',  adminOrManager, getDailyClosingStock);
router.get('/daily/stock-summary',  adminOrManager, getDailyStockSummary);

// Full sales report
router.get('/full', adminOrManager, getFullSalesReport);

// Filter options
router.get('/filters', adminOrManager, getReportFilters);

module.exports = router;
