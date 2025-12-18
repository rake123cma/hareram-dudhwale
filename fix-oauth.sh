#!/bin/bash

# Google OAuth Troubleshooting Script
# This script helps diagnose and fix OAuth issues

echo "🔧 Google OAuth Troubleshooting Script"
echo "====================================="

# Test environment variables
echo "\n📋 Testing Environment Variables:"
echo "--------------------------------"

if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Load environment variables
    source .env
    
    # Check critical variables
    echo ""
    echo "🔍 Checking Critical Variables:"
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your_64_character_super_secure_jwt_secret_here_change_this_immediately" ]; then
        echo "❌ JWT_SECRET: Missing or placeholder value"
    else
        echo "✅ JWT_SECRET: Present"
    fi
    
    if [ -z "$JWT_REFRESH_SECRET" ] || [ "$JWT_REFRESH_SECRET" = "your_64_character_super_secure_refresh_secret_here_change_this_immediately" ]; then
        echo "❌ JWT_REFRESH_SECRET: Missing or placeholder value"
    else
        echo "✅ JWT_REFRESH_SECRET: Present"
    fi
    
    if [ -z "$MONGO_URI" ]; then
        echo "❌ MONGO_URI: Missing"
    else
        echo "✅ MONGO_URI: Present"
    fi
    
    if [ -z "$GOOGLE_CLIENT_ID" ] || [ "$GOOGLE_CLIENT_ID" = "your_google_client_id_here" ]; then
        echo "❌ GOOGLE_CLIENT_ID: Missing or placeholder value"
        echo "   💡 Get from: https://console.cloud.google.com/apis/credentials"
    else
        echo "✅ GOOGLE_CLIENT_ID: Present"
    fi
    
    if [ -z "$GOOGLE_CLIENT_SECRET" ] || [ "$GOOGLE_CLIENT_SECRET" = "your_google_client_secret_here" ]; then
        echo "❌ GOOGLE_CLIENT_SECRET: Missing or placeholder value"
        echo "   💡 Get from: https://console.cloud.google.com/apis/credentials"
    else
        echo "✅ GOOGLE_CLIENT_SECRET: Present"
    fi
    
    if [ -z "$GOOGLE_CALLBACK_URL" ]; then
        echo "❌ GOOGLE_CALLBACK_URL: Missing"
    else
        echo "✅ GOOGLE_CALLBACK_URL: $GOOGLE_CALLBACK_URL"
    fi
    
else
    echo "❌ .env file missing!"
    echo "   💡 Run: cp .env.example .env (or create .env manually)"
fi

echo "\n🚀 Quick Fix Commands:"
echo "----------------------"
echo "1. Generate new JWT secrets:"
echo "   node generate-secrets.js"
echo ""
echo "2. Test server startup:"
echo "   cd server && npm install && npm start"
echo ""
echo "3. Test OAuth configuration:"
echo "   curl http://localhost:5000/api/auth/google-test"
echo ""
echo "4. Google Cloud Console:"
echo "   https://console.cloud.google.com/apis/credentials"

echo "\n📝 Next Steps:"
echo "-------------"
echo "1. ✅ Update .env file with your Google OAuth credentials"
echo "2. ✅ Set up MongoDB connection (MONGO_URI)"
echo "3. ✅ Configure Google Cloud Console OAuth settings"
echo "4. ✅ Test the server: npm run server"
echo "5. ✅ Test OAuth: Visit /api/auth/google-test endpoint"