const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

const authorizeCustomer = (req, res, next) => {
  if (req.user.role !== 'customer' && req.user.role !== 'admin') return res.status(403).json({ message: 'Customer access required' });
  next();
};

module.exports = { auth, authorizeAdmin, authorizeCustomer };
