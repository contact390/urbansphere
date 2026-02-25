const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

// Create table if it doesn't exist
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    service VARCHAR(100),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

db.query(createTableQuery, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Table "contact_messages" CREATED');
  }
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hitaishihospitalityservices@gmail.com',        // ✅ Replace with your Gmail
    pass: 'pios pzyx qtpc mzuj'           // ✅ Use an App Password (not your main Gmail password)
  }
});

// POST /api/contact
router.post('/contact', (req, res) => {
  const { name, email, phone, service, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const insertQuery = `
    INSERT INTO contact_messages (name, email, phone, service, message)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(insertQuery, [name, email, phone, service, message], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Send confirmation email
    const mailOptions = {
      from: 'hitaishihospitalityservices@gmail.com',
      to: email,
      subject: 'Thanks for contacting Hitaishi!',
      html: `
        <h3>Hi ${name},</h3>
        <p>Thank you for reaching out regarding <strong>${service || 'our services'}</strong>.</p>
        <p>We have received your message and will get back to you shortly.</p>
        <hr />
        <p><strong>Your Message:</strong><br>${message}</p>
        <br>
        <p>– Hitaishi Team</p>
      `
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Email failed:', err);
        return res.status(500).json({ error: 'Message saved but email not sent' });
      }
      console.log('Confirmation email sent:', info.response);
      res.json({ success: true, message: 'Message saved and email sent successfully' });
    });
  });
});


// GET /contact-messages - Fetch all contact messages
// GET /api/contact-messages
router.get('/contact', (req, res) => {
  const selectQuery = 'SELECT * FROM contact_messages ORDER BY created_at DESC';

  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results); // Send all messages as JSON
  });
});


module.exports = router;
