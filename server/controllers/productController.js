const pool = require('../config/db');

// ─── GET ALL BRANDS ──────────────────────────────────────────
const getAllBrands = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.full_name AS created_by_name,
              COUNT(p.id) AS product_count
       FROM brands b
       LEFT JOIN users u ON b.created_by = u.id
       LEFT JOIN products p ON p.brand_id = b.id
       GROUP BY b.id, u.full_name
       ORDER BY b.name`
    );
    res.status(200).json({ brands: result.rows });
  } catch (err) {
    console.error('Get brands error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CREATE BRAND ────────────────────────────────────────────
const createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Brand name is required.' });
    }
    const existing = await pool.query(
      'SELECT id FROM brands WHERE LOWER(name) = LOWER($1)', [name]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Brand already exists.' });
    }
    const result = await pool.query(
      `INSERT INTO brands (name, description, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description || null, req.user.id]
    );
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, req.user.full_name, 'CREATE_BRAND', 'brands',
       result.rows[0].id, JSON.stringify({ name })]
    );
    res.status(201).json({ message: 'Brand created successfully.', brand: result.rows[0] });
  } catch (err) {
    console.error('Create brand error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── UPDATE BRAND ─────────────────────────────────────────────
const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    const existing = await pool.query('SELECT * FROM brands WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Brand not found.' });
    }
    const old = existing.rows[0];
    const result = await pool.query(
      `UPDATE brands SET name = $1, description = $2, is_active = $3
       WHERE id = $4 RETURNING *`,
      [
        name !== undefined ? name : old.name,
        description !== undefined ? description : old.description,
        is_active !== undefined ? is_active : old.is_active,
        id
      ]
    );
    res.json({ message: 'Brand updated.', brand: result.rows[0] });
  } catch (err) {
    console.error('Update brand error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DELETE BRAND ─────────────────────────────────────────────
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await pool.query(
      'SELECT COUNT(*) FROM products WHERE brand_id = $1', [id]
    );
    if (parseInt(products.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete brand with existing products. Archive it instead.'
      });
    }
    await pool.query('DELETE FROM brands WHERE id = $1', [id]);
    res.json({ message: 'Brand deleted successfully.' });
  } catch (err) {
    console.error('Delete brand error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET ALL CATEGORIES ──────────────────────────────────────
const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.full_name AS created_by_name,
              COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id, u.full_name
       ORDER BY c.name`
    );
    res.status(200).json({ categories: result.rows });
  } catch (err) {
    console.error('Get categories error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CREATE CATEGORY ─────────────────────────────────────────
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }
    const existing = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Category already exists.' });
    }
    const result = await pool.query(
      `INSERT INTO categories (name, description, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description || null, req.user.id]
    );
    res.status(201).json({ message: 'Category created successfully.', category: result.rows[0] });
  } catch (err) {
    console.error('Create category error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── UPDATE CATEGORY ──────────────────────────────────────────
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    const existing = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    const old = existing.rows[0];
    const result = await pool.query(
      `UPDATE categories SET name = $1, description = $2, is_active = $3
       WHERE id = $4 RETURNING *`,
      [
        name !== undefined ? name : old.name,
        description !== undefined ? description : old.description,
        is_active !== undefined ? is_active : old.is_active,
        id
      ]
    );
    res.json({ message: 'Category updated.', category: result.rows[0] });
  } catch (err) {
    console.error('Update category error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DELETE CATEGORY ──────────────────────────────────────────
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await pool.query(
      'SELECT COUNT(*) FROM products WHERE category_id = $1', [id]
    );
    if (parseInt(products.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete category with existing products. Archive it instead.'
      });
    }
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET ALL PRODUCTS ────────────────────────────────────────
const getAllProducts = async (req, res) => {
  try {
    const { brand_id, category_id, low_stock, include_archived } = req.query;

    let query = `
      SELECT p.*,
             b.name AS brand_name,
             c.name AS category_name,
             u.full_name AS created_by_name,
             CASE WHEN p.quantity_in_stock <= p.minimum_threshold
                  THEN true ELSE false END AS is_low_stock,
             CASE WHEN (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) = 0
                  THEN true ELSE false END AS can_delete
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;

    const params = [];

    if (include_archived !== 'true') {
      query += ` AND p.is_active = true`;
    }

    if (brand_id) {
      params.push(brand_id);
      query += ` AND p.brand_id = $${params.length}`;
    }

    if (category_id) {
      params.push(category_id);
      query += ` AND p.category_id = $${params.length}`;
    }

    if (low_stock === 'true') {
      query += ` AND p.quantity_in_stock <= p.minimum_threshold`;
    }

    query += ` ORDER BY b.name, c.name, p.name`;

    const result = await pool.query(query, params);
    res.status(200).json({ products: result.rows });
  } catch (err) {
    console.error('Get products error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET SINGLE PRODUCT ──────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*,
              b.name AS brand_name,
              c.name AS category_name,
              u.full_name AS created_by_name
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json({ product: result.rows[0] });
  } catch (err) {
    console.error('Get product error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CREATE PRODUCT ──────────────────────────────────────────
const createProduct = async (req, res) => {
  try {
    const {
      name, brand_id, category_id, size_variant,
      unit, cost_price, selling_price,
      quantity_in_stock, minimum_threshold, description
    } = req.body;

    if (!name || !brand_id || !category_id || !size_variant || !unit) {
      return res.status(400).json({
        message: 'Name, brand, category, size variant and unit are required.'
      });
    }

    const brand = await pool.query('SELECT id FROM brands WHERE id = $1', [brand_id]);
    if (brand.rows.length === 0) {
      return res.status(404).json({ message: 'Brand not found.' });
    }

    const category = await pool.query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (category.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const result = await pool.query(
      `INSERT INTO products
         (name, brand_id, category_id, size_variant, unit,
          cost_price, selling_price, quantity_in_stock,
          minimum_threshold, description, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [name, brand_id, category_id, size_variant, unit,
       cost_price || 0, selling_price || 0,
       quantity_in_stock || 0, minimum_threshold || 5,
       description || null, req.user.id]
    );

    const newProduct = result.rows[0];

    if (quantity_in_stock > 0) {
      await pool.query(
        `INSERT INTO stock_movements
           (product_id, movement_type, quantity, quantity_before,
            quantity_after, note, performed_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newProduct.id, 'stock_in', quantity_in_stock, 0,
         quantity_in_stock, 'Initial stock entry', req.user.id]
      );
    }

    await pool.query(
      `INSERT INTO audit_logs
         (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'CREATE_PRODUCT', 'products',
       newProduct.id, JSON.stringify({ name, brand_id, category_id, quantity_in_stock })]
    );

    res.status(201).json({ message: 'Product created successfully.', product: newProduct });
  } catch (err) {
    console.error('Create product error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── UPDATE PRODUCT ──────────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, brand_id, category_id, size_variant,
      unit, cost_price, selling_price,
      minimum_threshold, description, is_active
    } = req.body;

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const old = existing.rows[0];

    const result = await pool.query(
      `UPDATE products SET
         name = $1, brand_id = $2, category_id = $3,
         size_variant = $4, unit = $5, cost_price = $6,
         selling_price = $7, minimum_threshold = $8,
         description = $9, is_active = $10, updated_at = NOW()
       WHERE id = $11 RETURNING *`,
      [
        name !== undefined ? name : old.name,
        brand_id !== undefined ? brand_id : old.brand_id,
        category_id !== undefined ? category_id : old.category_id,
        size_variant !== undefined ? size_variant : old.size_variant,
        unit !== undefined ? unit : old.unit,
        cost_price !== undefined ? cost_price : old.cost_price,
        selling_price !== undefined ? selling_price : old.selling_price,
        minimum_threshold !== undefined ? minimum_threshold : old.minimum_threshold,
        description !== undefined ? description : old.description,
        is_active !== undefined ? is_active : old.is_active,
        id
      ]
    );

    await pool.query(
      `INSERT INTO audit_logs
         (user_id, user_name, action, table_name, record_id, old_values, new_values)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [req.user.id, req.user.full_name, 'UPDATE_PRODUCT', 'products',
       id, JSON.stringify(old), JSON.stringify(result.rows[0])]
    );

    res.status(200).json({ message: 'Product updated successfully.', product: result.rows[0] });
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── ADD STOCK ───────────────────────────────────────────────
const addStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, note, confirmed_by } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero.' });
    }

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = existing.rows[0];
    const quantityBefore = product.quantity_in_stock;
    const quantityAfter = quantityBefore + parseInt(quantity);

    await pool.query(
      `UPDATE products SET quantity_in_stock = $1, updated_at = NOW() WHERE id = $2`,
      [quantityAfter, id]
    );

    await pool.query(
      `INSERT INTO stock_movements
         (product_id, movement_type, quantity, quantity_before,
          quantity_after, note, performed_by, confirmed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, 'stock_in', quantity, quantityBefore,
       quantityAfter, note || 'Stock addition',
       req.user.id, confirmed_by || null]
    );

    await pool.query(
      `INSERT INTO audit_logs
         (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'ADD_STOCK', 'products',
       id, JSON.stringify({ quantity, quantityBefore, quantityAfter, productName: product.name, unit: product.unit })]
    );

    res.status(200).json({
      message: `Stock updated. ${quantity} units added.`,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter
    });
  } catch (err) {
    console.error('Add stock error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── REDUCE STOCK ─────────────────────────────────────────────
const reduceStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero.' });
    }
    if (!reason) {
      return res.status(400).json({ message: 'Reason is required.' });
    }

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = existing.rows[0];
    if (parseInt(quantity) > product.quantity_in_stock) {
      return res.status(400).json({
        message: `Cannot reduce by ${quantity}. Current stock is only ${product.quantity_in_stock}.`
      });
    }

    const quantityBefore = product.quantity_in_stock;
    const quantityAfter = quantityBefore - parseInt(quantity);

    await pool.query(
      `UPDATE products SET quantity_in_stock = $1, updated_at = NOW() WHERE id = $2`,
      [quantityAfter, id]
    );

    await pool.query(
      `INSERT INTO stock_movements
         (product_id, movement_type, quantity, quantity_before,
          quantity_after, note, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, 'adjustment', quantity, quantityBefore, quantityAfter, reason, req.user.id]
    );

    await pool.query(
      `INSERT INTO audit_logs
         (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'REDUCE_STOCK', 'products',
       id, JSON.stringify({ quantity, reason, quantityBefore, quantityAfter })]
    );

    res.status(200).json({
      message: `Stock reduced by ${quantity} units. Reason: ${reason}`,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter
    });
  } catch (err) {
    console.error('Reduce stock error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DELETE PRODUCT ───────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const orderItems = await pool.query(
      'SELECT COUNT(*) FROM order_items WHERE product_id = $1', [id]
    );
    if (parseInt(orderItems.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete product that has been used in orders. Archive it instead.'
      });
    }

    await pool.query('DELETE FROM stock_movements WHERE product_id = $1', [id]);
    await pool.query('DELETE FROM products WHERE id = $1', [id]);

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET STOCK MOVEMENTS ─────────────────────────────────────
const getStockMovements = async (req, res) => {
  try {
    const { product_id, movement_type, from_date, to_date } = req.query;

    let query = `
      SELECT sm.*,
             p.name AS product_name,
             b.name AS brand_name,
             p.size_variant,
             u1.full_name AS performed_by_name,
             u2.full_name AS confirmed_by_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN users u1 ON sm.performed_by = u1.id
      LEFT JOIN users u2 ON sm.confirmed_by = u2.id
      WHERE 1=1
    `;

    const params = [];

    if (product_id) {
      params.push(product_id);
      query += ` AND sm.product_id = $${params.length}`;
    }
    if (movement_type) {
      params.push(movement_type);
      query += ` AND sm.movement_type = $${params.length}`;
    }
    if (from_date) {
      params.push(from_date);
      query += ` AND sm.created_at >= $${params.length}`;
    }
    if (to_date) {
      params.push(to_date);
      query += ` AND sm.created_at <= $${params.length}`;
    }

    query += ` ORDER BY sm.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    res.status(200).json({ movements: result.rows });
  } catch (err) {
    console.error('Get stock movements error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET LOW STOCK PRODUCTS ──────────────────────────────────
const getLowStockProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
              b.name AS brand_name,
              c.name AS category_name
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.quantity_in_stock <= p.minimum_threshold
         AND p.is_active = true
       ORDER BY p.quantity_in_stock ASC`
    );
    res.status(200).json({ count: result.rows.length, products: result.rows });
  } catch (err) {
    console.error('Get low stock error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getAllBrands, createBrand, updateBrand, deleteBrand,
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getAllProducts, getProductById, createProduct, updateProduct,
  addStock, reduceStock, deleteProduct,
  getStockMovements, getLowStockProducts
};
