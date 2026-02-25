// api.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

// Ensure table exists
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

db.query(createTableQuery, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Table ensured or already exists.');
  }
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hitaishihospitalityservices@gmail.com',         // 🔁 Replace with your Gmail
    pass: 'pios pzyx qtpc mzuj'            // 🔁 Use an app password, not your Gmail login
  }
});

// POST /api/subscribe
router.post('/subscribe', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const insertQuery = 'INSERT INTO newsletter_subscribers (email) VALUES (?)';

  db.query(insertQuery, [email], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Email already subscribed' });
      }
      console.error('Insert error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // Send welcome email
    const mailOptions = {
      from: 'hitaishihospitalityservices@gmail.com',
      to: email,
      subject: 'Thanks for Subscribing!',
      html: `
        <h3>Welcome to Hitaishi hospitality services!</h3>
        <p>Thank you for subscribing to our newsletter. You'll receive updates, tips, and exclusive offers from us.</p>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email send failed:', error);
        return res.status(500).json({ message: 'Subscription saved, but email failed to send.' });
      } else {
        console.log('Email sent: ' + info.response);
        return res.status(200).json({ message: 'Subscribed and email sent successfully.' });
      }
    });
  });
});

module.exports = router;
