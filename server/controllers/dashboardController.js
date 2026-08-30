const pool = require('../config/db');

// Low stock is determined by the minimum_threshold column on each product.

// ─── GET DASHBOARD STATS ──────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const today     = new Date();
    const todayStr  = today.toISOString().split('T')[0];
    const startOfToday    = `${todayStr} 00:00:00`;
    const startOfTomorrow = (() => {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      return `${d.toISOString().split('T')[0]} 00:00:00`;
    })();

    // 1. Today's sales value (released/completed orders released today)
    const todaySalesResult = await pool.query(`
      SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('released', 'completed')
        AND o.released_at >= $1
        AND o.released_at <  $2
    `, [startOfToday, startOfTomorrow]);
    const todaySales = parseFloat(todaySalesResult.rows[0].total || 0);

    // 2. Today's order count
    const todayOrdersResult = await pool.query(`
      SELECT COUNT(*) AS total
      FROM orders
      WHERE created_at >= $1 AND created_at < $2
    `, [startOfToday, startOfTomorrow]);
    const todayOrders = parseInt(todayOrdersResult.rows[0].total || 0);

    // 3. Pending orders (created + confirmed)
    const pendingResult = await pool.query(`
      SELECT COUNT(*) AS total
      FROM orders
      WHERE status IN ('created', 'confirmed')
    `);
    const pendingOrders = parseInt(pendingResult.rows[0].total || 0);

    // 4. Total stock value (current qty * selling price)
    const stockValueResult = await pool.query(`
      SELECT COALESCE(SUM(quantity_in_stock * selling_price), 0) AS total
      FROM products
      WHERE is_active = true
    `);
    const totalStockValue = parseFloat(stockValueResult.rows[0].total || 0);

    // 5. Active clients
    const clientsResult = await pool.query(`
      SELECT COUNT(*) AS total FROM clients WHERE is_active = true
    `);
    const activeClients = parseInt(clientsResult.rows[0].total || 0);

    // 6. Total active products
    const productsResult = await pool.query(`
      SELECT COUNT(*) AS total FROM products WHERE is_active = true
    `);
    const totalProducts = parseInt(productsResult.rows[0].total || 0);

    // 7. Low stock count using minimum_threshold column
    const lowStockCountResult = await pool.query(`
      SELECT COUNT(*) AS total
      FROM products
      WHERE is_active = true
        AND quantity_in_stock <= minimum_threshold
    `);
    const lowStockCount = parseInt(lowStockCountResult.rows[0].total || 0);

    // 8. Outstanding payments (unpaid + part_paid invoices)
    const outstandingResult = await pool.query(`
      SELECT
        COUNT(*) AS invoice_count,
        COALESCE(SUM(i.total_amount - COALESCE(i.amount_paid, 0)), 0) AS outstanding_amount
      FROM invoices i
      WHERE i.payment_status IN ('unpaid', 'part_paid')
    `);
    const outstanding = outstandingResult.rows[0];

    res.json({
      today_sales:        todaySales,
      today_orders:       todayOrders,
      pending_orders:     pendingOrders,
      total_stock_value:  totalStockValue,
      active_clients:     activeClients,
      total_products:     totalProducts,
      low_stock_count:    lowStockCount,
      outstanding_invoices: parseInt(outstanding.invoice_count || 0),
      outstanding_amount:   parseFloat(outstanding.outstanding_amount || 0)
    });

  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── 7-DAY SALES TREND ────────────────────────────────────────
