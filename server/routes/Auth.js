const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Secure Registration Route
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const password_hash = await bcrypt.hash(password, 10);

    await User.create({ email, password_hash });
    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Secure Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Incorrect password" });

    const accessToken = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET || "fallback_secret_key_change_this_in_production", 
      { expiresIn: '1h' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 3600000 
    });

    res.json({ message: "Logged in successfully", email: user.email });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Logout Route
router.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.json({ message: "Logged out successfully" });
});

module.exports = router;