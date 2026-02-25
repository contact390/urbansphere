const http = require('http');

const data = JSON.stringify({
  fullName: 'Test User',
  email: 'test2@example.com',
  phone: '1234567890',
  password: 'pass123',
  confirmPassword: 'pass123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/register-user',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.setEncoding('utf8');
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
  process.exit(1);
});

req.write(data);
req.end();
