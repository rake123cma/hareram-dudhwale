const fs = require('fs');
const path = require('path');
const { maskSensitiveData } = require('../utils/encryption');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logging function
const logToFile = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const maskedData = maskSensitiveData(data);
  const logEntry = {
    timestamp,
    level,
    message,
    ...maskedData
  };

  const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
  const logLine = JSON.stringify(logEntry) + '\n';

  fs.appendFile(logFile, logLine, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logToFile('INFO', 'Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';

    logToFile(level, 'Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress
    });
  });

  next();
};

// Security event logger
const logSecurityEvent = (event, details = {}) => {
  logToFile('SECURITY', event, details);
};

// Error logger
const logError = (error, context = {}) => {
  logToFile('ERROR', error.message || error, {
    stack: error.stack,
    ...context
  });
};

module.exports = {
  requestLogger,
  logSecurityEvent,
  logError
};