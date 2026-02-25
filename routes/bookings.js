// routes/bookings.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Create bookings table if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    specialId INT,
    customerName VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) console.error('Error creating bookings table:', err);
  else {
    console.log('✅ "bookings" table ensured');
    // Add address column if it doesn't exist
    db.query(`ALTER TABLE bookings ADD COLUMN address TEXT`, (alterErr) => {
      if (alterErr && alterErr.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ "address" column already exists in bookings table');
      } else if (alterErr) {
        console.error('Error adding address column:', alterErr);
      } else {
        console.log('✅ "address" column added to bookings table');
      }
    });
  }
});

// Handle booking submissions
router.post('/bookings', (req, res) => {
  const { specialId, customerName, phone, address } = req.body;
  if (!specialId || !customerName || !phone || !address) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  db.query(
    'INSERT INTO bookings (specialId, customerName, phone, address) VALUES (?, ?, ?, ?)',
    [specialId, customerName, phone, address],
    (err) => {
      if (err) {
        console.error('Failed to insert booking:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({ message: 'Booking successful' });
      }
    }
  );
});


// Add this below the POST route in routes/bookings.js
router.get('/bookings', (req, res) => {
  db.query('SELECT * FROM bookings', (err, results) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(results);
    }
  });
});




module.exports = router;
