import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Google OAuth endpoint on backend server
    const backendUrl = 'http://localhost:5000/api/auth/google';
    window.location.href = backendUrl;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Redirecting to Google</h2>
        <p className="text-gray-600">Please wait while we redirect you to Google for authentication...</p>
        <div className="mt-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default OAuthHandler;