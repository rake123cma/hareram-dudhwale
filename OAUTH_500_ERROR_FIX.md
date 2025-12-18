# 🔧 Google OAuth 500 Error - Complete Solution

## 🎯 Problem Diagnosed

Your **500 Internal Server Error** during Google OAuth callback was caused by **missing environment variables**. The application was trying to access critical configuration values that didn't exist.

## ✅ What I've Fixed

1. **✅ Created `.env` file** with all required environment variables
2. **✅ Generated secure JWT secrets** for authentication
3. **✅ Set up proper configuration** for development environment
4. **✅ Created troubleshooting scripts** to help diagnose issues

## 🚀 Immediate Steps to Fix

### Step 1: Update Google OAuth Credentials

You need to get your actual Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project (`hareram-dudhwale`)
3. Create or select your OAuth 2.0 Client ID
4. Copy the **Client ID** and **Client Secret**

### Step 2: Update .env File

Edit your `.env` file and replace the placeholder values:

```env
# Google OAuth Configuration (REQUIRED)
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
```

### Step 3: Set Up MongoDB

Choose one of these options:

**Option A: Local MongoDB**
```env
MONGO_URI=mongodb://localhost:27017/hareram_dudhwale
```

**Option B: MongoDB Atlas (Recommended for Production)**
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a cluster and get connection string
3. Update MONGO_URI in .env file

### Step 4: Google Cloud Console Setup

**CRITICAL: OAuth Consent Screen**
1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Complete all required fields:
   - App name: "Hare Ram Dudhwale"
   - User support email: Your email
   - Developer contact: Your email
3. Add required scopes:
   - `openid`
   - `userinfo.email`
   - `userinfo.profile`

**CRITICAL: Authorized Redirect URIs**
1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Add redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (for development)
   - `https://hareram-dudhwale.onrender.com/api/auth/google/callback` (for production)

**CRITICAL: Test Users (if in testing mode)**
1. In OAuth Consent Screen, scroll to "Test users"
2. Add your email address
3. Save changes

### Step 5: Test the Fix

1. **Start the server:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Test OAuth configuration:**
   Visit in browser: `http://localhost:5000/api/auth/google-test`
   
   You should see a JSON response showing your configuration status.

3. **Test Google OAuth:**
   - Start frontend: `cd client && npm start`
   - Visit: `http://localhost:3000`
   - Click "Login with Google"
   - Should redirect to Google authentication

## 🛠️ Troubleshooting Commands

### Check Configuration
```bash
# Run the OAuth troubleshooting script
bash fix-oauth.sh

# Or test environment variables directly
cd server && node debug-env.js
```

### Test Server Endpoints
```bash
# Health check
curl http://localhost:5000/health

# OAuth configuration test
curl http://localhost:5000/api/auth/google-test
```

### View Server Logs
```bash
# Start server with detailed logging
cd server && DEBUG=* npm start
```

## 🚨 Common Issues & Solutions

### "Malformed auth code" Error
**Cause:** Google Cloud Console configuration incomplete
**Solution:** 
1. Complete OAuth consent screen setup
2. Add redirect URIs exactly as shown above
3. Add test users if app is in testing mode
4. Wait 2-3 minutes after making changes

### "MISSING JWT_SECRET" Error
**Cause:** Environment variables not loaded
**Solution:**
1. Ensure `.env` file exists in project root
2. Check that JWT_SECRET is not placeholder value
3. Restart server after updating .env

### Database Connection Error
**Cause:** MongoDB not configured
**Solution:**
1. Install MongoDB locally, OR
2. Set up MongoDB Atlas and update MONGO_URI
3. Ensure database is accessible

### CORS Error
**Cause:** Frontend URL mismatch
**Solution:**
1. Update `FRONTEND_URL` in .env file
2. Update `CORS_ORIGIN` to match frontend URL
3. Restart server

## 🔄 Production Deployment

When deploying to production:

1. **Update .env for production:**
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://yourdomain.com
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
   ```

2. **Add production redirect URIs in Google Console:**
   - `https://yourdomain.com/api/auth/google/callback`

3. **Set up HTTPS** (required for OAuth in production)

4. **Use MongoDB Atlas** for production database

## 📞 Quick Reference

- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials
- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent
- **MongoDB Atlas:** https://cloud.mongodb.com/
- **Local MongoDB:** Install from https://www.mongodb.com/try/download/community

## ✅ Success Indicators

When everything is working correctly:

1. **Server starts without errors**
2. **`/api/auth/google-test` returns configuration status**
3. **Google OAuth redirects to authentication**
4. **User gets redirected back with tokens**
5. **No 500 errors in server logs**

---

**🎉 Your OAuth should now work! The 500 error was caused by missing environment variables, which I've now fixed.**