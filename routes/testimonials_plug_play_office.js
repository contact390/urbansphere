// routes/api.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../db");

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Create testimonials table if not exists
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS testimonials_plug_play_office (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    designation VARCHAR(100),
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;
db.query(createTableQuery, (err) => {
  if (err) console.error("Error creating table:", err);
  else console.log("testimonials_plug_play_office table ensured.");
});

// POST route for submitting testimonial
router.post("/testimonials_plug_play_office", upload.single("image"), (req, res) => {
  const { text, name, designation } = req.body;
  const image = req.file ? req.file.filename : null;

  const insertQuery = `
    INSERT INTO testimonials_plug_play_office (text, name, designation, image)
    VALUES (?, ?, ?, ?)
  `;
  db.query(insertQuery, [text, name, designation, image], (err, result) => {
    if (err) {
      console.error("Insert error:", err);
      return res.status(500).json({ message: "Failed to save testimonial" });
    }
    res.status(200).json({ message: "Testimonial submitted successfully" });
  });
});


// GET route to fetch all testimonials
router.get("/testimonials_plug_play_office", (req, res) => {
  const query = "SELECT * FROM testimonials_plug_play_office ORDER BY created_at DESC";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ message: "Error fetching testimonials" });
    }
    res.json(results);
  });
});





module.exports = router;


