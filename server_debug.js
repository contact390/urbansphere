const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 5000;

console.log('=== Starting server initialization ===');

// Middleware
console.log('Adding middleware...');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
console.log('Middleware added OK');

// Routes
console.log('Adding routes...');
try {
  app.use('/api', require('./routes/contact'));
  console.log('✓ contact');
  app.use('/api', require('./routes/subscribe'));
  console.log('✓ subscribe');
  app.use('/api', require('./routes/specials'));
  console.log('✓ specials');
  app.use('/api', require('./routes/bookings'));
  console.log('✓ bookings');
  app.use('/api', require('./routes/orders'));
  console.log('✓ orders');
  app.use('/api', require('./routes/admin'));
  console.log('✓ admin');
  app.use('/api', require('./routes/register'));
  console.log('✓ register');
  app.use('/api', require('./routes/send_message'));
  console.log('✓ send_message');
  app.use('/api', require('./routes/send_inquiry'));
  console.log('✓ send_inquiry');
  app.use('/api', require('./routes/testimonials_plug_play_office'));
  console.log('✓ testimonials_plug_play_office');
  app.use('/api', require('./routes/add_location_plug_play_office'));
  console.log('✓ add_location_plug_play_office');
  console.log('All routes added OK');
} catch (err) {
  console.error('Error adding routes:', err.message);
  console.error(err.stack);
}

// Direct handlers
console.log('Adding direct POST handlers...');
app.post('/api/register-user', (req, res) => {
  const { fullName, email, phone, password, confirmPassword } = req.body;
  if (!fullName || !email || !phone || !password || !confirmPassword)
    return res.status(400).json({ message: 'All fields are required' });
  if (password !== confirmPassword)
    return res.status(400).json({ message: 'Passwords do not match' });
  
  const sql = 'INSERT INTO users (fullName,email,phone,password) VALUES (?,?,?,?)';
  db.query(sql, [fullName, email, phone, password], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ message: 'Email already registered' });
      console.error('Registration insert error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json({ message: 'Registration successful' });
  });
});

app.post('/api/login-user', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });
  
  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error('Login DB Error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (result.length === 0)
      return res.status(401).json({ message: 'Invalid email or password' });
    
    const user = result[0];
    return res.json({
      message: 'Login successful',
      name: user.fullName,
      email: user.email
    });
  });
});

console.log('Direct handlers added OK');

// Create users table
console.log('Creating users table...');
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 fullName VARCHAR(150),
 email VARCHAR(150) UNIQUE,
 phone VARCHAR(20),
 password VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createUsersTable, (err) => {
  if (err) {
    console.log('TABLE CREATION ERROR:', err);
  } else {
    console.log('Users table ready!');
  }
});

console.log('=== About to start listening ===');

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('=== Server initialization complete ===');
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Prevent process from exiting
setInterval(() => {}, 60000);

// Handle SIGINT gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
