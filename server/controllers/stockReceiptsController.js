const pool = require('../config/db');
const { uploadToCloudinary } = require('../config/cloudinary');

// ─── CREATE MULTI-PRODUCT STOCK RECEIPT ───────────────────────
const createStockReceipt = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { delivery_reference, delivery_date, general_notes, items } = req.body;

    // Parse items — sent as JSON string from FormData
    let parsedItems = [];
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    } catch {
      throw { status: 400, message: 'Invalid items data.' };
    }

    if (!parsedItems || parsedItems.length === 0) {
      throw { status: 400, message: 'At least one product line is required.' };
    }

    // Validate each item
    for (const item of parsedItems) {
      const total   = parseInt(item.total_received || 0);
      const defect  = parseInt(item.defective_quantity || 0);
      if (!item.product_id)  throw { status: 400, message: 'Each item must have a product selected.' };
      if (total <= 0)        throw { status: 400, message: 'Total received must be greater than 0 for each item.' };
      if (defect < 0)        throw { status: 400, message: 'Defective quantity cannot be negative.' };
      if (defect > total)    throw { status: 400, message: 'Defective quantity cannot exceed total received.' };
      if (defect > 0 && !item.defect_description) {
        throw { status: 400, message: `Please describe the defect for product ID ${item.product_id}.` };
      }
    }

    // Group uploaded files by item index and upload to Cloudinary
    // Files are uploaded as defect_images_0, defect_images_1, etc.
    const filesByIndex = {};
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(async (f) => {
        const match = f.fieldname.match(/defect_images_(\d+)/);
        if (match) {
          const idx = parseInt(match[1]);
          if (!filesByIndex[idx]) filesByIndex[idx] = [];
          const url = await uploadToCloudinary(f.buffer, f.originalname);
          filesByIndex[idx].push(url);
        }
      }));
    }

    // Create the receipt header
    const headerRes = await client.query(`
      INSERT INTO stock_receipt_headers
        (delivery_reference, delivery_date, general_notes, received_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      delivery_reference || null,
      delivery_date      || new Date().toISOString().split('T')[0],
      general_notes      || null,
      req.user.id,
    ]);

    const receiptId = headerRes.rows[0].id;

    // Process each product line
    const results = [];
    for (let i = 0; i < parsedItems.length; i++) {
      const item        = parsedItems[i];
      const totalRec    = parseInt(item.total_received);
      const defectQty   = parseInt(item.defective_quantity || 0);
      const acceptedQty = totalRec - defectQty;
      const images      = filesByIndex[i] || [];

      // Get current stock
      const productRes = await client.query(
        'SELECT id, name, quantity_in_stock FROM products WHERE id = $1',
        [item.product_id]
      );
      if (productRes.rows.length === 0) {
        throw { status: 404, message: `Product ID ${item.product_id} not found.` };
      }

      const product      = productRes.rows[0];
      const currentStock = product.quantity_in_stock;
      const newStock     = currentStock + acceptedQty;

      // Insert receipt item
      const itemRes = await client.query(`
        INSERT INTO stock_receipt_items
          (receipt_id, product_id, supplier_name, total_received,
           defective_quantity, accepted_quantity, defect_description,
           defect_images, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id
      `, [
        receiptId,
        item.product_id,
        item.supplier_name       || null,
        totalRec,
        defectQty,
        acceptedQty,
        item.defect_description  || null,
        images.length > 0 ? images : null,
        item.notes               || null,
      ]);

      const itemId = itemRes.rows[0].id;

      // Update product stock
      await client.query(
        'UPDATE products SET quantity_in_stock = $1, updated_at = NOW() WHERE id = $2',
        [newStock, item.product_id]
      );

      // Stock movement for accepted qty
      if (acceptedQty > 0) {
        await client.query(`
          INSERT INTO stock_movements
            (product_id, movement_type, quantity, quantity_before,
             quantity_after, note, performed_by, reference_id, reference_type)
          VALUES ($1,'stock_in',$2,$3,$4,$5,$6,$7,'stock_receipt')
        `, [
          item.product_id, acceptedQty, currentStock, newStock,
          `Receipt #${receiptId} — ${item.supplier_name || 'Unknown supplier'}`,
          req.user.id, receiptId,
        ]);
      }

      // Stock movement for defective qty
      if (defectQty > 0) {
        await client.query(`
          INSERT INTO stock_movements
            (product_id, movement_type, quantity, quantity_before,
             quantity_after, note, performed_by, reference_id, reference_type)
          VALUES ($1,'adjustment',$2,$3,$3,$4,$5,$6,'stock_receipt_defect')
        `, [
          item.product_id, defectQty, currentStock,
          `Defective items — receipt #${receiptId}: ${item.defect_description || ''}`,
          req.user.id, receiptId,
        ]);
      }

      results.push({
        product_name:      product.name,
        total_received:    totalRec,
        defective_quantity: defectQty,
        accepted_quantity: acceptedQty,
        new_stock:         newStock,
      });
    }

    // Audit log
    await client.query(`
      INSERT INTO audit_logs
        (user_id, user_name, action, table_name, record_id, new_values)
      VALUES ($1,$2,'STOCK_RECEIPT','stock_receipt_headers',$3,$4)
    `, [
      req.user.id, req.user.full_name, receiptId,
      JSON.stringify({ item_count: parsedItems.length, results })
    ]);

    await client.query('COMMIT');

    res.json({
      message:    `Receipt recorded. ${parsedItems.length} product(s) added to stock.`,
      receipt_id: receiptId,
      results,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('Stock receipt error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ─── GET ALL RECEIPTS ─────────────────────────────────────────
const getAllReceipts = async (req, res) => {
  try {
    const { from_date, to_date, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (from_date) {
      params.push(`${from_date} 00:00:00`);
      conditions.push(`h.created_at >= $${params.length}`);
    }
    if (to_date) {
      const end = new Date(to_date);
      end.setDate(end.getDate() + 1);
      params.push(`${end.toISOString().split('T')[0]} 00:00:00`);
      conditions.push(`h.created_at < $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataParams = [...params, parseInt(limit), offset];
    const result = await pool.query(`
      SELECT
        h.id,
        h.delivery_reference,
        h.delivery_date,
        h.general_notes,
        h.created_at,
        u.full_name AS received_by,
        COUNT(sri.id)            AS item_count,
        SUM(sri.total_received)  AS total_received,
        SUM(sri.defective_quantity) AS total_defective,
        SUM(sri.accepted_quantity)  AS total_accepted
      FROM stock_receipt_headers h
      JOIN users u ON h.received_by = u.id
      LEFT JOIN stock_receipt_items sri ON sri.receipt_id = h.id
      ${whereClause}
      GROUP BY h.id, h.delivery_reference, h.delivery_date,
               h.general_notes, h.created_at, u.full_name
      ORDER BY h.created_at DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `, dataParams);

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM stock_receipt_headers h ${whereClause}`,
      params
    );

    res.json({
      receipts:   result.rows,
      pagination: {
        total_records: parseInt(countResult.rows[0].total),
        current_page:  parseInt(page),
        total_pages:   Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit)),
        per_page:      parseInt(limit),
      }
    });

  } catch (err) {
    console.error('Get receipts error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET SINGLE RECEIPT WITH ALL ITEMS ───────────────────────
const getReceiptById = async (req, res) => {
  try {
    const { id } = req.params;

    const headerRes = await pool.query(`
      SELECT h.*, u.full_name AS received_by_name
      FROM stock_receipt_headers h
      JOIN users u ON h.received_by = u.id
      WHERE h.id = $1
    `, [id]);

    if (headerRes.rows.length === 0) {
      return res.status(404).json({ message: 'Receipt not found.' });
    }

    const itemsRes = await pool.query(`
      SELECT
        sri.*,
        p.name         AS product_name,
        p.size_variant,
        p.unit,
        b.name         AS brand_name,
        c.name         AS category_name
      FROM stock_receipt_items sri
      JOIN products p  ON sri.product_id  = p.id
      JOIN brands b    ON p.brand_id      = b.id
      JOIN categories c ON p.category_id = c.id
      WHERE sri.receipt_id = $1
      ORDER BY sri.id
    `, [id]);

    res.json({
      receipt: headerRes.rows[0],
      items:   itemsRes.rows,
    });

  } catch (err) {
    console.error('Get receipt error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DEFECT SUMMARY ───────────────────────────────────────────
const getDefectSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sri.id,
        p.name                      AS product_name,
        p.size_variant,
        p.unit,
        b.name                      AS brand_name,
        h.delivery_reference,
        h.delivery_date,
        sri.supplier_name,
        sri.total_received,
        sri.defective_quantity,
        sri.accepted_quantity,
        ROUND(
          sri.defective_quantity::numeric /
          NULLIF(sri.total_received, 0) * 100, 1
        ) AS defect_rate_pct
      FROM stock_receipt_items sri
      JOIN products p              ON sri.product_id = p.id
      JOIN brands b                ON p.brand_id     = b.id
      JOIN stock_receipt_headers h ON sri.receipt_id = h.id
      WHERE sri.defective_quantity > 0
      ORDER BY h.delivery_date DESC, sri.id DESC
    `);

    res.json({ summary: result.rows });
  } catch (err) {
    console.error('Defect summary error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};
module.exports = {
  createStockReceipt,
  getAllReceipts,
  getReceiptById,
  getDefectSummary,
};
