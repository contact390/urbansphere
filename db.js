const mysql = require('mysql2');

const db = mysql.createConnection({
  host: "localhost",
  user: "urbanuser",
  password: "StrongPassword123",
  database: "urbansphere"
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Handle connection errors and keep connection alive
db.on('error', (err) => {
    console.error('DB connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        db.connect();
    }
});

module.exports = db;
