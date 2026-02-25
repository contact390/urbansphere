const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');

// Create table if not exists
const createTableQuery = `
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    dob DATE,
    services TEXT,
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip VARCHAR(20),
    country VARCHAR(50),
    referral VARCHAR(50),
    specialRequirements TEXT,
    agreedToTerms BOOLEAN,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

db.query(createTableQuery, (err) => {
    if (err) {
        console.error("Error creating table:", err);
    } else {
        console.log("Registrations table ensured.");
    }
});

// POST: Register and send confirmation email
router.post('/register', (req, res) => {
    const {
        fullName,
        email,
        phone,
        dob,
        services,
        address,
        referral,
        specialRequirements,
        agreedToTerms
    } = req.body;

    const query = `
        INSERT INTO registrations 
        (fullName, email, phone, dob, services, street, city, state, zip, country, referral, specialRequirements, agreedToTerms) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        fullName,
        email,
        phone,
        dob || null,
        JSON.stringify(services),
        address.street,
        address.city,
        address.state,
        address.zip,
        address.country,
        referral,
        specialRequirements,
        agreedToTerms ? 1 : 0
    ];

    db.query(query, values, async (err) => {
        if (err) {
            console.error("Insert error:", err);
            return res.status(500).json({ message: 'Failed to register.' });
        }

        // Setup mail transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'hitaishihospitalityservices@gmail.com',
                pass: 'pios pzyx qtpc mzuj' // Use App Password
            }
        });

        // Email content
        const mailOptions = {
            from: 'your_email@gmail.com',
            to: email,
            subject: 'Registration Confirmation - Hitaishi Hospitality Services',
            html: `
                <h3>Hello ${fullName},</h3>
                <p>Thank you for registering with Hitaishi Hospitality Services.</p>
                <p>We have received your profile details successfully.</p>
                <br><p>Warm regards,<br><b>Hitaishi Team</b></p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: 'Registration successful and email sent.' });
        } catch (mailErr) {
            console.error('Email sending failed:', mailErr);
            res.status(200).json({ message: 'Registration successful but email failed.' });
        }
    });
});

// GET: All registrations for dashboard
router.get('/admin/registrations', (req, res) => {
    db.query('SELECT * FROM registrations ORDER BY submitted_at DESC', (err, results) => {
        if (err) {
            console.error('Error fetching registrations:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

module.exports = router;
