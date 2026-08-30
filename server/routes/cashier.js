const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, adminOrCashier } = require('../middleware/auth');

router.use(verifyToken);
router.use(adminOrCashier);

// GET all invoices (no unit prices)
router.get('/invoices', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.invoice_number, i.order_id, i.client_id,
              i.total_amount, i.payment_status, i.amount_paid,
              i.balance, i.created_at,
              c.full_name AS client_name
       FROM invoices i
       LEFT JOIN clients c ON i.client_id = c.id
       ORDER BY i.created_at DESC`
    );
    res.json({ invoices: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET all payments
router.get('/payments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.full_name AS client_name
       FROM payments p
       LEFT JOIN clients c ON p.client_id = c.id
       ORDER BY p.created_at DESC`
    );
    res.json({ payments: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST record a payment
router.post('/payments', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      invoice_id, client_id, amount, payment_method,
      reference_number, bank_name, notes
    } = req.body;

    if (!invoice_id || !client_id || !amount || !payment_method) {
      return res.status(400).json({
        message: 'Invoice, client, amount and method are required.'
      });
    }

    const invResult = await client.query(
      'SELECT * FROM invoices WHERE id = $1', [invoice_id]
    );
    if (invResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    const invoice = invResult.rows[0];
    const currentBalance = parseFloat(invoice.balance || 0);

    if (amount > currentBalance) {
      return res.status(400).json({
        message: `Amount exceeds balance. Maximum payable: NGN ${currentBalance.toLocaleString()}`
      });
    }

    const count = await client.query('SELECT COUNT(*) FROM payments');
    const receiptNumber = `HMS-RCP-${String(parseInt(count.rows[0].count) + 1).padStart(4, '0')}`;

    await client.query(
      `INSERT INTO payments
         (receipt_number, invoice_id, client_id, amount, payment_method,
          reference_number, bank_name, notes, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [receiptNumber, invoice_id, client_id, amount, payment_method,
       reference_number || null, bank_name || null,
       notes || null, req.user.id]
    );

    const newPaid = parseFloat(invoice.amount_paid || 0) + parseFloat(amount);
    const newBalance = parseFloat(invoice.total_amount) - newPaid;
    const newStatus = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'part_paid' : 'unpaid';

    await client.query(
      `UPDATE invoices SET
         amount_paid = $1, balance = $2,
         payment_status = $3, updated_at = NOW()
       WHERE id = $4`,
      [newPaid, newBalance, newStatus, invoice_id]
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Payment recorded.',
      receipt_number: receiptNumber
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Payment error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
});

// GET all expenses
router.get('/expenses', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.full_name AS recorded_by_name
       FROM expenses e
       LEFT JOIN users u ON e.recorded_by = u.id
       ORDER BY e.expense_date DESC, e.created_at DESC`
    );
    res.json({ expenses: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST record expense
router.post('/expenses', async (req, res) => {
  try {
    const {
      category, amount, description,
      payment_method, authorised_by, expense_date
    } = req.body;

    if (!category || !amount || !description || !payment_method) {
      return res.status(400).json({
        message: 'Category, amount, description and method are required.'
      });
    }

    const result = await pool.query(
      `INSERT INTO expenses
         (category, amount, description, payment_method,
          authorised_by, expense_date, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [category, amount, description, payment_method,
       authorised_by || null,
       expense_date || new Date().toISOString().split('T')[0],
       req.user.id]
    );

    res.status(201).json({
      message: 'Expense recorded.',
      expense: result.rows[0]
    });
  } catch (err) {
    console.error('Expense error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET petty cash
router.get('/petty-cash', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM petty_cash ORDER BY created_at DESC LIMIT 50`
    );
    const lastRecord = result.rows[0];
    const balance = lastRecord ? parseFloat(lastRecord.balance_after) : 0;
    res.json({ records: result.rows, balance });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST petty cash transaction
router.post('/petty-cash', async (req, res) => {
  try {
    const { transaction_type, amount, note, transaction_date } = req.body;

    if (!transaction_type || !amount) {
      return res.status(400).json({ message: 'Type and amount are required.' });
    }

    const last = await pool.query(
      'SELECT balance_after FROM petty_cash ORDER BY created_at DESC LIMIT 1'
    );
    const currentBalance = last.rows.length > 0
      ? parseFloat(last.rows[0].balance_after) : 0;

    let newBalance;
    if (transaction_type === 'disbursement') {
      newBalance = currentBalance - parseFloat(amount);
      if (newBalance < 0) {
        return res.status(400).json({
          message: 'Insufficient petty cash balance.'
        });
      }
    } else {
      newBalance = currentBalance + parseFloat(amount);
    }

    await pool.query(
      `INSERT INTO petty_cash
         (transaction_type, amount, balance_after, note, transaction_date, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [transaction_type, amount, newBalance, note || null,
       transaction_date || new Date().toISOString().split('T')[0],
       req.user.id]
    );

    res.status(201).json({
      message: 'Petty cash updated.',
      balance: newBalance
    });
  } catch (err) {
    console.error('Petty cash error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;