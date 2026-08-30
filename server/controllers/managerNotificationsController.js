const pool = require('../config/db');

const getManagerNotifications = async (req, res) => {
  try {
    const notifications = [];

    // 1. New paid orders awaiting manager confirmation
    const newPaidOrders = await pool.query(`
      SELECT o.id, o.order_number, o.created_at, c.full_name AS client_name
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      JOIN invoices i ON i.order_id = o.id
      WHERE o.status = 'created'
        AND COALESCE(i.payment_status, 'unpaid') = 'paid'
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    newPaidOrders.rows.forEach(o => {
      notifications.push({
        id:      `paid_order_${o.id}`,
        type:    'new_paid_order',
        title:   'New Paid Order',
        message: `Order ${o.order_number} from ${o.client_name} is paid and awaiting your confirmation.`,
        time:    o.created_at,
        urgent:  true,
      });
    });

    // 2. Signed waybills uploaded by storekeeper awaiting manager approval
    const signedWaybills = await pool.query(`
      SELECT o.id, o.order_number, w.updated_at, c.full_name AS client_name
      FROM orders o
      JOIN clients c  ON o.client_id  = c.id
      JOIN waybills w ON w.order_id   = o.id
      WHERE o.status = 'released'
        AND w.signed_copy_url IS NOT NULL
        AND (w.is_approved IS NULL OR w.is_approved = false)
      ORDER BY w.updated_at DESC
      LIMIT 10
    `);
    signedWaybills.rows.forEach(w => {
      notifications.push({
        id:      `signed_waybill_${w.id}`,
        type:    'signed_waybill',
        title:   'Signed Waybill Uploaded',
        message: `Storekeeper uploaded signed waybill for order ${w.order_number} (${w.client_name}). Ready for your approval.`,
        time:    w.updated_at,
        urgent:  true,
      });
    });

    // 3. Confirmed orders not yet acted on by storekeeper (scanned copy not uploaded)
    const pendingRelease = await pool.query(`
      SELECT o.id, o.order_number, o.updated_at, c.full_name AS client_name
      FROM orders o
      JOIN clients c  ON o.client_id = c.id
      JOIN waybills w ON w.order_id  = o.id
      WHERE o.status = 'confirmed'
        AND w.scanned_copy_url IS NULL
      ORDER BY o.updated_at DESC
      LIMIT 5
    `);
    pendingRelease.rows.forEach(o => {
      notifications.push({
        id:      `pending_release_${o.id}`,
        type:    'pending_release',
        title:   'Awaiting Waybill Upload',
        message: `Order ${o.order_number} (${o.client_name}) is confirmed. Upload scanned waybill to proceed.`,
        time:    o.updated_at,
        urgent:  false,
      });
    });

    // 4. Low stock alerts
    // 4. Low stock alerts
const lowStock = await pool.query(`
  SELECT p.name, p.quantity_in_stock, p.unit, b.name AS brand_name
  FROM products p
  JOIN brands b ON p.brand_id = b.id
  WHERE p.quantity_in_stock <= p.minimum_threshold AND p.is_active = true
  ORDER BY p.quantity_in_stock ASC
  LIMIT 5
`);
    if (lowStock.rows.length > 0) {
      notifications.push({
        id:      `low_stock_alert`,
        type:    'low_stock',
        title:   'Low Stock Alert',
        message: `${lowStock.rows.length} product(s) are running low on stock: ${lowStock.rows.map(p => p.name).join(', ')}.`,
        time:    new Date(),
        urgent:  false,
      });
    }

    // Sort by time descending
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({ notifications, total: notifications.length });
  } catch (err) {
    console.error('Manager notifications error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getManagerNotifications };
