// routes/add_location_plug_play_office.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Create table
db.query(`
  CREATE TABLE IF NOT EXISTS add_location_plug_play_office (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    imagePath VARCHAR(255)
  )
`, (err) => {
  if (err) console.error('❌ Error creating table:', err.message);
  else console.log('✅ "add_location_plug_play_office" table ensured');
});

// POST route
router.post("/add_location_plug_play_office", upload.single("image"), (req, res) => {
  const { title, description } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Image file is required' });

  const imagePath = "/uploads/" + req.file.filename;

  db.query(
    "INSERT INTO add_location_plug_play_office (title, description, imagePath) VALUES (?, ?, ?)",
    [title, description, imagePath],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database insert failed' });
      res.status(200).json({ message: 'Location added' });
    }
  );
});


// GET route
router.get("/add_location_plug_play_office", (req, res) => {
  db.query("SELECT * FROM add_location_plug_play_office", (err, results) => {
    if (err) return res.status(500).json({ error: 'Database read error' });
    res.json(results);
  });
});

// DELETE route
router.delete("/add_location_plug_play_office/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM add_location_plug_play_office WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Delete failed" });
    res.json({ message: "Deleted" });
  });
});

// PUT route (update)
router.put("/add_location_plug_play_office/:id", (req, res) => {
  const { title, description } = req.body;
  const id = req.params.id;

  db.query("UPDATE add_location_plug_play_office SET title = ?, description = ? WHERE id = ?",
    [title, description, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Update failed" });
      res.json({ message: "Updated" });
    });
});


module.exports = router;
