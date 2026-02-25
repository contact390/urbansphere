const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

// Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '_' + Math.random().toString(36).substring(7) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Ensure table exists
const createTableQuery = `
CREATE TABLE IF NOT EXISTS specials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  special VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  originalPrice DECIMAL(10, 2),
  cuisine VARCHAR(100),
  offer VARCHAR(100),
  rating DECIMAL(3, 1),
  image VARCHAR(255),
  searchTerms TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createTableQuery, err => {
  if (err) console.error('❌ Table creation error:', err);
  else console.log('✅ "specials" table is ready.');
});

// POST: Create special with image
router.post('/specials', upload.single('image'), (req, res) => {
  try {
    const {
      name, special, description,
      price, originalPrice, cuisine,
      offer, rating, searchTerms
    } = req.body;

    console.log('📝 Received special submission:', { name, special, description, price, originalPrice, cuisine, offer, rating, searchTerms });

    // Validate required fields
    if (!name || !special || !description || !price || !cuisine || !offer || !rating || !searchTerms) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!req.file) {
      console.error('❌ No image file provided');
      return res.status(400).json({ error: 'Image file is required' });
    }

    const image = req.file.filename;

    const query = `
      INSERT INTO specials 
      (name, special, description, price, originalPrice, cuisine, offer, rating, image, searchTerms) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [name, special, description, parseFloat(price), parseFloat(originalPrice) || 0, cuisine, offer, parseFloat(rating), image, searchTerms], (err, result) => {
      if (err) {
        console.error('❌ Insert error:', err);
        return res.status(500).json({ error: 'Database error: ' + err.message });
      }
      console.log('✅ Special added successfully with ID:', result.insertId);
      res.status(201).json({ 
        message: 'Special added successfully', 
        id: result.insertId,
        image: image
      });
    });
  } catch (error) {
    console.error('⚠️ Exception in /specials POST:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// GET all specials
router.get('/specials', (req, res) => {
  db.query('SELECT * FROM specials ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('❌ Fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch specials' });
    }
    res.json(results);
  });
});

// PUT: Update special with optional image
router.put('/specials/update', upload.single('image'), (req, res) => {
  try {
    const { id, name, special, description, price, originalPrice, cuisine, offer, rating, searchTerms } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    // If image is uploaded, we need to handle it
    if (req.file) {
      // First get the old image filename to delete it
      const getOldImageQuery = 'SELECT image FROM specials WHERE id=?';
      
      db.query(getOldImageQuery, [id], (err, results) => {
        if (err) {
          console.error('❌ Error fetching old image:', err);
          return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        // Delete old image file if it exists
        if (results.length > 0 && results[0].image) {
          const oldImagePath = path.join(uploadsDir, results[0].image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('🗑️ Old image deleted:', results[0].image);
          }
        }

        // Update with new image
        const newImage = req.file.filename;
        const query = `
          UPDATE specials 
          SET name=?, special=?, description=?, price=?, originalPrice=?, cuisine=?, offer=?, rating=?, searchTerms=?, image=? 
          WHERE id=?
        `;

        db.query(query, [name, special, description, parseFloat(price), parseFloat(originalPrice) || 0, cuisine, offer, parseFloat(rating), searchTerms, newImage, id], (err, result) => {
          if (err) {
            console.error('❌ Update error:', err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Special not found' });
          }
          console.log('✅ Special updated successfully with new image');
          res.json({ message: 'Special updated successfully', image: newImage });
        });
      });
    } else {
      // Update without image
      const query = `
        UPDATE specials 
        SET name=?, special=?, description=?, price=?, originalPrice=?, cuisine=?, offer=?, rating=?, searchTerms=? 
        WHERE id=?
      `;

      db.query(query, [name, special, description, parseFloat(price), parseFloat(originalPrice) || 0, cuisine, offer, parseFloat(rating), searchTerms, id], (err, result) => {
        if (err) {
          console.error('❌ Update error:', err);
          return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Special not found' });
        }
        console.log('✅ Special updated successfully');
        res.json({ message: 'Special updated successfully' });
      });
    }
  } catch (error) {
    console.error('⚠️ Exception in /specials/update PUT:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// DELETE: Delete special
router.delete('/specials/delete', (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const query = 'DELETE FROM specials WHERE id=?';

    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('❌ Delete error:', err);
        return res.status(500).json({ error: 'Database error: ' + err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Special not found' });
      }
      console.log('✅ Special deleted successfully');
      res.json({ message: 'Special deleted successfully' });
    });
  } catch (error) {
    console.error('⚠️ Exception in /specials/delete DELETE:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;