const crypto = require('crypto');

// Generate secure secrets for JWT
const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 Generated Secure JWT Secrets');
console.log('=====================================');
console.log('\nAdd these to your .env file:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log('\n⚠️  IMPORTANT: Keep these secrets secure and never commit them to version control!\n');