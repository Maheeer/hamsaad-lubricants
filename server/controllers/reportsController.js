const pool = require('../config/db');

const formatNGN = (value) => {
  return parseFloat(value || 0).toFixed(2);
};

// ─── DAILY REPORT: OPENING STOCK (TAB 1) ─────────────────────
const getDailyOpeningStock = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required.' });

    // Use date string directly so PostgreSQL applies its own timezone correctly
    const startOfDay    = `${date} 00:00:00`;

    const productsResult = await pool.query(`
      SELECT
        p.id,
        p.name              AS product_name,
        p.size_variant,
        p.quantity_in_stock AS current_stock,
        p.unit,
        b.name              AS brand_name,
        c.name              AS category_name
      FROM products p
      LEFT JOIN brands b     ON p.brand_id     = b.id
      LEFT JOIN categories c ON p.category_id  = c.id
      WHERE p.is_active = true
      ORDER BY b.name, c.name, p.name
    `);

    const products = productsResult.rows;

    // Sales from selected date onwards
    const salesResult = await pool.query(`
      SELECT product_id, SUM(quantity) AS qty
      FROM stock_movements
      WHERE movement_type = 'stock_out'
        AND created_at >= $1
      GROUP BY product_id
    `, [startOfDay]);

    const salesMap = {};
    salesResult.rows.forEach(r => { salesMap[r.product_id] = parseInt(r.qty || 0); });

    // Stock-ins from selected date onwards
    const stockInResult = await pool.query(`
      SELECT product_id, SUM(quantity) AS qty
      FROM stock_movements
      WHERE movement_type = 'stock_in'
        AND created_at >= $1
      GROUP BY product_id
    `, [startOfDay]);

    const stockInMap = {};
    stockInResult.rows.forEach(r => { stockInMap[r.product_id] = parseInt(r.qty || 0); });

    // Opening Stock = Current Stock + Sales from date - Stock-ins from date
    const result = products.map(p => {
      const sold    = salesMap[p.id]   || 0;
      const stockIn = stockInMap[p.id] || 0;
      const opening = p.current_stock + sold - stockIn;
      return {
        id:            p.id,
        product_name:  p.product_name,
        size_variant:  p.size_variant,
        brand_name:    p.brand_name,
        category_name: p.category_name,
        unit:          p.unit,
        opening_stock: opening < 0 ? 0 : opening
      };
    });

    const grouped = {};
    result.forEach(item => {
      const brand = item.brand_name || 'Unknown Brand';
      if (!grouped[brand]) grouped[brand] = [];
      grouped[brand].push(item);
    });

    res.json({ date, grouped_by_brand: grouped, all_products: result });

  } catch (err) {
    console.error('Opening stock error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DAILY REPORT: SALES BY BRAND (TAB 2) ────────────────────
const getDailySalesByBrand = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required.' });

    const startOfDay     = `${date} 00:00:00`;
    const nextDate1      = new Date(date);
    nextDate1.setDate(nextDate1.getDate() + 1);
    const startOfNextDay = `${nextDate1.toISOString().split('T')[0]} 00:00:00`;

    const result = await pool.query(`
      SELECT
        b.name                          AS brand_name,
        SUM(oi.quantity)                AS total_qty_sold,
        SUM(oi.quantity * oi.unit_price) AS total_sales_value
      FROM order_items oi
      JOIN orders o      ON oi.order_id  = o.id
      JOIN products p    ON oi.product_id = p.id
      JOIN brands b      ON p.brand_id    = b.id
      WHERE o.status IN ('released', 'completed')
        AND o.released_at >= $1
        AND o.released_at <  $2
      GROUP BY b.name
      ORDER BY total_sales_value DESC
    `, [startOfDay, startOfNextDay]);

    const brands = result.rows;
    const overallTotalQty   = brands.reduce((s, b) => s + parseInt(b.total_qty_sold   || 0), 0);
    const overallTotalValue = brands.reduce((s, b) => s + parseFloat(b.total_sales_value || 0), 0);

    res.json({
      date,
      sales_by_brand: brands.map(b => ({
        brand_name:        b.brand_name,
        total_qty_sold:    parseInt(b.total_qty_sold   || 0),
        total_sales_value: formatNGN(b.total_sales_value)
      })),
      overall_total_qty:   overallTotalQty,
      overall_total_value: formatNGN(overallTotalValue)
    });

  } catch (err) {
    console.error('Sales by brand error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DAILY REPORT: SALES BY PRODUCT (TAB 3) ──────────────────
const getDailySalesByProduct = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required.' });

    const startOfDay     = `${date} 00:00:00`;
    const nextDate2      = new Date(date);
    nextDate2.setDate(nextDate2.getDate() + 1);
    const startOfNextDay = `${nextDate2.toISOString().split('T')[0]} 00:00:00`;

    const result = await pool.query(`
      SELECT
        b.name                           AS brand_name,
        c.name                           AS category_name,
        p.name                           AS product_name,
        p.size_variant,
        p.unit,
        oi.unit_price,
        SUM(oi.quantity)                 AS total_qty_sold,
        SUM(oi.quantity * oi.unit_price) AS total_sales_value
      FROM order_items oi
      JOIN orders o      ON oi.order_id   = o.id
      JOIN products p    ON oi.product_id = p.id
      JOIN brands b      ON p.brand_id    = b.id
      JOIN categories c  ON p.category_id = c.id
      WHERE o.status IN ('released', 'completed')
        AND o.released_at >= $1
        AND o.released_at <  $2
      GROUP BY b.name, c.name, p.name, p.size_variant, p.unit, oi.unit_price
      ORDER BY b.name, c.name, p.name
    `, [startOfDay, startOfNextDay]);

    const rows = result.rows;
    const grandTotalQty   = rows.reduce((s, r) => s + parseInt(r.total_qty_sold   || 0), 0);
    const grandTotalValue = rows.reduce((s, r) => s + parseFloat(r.total_sales_value || 0), 0);

    res.json({
      date,
      sales_by_product: rows.map(r => ({
        brand_name:        r.brand_name,
        category_name:     r.category_name,
        product_name:      r.product_name,
        size_variant:      r.size_variant,
        unit:              r.unit,
        unit_price:        formatNGN(r.unit_price),
        total_qty_sold:    parseInt(r.total_qty_sold   || 0),
        total_sales_value: formatNGN(r.total_sales_value)
      })),
      grand_total_qty:   grandTotalQty,
      grand_total_value: formatNGN(grandTotalValue)
    });

  } catch (err) {
    console.error('Sales by product error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DAILY REPORT: CLOSING STOCK (TAB 4) ─────────────────────
const getDailyClosingStock = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required.' });

    // Add 1 day to date string directly
    const nextDate       = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr    = nextDate.toISOString().split('T')[0];
    const startOfNextDay = `${nextDateStr} 00:00:00`;

    const productsResult = await pool.query(`
      SELECT
        p.id,
        p.name              AS product_name,
        p.size_variant,
        p.quantity_in_stock AS current_stock,
        p.unit,
        b.name              AS brand_name,
        c.name              AS category_name
      FROM products p
      LEFT JOIN brands b     ON p.brand_id    = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY b.name, c.name, p.name
    `);

    const products = productsResult.rows;

    // Sales AFTER selected day (i.e. from start of next day onwards)
    const salesAfterResult = await pool.query(`
      SELECT product_id, SUM(quantity) AS qty
      FROM stock_movements
      WHERE movement_type = 'stock_out'
        AND created_at >= $1
      GROUP BY product_id
    `, [startOfNextDay]);

    const salesAfterMap = {};
    salesAfterResult.rows.forEach(r => { salesAfterMap[r.product_id] = parseInt(r.qty || 0); });

    // Stock-ins AFTER selected day
    const stockInAfterResult = await pool.query(`
      SELECT product_id, SUM(quantity) AS qty
      FROM stock_movements
      WHERE movement_type = 'stock_in'
        AND created_at >= $1
      GROUP BY product_id
    `, [startOfNextDay]);

    const stockInAfterMap = {};
    stockInAfterResult.rows.forEach(r => { stockInAfterMap[r.product_id] = parseInt(r.qty || 0); });

    // Closing Stock = Current Stock + Sales after day - Stock-ins after day
    const result = products.map(p => {
      const soldAfter    = salesAfterMap[p.id]   || 0;
      const stockInAfter = stockInAfterMap[p.id] || 0;
      const closing      = p.current_stock + soldAfter - stockInAfter;
      return {
        id:            p.id,
        product_name:  p.product_name,
        size_variant:  p.size_variant,
        brand_name:    p.brand_name,
        category_name: p.category_name,
        unit:          p.unit,
        closing_stock: closing < 0 ? 0 : closing
      };
    });

    const grouped = {};
    result.forEach(item => {
      const brand = item.brand_name || 'Unknown Brand';
      if (!grouped[brand]) grouped[brand] = [];
      grouped[brand].push(item);
    });

    res.json({ date, grouped_by_brand: grouped, all_products: result });

  } catch (err) {
    console.error('Closing stock error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── FULL REPORT BREAKDOWN ────────────────────────────────────
const getFullSalesReport = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      brand_id,
      category_id,
      product_id,
      page  = 1,
      limit = 50
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [`o.status IN ('released', 'completed')`];

    if (start_date) {
      params.push(`${start_date} 00:00:00`);
      conditions.push(`o.released_at >= $${params.length}`);
    }
    if (end_date) {
      const endNext = new Date(end_date);
      endNext.setDate(endNext.getDate() + 1);
      const endNextStr = endNext.toISOString().split('T')[0];
      params.push(`${endNextStr} 00:00:00`);
      conditions.push(`o.released_at < $${params.length}`);
    }
    if (brand_id) {
      params.push(brand_id);
      conditions.push(`b.id = $${params.length}`);
    }
    if (category_id) {
      params.push(category_id);
      conditions.push(`c.id = $${params.length}`);
    }
    if (product_id) {
      params.push(product_id);
      conditions.push(`p.id = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const baseJoins = `
      FROM order_items oi
      JOIN orders o      ON oi.order_id   = o.id
      JOIN clients cl    ON o.client_id   = cl.id
      JOIN products p    ON oi.product_id = p.id
      JOIN brands b      ON p.brand_id    = b.id
      JOIN categories c  ON p.category_id = c.id
      LEFT JOIN invoices inv ON inv.order_id = o.id
    `;

    // Main data query
    const dataParams = [...params, parseInt(limit), offset];
    const dataResult = await pool.query(`
      SELECT
        o.order_number,
        o.released_at        AS sale_date,
        cl.full_name         AS client_name,
        b.name               AS brand_name,
        c.name               AS category_name,
        p.name               AS product_name,
        p.size_variant,
        p.unit,
        oi.quantity          AS qty_sold,
        oi.unit_price,
        (oi.quantity * oi.unit_price) AS line_total,
        inv.payment_status
      ${baseJoins}
      ${whereClause}
      ORDER BY o.released_at DESC, o.order_number
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `, dataParams);

    // Count query
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total ${baseJoins} ${whereClause}`,
      params
    );
    const totalRecords = parseInt(countResult.rows[0].total);

    // Summary totals
    const summaryResult = await pool.query(`
      SELECT
        SUM(oi.quantity)                 AS total_qty,
        SUM(oi.quantity * oi.unit_price) AS total_value
      ${baseJoins}
      ${whereClause}
    `, params);
    const summary = summaryResult.rows[0];

    res.json({
      records: dataResult.rows.map(r => ({
        order_number:   r.order_number,
        sale_date:      r.sale_date,
        client_name:    r.client_name,
        brand_name:     r.brand_name,
        category_name:  r.category_name,
        product_name:   r.product_name,
        size_variant:   r.size_variant,
        unit:           r.unit,
        qty_sold:       parseInt(r.qty_sold   || 0),
        unit_price:     formatNGN(r.unit_price),
        line_total:     formatNGN(r.line_total),
        payment_status: r.payment_status || 'pending'
      })),
      pagination: {
        total_records: totalRecords,
        current_page:  parseInt(page),
        total_pages:   Math.ceil(totalRecords / parseInt(limit)),
        per_page:      parseInt(limit)
      },
      summary: {
        total_qty:   parseInt(summary.total_qty   || 0),
        total_value: formatNGN(summary.total_value)
      }
    });

  } catch (err) {
    console.error('Full report error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── FILTER OPTIONS ───────────────────────────────────────────
const getReportFilters = async (req, res) => {
  try {
    const brands = await pool.query(
      `SELECT id, name AS brand_name FROM brands WHERE is_active = true ORDER BY name`
    );
    const categories = await pool.query(
      `SELECT id, name AS category_name FROM categories WHERE is_active = true ORDER BY name`
    );
    const products = await pool.query(`
      SELECT p.id, p.name AS product_name, b.name AS brand_name, c.name AS category_name
      FROM products p
      LEFT JOIN brands b     ON p.brand_id    = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY b.name, p.name
    `);

    res.json({
      brands:     brands.rows,
      categories: categories.rows,
      products:   products.rows
    });
  } catch (err) {
    console.error('Report filters error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DAILY STOCK MOVEMENT SUMMARY (TAB 5) ────────────────────
// Combines opening stock, stock-ins, sales out, and closing stock
// for each product on a selected date in one table
const getDailyStockSummary = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required.' });

    const startOfDay     = `${date} 00:00:00`;
    const nextDate       = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const startOfNextDay = `${nextDate.toISOString().split('T')[0]} 00:00:00`;

    // 1. Get all active products
    const productsResult = await pool.query(`
      SELECT
        p.id,
        p.name              AS product_name,
        p.size_variant,
        p.quantity_in_stock AS current_stock,
        p.unit,
        b.name              AS brand_name,
        c.name              AS category_name
      FROM products p
      LEFT JOIN brands b     ON p.brand_id    = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY b.name, c.name, p.name
    `);
    const products = productsResult.rows;

    // 2. Sales from selected date onwards (for opening stock calc)
    const salesFromResult = await pool.query(`
      SELECT product_id, SUM(quantity) AS qty
      FROM stock_movements
      WHERE movement_type = 'stock_out' AND created_at >= $1
      GROUP BY product_id
    `, [startOfDay]);
    const salesFromMap = {};
    salesFromResult.rows.forEach(r => { salesFromMap[r.product_id] = parseInt(r.qty || 0); });

    // 3. Stock-ins from selected date onwards (for opening stock calc)
    const stockInFromResult = await pool.query(`
      SELECT product_id, SUM(quantity) AS qty
      FROM stock_movements
      WHERE movement_type = 'stock_in' AND created_at >= $1
      GROUP BY product_id
    `, [startOfDay]);
    const stockInFromMap = {};
    stockInFromResult.rows.forEach(r => { stockInFromMap[r.product_id] = parseInt(r.qty || 0); });

    // 4. Sales on selected date only (between start and end of day)
    const salesOnDayResult = await pool.query(`
      SELECT product_id, SUM(quantity) AS qty
      FROM stock_movements
      WHERE movement_type = 'stock_out'
        AND created_at >= $1
        AND created_at <  $2
      GROUP BY product_id
    `, [startOfDay, startOfNextDay]);
    const salesOnDayMap = {};
    salesOnDayResult.rows.forEach(r => { salesOnDayMap[r.product_id] = parseInt(r.qty || 0); });

    // 5. Stock-ins on selected date only
    const stockInOnDayResult = await pool.query(`
      SELECT product_id, SUM(quantity) AS qty
      FROM stock_movements
      WHERE movement_type = 'stock_in'
        AND created_at >= $1
        AND created_at <  $2
      GROUP BY product_id
    `, [startOfDay, startOfNextDay]);
    const stockInOnDayMap = {};
    stockInOnDayResult.rows.forEach(r => { stockInOnDayMap[r.product_id] = parseInt(r.qty || 0); });

    // 6. Sales after selected day (for closing stock calc)
    const salesAfterResult = await pool.query(`
      SELECT product_id, SUM(quantity) AS qty
      FROM stock_movements
      WHERE movement_type = 'stock_out' AND created_at >= $1
      GROUP BY product_id
    `, [startOfNextDay]);
    const salesAfterMap = {};
    salesAfterResult.rows.forEach(r => { salesAfterMap[r.product_id] = parseInt(r.qty || 0); });

    // 7. Stock-ins after selected day (for closing stock calc)
    const stockInAfterResult = await pool.query(`
      SELECT product_id, SUM(quantity) AS qty
      FROM stock_movements
      WHERE movement_type = 'stock_in' AND created_at >= $1
      GROUP BY product_id
    `, [startOfNextDay]);
    const stockInAfterMap = {};
    stockInAfterResult.rows.forEach(r => { stockInAfterMap[r.product_id] = parseInt(r.qty || 0); });

    // 8. Build summary for each product
    const result = products.map(p => {
      const salesFrom   = salesFromMap[p.id]    || 0;
      const stockInFrom = stockInFromMap[p.id]  || 0;
      const salesAfter  = salesAfterMap[p.id]   || 0;
      const stockInAfter = stockInAfterMap[p.id] || 0;

      // Opening = Current + all sales from day - all stockins from day
      const openingStock = Math.max(0, p.current_stock + salesFrom - stockInFrom);

      // Closing = Current + sales after day - stockins after day
      const closingStock = Math.max(0, p.current_stock + salesAfter - stockInAfter);

      // Actual movements on the day
      const salesOut  = salesOnDayMap[p.id]   || 0;
      const stockIn   = stockInOnDayMap[p.id] || 0;

      // Expected closing = opening - sales + stock-ins
      const expectedClosing = openingStock - salesOut + stockIn;

      // Variance: difference between expected and actual closing
      const variance = closingStock - expectedClosing;

      // Net change = closing - opening
      const netChange = closingStock - openingStock;

      return {
        id:               p.id,
        brand_name:       p.brand_name,
        category_name:    p.category_name,
        product_name:     p.product_name,
        size_variant:     p.size_variant,
        unit:             p.unit,
        opening_stock:    openingStock,
        stock_in:         stockIn,
        sales_out:        salesOut,
        closing_stock:    closingStock,
        expected_closing: expectedClosing,
        net_change:       netChange,
        variance:         variance,
        has_variance:     variance !== 0
      };
    });

    // Group by brand
    const grouped = {};
    result.forEach(item => {
      const brand = item.brand_name || 'Unknown Brand';
      if (!grouped[brand]) grouped[brand] = [];
      grouped[brand].push(item);
    });

    // Overall totals
    const totals = {
      opening_stock: result.reduce((s, r) => s + r.opening_stock, 0),
      stock_in:      result.reduce((s, r) => s + r.stock_in,      0),
      sales_out:     result.reduce((s, r) => s + r.sales_out,     0),
      closing_stock: result.reduce((s, r) => s + r.closing_stock, 0),
      net_change:    result.reduce((s, r) => s + r.net_change,    0),
    };

    res.json({ date, grouped_by_brand: grouped, all_products: result, totals });

  } catch (err) {
    console.error('Stock summary error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getDailyOpeningStock,
  getDailySalesByBrand,
  getDailySalesByProduct,
  getDailyClosingStock,
  getDailyStockSummary,
  getFullSalesReport,
  getReportFilters
};
