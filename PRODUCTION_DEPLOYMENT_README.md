# 🚀 Production Deployment Guide - Hareram Dudhwale

## 📋 Pre-Deployment Checklist

### ✅ Code Preparation
- [x] Environment-specific CSP policies
- [x] Production build scripts
- [x] Security headers configured
- [x] Error handling optimized
- [x] Authentication systems tested

### 🔧 Infrastructure Requirements
- [ ] Node.js 18+ server
- [ ] MongoDB Atlas database
- [ ] Domain name and SSL certificate
- [ ] Google Cloud Console account (for OAuth)
- [ ] File storage (for uploads)

---

## 🏗️ Step-by-Step Deployment

### 1. **Environment Setup**

#### Create Production Environment File
```bash
cp .env.production.example .env.production
```

#### Update Production Environment Variables
```bash
# Edit .env.production with your production values
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hareram_dudhwale_prod
JWT_SECRET=your_64_character_super_secure_jwt_secret
JWT_REFRESH_SECRET=your_64_character_super_secure_refresh_secret
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### 2. **Database Setup**

#### MongoDB Atlas Configuration
1. Create production cluster on MongoDB Atlas
2. Create database user with read/write permissions
3. Whitelist your server IP addresses
4. Get connection string and update `MONGO_URI`

#### Database Migration (if needed)
```bash
# No migration needed - Mongoose handles schema creation
# Existing data will be preserved
```

### 3. **Google OAuth Production Setup**

#### Create Production OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new OAuth 2.0 Client ID for production
3. Set authorized redirect URIs:
   - `https://yourdomain.com/api/auth/google/callback`
4. Set authorized JavaScript origins:
   - `https://yourdomain.com`

#### Update OAuth Consent Screen
1. Complete OAuth consent screen for production
2. Submit for Google verification if needed
3. Update client ID and secret in `.env.production`

### 4. **SSL Certificate Setup**

#### Using Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt-get install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com
```

#### Manual SSL Configuration
```bash
# Update environment variables
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.key
```

### 5. **Server Deployment**

#### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Install dependencies
npm install --production

# Build the application
npm run build-production

# Start with PM2
pm2 start ecosystem.config.js
```

#### PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'hareram-dudhwale',
    script: 'server/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### 6. **Nginx Reverse Proxy Setup**

#### Install Nginx
```bash
sudo apt-get install nginx
```

#### Nginx Configuration (/etc/nginx/sites-available/hareram-dudhwale)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static files
    location /uploads/ {
        alias /path/to/your/app/uploads/;
        expires 30d;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # React app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/hareram-dudhwale /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. **File Uploads Configuration**

#### Create Uploads Directory
```bash
mkdir -p uploads
chmod 755 uploads
```

#### Update Nginx for File Serving
```nginx
location /uploads/ {
    alias /path/to/your/app/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 8. **Monitoring & Logging**

#### PM2 Monitoring
```bash
# Monitor application
pm2 monit

# View logs
pm2 logs hareram-dudhwale

# Restart application
pm2 restart hareram-dudhwale
```

#### Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 9. **Backup Strategy**

#### Database Backup
```bash
# Create backup script
mongodump --db hareram_dudhwale_prod --out /path/to/backup/$(date +%Y%m%d)

# Schedule with cron
0 2 * * * mongodump --db hareram_dudhwale_prod --out /path/to/backup/$(date +\%Y\%m\%d)
```

#### File Backup
```bash
# Backup uploads directory
tar -czf /path/to/backup/uploads_$(date +%Y%m%d).tar.gz uploads/
```

### 10. **Security Hardening**

#### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

#### Fail2Ban Setup
```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🔍 Post-Deployment Testing

### Health Check
```bash
curl https://yourdomain.com/health
# Should return: {"status":"OK","timestamp":"..."}
```

### Authentication Testing
```bash
# Test phone/OTP login
curl -X POST https://yourdomain.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210"}'

# Test email/password login
curl -X POST https://yourdomain.com/api/auth/email-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123!"}'
```

### Frontend Testing
1. Visit `https://yourdomain.com`
2. Test login functionality
3. Verify Google OAuth (if configured)
4. Check responsive design

---

## 🚨 Troubleshooting

### Common Issues

#### 500 Internal Server Error
```bash
# Check PM2 logs
pm2 logs hareram-dudhwale

# Check application logs
tail -f /var/log/hareram-dudhwale/app.log
```

#### Database Connection Issues
```bash
# Test database connection
mongosh "mongodb+srv://username:password@cluster.mongodb.net/hareram_dudhwale_prod"
```

#### SSL Certificate Issues
```bash
# Renew Let's Encrypt certificate
sudo certbot renew
sudo systemctl reload nginx
```

---

## 📊 Performance Optimization

### Database Indexing
```javascript
// Ensure proper indexes in MongoDB
db.users.createIndex({ email: 1 });
db.users.createIndex({ username: 1 });
db.customers.createIndex({ phone: 1 });
```

### Caching Strategy
```javascript
// Implement Redis for session caching (future enhancement)
// Implement CDN for static assets (future enhancement)
```

### Monitoring Setup
```bash
# Install monitoring tools
npm install -g pm2
pm2 install pm2-server-monit
```

---

## 🔄 Maintenance Tasks

### Regular Updates
```bash
# Update dependencies
npm audit fix
npm update

# Restart application
pm2 restart hareram-dudhwale
```

### SSL Certificate Renewal
```bash
# Automatic renewal with cron
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📞 Support & Monitoring

### Application Monitoring
- PM2 monitoring: `pm2 monit`
- Nginx logs: `/var/log/nginx/`
- Application logs: Check PM2 logs

### Health Checks
```bash
# Add to monitoring system
curl -f https://yourdomain.com/health || alert_admin
```

---

## ✅ Deployment Complete!

Your **Hareram Dudhwale** application is now running in production with:

- ✅ **Secure Authentication** (Phone/OTP, Email/Password, Google OAuth)
- ✅ **Production Database** (MongoDB Atlas)
- ✅ **SSL Encryption** (HTTPS)
- ✅ **Load Balancing** (Nginx + PM2)
- ✅ **File Uploads** (Secure handling)
- ✅ **Monitoring & Logging** (PM2 + Nginx)
- ✅ **Backup Strategy** (Database + Files)
- ✅ **Security Hardening** (Firewall + Fail2Ban)

**🎉 Your application is production-ready and secure!**
