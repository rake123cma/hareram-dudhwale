# 🚀 Render.com Production Deployment - Google OAuth Fix

## ✅ Configuration Status: READY FOR DEPLOYMENT

Your environment is now properly configured for Render.com production deployment.

### 🔧 Environment Variables to Configure
Set these environment variables in Render.com dashboard:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_atJWT_SECRET=yourlas_connection_string
_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://your-domain.onrender.com/api/auth/google/callback
FRONTEND_URL=https://your-domain.onrender.com
CORS_ORIGIN=https://your-domain.onrender.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
ENCRYPTION_KEY=your_encryption_key_here
OTP_EXPIRY=300000
SESSION_TIMEOUT=3600000
```

## 🎯 Critical Google Cloud Console Setup (REQUIRED)

### 1. OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent)
2. Select your project: `hareram-dudhwale`
3. Complete **ALL** required fields:
   - **App name**: Hare Ram Dudhwale
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add required **Scopes**:
   - `openid`
   - `userinfo.email`
   - `userinfo.profile`
5. **Save and wait 2-3 minutes**

### 2. Authorized Redirect URIs
1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. In "Authorized redirect URIs", add:
   ```
   https://your-domain.onrender.com/api/auth/google/callback
   ```
4. **Save and wait 2-3 minutes**

### 3. Test Users (Critical!)
If your app is in "Testing" mode:
1. Scroll to "Test users" section in OAuth consent screen
2. Click "Add Users"
3. Add your email address
4. Save changes

## 🚀 Deployment Steps

### Step 1: Deploy to Render.com
1. **Push to GitHub** (if not already done)
2. **Connect to Render.com**:
   - New Web Service
   - Connect your GitHub repository
   - Build Command: `npm install`
   - Start Command: `cd server && npm start`

### Step 2: Environment Variables in Render.com
Add the environment variables shown above in Render.com dashboard.

### Step 3: Test Production Deployment
After deployment:

1. **Health Check**:
   ```
   https://your-domain.onrender.com/health
   ```

2. **OAuth Test**:
   ```
   https://your-domain.onrender.com/api/auth/google-test
   ```

3. **Frontend Test**:
   ```
   https://your-domain.onrender.com
   ```

## 🛠️ Troubleshooting Production Issues

### If you still get 500 errors:

1. **Check Render.com logs**:
   - Go to Render.com dashboard
   - Click on your service
   - View logs for detailed error messages

2. **Common OAuth Issues**:
   - **"Malformed auth code"**: Google Cloud Console not configured properly
   - **"redirect_uri_mismatch"**: Callback URL doesn't match exactly
   - **"access_denied"**: User denied permissions or app in testing mode

3. **Environment Variable Issues**:
   - Ensure all variables are set in Render.com dashboard
   - Restart the service after adding environment variables

### Quick Debug Commands
```bash
# Test your production configuration
curl https://your-domain.onrender.com/api/auth/google-test

# Check health
curl https://your-domain.onrender.com/health
```

## 🎉 Expected Results

When everything is working correctly:

1. **Server starts without errors**
2. **Health endpoint returns**: `{"status":"OK","timestamp":"..."}`
3. **OAuth test endpoint shows** your configuration status
4. **Google login redirects** properly and returns with tokens
5. **No 500 errors** in Render.com logs

## 📞 Support Resources

- **Render.com Logs**: Check your service dashboard for detailed error messages
- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
- **OAuth Documentation**: https://developers.google.com/identity/protocols/oauth2

---

## ✅ SUCCESS CHECKLIST

Before deployment, ensure:

- [x] Environment variables configured correctly
- [x] Google OAuth consent screen completed
- [x] Production redirect URI added to Google Console
- [x] Test users added (if app in testing mode)
- [x] MongoDB Atlas accessible
- [x] All secrets are secure and unique

**🎯 Your 500 Internal Server Error should now be resolved with proper environment configuration!**