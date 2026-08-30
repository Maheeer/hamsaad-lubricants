const pool = require('../config/db');

const getNotifications = async (req, res) => {
  try {
    const notifications = [];

    // 1. Pending client orders (created but not confirmed)
    const pendingOrders = await pool.query(`
      SELECT o.id, o.order_number, o.created_at, c.full_name AS client_name
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE o.status = 'created'
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    pendingOrders.rows.forEach(o => {
      notifications.push({
        id:      `pending_order_${o.id}`,
        type:    'pending_order',
        title:   'New Order',
        message: `Order ${o.order_number} from ${o.client_name} is awaiting confirmation.`,
        time:    o.created_at,
        urgent:  false,
      });
    });

    // 2. Payment receipts awaiting approval
    const pendingPayments = await pool.query(`
      SELECT o.id, o.order_number, i.receipt_uploaded_at, c.full_name AS client_name
      FROM invoices i
      JOIN orders  o ON i.order_id  = o.id
      JOIN clients c ON o.client_id = c.id
      WHERE i.payment_receipt_url IS NOT NULL
        AND i.payment_status = 'part_paid'
        AND i.receipt_approved_at IS NULL
      ORDER BY i.receipt_uploaded_at DESC
      LIMIT 10
    `);
    pendingPayments.rows.forEach(p => {
      notifications.push({
        id:      `payment_receipt_${p.id}`,
        type:    'payment_receipt',
        title:   'Payment Receipt Uploaded',
        message: `Client ${p.client_name} uploaded a payment receipt for order ${p.order_number}. Awaiting your approval.`,
        time:    p.receipt_uploaded_at,
        urgent:  true,
      });
    });

    // 3. Open complaints
    const complaints = await pool.query(`
      SELECT id, subject, created_at, status
      FROM complaints
      WHERE status = 'open'
      ORDER BY created_at DESC
      LIMIT 5
    `).catch(() => ({ rows: [] }));
    complaints.rows.forEach(c => {
      notifications.push({
        id:      `complaint_${c.id}`,
        type:    'complaint',
        title:   'Open Complaint',
        message: `Complaint "${c.subject}" is open and awaiting resolution.`,
        time:    c.created_at,
        urgent:  false,
      });
    });

    // 4. Stock added by manager or storekeeper in last 7 days
    const recentStock = await pool.query(`
      SELECT sm.id, sm.quantity, sm.created_at, p.name AS product_name,
             u.full_name AS performed_by, u.role
      FROM stock_movements sm
      JOIN products p ON sm.product_id  = p.id
      JOIN users    u ON sm.performed_by = u.id
      WHERE sm.movement_type = 'stock_in'
        AND u.role IN ('manager', 'storekeeper')
        AND sm.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY sm.created_at DESC
      LIMIT 5
    `);
    recentStock.rows.forEach(s => {
      notifications.push({
        id:      `stock_in_${s.id}`,
        type:    'stock_in',
        title:   'Stock Added',
        message: `${s.performed_by} (${s.role}) added ${s.quantity} units of ${s.product_name}.`,
        time:    s.created_at,
        urgent:  false,
      });
    });

    // 5. Low stock alerts
    const lowStock = await pool.query(`
      SELECT p.name, p.quantity_in_stock, p.unit, b.name AS brand_name
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      WHERE p.is_low_stock = true AND p.is_active = true
      ORDER BY p.quantity_in_stock ASC
      LIMIT 5
    `);
    if (lowStock.rows.length > 0) {
      notifications.push({
        id:      `low_stock_alert`,
        type:    'low_stock',
        title:   'Low Stock Alert',
        message: `${lowStock.rows.length} product(s) are running low: ${lowStock.rows.map(p => p.name).join(', ')}.`,
        time:    new Date(),
        urgent:  true,
      });
    }

    // Sort by time descending
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({ notifications, total: notifications.length });
  } catch (err) {
    console.error('Notifications error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAdminNotifications: getNotifications };
