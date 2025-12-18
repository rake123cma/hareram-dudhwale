# 🚨 Production OAuth Error - "Malformed auth code" - FIX NEEDED

## Current Issue
You're getting `TokenError: Malformed auth code` in production on Render.com. This is a **Google Cloud Console configuration issue**, not a code issue.

## 🎯 Root Cause
The error occurs because Google OAuth is not properly configured for your production domain on Render.com.

## ✅ IMMEDIATE FIX REQUIRED

### Step 1: Google Cloud Console OAuth Setup
Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent) and ensure:

1. **OAuth Consent Screen Completed**:
   - App name: "Hare Ram Dudhwale"
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes: `openid`, `userinfo.email`, `userinfo.profile`
   - **Save and wait 2-3 minutes**

2. **Authorized Redirect URIs** (CRITICAL):
   - Go to [Credentials](https://console.cloud.google.com/apis/credentials)
   - Click your OAuth 2.0 Client ID
   - Add this exact URL:
   ```
   https://hareram-dudhwale.onrender.com/api/auth/google/callback
   ```
   - **Save and wait 2-3 minutes**

3. **Test Users** (if in testing mode):
   - In OAuth consent screen, add your email to "Test users"
   - **Save and wait 2-3 minutes**

### Step 2: Verify Production Environment Variables
In Render.com dashboard, ensure these are set:
```
NODE_ENV=production
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
GOOGLE_CALLBACK_URL=https://hareram-dudhwale.onrender.com/api/auth/google/callback
FRONTEND_URL=https://hareram-dudhwale.onrender.com
```

### Step 3: Test OAuth Flow
After making Google Cloud Console changes:
1. **Wait 2-3 minutes** for changes to propagate
2. **Visit your production site**: https://hareram-dudhwale.onrender.com
3. **Try Google login**
4. **Should work without "Malformed auth code" error**

## 🔍 Common "Malformed auth code" Causes
1. **OAuth consent screen not completed**
2. **Wrong redirect URI** (must match exactly)
3. **App in testing mode** without test users
4. **Google OAuth not published** for production
5. **Client ID/Secret mismatch**

## ✅ Expected Result
After fixing Google Cloud Console:
- ✅ No "Malformed auth code" error
- ✅ Google login redirects properly
- ✅ User gets authenticated successfully
- ✅ JWT tokens generated correctly

## 📞 Quick Check
Test your OAuth configuration:
```
https://hareram-dudhwale.onrender.com/api/auth/google-test
```

This should show your production configuration status.

**The "Malformed auth code" error is 100% a Google Cloud Console configuration issue, not a code problem!**