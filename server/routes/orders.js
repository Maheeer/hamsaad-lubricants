const express  = require('express');
const router   = express.Router();
const path     = require('path');
const pool     = require('../config/db');
const { upload } = require('../config/cloudinary');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  confirmOrder,
  uploadScannedWaybill,
  confirmGoodsReleased,
  uploadSignedWaybill,
  approveWaybill,
  rejectWaybill,
  adminUploadReceipt,
} = require('../controllers/orderController');

const {
  verifyToken,
  adminOnly,
  adminOrManager,
  adminManagerOrStorekeeper,
} = require('../middleware/auth');

router.use(verifyToken);

// ── Order CRUD ────────────────────────────────────────────────
router.post('/',              adminOnly,                 createOrder);
router.get('/',               adminManagerOrStorekeeper, getAllOrders);
router.get('/:id',            adminManagerOrStorekeeper, getOrderById);
router.patch('/:id/confirm',  adminOrManager,            confirmOrder);
router.patch('/:id/release',  adminManagerOrStorekeeper, confirmGoodsReleased);

// ── Waybill uploads ───────────────────────────────────────────
router.post('/:id/upload-scanned-waybill', adminManagerOrStorekeeper, upload.single('file'), uploadScannedWaybill);
router.post('/:id/upload-signed-waybill',  adminManagerOrStorekeeper, upload.single('file'), uploadSignedWaybill);
router.patch('/:id/approve-waybill',       adminOrManager,            approveWaybill);
router.put('/:id/reject-waybill',          adminOrManager,            rejectWaybill);

// ── Delivery note upload (Manager) ────────────────────────────
router.post('/:id/upload-delivery-note', adminOrManager, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const fileUrl = req.file.path || req.file.secure_url;

    await pool.query(
      `UPDATE waybills SET delivery_note_url = $1, updated_at = NOW() WHERE order_id = $2`,
      [fileUrl, id]
    );

    res.json({ message: 'Delivery note uploaded successfully.', delivery_note_url: fileUrl });
  } catch (err) {
    console.error('Upload delivery note error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Upload Signed Delivery Note (Storekeeper) ─────────────────
router.post('/:id/upload-signed-delivery-note', adminManagerOrStorekeeper, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const fileUrl = req.file.path || req.file.secure_url;

    await pool.query(
      `UPDATE waybills SET signed_delivery_note_url = $1, updated_at = NOW() WHERE order_id = $2`,
      [fileUrl, id]
    );

    res.json({ message: 'Signed delivery note uploaded successfully.', signed_delivery_note_url: fileUrl });
  } catch (err) {
    console.error('Upload signed delivery note error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Admin receipt upload on behalf of client ──────────────────
router.post('/:id/admin-upload-receipt', adminOnly, upload.single('file'), adminUploadReceipt);

module.exports = router;
