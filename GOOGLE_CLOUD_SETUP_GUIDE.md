# 🔧 Google Cloud Console Setup - Step-by-Step Guide

## 🎯 Fix "Malformed auth code" Error

Your production site is failing because Google OAuth is not properly configured for your Render.com domain.

## 📋 Step-by-Step Setup

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. **Select your project**: `hareram-dudhwale`
3. If project not visible, create new project with name "hareram-dudhwale"

### Step 2: OAuth Consent Screen Setup
1. **Navigate to**: APIs & Services → OAuth consent screen
2. **Choose User Type**: 
   - **External** (if you want public access)
   - **Internal** (if only Google Workspace users)

3. **App Information**:
   - **App name**: `Hare Ram Dudhwale`
   - **User support email**: Your email address
   - **Developer contact**: Your email address

4. **App Logo** (optional):
   - Upload your app logo (if available)

5. **App Domain** (optional):
   - **Application home page**: https://hareram-dudhwale.onrender.com
   - **Application privacy policy link**: https://hareram-dudhwale.onrender.com/privacy-policy
   - **Application terms of service link**: https://hareram-dudhwale.onrender.com/terms-of-service

6. **Authorized domains**:
   - Add: `hareram-dudhwale.onrender.com`

7. **Developer contact information**:
   - Add your email address

8. **Click**: **SAVE AND CONTINUE**

### Step 3: Configure Scopes
1. **Click**: **ADD OR REMOVE SCOPES**
2. **Search and add these scopes**:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`

3. **Click**: **UPDATE**
4. **Click**: **SAVE AND CONTINUE**

### Step 4: Add Test Users (Important!)
1. **Click**: **ADD USERS**
2. **Add your email address**
3. **Click**: **SAVE**

4. **Note**: If you plan to make app public, you can skip this step later

5. **Click**: **SAVE AND CONTINUE**

### Step 5: Create OAuth 2.0 Credentials
1. **Go to**: APIs & Services → Credentials
2. **Click**: **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**

3. **Choose Application Type**: **Web application**

4. **Name**: `Hare Ram Dudhwale Web App`

5. **Authorized JavaScript origins**:
   - Add: `https://hareram-dudhwale.onrender.com`

6. **Authorized redirect URIs** (CRITICAL):
   - Add: `https://hareram-dudhwale.onrender.com/api/auth/google/callback`

7. **Click**: **CREATE**

8. **Copy the Client ID and Client Secret** (you'll need these for Render.com)

### Step 6: Wait for Propagation
**IMPORTANT**: Wait **2-3 minutes** before testing OAuth.

### Step 7: Update Render.com Environment Variables
In your Render.com dashboard, ensure these are set:
```
NODE_ENV=production
GOOGLE_CLIENT_ID=your_copied_client_id
GOOGLE_CLIENT_SECRET=your_copied_client_secret
GOOGLE_CALLBACK_URL=https://hareram-dudhwale.onrender.com/api/auth/google/callback
FRONTEND_URL=https://hareram-dudhwale.onrender.com
CORS_ORIGIN=https://hareram-dudhwale.onrender.com
```

## ✅ Verification Steps

### Test OAuth Configuration
Visit: https://hareram-dudhwale.onrender.com/api/auth/google-test

This should show your production configuration status.

### Test Google Login
1. Visit: https://hareram-dudhwale.onrender.com
2. Click "Login with Google"
3. Should redirect to Google authentication
4. Should return with authenticated user (no "Malformed auth code" error)

## 🎯 Expected Results
After proper setup:
- ✅ No "Malformed auth code" errors
- ✅ Google OAuth redirects work properly
- ✅ User authentication successful
- ✅ JWT tokens generated correctly

## 🚨 Common Mistakes
1. **Redirect URI mismatch**: Must be exactly `https://hareram-dudhwale.onrender.com/api/auth/google/callback`
2. **Not waiting 2-3 minutes**: Google needs time to propagate changes
3. **Testing mode**: If in testing mode, must add test users
4. **Wrong domain**: Using localhost URLs instead of production domain

## 📞 URLs for Quick Access
- **OAuth Consent Screen**: https://console.cloud.google.com/apis/credentials/consent
- **Credentials**: https://console.cloud.google.com/apis/credentials
- **Your Production Site**: https://hareram-dudhwale.onrender.com
- **OAuth Test**: https://hareram-dudhwale.onrender.com/api/auth/google-test

**Once you complete this setup, your Google OAuth will work perfectly in production!**