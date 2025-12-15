// HTTPS Configuration for Production
// This file provides HTTPS setup instructions and configuration

const fs = require('fs');
const path = require('path');
const https = require('https');

// HTTPS Configuration Options
const httpsOptions = {
  // For development/testing - generate self-signed certificates
  development: {
    key: fs.readFileSync(path.join(__dirname, '../certs/server.key')),
    cert: fs.readFileSync(path.join(__dirname, '../certs/server.crt')),
    // For self-signed certificates in development
    rejectUnauthorized: false
  },

  // For production - use Let's Encrypt or commercial certificates
  production: {
    key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/chain.pem')
  }
};

// Function to create HTTPS server
const createHTTPSServer = (app) => {
  const env = process.env.NODE_ENV || 'development';
  const options = httpsOptions[env];

  if (!options) {
    throw new Error(`HTTPS configuration not found for environment: ${env}`);
  }

  return https.createServer(options, app);
};

// Generate self-signed certificate for development
const generateSelfSignedCert = () => {
  const { execSync } = require('child_process');

  const certsDir = path.join(__dirname, '../certs');
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  const keyPath = path.join(certsDir, 'server.key');
  const certPath = path.join(certsDir, 'server.crt');

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    try {
      // Generate private key
      execSync(`openssl genrsa -out ${keyPath} 2048`);

      // Generate certificate
      execSync(`openssl req -new -x509 -key ${keyPath} -out ${certPath} -days 365 -subj "/C=IN/ST=Maharashtra/L=Pune/O=Hareram Dudhwale/CN=localhost"`);
    } catch (error) {
    }
  }
};

// Redirect HTTP to HTTPS middleware
const redirectToHTTPS = (req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
};

// Production HTTPS Setup Instructions
const HTTPS_SETUP_INSTRUCTIONS = `
🔒 HTTPS Production Setup Guide
================================

1. Obtain SSL Certificate:
   - Use Let's Encrypt (free): certbot --nginx -d yourdomain.com
   - Or purchase from commercial CA (DigiCert, GlobalSign, etc.)

2. Update server.js to use HTTPS:
   const { createHTTPSServer } = require('./config/https-config');
   const server = createHTTPSServer(app);
   server.listen(443, () => {});

3. Redirect HTTP to HTTPS:
   - Add redirectToHTTPS middleware for HTTP server
   - Configure reverse proxy (nginx/apache) to handle redirects

4. Security Headers (already implemented):
   - HSTS (HTTP Strict Transport Security)
   - Secure cookie flags
   - Content Security Policy

5. Certificate Renewal:
   - Let's Encrypt: Automatic renewal with cron job
   - Commercial: Manual renewal before expiry

6. Testing:
   - Use SSL Labs: https://www.ssllabs.com/ssltest/
   - Check for A+ rating
   - Verify certificate chain

7. Environment Variables:
   NODE_ENV=production
   HTTPS=true

8. Firewall Configuration:
   - Open port 443 for HTTPS
   - Close port 80 or redirect to 443
   - Configure rate limiting at firewall level
`;

module.exports = {
  createHTTPSServer,
  generateSelfSignedCert,
  redirectToHTTPS,
  HTTPS_SETUP_INSTRUCTIONS
};