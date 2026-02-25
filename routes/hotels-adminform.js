const express = require('express');
const router = express.Router();
const db = require('../db');

// Create hotel_items table if it doesn't exist
const createTableSQL = `CREATE TABLE IF NOT EXISTS hotel_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  imageUrl VARCHAR(500) NOT NULL,
  price DECIMAL(10, 2),
  location VARCHAR(255),
  rating DECIMAL(3, 1),
  features TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_subcategory (subcategory),
  INDEX idx_createdAt (createdAt)
)`;

db.query(createTableSQL, (err) => {
  if (err) {
    console.error('Error creating hotel_items table:', err);
  } else {
    console.log('hotel_items table ready (created or already exists)');
  }
});

// POST - Add a new hotel item
router.post('/hotels-items', (req, res) => {
  const {
    category,
    subcategory,
    name,
    description,
    imageUrl,
    price,
    location,
    rating,
    features
  } = req.body;

  // Validate required fields
  if (!category || !subcategory || !name || !description || !imageUrl) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: category, subcategory, name, description, imageUrl'
    });
  }

  // Prepare features array
  const featuresStr = Array.isArray(features) ? features.join(',') : (features || '');

  // Insert into database
  const sql = `INSERT INTO hotel_items 
    (category, subcategory, name, description, imageUrl, price, location, rating, features, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

  const values = [
    category,
    subcategory,
    name,
    description,
    imageUrl,
    price || null,
    location || null,
    rating || null,
    featuresStr
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database error adding hotel item:', err);
      return res.status(500).json({
        success: false,
        message: 'Error adding item to database',
        error: err.message
      });
    }

    res.json({
      success: true,
      message: `"${name}" added successfully!`,
      itemId: result.insertId,
      item: {
        id: result.insertId,
        category,
        subcategory,
        name,
        description,
        imageUrl,
        price,
        location,
        rating,
        features: featuresStr.split(',').filter(f => f.trim())
      }
    });
  });
});

// GET - Retrieve all hotel items
router.get('/hotels-items', (req, res) => {
  const sql = `SELECT id, category, subcategory, name, description, imageUrl, price, location, rating, features, createdAt 
               FROM hotel_items 
               ORDER BY createdAt DESC`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error fetching hotel items:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching items',
        error: err.message
      });
    }

    // Parse features string back to array
    const items = results.map(item => ({
      ...item,
      features: item.features ? item.features.split(',').map(f => f.trim()).filter(f => f) : []
    }));

    res.json({
      success: true,
      count: items.length,
      items
    });
  });
});

// GET - Get items by category
router.get('/hotels-items/category/:category', (req, res) => {
  const { category } = req.params;

  const sql = `SELECT id, category, subcategory, name, description, imageUrl, price, location, rating, features, createdAt 
               FROM hotel_items 
               WHERE category = ? 
               ORDER BY createdAt DESC`;

  db.query(sql, [category], (err, results) => {
    if (err) {
      console.error('Database error fetching items by category:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching items',
        error: err.message
      });
    }

    const items = results.map(item => ({
      ...item,
      features: item.features ? item.features.split(',').map(f => f.trim()).filter(f => f) : []
    }));

    res.json({
      success: true,
      category,
      count: items.length,
      items
    });
  });
});

// DELETE - Remove an item by ID
router.delete('/hotels-items/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM hotel_items WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Database error deleting hotel item:', err);
      return res.status(500).json({
        success: false,
        message: 'Error deleting item',
        error: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  });
});

// UPDATE - Modify an existing item
router.put('/hotels-items/:id', (req, res) => {
  const { id } = req.params;
  const {
    category,
    subcategory,
    name,
    description,
    imageUrl,
    price,
    location,
    rating,
    features
  } = req.body;

  if (!category || !subcategory || !name || !description || !imageUrl) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  const featuresStr = Array.isArray(features) ? features.join(',') : (features || '');

  const sql = `UPDATE hotel_items 
               SET category = ?, subcategory = ?, name = ?, description = ?, imageUrl = ?, price = ?, location = ?, rating = ?, features = ?
               WHERE id = ?`;

  const values = [
    category,
    subcategory,
    name,
    description,
    imageUrl,
    price || null,
    location || null,
    rating || null,
    featuresStr,
    id
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database error updating hotel item:', err);
      return res.status(500).json({
        success: false,
        message: 'Error updating item',
        error: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item updated successfully'
    });
  });
});

module.exports = router;
