const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const {
  createStockReceipt,
  getAllReceipts,
  getReceiptById,
  getDefectSummary,
} = require('../controllers/stockReceiptsController');
const { verifyToken, adminOrManager, adminManagerOrStorekeeper } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = `defect_${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

router.use(verifyToken);

// Accept up to 5 images per product line, up to 10 product lines = 50 max
router.post('/',               adminManagerOrStorekeeper, upload.any(), createStockReceipt);
router.get('/',                adminOrManager,            getAllReceipts);
router.get('/defect-summary',  adminOrManager,            getDefectSummary);
router.get('/:id',             adminOrManager,            getReceiptById);

module.exports = router;
