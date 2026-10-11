const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) return res.status(401).json({ error: "Not logged in" });

  try {
    const validToken = jwt.verify(accessToken, process.env.JWT_SECRET || "fallback_secret");
    req.user = validToken;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = { validateToken };