const express = require('express');
const db = require('../db');
const nodemailer = require('nodemailer');

const router = express.Router();

console.log('Loaded routes/request.js');

/* Ensure table exists on startup using the shared connection */
;(async () => {
  try {
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS information_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        venue_type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ information_requests table ready');
  } catch (err) {
    console.error('❌ Error creating information_requests table:', err && err.message ? err.message : err);
  }
})();

router.post('/request-information', async (req, res) => {
  const { name, email, phone, venueType, message } = req.body;
  console.log('POST /api/request-information received:', { name, email, phone, venueType, message });

  if (!name || !email || !venueType || !message) {
    return res.status(400).json({ message: 'Name, email, venue type, and message are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  if (message.length < 10) {
    return res.status(400).json({ message: 'Message must be at least 10 characters long' });
  }

  try {
    const [result] = await db.promise().query(
      `INSERT INTO information_requests (name, email, phone, venue_type, message, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [name, email || null, phone || null, venueType, message]
    );

    console.log('✅ Inserted information_requests id=', result.insertId);

    // send confirmation email if nodemailer available
    try {
      let transporter;
      try {
        transporter = require('nodemailer').createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com',
            pass: process.env.EMAIL_PASSWORD || 'your-password'
          }
        });
      } catch (e) {
        transporter = null;
      }

      if (transporter) {
        const html = `<p>Dear ${name},<br>Your request has been received.</p>`;
        await transporter.sendMail({ from: process.env.EMAIL_USER || 'noreply@hitaishilens.com', to: email, subject: 'Request received', html });
      }
    } catch (emailErr) {
      console.warn('Email send failed:', emailErr && emailErr.message ? emailErr.message : emailErr);
    }

    return res.status(201).json({ success: true, message: 'Request submitted', requestId: result.insertId });
  } catch (err) {
    console.error('❌ Error saving request:', err && err.message ? err.message : err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/requests', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM information_requests ORDER BY created_at DESC');
    return res.json({ success: true, total: rows.length, requests: rows });
  } catch (err) {
    console.error('❌ Error fetching requests:', err && err.message ? err.message : err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['pending', 'contacted', 'completed', 'rejected'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    const [result] = await db.promise().query('UPDATE information_requests SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Request not found' });
    return res.json({ success: true, message: 'Updated' });
  } catch (err) {
    console.error('❌ Error updating request:', err && err.message ? err.message : err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/requests/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.promise().query('DELETE FROM information_requests WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting request:', err && err.message ? err.message : err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;