const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
// We'll load route modules using a safeRequire helper so a single failing route
// won't crash the entire server at startup.
function safeRequire(modulePath) {
  try {
    const mod = require(modulePath);
    console.log(`Loaded ${modulePath}`);
    return mod;
  } catch (err) {
    console.error(`Failed to load ${modulePath}:`, err && err.message ? err.message : err);
    return null;
  }
}

const contactRoutes = safeRequire('./routes/contact');
const subscribeRoutes = safeRequire('./routes/subscribe');
const formRoutes = safeRequire('./routes/form');
const bookingsRoutes = safeRequire('./routes/bookings');
const ordersRoutes = safeRequire('./routes/orders');
const adminRoutes = safeRequire('./routes/admin');
const registerRoutes = safeRequire('./routes/register');
const send_messageRoutes = safeRequire('./routes/send_message');
const send_inquiryRoutes = safeRequire('./routes/send_inquiry');
const testimonials_plug_play_office = safeRequire('./routes/testimonials_plug_play_office');
const add_location_plug_play_office = safeRequire('./routes/add_location_plug_play_office');
const registerUserRoutes = safeRequire('./routes/register-user');
const loginUserRoutes = safeRequire('./routes/login-user');
const featured_locationsRoutes = safeRequire('./routes/featured-locations');
const preschoolRoutes = safeRequire('./routes/preschool');
const requestRoutes = safeRequire('./routes/request');
const hotelsAdminformRoutes = safeRequire('./routes/hotels-adminform');
const hotels_fetch_locationRoutes = safeRequire('./routes/hotels_fetch_location');
// const suboptionsRoutes = safeRequire('./routes/suboptions'); // File doesn't exist

const db = require('./db');
const { request } = require('http');

const app = express();
const PORT = 5000;

// Global error handlers to surface unexpected errors during startup
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// serve statiuc files from the root directory
app.use(express.static(path.join(__dirname)));

// Lightweight health check for quick diagnostics
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fallback login handler: ensures /api/login-user is available even if route file fails to load
app.post('/api/login-user', (req, res, next) => {
  // If a later-mounted login route exists it will override this, but this ensures the endpoint responds
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error('Fallback login DB Error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (!result || result.length === 0) return res.status(401).json({ message: 'Invalid email or password' });
    const user = result[0];
    return res.json({ message: 'Login successful', name: user.fullName, email: user.email });
  });
});

// Routes
if (contactRoutes) app.use('/api', contactRoutes); else console.log('Skipping contact route');
if (subscribeRoutes) app.use('/api', subscribeRoutes); else console.log('Skipping subscribe route');
if (formRoutes) app.use('/api', formRoutes); else console.log('Skipping specials route');
if (bookingsRoutes) app.use('/api', bookingsRoutes); else console.log('Skipping bookings route');
if (ordersRoutes) app.use('/api', ordersRoutes); else console.log('Skipping orders route');
if (adminRoutes) app.use('/api', adminRoutes); else console.log('Skipping admin route');
if (registerRoutes) app.use('/api', registerRoutes); else console.log('Skipping register route');
if (send_messageRoutes) app.use('/api', send_messageRoutes); else console.log('Skipping send_message route');
if (send_inquiryRoutes) app.use('/api', send_inquiryRoutes); else console.log('Skipping send_inquiry route');
if (testimonials_plug_play_office) app.use('/api', testimonials_plug_play_office); else console.log('Skipping testimonials route');
if (add_location_plug_play_office) app.use('/api', add_location_plug_play_office); else console.log('Skipping add_location route');
if (registerUserRoutes) { app.use('/api', registerUserRoutes); console.log('Mounted register-user router'); } else console.log('Skipping register-user route');
if (loginUserRoutes) { app.use('/api', loginUserRoutes); console.log('Mounted login-user router'); } else console.log('Skipping login-user route');
if (featured_locationsRoutes) { app.use('/api', featured_locationsRoutes); console.log('Mounted featured-locations router'); } else console.log('Skipping featured-locations route');
if (preschoolRoutes) { app.use('/api', preschoolRoutes); console.log('Mounted preschool router'); } else console.log('Skipping preschool route');
if (hotelsAdminformRoutes) { app.use('/api', hotelsAdminformRoutes); console.log('Mounted hotels-adminform router'); } else console.log('Skipping hotels-adminform route');
if (hotels_fetch_locationRoutes) { app.use('/api', hotels_fetch_locationRoutes); console.log('Mounted hotels_fetch_location router'); } else console.log('Skipping hotels_fetch_location route');
// if (suboptionsRoutes) { app.use('/api', suboptionsRoutes); console.log('Mounted suboptions router'); } else console.log('Skipping suboptions route');
// Fallback direct handler for registration to ensure endpoint is available
if (requestRoutes) { app.use('/api', requestRoutes); console.log('Mounted request router'); } else console.log('Skipping request route');




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

// Start Server



// Print registered routes for debugging
function listRoutes() {
  const routes = [];
  if (!app._router || !app._router.stack) {
    console.log('No routes registered (app._router is undefined)');
    return;
  }

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
      routes.push(`${methods} ${middleware.route.path}`);
    } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
          routes.push(`${methods} ${handler.route.path}`);
        }
      });
    }
  });
  console.log('Registered routes:\n' + routes.join('\n'));
}

// Wait 2 seconds for async DB operations to complete, then start server
setTimeout(() => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      listRoutes();
      
      // Keep the process alive by preventing idle timeout
      setInterval(() => {}, 10000);
    });
    
    server.on('error', (err) => {
      console.error('Server error:', err);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}, 2000);
