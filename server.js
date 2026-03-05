const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();

const db = require("./db");

const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Home Page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server running successfully 🚀" });
});


// Safe route loader
function safeRequire(modulePath) {
  try {
    const route = require(modulePath);
    console.log(`✅ Loaded ${modulePath}`);
    return route;
  } catch (err) {
    console.error(`❌ Failed to load ${modulePath}:`, err.message);
    return null;
  }
}

// Load routes
const contactRoutes = safeRequire("./routes/contact");
const subscribeRoutes = safeRequire("./routes/subscribe");
const registerUserRoutes = safeRequire("./routes/register-user");
const loginUserRoutes = safeRequire("./routes/login-user");

// Use routes
if (contactRoutes) app.use("/api", contactRoutes);
if (subscribeRoutes) app.use("/api", subscribeRoutes);
if (registerUserRoutes) app.use("/api", registerUserRoutes);
if (loginUserRoutes) app.use("/api", loginUserRoutes);


// Fallback Register API
app.post("/api/register-user", (req, res) => {
  const { fullName, email, phone, password, confirmPassword } = req.body;

  if (!fullName || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const sql = "INSERT INTO users (fullName,email,phone,password) VALUES (?,?,?,?)";

  db.query(sql, [fullName, email, phone, password], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Email already registered" });
      }

      console.error("DB Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    res.json({ message: "Registration successful" });
  });
});


// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});