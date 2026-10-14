// routes/Auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const { validateToken, JWT_SECRET } = require('../middlewares/AuthMiddleware');

const BCRYPT_ROUNDS = 12;
// Pre-computed dummy hash used to mitigate timing enumeration attacks when a user is not found
const DUMMY_PASSWORD_HASH = '$2b$12$eImiTXuWVxfM37uY4JANjQ.1JqX.vK1wG/wY8/vK1wG/wY8/vK1wG';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
});

// Secure Registration Route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({ error: "Username, email, and password must be valid strings" });
  }

  const trimmedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!trimmedUsername || !normalizedEmail || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Bcrypt truncates passwords longer than 72 bytes
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: "Password must be between 8 and 72 characters" });
  }

  try {
    // Check if either the email OR the username is already taken
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: normalizedEmail }, { username: trimmedUsername }]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email or username already registered" });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Creates the user (role defaults to 'customer' automatically)
    await User.create({
      username: trimmedUsername,
      email: normalizedEmail,
      password_hash
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Secure Login Route
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // 'identifier' is either their username or email

  if (typeof identifier !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: "Username/Email and password are required" });
  }

  const trimmedIdentifier = identifier.trim();
  if (!trimmedIdentifier || !password) {
    return res.status(400).json({ error: "Username/Email and password are required" });
  }

  try {
    // Find user by either normalized email OR exact username
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: trimmedIdentifier.toLowerCase() },
          { username: trimmedIdentifier }
        ]
      }
    });

    // Always run bcrypt.compare to prevent timing attacks that leak user existence
    const targetHash = user ? user.password_hash : DUMMY_PASSWORD_HASH;
    const match = await bcrypt.compare(password, targetHash);

    if (!user || !match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Include the role and username in the JWT payload
    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' }
    );

    res.cookie('accessToken', accessToken, {
      ...getCookieOptions(),
      maxAge: 3600000, // 1 hour
    });

    res.json({
      message: "Logged in successfully",
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Verify Active Session Route
router.get('/me', validateToken, async (req, res) => {
  try {
    // Query the database so revoked/deleted users or changed roles take effect immediately
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'role']
    });

    if (!user) {
      res.clearCookie('accessToken', getCookieOptions());
      return res.status(401).json({ error: "Session no longer valid" });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error("Session verification error:", error);
    res.status(500).json({ error: "Server error verifying session" });
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken', getCookieOptions());
  res.json({ message: "Logged out successfully" });
});

module.exports = router;