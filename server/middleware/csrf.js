const crypto = require('crypto');

// In-memory store for CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map();

// Generate CSRF token
const generateCSRFToken = (sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour expiry

  csrfTokens.set(sessionId, { token, expiresAt });

  // Clean up expired tokens periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of csrfTokens.entries()) {
      if (value.expiresAt < now) {
        csrfTokens.delete(key);
      }
    }
  }, 60000); // Clean every minute

  return token;
};

// Validate CSRF token
const validateCSRFToken = (sessionId, token) => {
  const stored = csrfTokens.get(sessionId);

  if (!stored) {
    return false;
  }

  if (stored.expiresAt < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }

  if (stored.token !== token) {
    return false;
  }

  // Token is single-use, remove after validation
  csrfTokens.delete(sessionId);
  return true;
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints that don't need it (like refresh token)
  if (req.path === '/api/auth/refresh-token' || req.path.startsWith('/api/auth/send-otp')) {
    return next();
  }

  // For state-changing operations, require CSRF token
  const sessionId = req.user?.id || req.ip || 'anonymous';
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;

  if (!csrfToken) {
    return res.status(403).json({
      message: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  if (!validateCSRFToken(sessionId, csrfToken)) {
    return res.status(403).json({
      message: 'Invalid or expired CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  next();
};

// Middleware to add CSRF token to response
const addCSRFToken = (req, res, next) => {
  const sessionId = req.user?.id || req.ip || 'anonymous';
  const token = generateCSRFToken(sessionId);

  // Add token to response headers
  res.setHeader('X-CSRF-Token', token);

  // Also add to res.locals for templates
  res.locals.csrfToken = token;

  next();
};

module.exports = {
  csrfProtection,
  addCSRFToken,
  generateCSRFToken
};