const express = require("express");
const router = express.Router();
const connection = require("../db");
const nodemailer = require("nodemailer");

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hitaishihospitalityservices@gmail.com",
    pass: "pios pzyx qtpc mzuj",
  },
});

const ADMIN_EMAIL = "hitaishihospitalityservices@gmail.com";
const FROM_EMAIL = "no-reply@yourdomain.com";

// Create DB Table
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS send_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

connection.query(createTableQuery, (err) => {
  if (err) console.error("Table creation failed:", err);
  else console.log("send_messages table ready.");
});

// POST: Save message and send emails
router.post("/send_message", (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All required fields must be filled." });
  }

  const insertQuery = `
    INSERT INTO send_messages (name, email, phone, subject, message)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(insertQuery, [name, email, phone, subject, message], (err) => {
    if (err) {
      console.error("Insert error:", err);
      return res.status(500).json({ message: "Failed to save message." });
    }

    const userMail = {
      from: FROM_EMAIL,
      to: email,
      subject: `We received your message: "${subject}"`,
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for contacting us. We got your message with subject "<strong>${subject}</strong>" and will respond soon.</p>
        <p><strong>Your message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
        <p>Regards,<br/>Team</p>
      `,
    };

    const adminMail = {
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New contact form submission: "${subject}"`,
      html: `
        <p>New message submitted:</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
        <p><em>Submitted at: ${new Date().toLocaleString()}</em></p>
      `,
    };

    // Send emails (non-blocking)
    transporter.sendMail(userMail, (uErr) => {
      if (uErr) console.error("User email error:", uErr);
    });

    transporter.sendMail(adminMail, (aErr) => {
      if (aErr) console.error("Admin email error:", aErr);
    });

    return res.status(200).json({ message: "Message received successfully." });
  });
});

// GET: Fetch all messages
router.get("/send_message", (req, res) => {
  const selectQuery = "SELECT * FROM send_messages ORDER BY submitted_at DESC";

  connection.query(selectQuery, (err, results) => {
    if (err) {
      console.error("Select error:", err);
      return res.status(500).send("Failed to fetch messages.");
    }
    res.json(results);
  });
});

module.exports = router;
