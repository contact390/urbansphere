const express = require("express");
const router = express.Router();
const db = require("../db");

// ⭐ USER LOGIN ROUTE
router.post("/login-user", (req, res) => {
    const { email, password } = req.body;

    // 1️⃣ Check empty fields
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    // 2️⃣ Query MySQL
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, result) => {
        // 3️⃣ Database error
        if (err) {
            console.error("Login DB Error:", err);
            return res.status(500).json({
                message: "Internal server error"
            });
        }

        // 4️⃣ No user found
        if (result.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // 5️⃣ Successfully logged in
        const user = result[0];

        return res.json({
            message: "Login successful",
            name: user.fullName,
            email: user.email
        });
    });
});

module.exports = router;
