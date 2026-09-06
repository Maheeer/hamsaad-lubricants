const express  = require('express');
const router   = express.Router();
const {
  createStockReceipt,
  getAllReceipts,
  getReceiptById,
  getDefectSummary,
} = require('../controllers/stockReceiptsController');
const { verifyToken, adminOrManager, adminManagerOrStorekeeper } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.use(verifyToken);

// Accept up to 5 images per product line, up to 10 product lines = 50 max
router.post('/',               adminManagerOrStorekeeper, upload.any(), createStockReceipt);
router.get('/',                adminOrManager,            getAllReceipts);
router.get('/defect-summary',  adminOrManager,            getDefectSummary);
router.get('/:id',             adminOrManager,            getReceiptById);

module.exports = router;
