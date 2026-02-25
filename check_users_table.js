const db = require('./db');

db.query("SHOW TABLES LIKE 'users'", (err, results) => {
  if (err) {
    console.error('Error querying DB:', err);
    process.exit(1);
  }
  console.log('SHOW TABLES LIKE "users" result:', results);
  process.exit(0);
});
