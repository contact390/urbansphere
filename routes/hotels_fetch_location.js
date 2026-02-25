const express = require("express");
const router = express.Router();
const db = require("../db");


// ========================================
// AUTO CREATE TABLE (if not exists)
// ========================================
const createTableQuery = `
CREATE TABLE IF NOT EXISTS hotel_locations_full (
    id INT AUTO_INCREMENT PRIMARY KEY,
    country VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    regionCount INT NOT NULL,
    regions JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;

db.query(createTableQuery, (err) => {
    if (err) {
        console.log("Table creation failed:", err);
    } else {
        console.log("hotel_locations_full table ready");
    }
});


// ========================================
// ADD LOCATION API
// ========================================
router.post("/hotels_fetch_location", (req, res) => {
    const { country, state, regionCount, regions } = req.body;

    if (!country || !state || !regionCount || !regions || !Array.isArray(regions)) {
        return res.json({
            success: false,
            message: "All fields required"
        });
    }

    const insertQuery = `
        INSERT INTO hotel_locations_full (country, state, regionCount, regions)
        VALUES (?, ?, ?, ?)
    `;

    db.query(insertQuery, [country, state, regionCount, JSON.stringify(regions)], (err, result) => {
        if (err) {
            console.log("Insert Error:", err);
            return res.json({ success: false });
        }
        res.json({
            success: true,
            message: "Location Added Successfully"
        });
    });
});


// ========================================
// GET ALL LOCATIONS API
// ========================================
router.get("/get-locations", (req, res) => {
    const fetchQuery = `
        SELECT * FROM hotel_locations_full
        ORDER BY id DESC
    `;

    db.query(fetchQuery, (err, results) => {
        if (err) {
            console.log("Fetch Error:", err);
            return res.json({ success: false });
        }
        // Parse regions JSON for each result
        const parsed = results.map(row => {
            let regionsData = row.regions;
            if (typeof regionsData === 'string') {
                try {
                    regionsData = JSON.parse(regionsData);
                } catch (e) {
                    regionsData = [];
                }
            }
            return {
                ...row,
                regions: regionsData
            };
        });
        res.json({
            success: true,
            locations: parsed
        });

    });
});

module.exports = router;
