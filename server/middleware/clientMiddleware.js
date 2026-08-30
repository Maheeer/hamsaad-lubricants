const jwt = require('jsonwebtoken');

const verifyClientToken = (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) token = req.query.token;

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'client') {
      return res.status(403).json({ message: 'Access denied. Client token required.' });
    }

    req.client = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

module.exports = { verifyClientToken };
