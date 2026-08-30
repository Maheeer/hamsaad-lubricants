const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get fresh user data from database
    const result = await pool.query(
      'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account has been disabled. Contact admin.' });
    }

    req.user = user;
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Role-based access control
const authorise = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This action requires one of: ${roles.join(', ')}`
      });
    }
    next();
  };
};

// Shorthand role guards
const adminOnly = authorise('admin');
const adminOrManager = authorise('admin', 'manager');
const adminManagerOrStorekeeper = authorise('admin', 'manager', 'storekeeper');
const cashierOnly = authorise('cashier');
const adminOrCashier = authorise('admin', 'cashier');

module.exports = {
  verifyToken,
  authorise,
  adminOnly,
  adminOrManager,
  adminManagerOrStorekeeper,
  cashierOnly,
  adminOrCashier
};