const getSalesTrend = async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const results = await Promise.all(days.map(async (day) => {
      const startOfDay     = `${day} 00:00:00`;
      const nextDay        = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const startOfNextDay = `${nextDay.toISOString().split('T')[0]} 00:00:00`;

      const r = await pool.query(`
        SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('released', 'completed')
          AND o.released_at >= $1
          AND o.released_at <  $2
      `, [startOfDay, startOfNextDay]);

      const orderCount = await pool.query(`
        SELECT COUNT(*) AS total
        FROM orders
        WHERE released_at >= $1 AND released_at < $2
          AND status IN ('released', 'completed')
      `, [startOfDay, startOfNextDay]);

      return {
        date:        day,
        label:       new Date(day).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }),
        sales_value: parseFloat(r.rows[0].total || 0),
        order_count: parseInt(orderCount.rows[0].total || 0)
      };
    }));

    res.json({ trend: results });

  } catch (err) {
    console.error('Sales trend error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── LOW STOCK PRODUCTS ───────────────────────────────────────
const getDashboardLowStock = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.size_variant,
        p.unit,
        p.quantity_in_stock,
        p.minimum_threshold AS threshold,
        b.name AS brand_name,
        c.name AS category_name
      FROM products p
      LEFT JOIN brands b     ON p.brand_id    = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
        AND p.quantity_in_stock <= p.minimum_threshold
      ORDER BY p.quantity_in_stock ASC
    `);

    res.json({
      count:    result.rows.length,
      products: result.rows.map(p => ({ ...p, is_low_stock: true }))
    });

  } catch (err) {
    console.error('Low stock error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── RECENT ORDERS ────────────────────────────────────────────
const getRecentOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.created_at,
        o.released_at,
        cl.full_name   AS client_name,
        inv.total_amount,
        inv.payment_status
      FROM orders o
      JOIN clients cl    ON o.client_id  = cl.id
      LEFT JOIN invoices inv ON inv.order_id = o.id
      ORDER BY o.created_at DESC
      LIMIT 8
    `);

    res.json({ orders: result.rows });

  } catch (err) {
    console.error('Recent orders error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── PAYMENT STATUS SUMMARY ───────────────────────────────────
const getPaymentSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        payment_status,
        COUNT(*)                           AS invoice_count,
        COALESCE(SUM(total_amount), 0)     AS total_amount,
        COALESCE(SUM(amount_paid), 0)      AS amount_paid,
        COALESCE(SUM(total_amount - COALESCE(amount_paid, 0)), 0) AS amount_outstanding
      FROM invoices
      GROUP BY payment_status
    `);

    const summary = { paid: null, part_paid: null, unpaid: null };
    result.rows.forEach(r => {
      summary[r.payment_status] = {
        count:               parseInt(r.invoice_count || 0),
        total_amount:        parseFloat(r.total_amount || 0),
        amount_paid:         parseFloat(r.amount_paid || 0),
        amount_outstanding:  parseFloat(r.amount_outstanding || 0)
      };
    });

    // Ensure all keys exist
    ['paid', 'part_paid', 'unpaid'].forEach(k => {
      if (!summary[k]) summary[k] = { count: 0, total_amount: 0, amount_paid: 0, amount_outstanding: 0 };
    });

    res.json({ summary });

  } catch (err) {
    console.error('Payment summary error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── TOP SELLING PRODUCTS (this month) ───────────────────────
const getTopProducts = async (req, res) => {
  try {
    const now           = new Date();
    const startOfMonth  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01 00:00:00`;

    const result = await pool.query(`
      SELECT
        p.name          AS product_name,
        p.size_variant,
        p.unit,
        b.name          AS brand_name,
        c.name          AS category_name,
        SUM(oi.quantity)                  AS total_qty,
        SUM(oi.quantity * oi.unit_price)  AS total_value
      FROM order_items oi
      JOIN orders o      ON oi.order_id   = o.id
      JOIN products p    ON oi.product_id = p.id
      JOIN brands b      ON p.brand_id    = b.id
      JOIN categories c  ON p.category_id = c.id
      WHERE o.status IN ('released', 'completed')
        AND o.released_at >= $1
      GROUP BY p.name, p.size_variant, p.unit, b.name, c.name
      ORDER BY total_qty DESC
      LIMIT 5
    `, [startOfMonth]);

    res.json({ products: result.rows });

  } catch (err) {
    console.error('Top products error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getDashboardStats,
  getSalesTrend,
  getDashboardLowStock,
  getRecentOrders,
  getPaymentSummary,
  getTopProducts
};
