const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',        // or your database host (e.g., '127.0.0.1' or remote host)
    user: 'root',    // your MySQL username
    password: '2142',// your MySQL password
    database: 'hospitalityservices' // your database name
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
