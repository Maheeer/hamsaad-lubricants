const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const pool    = require('../config/db');
const {
  getAllUsers, getUserById, createUser,
  toggleUserAccess, resetUserPassword,
  getAllClients, createClient, toggleClientAccess,
  resetClientPassword, confirmProspect,
} = require('../controllers/userController');
const { verifyToken, adminOnly } = require('../middleware/auth');

router.use(verifyToken);

// ── Own Profile — any logged in user ─────────────────────────
router.put('/profile', async (req, res) => {
  try {
    const { full_name, email, phone } = req.body;
    if (!full_name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    // Check email not taken by another user
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already in use by another account.' });
    }

    await pool.query(
      `UPDATE users
       SET full_name = $1, email = $2, phone = $3, updated_at = NOW()
       WHERE id = $4`,
      [full_name, email, phone || null, req.user.id]
    );

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Change Own Password — any logged in user ──────────────────
router.put('/change-password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Both current and new password are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1', [req.user.id]
    );
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id)
       VALUES ($1, $2, 'CHANGE_PASSWORD', 'users', $3)`,
      [req.user.id, req.user.full_name, req.user.id]
    );

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Client routes BEFORE /:id ─────────────────────────────────
router.get('/clients',                      adminOnly, getAllClients);
router.post('/clients',                     adminOnly, createClient);
router.patch('/clients/:id/toggle',         adminOnly, toggleClientAccess);
router.patch('/clients/:id/reset-password', adminOnly, resetClientPassword);
router.patch('/clients/:id/confirm',        adminOnly, confirmProspect);

// ── User routes ───────────────────────────────────────────────
router.get('/',                     adminOnly, getAllUsers);
router.post('/',                    adminOnly, createUser);
router.get('/:id',                  adminOnly, getUserById);
router.patch('/:id/toggle',         adminOnly, toggleUserAccess);
router.patch('/:id/reset-password', adminOnly, resetUserPassword);

module.exports = router;
