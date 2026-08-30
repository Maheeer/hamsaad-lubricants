const pool = require('../config/db');

// ─── GENERATE ORDER NUMBER ────────────────────────────────────
const generateOrderNumber = async () => {
  const date = new Date();
  const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `HMS-INV-${yyyymm}-`;

  const result = await pool.query(
    `SELECT COALESCE(MAX(
       CAST(SUBSTRING(order_number FROM LENGTH($1) + 1) AS INTEGER)
     ), 0) AS max_num
     FROM orders
     WHERE order_number LIKE $2`,
    [prefix, `${prefix}%`]
  );

  const result2 = await pool.query(
    `SELECT COALESCE(MAX(
       CAST(SUBSTRING(invoice_number FROM LENGTH($1) + 1) AS INTEGER)
     ), 0) AS max_num
     FROM invoices
     WHERE invoice_number LIKE $2`,
    [prefix, `${prefix}%`]
  );

  const maxFromOrders   = parseInt(result.rows[0].max_num)  || 0;
  const maxFromInvoices = parseInt(result2.rows[0].max_num) || 0;
  const next = Math.max(maxFromOrders, maxFromInvoices) + 1;

  return `${prefix}${String(next).padStart(4, '0')}`;
};

// ─── CREATE ORDER ─────────────────────────────────────────────
const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { client_id, items, notes, payment_method, created_by_admin } = req.body;

    if (!client_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Client and at least one item are required.' });
    }

    const clientResult = await client.query(
      'SELECT * FROM clients WHERE id = $1 AND is_active = true', [client_id]
    );
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found or inactive.' });
    }

    const orderNumber = await generateOrderNumber();

    let subtotal      = 0;
    let totalDiscount = 0;

    const validatedItems = [];
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Each item needs a valid product and quantity.' });
      }

      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 AND is_active = true', [item.product_id]
      );
      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: `Product ID ${item.product_id} not found or inactive.` });
      }

      const product         = productResult.rows[0];
      const quantity        = parseInt(item.quantity);
      const unitPrice       = parseFloat(product.selling_price);
      const discPerUnit     = parseFloat(item.discount_per_unit) || 0;
      const discountedPrice = unitPrice - discPerUnit;
      const lineTotal       = discountedPrice * quantity;
      const lineDiscount    = discPerUnit * quantity;

      if (quantity > product.quantity_in_stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Ordered: ${quantity}, Available: ${product.quantity_in_stock}.`
        });
      }

      if (discPerUnit >= unitPrice) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Discount per unit for "${product.name}" cannot equal or exceed the selling price.`
        });
      }

      subtotal      += unitPrice * quantity;
      totalDiscount += lineDiscount;

      validatedItems.push({
        product_id:        item.product_id,
        product_name:      product.name,
        quantity,
        unit_price:        unitPrice,
        discount_per_unit: discPerUnit,
        discounted_price:  discountedPrice,
        total_price:       lineTotal,
      });
    }

    const totalAmount = subtotal - totalDiscount;

    const pm = payment_method || 'bank_transfer';
    const isCashOrPos = pm === 'cash' || pm === 'pos';

    const orderResult = await client.query(
      `INSERT INTO orders
         (order_number, client_id, created_by, status,
          subtotal, total_discount, total_amount, notes,
          payment_method, created_by_admin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        orderNumber, client_id, req.user.id, 'created',
        subtotal.toFixed(2), totalDiscount.toFixed(2), totalAmount.toFixed(2),
        notes || null, pm, created_by_admin ? true : false,
      ]
    );

    const order = orderResult.rows[0];

    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, product_name, quantity,
            unit_price, discount_per_unit, discounted_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [order.id, item.product_id, item.product_name, item.quantity,
         item.unit_price, item.discount_per_unit, item.discounted_price, item.total_price]
      );
    }

    await client.query(
      `INSERT INTO invoices
         (order_id, invoice_number, client_id, total_amount,
          subtotal, total_discount, payment_status, created_by,
          receipt_approved_by, receipt_approved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        order.id, orderNumber, client_id,
        totalAmount.toFixed(2), subtotal.toFixed(2), totalDiscount.toFixed(2),
        isCashOrPos ? 'paid' : 'unpaid', req.user.id,
        isCashOrPos ? req.user.id : null,
        isCashOrPos ? new Date()  : null,
      ]
    );

    await client.query(
      `INSERT INTO audit_logs
         (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'CREATE_ORDER', 'orders', order.id,
       JSON.stringify({ orderNumber, client_id, totalAmount, itemCount: validatedItems.length })]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order created successfully.',
      order: { ...order, items: validatedItems },
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create order error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ─── GET ALL ORDERS ───────────────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    // Added payment_status to destructuring
    const { status, client_id, from_date, to_date, payment_status } = req.query;

    let query = `
      SELECT o.*,
             c.full_name AS client_name,
             c.client_id AS client_id_code,
             u.full_name AS created_by_name,
             COALESCE(i.payment_status, 'unpaid') AS payment_status,
             i.payment_receipt_url,
             i.receipt_uploaded_at
      FROM orders o
      LEFT JOIN clients  c ON o.client_id  = c.id
      LEFT JOIN users    u ON o.created_by = u.id
      LEFT JOIN invoices i ON i.order_id   = o.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }
    if (client_id) {
      params.push(client_id);
      query += ` AND o.client_id = $${params.length}`;
    }
    if (from_date) {
      params.push(from_date);
      query += ` AND o.created_at >= $${params.length}`;
    }
    if (to_date) {
      params.push(to_date);
      query += ` AND o.created_at <= $${params.length}`;
    }
    // New payment status filter
    if (payment_status) {
      params.push(payment_status);
      query += ` AND COALESCE(i.payment_status, 'unpaid') = $${params.length}`;
    }

    query += ` ORDER BY o.created_at DESC`;

    const result = await pool.query(query, params);
    res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error('Get orders error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET ORDER BY ID ──────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `SELECT o.*,
              c.full_name AS client_name,
              c.client_id AS client_id_code,
              c.phone,
              c.email,
              c.address,
              u.full_name AS created_by_name,
              COALESCE(i.payment_status, 'unpaid') AS payment_status,
              i.payment_receipt_url,
              i.receipt_uploaded_at
       FROM orders o
       LEFT JOIN clients  c ON o.client_id  = c.id
       LEFT JOIN users    u ON o.created_by = u.id
       LEFT JOIN invoices i ON i.order_id   = o.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orderResult.rows[0];

    // Fetch order items (includes current stock for storekeeper availability check)
    const itemsResult = await pool.query(
      `SELECT oi.*,
              COALESCE(oi.product_name, p.name) AS product_name,
              p.size_variant, p.unit,
              p.quantity_in_stock, p.minimum_threshold,
              b.name AS brand_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN brands   b ON p.brand_id    = b.id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [id]
    );

    // Fetch waybill
    const waybillResult = await pool.query(
      `SELECT w.*, u.full_name AS created_by_name
       FROM waybills w
       LEFT JOIN users u ON w.created_by = u.id
       WHERE w.order_id = $1`,
      [id]
    );

    res.status(200).json({
      order,
      items:   itemsResult.rows,
      waybill: waybillResult.rows[0] || null,
    });

  } catch (err) {
    console.error('Get order error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CONFIRM ORDER (Manager) ──────────────────────────────────
const confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.rows[0].status !== 'created') {
      return res.status(400).json({ message: 'Only orders with status "created" can be confirmed.' });
    }

    await pool.query(
      `UPDATE orders
       SET status = 'confirmed', confirmed_by = $1,
           confirmed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [req.user.id, id]
    );

    const existingWaybill = await pool.query(
      'SELECT id FROM waybills WHERE order_id = $1', [id]
    );
    if (existingWaybill.rows.length === 0) {
      const { collector_name } = req.body;
      await pool.query(
        `INSERT INTO waybills (order_id, waybill_number, created_by, collector_name)
        VALUES ($1, $2, $3, $4)`,
        [id, order.rows[0].order_number, req.user.id, collector_name || null]
      );
    }

    await pool.query(
      `INSERT INTO audit_logs
         (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'CONFIRM_ORDER', 'orders',
       id, JSON.stringify({ status: 'confirmed' })]
    );

    res.json({ message: 'Order confirmed. Waybill generated.' });
  } catch (err) {
    console.error('Confirm order error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── UPLOAD SCANNED WAYBILL (Manager) ────────────────────────
const uploadScannedWaybill = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.rows[0].status !== 'confirmed') {
      return res.status(400).json({ message: 'Order must be confirmed before uploading waybill.' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    await pool.query(
      `UPDATE waybills SET scanned_copy_url = $1, updated_at = NOW() WHERE order_id = $2`,
      [filePath, id]
    );

    res.json({ message: 'Scanned waybill uploaded.', file_path: filePath });
  } catch (err) {
    console.error('Upload scanned waybill error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CONFIRM GOODS RELEASED (Storekeeper) ────────────────────
const confirmGoodsReleased = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orderResult.rows[0];
    if (order.status !== 'confirmed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Order must be confirmed before releasing goods.' });
    }

    const itemsResult = await client.query(
      'SELECT * FROM order_items WHERE order_id = $1', [id]
    );

    for (const item of itemsResult.rows) {
      const pRes = await client.query(
        'SELECT quantity_in_stock, name FROM products WHERE id = $1', [item.product_id]
      );
      if (pRes.rows.length === 0) continue;
      const { quantity_in_stock, name } = pRes.rows[0];
      if (quantity_in_stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Insufficient stock for "${name}". Available: ${quantity_in_stock}, Required: ${item.quantity}.`
        });
      }
    }

    for (const item of itemsResult.rows) {
      const pRes = await client.query(
        'SELECT quantity_in_stock FROM products WHERE id = $1', [item.product_id]
      );
      if (pRes.rows.length === 0) continue;

      const currentStock = pRes.rows[0].quantity_in_stock;
      const newStock     = currentStock - item.quantity;

      await client.query(
        `UPDATE products SET quantity_in_stock = $1, updated_at = NOW() WHERE id = $2`,
        [newStock, item.product_id]
      );

      await client.query(
        `INSERT INTO stock_movements
           (product_id, movement_type, quantity, quantity_before,
            quantity_after, note, performed_by, reference_id, reference_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [item.product_id, 'stock_out', item.quantity, currentStock, newStock,
         `Released for order ${order.order_number}`, req.user.id, id, 'order']
      );
    }

    await client.query(
      `UPDATE orders
       SET status = 'released', released_by = $1,
           released_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [req.user.id, id]
    );

    await client.query(
      `INSERT INTO audit_logs
         (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'RELEASE_GOODS', 'orders',
       id, JSON.stringify({ status: 'released' })]
    );

    await client.query('COMMIT');
    res.json({ message: 'Goods released. Stock deducted.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Confirm goods released error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ─── UPLOAD SIGNED WAYBILL (Storekeeper) ─────────────────────
const uploadSignedWaybill = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.rows[0].status !== 'released') {
      return res.status(400).json({ message: 'Order must be released before uploading signed waybill.' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    await pool.query(
      `UPDATE waybills SET signed_copy_url = $1, updated_at = NOW() WHERE order_id = $2`,
      [filePath, id]
    );

    res.json({ message: 'Signed waybill uploaded.', file_path: filePath });
  } catch (err) {
    console.error('Upload signed waybill error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── APPROVE WAYBILL (Manager) ───────────────────────────────
const approveWaybill = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.rows[0].status !== 'released') {
      return res.status(400).json({ message: 'Order must be released before approving waybill.' });
    }

    const waybill = await pool.query('SELECT * FROM waybills WHERE order_id = $1', [id]);
    if (!waybill.rows[0]?.signed_copy_url) {
      return res.status(400).json({ message: 'Signed waybill must be uploaded before approval.' });
    }

    await pool.query(
      `UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = $1`, [id]
    );

    await pool.query(
      `UPDATE waybills
       SET approved_by = $1, approved_at = NOW(),
           is_approved = true, updated_at = NOW()
       WHERE order_id = $2`,
      [req.user.id, id]
    );

    await pool.query(
      `INSERT INTO audit_logs
         (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'APPROVE_WAYBILL', 'orders',
       id, JSON.stringify({ status: 'completed' })]
    );

    res.json({ message: 'Waybill approved. Order completed.' });
  } catch (err) {
    console.error('Approve waybill error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── ADMIN UPLOAD RECEIPT ON BEHALF OF CLIENT ────────────────
const adminUploadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const orderRes = await pool.query(
      `SELECT o.*, i.id AS invoice_id, i.payment_status
       FROM orders o
       LEFT JOIN invoices i ON i.order_id = o.id
       WHERE o.id = $1`, [id]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order    = orderRes.rows[0];
    const filePath = `/uploads/${req.file.filename}`;

    await pool.query(
      `UPDATE invoices SET payment_receipt_url = $1, updated_at = NOW() WHERE order_id = $2`,
      [filePath, id]
    );

    if (order.payment_status === 'unpaid') {
      await pool.query(
        `UPDATE invoices SET payment_status = 'part_paid', updated_at = NOW() WHERE order_id = $1`,
        [id]
      );
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'UPLOAD_RECEIPT', 'invoices',
       order.invoice_id, JSON.stringify({ order_number: order.order_number, uploaded_on_behalf: true })]
    );

    res.json({ message: 'Receipt uploaded successfully.', file_path: filePath });
  } catch (err) {
    console.error('Admin upload receipt error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

const rejectWaybill = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ message: 'Rejection reason is required.' });

    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.rows[0].status !== 'released') {
      return res.status(400).json({ message: 'Order must be in released status to reject waybill.' });
    }

    await pool.query(
      `UPDATE waybills
       SET signed_copy_url  = NULL,
           rejection_reason = $1,
           rejected_at      = NOW(),
           rejected_by      = $2,
           is_approved      = false,
           updated_at       = NOW()
       WHERE order_id = $3`,
      [reason, req.user.id, id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'REJECT_WAYBILL', 'waybills',
       id, JSON.stringify({ reason })]
    );

    res.json({ message: 'Waybill rejected. Storekeeper can now re-upload.' });
  } catch (err) {
    console.error('Reject waybill error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
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
};
