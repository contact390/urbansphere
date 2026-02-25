// routes/admin.js
const express = require('express');
const router = express.Router();

// Hardcoded admin credentials (you can upgrade to DB later)
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

// POST /api/admin/login
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    res.status(200).json({ message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

module.exports = router;
