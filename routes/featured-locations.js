const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

/* ================================
   1️⃣ AUTO CREATE TABLE
================================ */
const createTableQuery = `
CREATE TABLE IF NOT EXISTS featured_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;

db.query(createTableQuery, (err) => {
  if (err) {
    console.error('❌ Table creation failed:', err);
  } else {
    console.log('✅ featured_locations table ready');
  }
});

/* ================================
   2️⃣ MULTER CONFIG
================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const isValid = allowed.test(file.mimetype);
    cb(isValid ? null : new Error('Only image files allowed'), isValid);
  }
});

/* ================================
   3️⃣ ADD FEATURED LOCATION
================================ */
router.post(
  '/featured-locations',
  upload.single('image'),
  (req, res) => {
    console.log('\n📍 === POST /featured-locations ===');
    console.log('📦 Body:', JSON.stringify(req.body));
    console.log('📷 File:', req.file ? { filename: req.file.filename, size: req.file.size } : 'NO FILE');

    const { title, description, region } = req.body;

    // Validation
    if (!title || !title.trim()) {
      console.error('❌ Missing title');
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!description || !description.trim()) {
      console.error('❌ Missing description');
      return res.status(400).json({ message: 'Description is required' });
    }
    if (!region || !region.trim()) {
      console.error('❌ Missing region');
      return res.status(400).json({ message: 'Region is required' });
    }
    if (!req.file) {
      console.error('❌ Missing image file');
      return res.status(400).json({ message: 'Image is required' });
    }

    const image = req.file.filename;
    console.log('✅ All validations passed');
    console.log('📝 Inserting:', { title, description, image, region });

    const sql = `
      INSERT INTO featured_locations (title, description, image, region)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [title, description, image, region], (err, result) => {
      if (err) {
        console.error('❌ DATABASE ERROR:', err.message);
        console.error('Full Error:', err);
        return res.status(500).json({ 
          message: 'Insert failed', 
          error: err.message,
          sqlError: err.code 
        });
      }
      console.log('✅ INSERT SUCCESS - ID:', result.insertId);
      console.log('📍 === END POST /featured-locations ===\n');
      res.status(200).json({ 
        message: 'Location added successfully',
        id: result.insertId,
        image: image
      });
    });
  }
);

/* ================================
   4️⃣ GET FEATURED LOCATIONS
================================ */
router.get('/featured-locations', (req, res) => {
  console.log('📍 === GET /featured-locations ===');
  const sql = 'SELECT * FROM featured_locations ORDER BY created_at DESC';
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ DATABASE ERROR:', err.message);
      return res.status(500).json({ 
        message: 'Fetch failed',
        error: err.message 
      });
    }
    console.log('✅ Retrieved', results.length, 'locations');
    console.log('📍 === END GET /featured-locations ===\n');
    res.json(results);
  });
});

module.exports = router;
