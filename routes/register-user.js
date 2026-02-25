const express = require("express");
const router = express.Router();
const db = require("../db");

console.log('routes/register-user.js loaded');

// Create table if not exists
const createTable = `
CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 fullName VARCHAR(150),
 email VARCHAR(150) UNIQUE,
 phone VARCHAR(20),
 password VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createTable, (err) => {
    if (err) {
        console.log("TABLE CREATION ERROR:", err);
    } else {
        console.log("Users table ready!");
    }
});

// Register user (simple register.html)
router.post("/register-user", (req, res) => {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    if (!fullName || !email || !phone || !password || !confirmPassword)
        return res.status(400).json({ message: "All fields are required" });

    if (password !== confirmPassword)
        return res.status(400).json({ message: "Passwords do not match" });

    const sql = "INSERT INTO users (fullName,email,phone,password) VALUES (?,?,?,?)";

    db.query(sql, [fullName, email, phone, password], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY")
                return res.status(400).json({ message: "Email already registered" });

            return res.status(500).json({ message: "Server error" });
        }

        res.json({ message: "Registration successful" });
    });
});

console.log('register-user: POST /register-user route defined on router');

module.exports = router;
