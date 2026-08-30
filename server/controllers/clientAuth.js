const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─── CLIENT LOGIN ─────────────────────────────────────────────
const clientLogin = async (req, res) => {
  try {
    const { client_id, password } = req.body;

    if (!client_id || !password) {
      return res.status(400).json({ message: 'Client ID and password are required.' });
    }

    const result = await pool.query(
      'SELECT * FROM clients WHERE client_id = $1', [client_id.trim().toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid Client ID or password.' });
    }

    const client = result.rows[0];

    if (!client.is_active) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });
    }

    // If no password set yet, allow login with client_id as default password
    let isValid = false;
    if (!client.password_hash) {
      isValid = password === client.client_id;
      if (isValid) {
        // Auto-set the password hash on first login
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
          'UPDATE clients SET password_hash = $1 WHERE id = $2',
          [hash, client.id]
        );
      }
    } else {
      isValid = await bcrypt.compare(password, client.password_hash);
    }

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid Client ID or password.' });
    }

    const token = jwt.sign(
      { id: client.id, client_id: client.client_id, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      client: {
        id:        client.id,
        client_id: client.client_id,
        full_name: client.full_name,
        email:     client.email,
        phone:     client.phone,
      }
    });
  } catch (err) {
    console.error('Client login error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CLIENT CHANGE PASSWORD ───────────────────────────────────
const clientChangePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const clientId = req.client.id;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [clientId]);
    const client = result.rows[0];

    let isValid = false;
    if (!client.password_hash) {
      isValid = current_password === client.client_id;
    } else {
      isValid = await bcrypt.compare(current_password, client.password_hash);
    }

    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE clients SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hash, clientId]
    );

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Client change password error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET CLIENT PROFILE ───────────────────────────────────────
const getClientProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, client_id, full_name, email, phone, address, credit_terms, created_at FROM clients WHERE id = $1',
      [req.client.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found.' });
    }
    res.json({ client: result.rows[0] });
  } catch (err) {
    console.error('Get client profile error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { clientLogin, clientChangePassword, getClientProfile };
