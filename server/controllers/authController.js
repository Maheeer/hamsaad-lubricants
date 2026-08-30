const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─── LOGIN ───────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        message: 'Your account has been disabled. Please contact the administrator.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Log the login action
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, user.full_name, 'LOGIN', 'users', user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return token and user info (no password)
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// ─── GET CURRENT USER (ME) ───────────────────────────────────
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, is_active, last_login, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ user: result.rows[0] });

  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CHANGE PASSWORD ─────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Both current and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    // Get current user with password
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, req.user.full_name, 'CHANGE_PASSWORD', 'users', req.user.id]
    );

    res.status(200).json({ message: 'Password changed successfully.' });

  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { login, getMe, changePassword };