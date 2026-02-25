// routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create orders table if not exists
const orderTableQuery = `
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customerName VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  items JSON,
  status ENUM('pending','accepted','rejected') DEFAULT 'pending',
  rejectionReason TEXT,
  paymentMethod ENUM('upi','cod'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(orderTableQuery, (err) => {
  if (err) {
    console.error('Error creating orders table:', err);
  } else {
    console.log('Orders table ensured.');
  }
});

// Helper function to generate PDF receipt
function generateReceipt(order, callback) {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, '../receipts', `order_${order.id}.pdf`);
  const stream = fs.createWriteStream(filePath);
  
  doc.pipe(stream);
  
  // Add receipt content
  doc.fontSize(20).text('Hitaishi Hospitality', { align: 'center' });
  doc.fontSize(14).text('Order Receipt', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(12).text(`Order ID: ${order.id}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
  doc.text(`Customer: ${order.customerName}`);
  doc.text(`Phone: ${order.phone}`);
  doc.text(`Email: ${order.email}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Order Items:');
  let total = 0;
  order.items.forEach(item => {
    doc.text(`${item.name} - ${item.special || ''} - ₹${item.price}`);
    total += parseInt(item.price);
  });
  
  doc.moveDown();
  doc.fontSize(14).text(`Total: ₹${total}`, { align: 'right' });
  doc.moveDown();
  doc.text(`Payment Method: ${order.paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}`);
  doc.text(`Status: ${order.status}`);
  
  if (order.rejectionReason) {
    doc.moveDown();
    doc.text(`Rejection Reason: ${order.rejectionReason}`);
  }
  
  doc.moveDown();
  doc.fontSize(10).text('Thank you for your order!', { align: 'center' });
  
  doc.end();
  stream.on('finish', () => callback(filePath));
}

// POST: Save new order
router.post('/orders', async (req, res) => {
  const { customerName, phone, email, address, items, paymentMethod } = req.body;

  if (!customerName || !phone || !email || !address || !items || !Array.isArray(items) || !paymentMethod) {
    return res.status(400).json({ error: 'Missing or invalid fields.' });
  }

  const insertQuery = `INSERT INTO orders (customerName, phone, email, address, items, paymentMethod) VALUES (?, ?, ?, ?, ?, ?)`;
  const values = [customerName, phone, email, address, JSON.stringify(items), paymentMethod];

  db.query(insertQuery, values, async (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ error: 'Database insert failed.' });
    }

    // Get the inserted order
    const orderId = result.insertId;
    const selectQuery = 'SELECT * FROM orders WHERE id = ?';
    db.query(selectQuery, [orderId], async (err, results) => {
      if (err || results.length === 0) {
        console.error('Error fetching order:', err);
        return res.status(200).json({ message: 'Order placed but receipt generation failed.' });
      }

      const order = results[0];
      order.items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

      // Generate receipt PDF
      generateReceipt(order, async (filePath) => {
        // Send confirmation email
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'hitaishihospitalityservices@gmail.com',
            pass: 'pios pzyx qtpc mzuj'
          }
        });

        const itemList = order.items.map(i => `<li>${i.name} - ${i.special || ''} @ ₹${i.price}</li>`).join('');
        const total = order.items.reduce((sum, item) => sum + parseInt(item.price), 0);
        
        const mailOptions = {
          from: 'hitaishihospitalityservices@gmail.com',
          to: email,
          subject: 'Order Confirmation - Hitaishi Hospitality',
          html: `
            <h3>Dear ${customerName},</h3>
            <p>Thank you for your order! Here are your order details:</p>
            <ul>${itemList}</ul>
            <p><strong>Total Amount:</strong> ₹${total}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p>Please find your receipt attached.</p>
            <br><p>Regards,<br>Hitaishi Hospitality Team</p>
          `,
          attachments: [{
            filename: `receipt_order_${order.id}.pdf`,
            path: filePath
          }]
        };

        try {
          await transporter.sendMail(mailOptions);
          res.status(200).json({ message: 'Order placed and email sent.' });
        } catch (mailErr) {
          console.error('Email error:', mailErr);
          res.status(200).json({ message: 'Order placed but email failed.' });
        }
      });
    });
  });
});

// PUT: Update order status
router.put('/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!status || (status === 'rejected' && !rejectionReason)) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const updateQuery = 'UPDATE orders SET status = ?, rejectionReason = ? WHERE id = ?';
  db.query(updateQuery, [status, rejectionReason, id], (err) => {
    if (err) {
      console.error('Update error:', err);
      return res.status(500).json({ error: 'Database update failed.' });
    }
    res.json({ message: 'Order status updated.' });
  });
});

// GET: Send all orders as JSON (for use in frontend)
router.get('/orders', (req, res) => {
  const selectQuery = 'SELECT * FROM orders ORDER BY createdAt DESC';
  
  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Fetch error:', err);
      return res.status(500).json({ error: 'Database fetch failed.' });
    }

    const orders = results.map(order => {
      let parsedItems;
      try {
        parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        console.error('Failed to parse items for order ID:', order.id);
        parsedItems = [];
      }

      return {
        ...order,
        items: parsedItems
      };
    });

    res.json(orders);
  });
});

module.exports = router;