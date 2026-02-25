const express = require('express');
const router = express.Router();
const db = require('../db');

/* =========================================
   CREATE TABLE (AUTO RUNS ON SERVER START)
========================================= */

const createTableQuery = `
CREATE TABLE IF NOT EXISTS preschool (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    interest VARCHAR(100),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Attempt to create table; if the database is missing, try to create it and retry
db.query(createTableQuery, (err) => {
    if (err) {
        console.error('❌ Failed to create preschool table:', err && err.code ? err.code + ' - ' + err.message : err);

        // If database doesn't exist, try to create it and retry table creation
        if (err && err.code === 'ER_BAD_DB_ERROR') {
            console.log('Database not found. Attempting to create database `hospitalityservices` and retry table creation...');
            db.query('CREATE DATABASE IF NOT EXISTS hospitalityservices', (dbErr) => {
                if (dbErr) {
                    console.error('❌ Failed to create database hospitalityservices:', dbErr);
                    return;
                }
                console.log('✅ Database hospitalityservices ensured. Retrying table creation...');
                db.query(createTableQuery, (err2) => {
                    if (err2) {
                        console.error('❌ Retry: Failed to create preschool table:', err2);
                    } else {
                        console.log('✅ preschool table ready (after creating DB)');
                    }
                });
            });
        }
    } else {
        console.log('✅ preschool table ready');
    }
});

/* =========================================
   CONTACT FORM API
========================================= */

router.post('/preschool', (req, res) => {
    console.log('POST /api/preschool payload:', req.body);
    const { name, email, phone, interest, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            message: 'Name, Email and Message are required'
        });
    }

    const insertQuery = `
        INSERT INTO preschool
        (name, email, phone, interest, message)
        VALUES (?, ?, ?, ?, ?)
    `;

    // Try inserting; if table schema is missing a column, attempt to ALTER TABLE and retry once
    const attemptInsert = (retry = true) => {
        db.query(insertQuery, [name, email, phone, interest, message], (err, result) => {
            if (err) {
                console.error('❌ Insert Error:', err && err.code ? err.code + ' - ' + err.message : err);

                // Handle unknown column errors by attempting to add the missing column(s)
                if (retry && err.code === 'ER_BAD_FIELD_ERROR' && /Unknown column '(\w+)' in 'field list'/.test(err.message)) {
                    const missing = err.message.match(/Unknown column '(\w+)' in 'field list'/);
                    const col = missing && missing[1];
                    if (col) {
                        console.log(`Attempting to add missing column '${col}' to preschool...`);
                        const alterSql = `ALTER TABLE preschool ADD COLUMN ${col} VARCHAR(255) NULL`;
                        db.query(alterSql, (alterErr) => {
                            if (alterErr) {
                                // If column already exists or other error, return failure
                                console.error('❌ ALTER TABLE error:', alterErr);
                                return res.status(500).json({ message: 'Database schema update failed', error: alterErr && alterErr.code ? alterErr.code : undefined });
                            }
                            console.log(`✅ Added column '${col}'. Retrying insert...`);
                            // Retry once
                            attemptInsert(false);
                        });
                        return;
                    }
                }

                return res.status(500).json({
                    message: 'Database insert failed',
                    error: err && err.code ? err.code : undefined
                });
            }

            console.log('Inserted preschool id=', result.insertId);
            res.status(200).json({
                message: '✅ Message submitted successfully',
                id: result.insertId
            });
        });
    };

    attemptInsert(true);
});

module.exports = router;
