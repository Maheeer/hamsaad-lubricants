const pool = require('../config/db');

// ─── GET ALL SETTINGS ─────────────────────────────────────────
const getSettings = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT setting_key, setting_value FROM company_settings ORDER BY setting_key'
    );
    const settings = {};
    result.rows.forEach((r) => { settings[r.setting_key] = r.setting_value; });
    res.json({ settings });
  } catch (err) {
    console.error('Get settings error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── UPDATE SETTINGS ──────────────────────────────────────────
const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ message: 'Settings object is required.' });
    }
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO company_settings (setting_key, setting_value, updated_by, updated_at)
         VALUES ($1,$2,$3,NOW())
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = $2, updated_by = $3, updated_at = NOW()`,
        [key, value, req.user.id]
      );
    }
    res.json({ message: 'Settings updated successfully.' });
  } catch (err) {
    console.error('Update settings error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── APPROVE PAYMENT RECEIPT (Admin) ─────────────────────────
const approvePaymentReceipt = async (req, res) => {
  try {
    const { order_id } = req.params;

    const orderResult = await pool.query(
      `SELECT o.*, c.id AS client_row_id
       FROM orders o
       JOIN clients c ON o.client_id = c.id
       WHERE o.id = $1`,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orderResult.rows[0];

    // Mark invoice as paid
    await pool.query(
      `UPDATE invoices
       SET payment_status = 'paid',
           receipt_approved_by = $1,
           receipt_approved_at = NOW()
       WHERE order_id = $2`,
      [req.user.id, order_id]
    );

    // Mark invoice payment status as paid (payment_status lives on invoices table)
    await pool.query(
      `UPDATE invoices SET payment_status = 'paid', updated_at = NOW() WHERE order_id = $1`,
      [order_id]
    );

    // Notify client
    await pool.query(
      `INSERT INTO client_notifications (client_id, type, title, message, order_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        order.client_row_id,
        'payment_approved',
        'Payment Approved',
        `Your payment for order ${order.order_number} has been approved. Your invoice is now marked as PAID.`,
        order.id,
      ]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'APPROVE_PAYMENT', 'orders',
       order.id, JSON.stringify({ order_number: order.order_number, client: order.client_name || order.order_number })]
    );

    res.json({ message: 'Payment approved. Invoice marked as paid.' });
  } catch (err) {
    console.error('Approve payment error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET ALL COMPLAINTS (Admin) ───────────────────────────────
const getAllComplaints = async (req, res) => {
  try {
    const complaintsRes = await pool.query(
      `SELECT comp.*,
              c.full_name  AS client_name,
              c.client_id  AS client_id_code,
              o.order_number
       FROM complaints comp
       JOIN clients c ON comp.client_id = c.id
       LEFT JOIN orders o ON comp.order_id = o.id
       ORDER BY comp.created_at DESC`
    );

    const complaints = complaintsRes.rows;

    for (const comp of complaints) {
      const msgRes = await pool.query(
        `SELECT * FROM complaint_messages
         WHERE complaint_id = $1 ORDER BY created_at ASC`,
        [comp.id]
      );
      comp.messages = msgRes.rows;
    }

    res.json({ complaints });
  } catch (err) {
    console.error('Get complaints error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── ADMIN REPLY TO COMPLAINT ─────────────────────────────────
const replyToComplaint = async (req, res) => {
  try {
    const { id }              = req.params;
    const { message, status } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Reply message is required.' });
    }

    const complaintRes = await pool.query(
      'SELECT * FROM complaints WHERE id = $1', [id]
    );
    if (complaintRes.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }
    if (complaintRes.rows[0].status === 'resolved') {
      return res.status(400).json({ message: 'This complaint is resolved and closed.' });
    }

    const complaint = complaintRes.rows[0];

    // Save message to thread
    await pool.query(
      `INSERT INTO complaint_messages
         (complaint_id, sender_type, sender_id, sender_name, message)
       VALUES ($1, 'admin', $2, $3, $4)`,
      [id, req.user.id, req.user.full_name, message]
    );

    // Update complaint status and admin_response
    await pool.query(
      `UPDATE complaints
       SET status = $1,
           admin_response = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [status || 'in_progress', message, id]
    );

    // Notify client
    await pool.query(
      `INSERT INTO client_notifications
         (client_id, type, title, message, order_id, complaint_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        complaint.client_id,
        'complaint_response',
        'Admin has responded to your complaint',
        `Admin has responded to your complaint: "${complaint.subject}"`,
        complaint.order_id,
        complaint.id,
      ]
    );

    // Audit log if resolved
    if ((status || 'in_progress') === 'resolved') {
      await pool.query(
        `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, new_values)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.user.id, req.user.full_name, 'RESOLVE_COMPLAINT', 'complaints',
         complaint.id, JSON.stringify({ subject: complaint.subject })]
      );
    }

    res.json({ message: 'Reply sent.' });
  } catch (err) {
    console.error('Reply complaint error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET PRICE ALERTS HISTORY ─────────────────────────────────

// ─── GET PRICE ALERTS HISTORY ─────────────────────────────────
const getPriceAlerts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pa.*, u.full_name AS sent_by_name
       FROM price_alerts pa
       LEFT JOIN users u ON pa.sent_by = u.id
       ORDER BY pa.created_at DESC
       LIMIT 100`
    );
    res.json({ alerts: result.rows });
  } catch (err) {
    console.error('Get price alerts error:', err.message);
    res.json({ alerts: [] });
  }
};

// ─── SEND PRICE NOTIFICATION TO CLIENTS ──────────────────────
const sendPriceNotification = async (req, res) => {
  try {
    const { alert_type, brand_name, products, client_ids } = req.body;

    if (!alert_type) {
      return res.status(400).json({ message: 'Alert type is required.' });
    }

    let message = '';
    let sentTo  = 'All Clients';

    if (alert_type === 'brand') {
      // Brand-level general note
      if (!brand_name) {
        return res.status(400).json({ message: 'Brand name is required for brand alerts.' });
      }
      message = `Price Update Notice: The price of all ${brand_name} products will be changing in the coming days. Please contact us for more information.`;

    } else if (alert_type === 'product') {
      // Product-level with increase/decrease list
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: 'At least one product is required.' });
      }
      const lines = products.map((p) =>
        `• ${p.name}: Price ${p.direction === 'increase' ? 'Increase ↑' : 'Decrease ↓'}`
      );
      message = `Price Update Notice:\n\n${lines.join('\n')}\n\nPlease contact us for more details.`;

    } else {
      return res.status(400).json({ message: 'Invalid alert type.' });
    }

    const title = alert_type === 'brand'
      ? `Price Update: ${brand_name} Products`
      : 'Product Price Update Notice';

    // Send notifications to clients
    if (client_ids && client_ids.length > 0) {
      for (const clientId of client_ids) {
        await pool.query(
          `INSERT INTO client_notifications (client_id, type, title, message)
           VALUES ($1, 'price_update', $2, $3)`,
          [clientId, title, message]
        );
      }
      const nameRes = await pool.query(
        `SELECT full_name FROM clients WHERE id = ANY($1)`, [client_ids]
      );
      sentTo = nameRes.rows.map((r) => r.full_name).join(', ');
    } else {
      await pool.query(
        `INSERT INTO client_notifications (client_id, type, title, message)
         SELECT id, 'price_update', $1, $2 FROM clients WHERE is_active = true`,
        [title, message]
      );
    }

    // Log to price_alerts
    await pool.query(
      `INSERT INTO price_alerts (alert_type, brand_name, message, products, sent_to, sent_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        alert_type,
        brand_name || null,
        message,
        products ? JSON.stringify(products) : null,
        sentTo,
        req.user.id,
      ]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'SEND_PRICE_ALERT', 'price_alerts',
       null, JSON.stringify({ alert_type, brand_name: brand_name || null, sent_to: sentTo })]
    );

    res.json({ message: `Price alert sent to ${sentTo}.` });
  } catch (err) {
    console.error('Send price notification error:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// ─── ACTIVITY LOG ─────────────────────────────────────────────
const getActivityLog = async (req, res) => {
  try {
    const { action_type, from_date, to_date, limit = 100 } = req.query;

    // Build filter
    const conditions = [];
    const params     = [];
    let   p          = 1;

    if (action_type && action_type !== 'all') {
      // Map filter groups to action names
      const groups = {
        stock:      ['ADD_STOCK', 'REDUCE_STOCK'],
        orders:     ['CREATE_ORDER', 'CONFIRM_ORDER', 'RELEASE_GOODS', 'COMPLETE_ORDER',
                     'UPLOAD_SCANNED_WAYBILL', 'UPLOAD_SIGNED_WAYBILL', 'APPROVE_WAYBILL'],
        clients:    ['CREATE_CLIENT', 'ENABLE_CLIENT', 'DISABLE_CLIENT'],
        users:      ['CREATE_USER', 'ENABLE_USER', 'DISABLE_USER'],
        products:   ['CREATE_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT', 'CREATE_BRAND',
                     'ARCHIVE_PRODUCT', 'RESTORE_PRODUCT'],
        payments:   ['APPROVE_PAYMENT', 'UPLOAD_RECEIPT'],
        alerts:     ['SEND_PRICE_ALERT'],
        complaints: ['RESOLVE_COMPLAINT'],
      };
      const actions = groups[action_type] || [action_type];
      conditions.push(`action = ANY($${p})`);
      params.push(actions);
      p++;
    }

    if (from_date) {
      conditions.push(`created_at >= $${p}`);
      params.push(from_date);
      p++;
    }

    if (to_date) {
      conditions.push(`created_at <= $${p}::date + interval '1 day'`);
      params.push(to_date);
      p++;
    }

    const where = conditions.length > 0
      ? `WHERE action != 'LOGIN' AND ${conditions.join(' AND ')}`
      : `WHERE action != 'LOGIN'`;

    const result = await pool.query(
      `SELECT id, user_id, user_name, action, table_name, record_id,
              new_values, old_values, created_at
       FROM audit_logs
       ${where}
       ORDER BY created_at DESC
       LIMIT $${p}`,
      [...params, parseInt(limit)]
    );

    res.json({ logs: result.rows });
  } catch (err) {
    console.error('Activity log error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  approvePaymentReceipt,
  getAllComplaints,
  replyToComplaint,
  getPriceAlerts,
  sendPriceNotification,
  getActivityLog,
};
