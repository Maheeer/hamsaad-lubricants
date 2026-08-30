const pool = require('../config/db');

const getStorekeeperNotifications = async (req, res) => {
  try {
    const notifications = [];

    // 1. Newly confirmed orders (storekeeper needs to release)
    const confirmedOrders = await pool.query(`
      SELECT o.id, o.order_number, o.confirmed_at, c.full_name AS client_name
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE o.status = 'confirmed'
      ORDER BY o.confirmed_at DESC
      LIMIT 10
    `);
    confirmedOrders.rows.forEach(o => {
      notifications.push({
        id:         `confirmed_order_${o.id}`,
        type:       'confirmed_order',
        title:      'Order Ready for Release',
        message:    `Order ${o.order_number} from ${o.client_name} has been confirmed. Ready for goods release.`,
        time:       o.confirmed_at,
        urgent:     true,
      });
    });

    // 2. Waybills approved by manager (order completed)
    const approvedWaybills = await pool.query(`
      SELECT o.id, o.order_number, w.approved_at, c.full_name AS client_name
      FROM waybills w
      JOIN orders o  ON w.order_id   = o.id
      JOIN clients c ON o.client_id  = c.id
      WHERE w.is_approved = true
        AND w.approved_at >= NOW() - INTERVAL '7 days'
      ORDER BY w.approved_at DESC
      LIMIT 5
    `);
    approvedWaybills.rows.forEach(w => {
      notifications.push({
        id:         `waybill_approved_${w.id}`,
        type:       'waybill_approved',
        title:      'Waybill Approved',
        message:    `Waybill for order ${w.order_number} (${w.client_name}) has been approved by the Manager.`,
        time:       w.approved_at,
        urgent:     false,
      });
    });

    // 3. Waybills rejected by manager (storekeeper needs to re-upload)
    const rejectedWaybills = await pool.query(`
      SELECT o.id, o.order_number, w.rejected_at, w.rejection_reason, c.full_name AS client_name
      FROM waybills w
      JOIN orders o  ON w.order_id   = o.id
      JOIN clients c ON o.client_id  = c.id
      WHERE w.rejection_reason IS NOT NULL
        AND w.signed_copy_url IS NULL
        AND o.status = 'released'
      ORDER BY w.rejected_at DESC
      LIMIT 5
    `);
    rejectedWaybills.rows.forEach(w => {
      notifications.push({
        id:         `waybill_rejected_${w.id}`,
        type:       'waybill_rejected',
        title:      'Waybill Rejected',
        message:    `Waybill for order ${w.order_number} was rejected. Reason: ${w.rejection_reason}`,
        time:       w.rejected_at,
        urgent:     true,
      });
    });

    // 4. Goods released in last 7 days (for storekeeper history)
    const releasedOrders = await pool.query(`
      SELECT o.id, o.order_number, o.released_at, c.full_name AS client_name
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE o.status IN ('released', 'completed')
        AND o.released_at >= NOW() - INTERVAL '7 days'
      ORDER BY o.released_at DESC
      LIMIT 5
    `);
    releasedOrders.rows.forEach(o => {
      notifications.push({
        id:         `goods_released_${o.id}`,
        type:       'goods_released',
        title:      'Goods Released',
        message:    `You released goods for order ${o.order_number} (${o.client_name}).`,
        time:       o.released_at,
        urgent:     false,
      });
    });

    // 5. Low stock alerts
    const lowStock = await pool.query(`
      SELECT p.name, p.quantity_in_stock, p.unit, p.minimum_threshold
      FROM products p
      WHERE p.quantity_in_stock <= p.minimum_threshold
        AND p.is_active = true
      ORDER BY p.quantity_in_stock ASC
      LIMIT 5
    `);
    if (lowStock.rows.length > 0) {
      notifications.push({
        id:         `low_stock_alert`,
        type:       'low_stock',
        title:      'Low Stock Alert',
        message:    `${lowStock.rows.length} product(s) are running low on stock: ${lowStock.rows.map(p => `${p.name} (${p.quantity_in_stock} ${p.unit})`).join(', ')}.`,
        time:       new Date(),
        urgent:     true,
      });
    }

    // Sort by time descending
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({ notifications, total: notifications.length });
  } catch (err) {
    console.error('Storekeeper notifications error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getStorekeeperNotifications };
