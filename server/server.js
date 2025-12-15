const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const { sanitizeInput } = require('./middleware/validation');
const { requestLogger, logSecurityEvent } = require('./middleware/logger');
const { csrfProtection, addCSRFToken } = require('./middleware/csrf');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// Rate limiting (basic implementation)
const requestCounts = new Map();
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW) || 900000; // 15 minutes
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX) || 100;

  const now = Date.now();
  const windowStart = now - windowMs;

  if (!requestCounts.has(clientIP)) {
    requestCounts.set(clientIP, []);
  }

  const requests = requestCounts.get(clientIP);
  // Remove old requests outside the window
  const validRequests = requests.filter(time => time > windowStart);
  validRequests.push(now);
  requestCounts.set(clientIP, validRequests);

  if (validRequests.length > maxRequests) {
    return res.status(429).json({ message: 'Too many requests, please try again later' });
  }

  next();
});

// Middleware
app.use(requestLogger);
app.use(sanitizeInput);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CSRF protection for authenticated routes (temporarily disabled for testing)
// app.use('/api', addCSRFToken);
// app.use('/api', csrfProtection);

// File upload configuration with enhanced security
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate secure filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '');
    cb(null, basename + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const allowedMimeTypes = /image\/jpeg|image\/jpg|image\/png|application\/pdf/;

    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);

    // Additional security checks
    if (file.originalname.length > 100) {
      return cb(new Error('Filename too long'));
    }

    if (!mimetype || !extname) {
      return cb(new Error('Only JPEG, JPG, PNG and PDF files are allowed!'));
    }

    cb(null, true);
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Import models to register them with Mongoose
require('./models/Category');
require('./models/Product');
require('./models/Customer');
require('./models/User');
require('./models/DailyAttendance');
require('./models/Cow');
require('./models/Hen');
require('./models/Investor');
require('./models/Sale');
require('./models/Payment');
require('./models/Bill');
require('./models/Expense');
require('./models/MilkRecord');
require('./models/EggRecord');
require('./models/Order');
require('./models/Reminder');
require('./models/Review');
require('./models/SpecialProductReservation');
require('./models/Account');
require('./models/BankTransaction');
require('./models/CowTransfer');
require('./models/FarmImage');
require('./models/FinancialSummary');
require('./models/Income');
require('./models/Investment');
require('./models/Loan');
require('./models/Payout');
require('./models/Reservation');
require('./models/SimplePayable');
require('./models/SimplePayment');
require('./models/SimpleReceivable');
require('./models/Vendor');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cows', require('./routes/cows'));
app.use('/api/hens', require('./routes/hens'));
app.use('/api/milk-records', require('./routes/milkRecords'));
app.use('/api/egg-records', require('./routes/eggRecords'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/daily-attendance', require('./routes/dailyAttendance'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/special-reservations', require('./routes/specialProductReservations'));
app.use('/api/admin', require('./routes/admin'));

// Financial management routes
app.use('/api/financial', require('./routes/financial'));

// Serve static files from React app build directory in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React Router: send all non-API requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// Start server with HTTPS in production
if (process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true') {
  try {
    const { createHTTPSServer, generateSelfSignedCert } = require('./config/https-config');

    // Generate self-signed cert if needed for development
    if (process.env.NODE_ENV === 'development') {
      generateSelfSignedCert();
    }

    const httpsServer = createHTTPSServer(app);
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
    });

    // Optional: Also run HTTP server for redirects
    if (process.env.HTTP_REDIRECT === 'true') {
      const http = require('http');
      const { redirectToHTTPS } = require('./config/https-config');

      const httpApp = express();
      httpApp.use(redirectToHTTPS);
      httpApp.listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT} (redirects to HTTPS)`);
      });
    }
  } catch (error) {
    app.listen(PORT, () => {
      console.log(`HTTP Server running on port ${PORT}`);
    });
  }
} else {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
