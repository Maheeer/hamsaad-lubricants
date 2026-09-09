const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ─── GET ALL USERS ────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, access_code, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET USER BY ID ───────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    const result = await pool.query(
      `SELECT id, full_name, email, role, access_code, is_active, created_at
       FROM users WHERE id = $1`, [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CREATE USER ──────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { full_name, email, role, password } = req.body;

    if (!full_name || !email || !role || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    // Generate access code based on role
    const prefixes = { manager: 'MGR', storekeeper: 'STK', cashier: 'CSH', admin: 'ADM' };
    const prefix = prefixes[role] || 'USR';
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role = $1`, [role]
    );
    const count   = parseInt(countRes.rows[0].count) + 1;
    const accessCode = `${prefix}-${String(count).padStart(5, '0')}`;

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password, role, access_code)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, full_name, email, role, access_code, is_active, created_at`,
      [full_name, email, hash, role, accessCode]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'CREATE_USER', 'users',
       result.rows[0].id, JSON.stringify({ full_name, role, email })]
    );

    res.status(201).json({ message: 'User created successfully.', user: result.rows[0] });
  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── TOGGLE USER ACCESS ───────────────────────────────────────
const toggleUserAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const newStatus = !user.rows[0].is_active;
    await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2', [newStatus, id]
    );
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name,
       newStatus ? 'ENABLE_USER' : 'DISABLE_USER', 'users',
       id, JSON.stringify({ is_active: newStatus, target_name: user.rows[0].full_name })]
    );

    res.json({ message: `User ${newStatus ? 'enabled' : 'disabled'} successfully.` });
  } catch (err) {
    console.error('Toggle user error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── RESET USER PASSWORD ──────────────────────────────────────
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    if (!new_password) {
      return res.status(400).json({ message: 'New password is required.' });
    }
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2', [hash, id]
    );
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET ALL CLIENTS ──────────────────────────────────────────
const getAllClients = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              u.full_name AS added_by_name,
              CASE WHEN c.password_hash IS NOT NULL THEN true ELSE false END AS has_password
       FROM clients c
       LEFT JOIN users u ON c.added_by = u.id
       ORDER BY c.created_at DESC`
    );
    res.json({ clients: result.rows });
  } catch (err) {
    console.error('Get clients error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CREATE CLIENT ────────────────────────────────────────────
const createClient = async (req, res) => {
  try {
    const { full_name, email, phone, address, credit_terms, status } = req.body;
    const clientStatus = status === 'prospect' ? 'prospect' : 'active';

    if (!full_name) {
      return res.status(400).json({ message: 'Client name is required.' });
    }

    // Check email uniqueness if provided
    if (email) {
      const existing = await pool.query(
        'SELECT id FROM clients WHERE email = $1', [email]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'Email already exists.' });
      }
    }

    let clientId = null;

    // Only generate Hamsaad ID for full clients, not prospects
    if (clientStatus === 'active') {
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM clients WHERE status = 'active'`
      );
      const count = parseInt(countRes.rows[0].count) + 1;
      clientId = `HMS-CLT-${String(count).padStart(4, '0')}`;
    }

    const result = await pool.query(
      `INSERT INTO clients (client_id, full_name, email, phone, address, credit_terms, added_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [clientId, full_name, email || null, phone || null,
       address || null, credit_terms || 0, req.user.id, clientStatus]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'CREATE_CLIENT', 'clients',
       result.rows[0].id, JSON.stringify({ clientId, full_name, status: clientStatus })]
    );

    res.status(201).json({ message: `${clientStatus === 'prospect' ? 'Prospect' : 'Client'} created successfully.`, client: result.rows[0] });
  } catch (err) {
    console.error('Create client error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── TOGGLE CLIENT ACCESS ─────────────────────────────────────
const toggleClientAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (client.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found.' });
    }
    const newStatus = !client.rows[0].is_active;
    await pool.query(
      'UPDATE clients SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, id]
    );
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name,
       newStatus ? 'ENABLE_CLIENT' : 'DISABLE_CLIENT', 'clients',
       id, JSON.stringify({ is_active: newStatus, target_name: client.rows[0].full_name })]
    );

    res.json({ message: `Client ${newStatus ? 'enabled' : 'disabled'} successfully.` });
  } catch (err) {
    console.error('Toggle client error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── RESET CLIENT PASSWORD (Admin) ───────────────────────────
const resetClientPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (client.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found.' });
    }
    const defaultPassword = client.rows[0].client_id || client.rows[0].full_name.replace(/\s+/g, '').toLowerCase();
    const hash = await bcrypt.hash(defaultPassword, 10);
    await pool.query(
      'UPDATE clients SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hash, id]
    );
    res.json({ message: 'Client password reset to default.' });
  } catch (err) {
    console.error('Reset client password error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── CONFIRM PROSPECT AS FULL CLIENT ─────────────────────────
const confirmProspect = async (req, res) => {
  try {
    const { id } = req.params;

    const clientRes = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (clientRes.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found.' });
    }
    const client = clientRes.rows[0];
    if (client.status !== 'prospect') {
      return res.status(400).json({ message: 'Client is already confirmed.' });
    }

    // Generate Hamsaad ID based on active client count
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM clients WHERE status = 'active'`
    );
    const count    = parseInt(countRes.rows[0].count) + 1;
    const clientId = `HMS-CLT-${String(count).padStart(4, '0')}`;

    await pool.query(
      `UPDATE clients
       SET status       = 'active',
           client_id    = $1,
           confirmed_at = NOW(),
           confirmed_by = $2,
           updated_at   = NOW()
       WHERE id = $3`,
      [clientId, req.user.id, id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, table_name, record_id, new_values)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.full_name, 'CONFIRM_PROSPECT', 'clients',
       id, JSON.stringify({ client_id: clientId, full_name: client.full_name })]
    ).catch(() => {});

    res.json({ message: `${client.full_name} confirmed as a Hamsaad client. ID: ${clientId}`, client_id: clientId });
  } catch (err) {
    console.error('Confirm prospect error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getAllUsers, getUserById, createUser,
  toggleUserAccess, resetUserPassword,
  getAllClients, createClient, toggleClientAccess,
  resetClientPassword, confirmProspect,
};
