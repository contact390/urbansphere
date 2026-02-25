// api.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const nodemailer = require("nodemailer");

// Create table if not exists
const createTableQuery = `
CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  interest VARCHAR(100),
  location VARCHAR(100),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

db.query(createTableQuery, (err) => {
  if (err) console.error("Table creation error:", err);
  else console.log("Inquiries table ready.");
});

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your mail provider
  auth: {
    user: "hitaishihospitalityservices@gmail.com",      // Replace with your email
    pass: "pios pzyx qtpc mzuj"   // Use App Password if 2FA enabled
  }
});

// POST /api/send-inquiry
router.post("/send_inquiry", (req, res) => {
  const { name, email, phone, interest, location, message } = req.body;

  if (!name || !email || !interest || !message) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  const insertQuery = `
    INSERT INTO inquiries (name, email, phone, interest, location, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(insertQuery, [name, email, phone, interest, location, message], (err, result) => {
    if (err) {
      console.error("DB Insert Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // Compose email
    const mailOptions = {
      from: '"hitaishihospitalityservices@gmail.com " <yourcompanyemail@gmail.com>',
      to: "hitaishihospitalityservices@gmail.com", // Admin's email
      subject: "New Contact Inquiry Received",
      html: `
        <h3>New Inquiry Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Interested In:</strong> ${interest}</p>
        <p><strong>Preferred Location:</strong> ${location}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `
    };

    // Send email
    // Send email to admin
    const adminMailOptions = {
      from: '"Hitaashi Hospitality Services" <hitaishihospitalityservices@gmail.com>',
      to: "hitaishihospitalityservices@gmail.com",
      subject: "New Contact Inquiry Received",
      html: `
        <h3>New Inquiry Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Interested In:</strong> ${interest}</p>
        <p><strong>Preferred Location:</strong> ${location}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `
    };

    // Confirmation email to user
    const userMailOptions = {
      from: '"Hitaashi Hospitality Services" <hitaishihospitalityservices@gmail.com>',
      to: email, // user who submitted
      subject: "Thank you for contacting Hitaishi Hospitality",
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for getting in touch with us. We’ve received your inquiry regarding <strong>${interest}</strong>.</p>
        <p>Our team will get back to you shortly.</p>
        <br>
        <p>Best regards,<br>Hitaishi Hospitality Services</p>
      `
    };

    // Send both emails
    transporter.sendMail(adminMailOptions, (error1, info1) => {
      if (error1) {
        console.error("Admin email error:", error1);
        return res.status(500).json({ message: "Saved to DB, but failed to notify admin." });
      }

      transporter.sendMail(userMailOptions, (error2, info2) => {
        if (error2) {
          console.error("User email error:", error2);
          return res.status(500).json({ message: "Admin notified, but failed to email user." });
        }

        console.log("Admin and user notified.");
        return res.status(200).json({ message: "Inquiry submitted and emails sent." });
      });
    });
  }); 
});
// GET /api/inquiries - fetch all inquiries
router.get("/send_inquiry", (req, res) => {
  const selectQuery = `SELECT * FROM inquiries ORDER BY created_at DESC`;

  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error("Error fetching inquiries:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});


module.exports = router;
