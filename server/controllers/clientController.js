const pool = require('../config/db');

// ─── GET PRODUCTS (with selling_price for cart total calc) ────
const getClientProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.size_variant, p.unit,
              p.selling_price, p.quantity_in_stock, p.minimum_threshold,
              b.name AS brand_name,
              c.name AS category_name
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true AND p.quantity_in_stock > 0
       ORDER BY b.name, c.name, p.name`
    );
    res.json({ products: result.rows });
  } catch (err) {
    console.error('Get client products error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CREATE CLIENT ORDER ──────────────────────────────────────
const createClientOrder = async (req, res) => {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const { items, notes } = req.body;
    const clientId = req.client.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required.' });
    }

    const date   = new Date();
    const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `HMS-INV-${yyyymm}-`;

    const r1 = await dbClient.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM LENGTH($1)+1) AS INTEGER)),0) AS max_num
       FROM orders WHERE order_number LIKE $2`,
      [prefix, `${prefix}%`]
    );
    const r2 = await dbClient.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH($1)+1) AS INTEGER)),0) AS max_num
       FROM invoices WHERE invoice_number LIKE $2`,
      [prefix, `${prefix}%`]
    );
    const next        = Math.max(parseInt(r1.rows[0].max_num), parseInt(r2.rows[0].max_num)) + 1;
    const orderNumber = `${prefix}${String(next).padStart(4, '0')}`;

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        await dbClient.query('ROLLBACK');
        return res.status(400).json({ message: 'Each item needs a valid product and quantity.' });
      }

      const pRes = await dbClient.query(
        'SELECT * FROM products WHERE id = $1 AND is_active = true', [item.product_id]
      );
      if (pRes.rows.length === 0) {
        await dbClient.query('ROLLBACK');
        return res.status(404).json({ message: 'Product not found.' });
      }

      const product   = pRes.rows[0];
      const quantity  = parseInt(item.quantity);
      const unitPrice = parseFloat(product.selling_price);
      const lineTotal = unitPrice * quantity;

      if (quantity > product.quantity_in_stock) {
        await dbClient.query('ROLLBACK');
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.quantity_in_stock}.`
        });
      }

      subtotal += lineTotal;
      validatedItems.push({
        product_id:       item.product_id,
        product_name:     product.name,
        quantity,
        unit_price:       unitPrice,
        discount_per_unit: 0,
        discounted_price:  unitPrice,
        total_price:      lineTotal,
      });
    }

    const orderResult = await dbClient.query(
      `INSERT INTO orders
         (order_number, client_id, created_by, status,
          subtotal, total_discount, total_amount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [orderNumber, clientId, null, 'created',
       subtotal.toFixed(2), '0.00', subtotal.toFixed(2), notes || null]
    );

    const order = orderResult.rows[0];

    for (const item of validatedItems) {
      await dbClient.query(
        `INSERT INTO order_items
           (order_id, product_id, product_name, quantity,
            unit_price, discount_per_unit, discounted_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [order.id, item.product_id, item.product_name, item.quantity,
         item.unit_price, 0, item.unit_price, item.total_price]
      );
    }

    await dbClient.query(
      `INSERT INTO invoices
         (order_id, invoice_number, client_id, total_amount,
          subtotal, total_discount, payment_status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [order.id, orderNumber, clientId,
       subtotal.toFixed(2), subtotal.toFixed(2), '0.00', 'unpaid', null]
    );

    await dbClient.query('COMMIT');

    res.status(201).json({
      message: 'Order placed successfully.',
      order: { ...order, items: validatedItems },
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Create client order error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    dbClient.release();
  }
};

// ─── GET CLIENT ORDERS ────────────────────────────────────────
const getClientOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*,
              COALESCE(i.payment_status, 'unpaid') AS payment_status,
              i.payment_receipt_url
       FROM orders o
       LEFT JOIN invoices i ON i.order_id = o.id
       WHERE o.client_id = $1
       ORDER BY o.created_at DESC`,
      [req.client.id]
    );
    res.json({ orders: result.rows });
  } catch (err) {
    console.error('Get client orders error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET CLIENT ORDER DETAIL ──────────────────────────────────
const getClientOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `SELECT o.*,
              COALESCE(i.payment_status, 'unpaid') AS payment_status,
              i.payment_receipt_url,
              i.receipt_approved_at
       FROM orders o
       LEFT JOIN invoices i ON i.order_id = o.id
       WHERE o.id = $1 AND o.client_id = $2`,
      [id, req.client.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const itemsResult = await pool.query(
      `SELECT oi.id, oi.product_name, oi.quantity,
              oi.total_price, p.size_variant, p.unit,
              b.name AS brand_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE oi.order_id = $1 ORDER BY oi.id`,
      [id]
    );

    res.json({ order: { ...orderResult.rows[0], items: itemsResult.rows } });
  } catch (err) {
    console.error('Get client order detail error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── UPLOAD PAYMENT RECEIPT ───────────────────────────────────
const uploadPaymentReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND client_id = $2',
      [id, req.client.id]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    await pool.query(
      `UPDATE invoices
       SET payment_receipt_url = $1, receipt_uploaded_at = NOW(),
           payment_status = 'part_paid', updated_at = NOW()
       WHERE order_id = $2`,
      [filePath, id]
    );

    res.json({ message: 'Payment receipt uploaded. Awaiting admin approval.', file_path: filePath });
  } catch (err) {
    console.error('Upload receipt error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET BANK DETAILS ─────────────────────────────────────────
const getBankDetails = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT setting_key, setting_value FROM company_settings
       WHERE setting_key IN ('bank_account_name','bank_account_number','bank_name')`
    );
    const details = {};
    result.rows.forEach((r) => { details[r.setting_key] = r.setting_value; });
    res.json({ bank_details: details });
  } catch (err) {
    console.error('Get bank details error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── LODGE COMPLAINT ──────────────────────────────────────────
const lodgeComplaint = async (req, res) => {
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    const { order_id, subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required.' });
    }

    // Get client name
    const clientRes = await dbClient.query(
      'SELECT full_name FROM clients WHERE id = $1', [req.client.id]
    );
    const clientName = clientRes.rows[0]?.full_name || 'Client';

    // Create complaint
    const result = await dbClient.query(
      `INSERT INTO complaints (client_id, order_id, subject, message, status)
       VALUES ($1,$2,$3,$4,'open') RETURNING *`,
      [req.client.id, order_id || null, subject, message]
    );

    const complaint = result.rows[0];

    // Save first message in thread
    await dbClient.query(
      `INSERT INTO complaint_messages
         (complaint_id, sender_type, sender_id, sender_name, message)
       VALUES ($1,'client',$2,$3,$4)`,
      [complaint.id, req.client.id, clientName, message]
    );

    await dbClient.query('COMMIT');
    res.status(201).json({ message: 'Complaint submitted.', complaint });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Lodge complaint error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    dbClient.release();
  }
};

// ─── GET CLIENT COMPLAINTS (with messages) ────────────────────
const getClientComplaints = async (req, res) => {
  try {
    const complaintsRes = await pool.query(
      `SELECT c.*, o.order_number
       FROM complaints c
       LEFT JOIN orders o ON c.order_id = o.id
       WHERE c.client_id = $1
       ORDER BY c.created_at DESC`,
      [req.client.id]
    );

    const complaints = complaintsRes.rows;

    // Fetch messages for each complaint
    for (const c of complaints) {
      const msgRes = await pool.query(
        `SELECT * FROM complaint_messages
         WHERE complaint_id = $1 ORDER BY created_at ASC`,
        [c.id]
      );
      c.messages = msgRes.rows;
    }

    res.json({ complaints });
  } catch (err) {
    console.error('Get complaints error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CLIENT REPLY TO COMPLAINT ────────────────────────────────
const replyToComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) return res.status(400).json({ message: 'Message is required.' });

    // Check complaint belongs to client and is not resolved
    const complaintRes = await pool.query(
      'SELECT * FROM complaints WHERE id = $1 AND client_id = $2',
      [id, req.client.id]
    );
    if (complaintRes.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }
    if (complaintRes.rows[0].status === 'resolved') {
      return res.status(400).json({ message: 'This complaint is resolved and closed.' });
    }

    const clientRes = await pool.query(
      'SELECT full_name FROM clients WHERE id = $1', [req.client.id]
    );
    const clientName = clientRes.rows[0]?.full_name || 'Client';

    await pool.query(
      `INSERT INTO complaint_messages
         (complaint_id, sender_type, sender_id, sender_name, message)
       VALUES ($1,'client',$2,$3,$4)`,
      [id, req.client.id, clientName, message]
    );

    // Mark complaint as open again if it was in_progress
    await pool.query(
      `UPDATE complaints SET status = 'open', updated_at = NOW() WHERE id = $1 AND status = 'in_progress'`,
      [id]
    );

    res.json({ message: 'Reply sent.' });
  } catch (err) {
    console.error('Client reply error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET CLIENT NOTIFICATIONS ─────────────────────────────────
const getClientNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM client_notifications
       WHERE client_id = $1 OR client_id IS NULL
       ORDER BY created_at DESC LIMIT 50`,
      [req.client.id]
    );
    const unread = result.rows.filter((n) => !n.is_read).length;
    res.json({ notifications: result.rows, unread_count: unread });
  } catch (err) {
    console.error('Get notifications error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── MARK NOTIFICATIONS READ ──────────────────────────────────
const markNotificationsRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE client_notifications
       SET is_read = true
       WHERE (client_id = $1 OR client_id IS NULL) AND is_read = false`,
      [req.client.id]
    );
    res.json({ message: 'Notifications marked as read.' });
  } catch (err) {
    console.error('Mark notifications read error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
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
};
