const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { verifyToken, adminOrManager, adminOnly, adminManagerOrStorekeeper } = require('../middleware/auth');
const { generateWaybillPDF, generateDeliveryNotePDF, generateInvoicePDF } = require('../utils/generatePDF');

// ─── DOWNLOAD WAYBILL PDF ─────────────────────────────────────
router.get('/waybill/:orderId', verifyToken, adminManagerOrStorekeeper, async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(
      `SELECT o.*, c.full_name AS client_name, c.client_id AS client_code
       FROM orders o
       LEFT JOIN clients c ON o.client_id = c.id
       WHERE o.id = $1`,
      [orderId]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ message: 'Order not found.' });
    const order = orderResult.rows[0];

    const waybillResult = await pool.query(
      `SELECT w.*, u1.full_name AS storekeeper_name
       FROM waybills w
       LEFT JOIN users u1 ON w.storekeeper_id = u1.id
       WHERE w.order_id = $1`,
      [orderId]
    );
    if (waybillResult.rows.length === 0) return res.status(404).json({ message: 'Waybill not found.' });
    const waybill = waybillResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT oi.*, p.name AS product_name, p.size_variant, p.unit, b.name AS brand_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN brands b   ON p.brand_id    = b.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    generateWaybillPDF(waybill, order, itemsResult.rows, res);
  } catch (err) {
    console.error('Waybill PDF error:', err.message);
    res.status(500).json({ message: 'Failed to generate waybill PDF.' });
  }
});

// ─── DOWNLOAD DELIVERY NOTE PDF ───────────────────────────────
router.get('/delivery-note/:orderId', verifyToken, adminManagerOrStorekeeper, async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(
      `SELECT o.*, c.full_name AS client_name, c.client_id AS client_code
       FROM orders o
       LEFT JOIN clients c ON o.client_id = c.id
       WHERE o.id = $1`,
      [orderId]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ message: 'Order not found.' });
    const order = orderResult.rows[0];

    const waybillResult = await pool.query(
      `SELECT w.*, u1.full_name AS storekeeper_name
       FROM waybills w
       LEFT JOIN users u1 ON w.storekeeper_id = u1.id
       WHERE w.order_id = $1`,
      [orderId]
    );
    const waybill = waybillResult.rows.length > 0 ? waybillResult.rows[0] : {};

    const clientResult = await pool.query(
      `SELECT * FROM clients WHERE id = $1`, [order.client_id]
    );
    const client = clientResult.rows.length > 0 ? clientResult.rows[0] : {};

    const itemsResult = await pool.query(
      `SELECT oi.*, p.name AS product_name, p.size_variant, p.unit, b.name AS brand_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN brands b   ON p.brand_id    = b.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    generateDeliveryNotePDF(waybill, order, itemsResult.rows, client, res);
  } catch (err) {
    console.error('Delivery note PDF error:', err.message);
    res.status(500).json({ message: 'Failed to generate delivery note PDF.' });
  }
});

// ─── DOWNLOAD INVOICE PDF ─────────────────────────────────────
router.get('/invoice/:orderId', verifyToken, adminOnly, async (req, res) => {
  try {
    const { orderId } = req.params;

    const invoiceResult = await pool.query(
      `SELECT i.* FROM invoices i WHERE i.order_id = $1`, [orderId]
    );
    if (invoiceResult.rows.length === 0) return res.status(404).json({ message: 'Invoice not found.' });
    const invoice = invoiceResult.rows[0];

    const orderResult  = await pool.query('SELECT * FROM orders  WHERE id = $1', [orderId]);
    const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [invoice.client_id]);
    const order  = orderResult.rows[0];
    const client = clientResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT oi.*, p.name AS product_name, p.size_variant, p.unit, b.name AS brand_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN brands b   ON p.brand_id    = b.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    generateInvoicePDF(invoice, order, itemsResult.rows, client, res);
  } catch (err) {
    console.error('Invoice PDF error:', err.message);
    res.status(500).json({ message: 'Failed to generate invoice PDF.' });
  }
});

module.exports = router;
