const crypto = require('crypto');

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'hareram-encryption-key-2024-!@#$%^&*()';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

// Ensure key is 32 bytes
const getKey = () => {
  return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
};

// Encrypt sensitive data
const encrypt = (text) => {
  if (!text) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher(ALGORITHM, getKey());

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:encryptedData
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

// Decrypt sensitive data
const decrypt = (encryptedText) => {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(ALGORITHM, getKey());
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return encryptedText; // Return original if decryption fails
  }
};

// Hash sensitive data (one-way)
const hashData = (data, saltRounds = 12) => {
  if (!data) return data;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Generate secure random token
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Mask sensitive data for logging
const maskSensitiveData = (data, fields = ['password', 'token', 'secret', 'key']) => {
  if (!data || typeof data !== 'object') return data;

  const masked = { ...data };

  fields.forEach(field => {
    if (masked[field]) {
      if (typeof masked[field] === 'string' && masked[field].length > 4) {
        masked[field] = masked[field].substring(0, 2) + '*'.repeat(masked[field].length - 4) + masked[field].substring(masked[field].length - 2);
      } else {
        masked[field] = '[REDACTED]';
      }
    }
  });

  return masked;
};

module.exports = {
  encrypt,
  decrypt,
  hashData,
  generateSecureToken,
  maskSensitiveData
};