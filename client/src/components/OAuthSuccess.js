import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processOAuthSuccess = () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const userData = searchParams.get('user');

        if (!token || !refreshToken || !userData) {
          setError('Missing authentication data');
          setProcessing(false);
          return;
        }

        // Parse user data
        let user;
        try {
          user = JSON.parse(decodeURIComponent(userData));
        } catch (err) {
          setError('Invalid user data');
          setProcessing(false);
          return;
        }

        // Store tokens
        try {
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);
        } catch (err) {
          setError('Failed to save authentication data');
          setProcessing(false);
          return;
        }

        // Redirect based on user role
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/customer');
        }
      } catch (err) {
        setError('Authentication failed');
        setProcessing(false);
      }
    };

    // Small delay to show processing state
    const timer = setTimeout(() => {
      processOAuthSuccess();
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors duration-300"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl text-center max-w-md">
        <div className="text-green-500 text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {processing ? 'Completing Login...' : 'Login Successful!'}
        </h2>
        <p className="text-gray-600 mb-6">
          {processing 
            ? 'Please wait while we complete your authentication...' 
            : 'Redirecting to your dashboard...'
          }
        </p>
        
        {processing && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthSuccess;