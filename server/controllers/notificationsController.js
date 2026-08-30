const pool = require('../config/db');

const getAdminNotifications = async (req, res) => {
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
        id:         `pending_order_${o.id}`,
        type:       'pending_order',
        icon:       '📋',
        title:      'New Order',
        message:    `Order ${o.order_number} from ${o.client_name} is awaiting confirmation.`,
        created_at: o.created_at,
        link:       '/admin/orders',
        urgent:     false,
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
        id:         `payment_approval_${p.id}`,
        type:       'payment_approval',
        icon:       '💰',
        title:      'Payment Receipt Uploaded',
        message:    `${p.client_name} uploaded a payment receipt for order ${p.order_number}. Awaiting approval.`,
        created_at: p.receipt_uploaded_at,
        link:       '/admin/orders',
        urgent:     true,
      });
    });

    // 3. Open complaints
    const complaints = await pool.query(`
      SELECT id, subject, created_at
      FROM complaints
      WHERE status = 'open'
      ORDER BY created_at DESC
      LIMIT 5
    `).catch(() => ({ rows: [] }));
    complaints.rows.forEach(c => {
      notifications.push({
        id:         `complaint_${c.id}`,
        type:       'complaint',
        icon:       '⚠️',
        title:      'Open Complaint',
        message:    `Complaint "${c.subject}" is open and awaiting resolution.`,
        created_at: c.created_at,
        link:       '/admin/clients',
        urgent:     false,
      });
    });

    // 4. Stock added by manager or storekeeper in last 7 days
    const recentStock = await pool.query(`
      SELECT sm.id, sm.quantity, sm.created_at,
             p.name AS product_name,
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
        id:         `stock_added_${s.id}`,
        type:       'stock_added',
        icon:       '📦',
        title:      'Stock Added',
        message:    `${s.performed_by} (${s.role}) added ${s.quantity} units of ${s.product_name}.`,
        created_at: s.created_at,
        link:       '/admin/products',
        urgent:     false,
      });
    });

    // 5. Low stock alerts
    const lowStock = await pool.query(`
      SELECT p.name, p.quantity_in_stock, p.unit, b.name AS brand_name
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      WHERE p.quantity_in_stock <= p.minimum_threshold
        AND p.is_active = true
      ORDER BY p.quantity_in_stock ASC
      LIMIT 5
    `);
    if (lowStock.rows.length > 0) {
      notifications.push({
        id:         `low_stock_alert`,
        type:       'complaint',
        icon:       '🚨',
        title:      'Low Stock Alert',
        message:    `${lowStock.rows.length} product(s) running low: ${lowStock.rows.map(p => p.name).join(', ')}.`,
        created_at: new Date(),
        link:       '/admin/products',
        urgent:     true,
      });
    }

    // Sort by created_at descending
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ notifications, total: notifications.length });
  } catch (err) {
    console.error('Notifications error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAdminNotifications };
