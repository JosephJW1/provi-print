const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET environment variable is not defined.");
}

const validateToken = (req, res, next) => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: "User not logged in" });
  }

  try {
    const validToken = jwt.verify(accessToken, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    req.user = validToken;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const isAdmin = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "User not logged in" });
  }

  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'role'],
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied: Admins only" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    next();
  } catch (err) {
    console.error("Admin authorization error:", err);
    return res.status(500).json({ error: "Server error verifying permissions" });
  }
};

module.exports = { validateToken, isAdmin, JWT_SECRET };