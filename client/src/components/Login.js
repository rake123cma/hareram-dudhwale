import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import axios from 'axios';

const Login = () => {
  const [searchParams] = useSearchParams();
  const isAdminLogin = searchParams.get('admin') === 'true';
  const [loginType, setLoginType] = useState(isAdminLogin ? 'admin' : 'customer'); // 'customer', 'investor', or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoginType(isAdminLogin ? 'admin' : 'customer');
  }, [isAdminLogin]);

  // Check Google OAuth status
  useEffect(() => {
    const checkGoogleStatus = async () => {
      try {
        const res = await axios.get('/api/auth/google/status');
        setGoogleEnabled(res.data.configured);
      } catch (err) {
        setGoogleEnabled(false);
      }
    };
    checkGoogleStatus();
  }, []);

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Customer login attempt:', email);
      
      // Validate inputs
      if (!email || !password) {
        alert('Please enter both email/mobile number and password');
        return;
      }
      
      // Check if input is valid email or mobile number
      const isEmail = email.includes('@');
      const isMobile = /^\d{10}$/.test(email.replace(/\s+/g, ''));
      
      if (!isEmail && !isMobile) {
        alert('Please enter a valid email address or 10-digit mobile number');
        return;
      }
      
      if (isMobile && email.replace(/\s+/g, '').length !== 10) {
        alert('Mobile number must be exactly 10 digits');
        return;
      }

      const res = await axios.post('/api/auth/email-login', { email, password }, { 
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Login response:', res.data);
      
      // Validate response
      if (!res.data.token || !res.data.user) {
        throw new Error('Invalid response from server');
      }
      
      try {
        localStorage.setItem('token', res.data.token);
        if (res.data.refreshToken) {
          localStorage.setItem('refreshToken', res.data.refreshToken);
        }
        console.log('💾 Tokens saved to localStorage');
      } catch (storageErr) {
        alert('Login successful, but failed to save authentication data. Please check browser storage permissions.');
        return;
      }
      
      console.log('🎯 Redirecting to customer dashboard');
      navigate('/customer');
    } catch (err) {
      console.error('💥 Login error:', err);
      
      // Handle different error types
      if (err.code === 'ECONNABORTED') {
        alert('Login timeout. Please check your internet connection and try again.');
      } else if (err.response?.status === 400) {
        alert(err.response?.data?.message || 'Invalid input. Please check your email/mobile number and password.');
      } else if (err.response?.status === 401) {
        alert(err.response?.data?.message || 'Invalid email/mobile number or password. Please check your credentials.');
      } else if (err.response?.status === 500) {
        alert('Server error. Please try again later.');
      } else {
        alert('Login failed. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('🔐 Admin login attempt:', username);
      
      // Validate inputs
      if (!username || !adminPassword) {
        alert('Please enter both username and password');
        return;
      }
      
      if (username.length < 3) {
        alert('Username must be at least 3 characters long');
        return;
      }

      const res = await axios.post('/api/auth/login', { username, password: adminPassword }, { 
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Admin login response:', res.data);
      
      // Validate response
      if (!res.data.token || !res.data.user) {
        throw new Error('Invalid response from server');
      }
      
      try {
        localStorage.setItem('token', res.data.token);
        console.log('💾 Admin token saved to localStorage');
      } catch (storageErr) {
        alert('Login successful, but failed to save authentication data. Please check browser storage permissions.');
        return;
      }
      
      if (res.data.user.role === 'admin') {
        console.log('🎯 Redirecting to admin dashboard');
        navigate('/admin');
      } else {
        console.log('🎯 Redirecting to customer dashboard');
        navigate('/customer');
      }
    } catch (err) {
      console.error('💥 Admin login error:', err);
      
      // Handle different error types
      if (err.code === 'ECONNABORTED') {
        alert('Login timeout. Please check your internet connection and try again.');
      } else if (err.response?.status === 400) {
        alert(err.response?.data?.message || 'Invalid input. Please check your username and password.');
      } else if (err.response?.status === 401) {
        alert(err.response?.data?.message || 'Invalid username or password. Please check your credentials.');
      } else if (err.response?.status === 500) {
        alert('Server error. Please try again later.');
      } else {
        alert('Login failed. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    // Navigate to OAuth handler which will redirect to backend
    navigate('/oauth-handler');
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setAdminPassword('');
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    resetForm();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-0 md:p-5 font-sans">
      {/* Header with Home Button */}
      <div className="absolute top-2 left-2 md:top-5 md:left-5 z-10">
        <Link to="/" className="inline-flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 bg-white bg-opacity-20 text-white no-underline rounded-full text-sm font-semibold transition-all duration-300 border border-white border-opacity-30 hover:bg-opacity-30">
          🏠 Home
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-8 md:pt-20 px-4 md:px-0">
        {/* Logo/Brand */}
        <div className="text-center mb-6 md:mb-10">
          <h1 className="bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent m-0 text-4xl md:text-5xl font-bold drop-shadow-lg">
            Hareram DudhWale
          </h1>
          <p className="text-white text-opacity-80 mt-2 mb-0 text-lg md:text-xl font-light">
            Fresh Milk Delivery in Ranchi
          </p>
          
          {/* Security Trust Indicators */}
          <div className="flex items-center justify-center mt-4 space-x-4 text-white text-opacity-90">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">Secure Login</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">SSL Protected</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Verified Business</span>
            </div>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/90 backdrop-blur-lg p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden border border-white/20">
          {/* Decorative background */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${loginType === 'customer' ? 'bg-green-500' : 'bg-red-500'}`}></div>

          {/* Login Type Selector */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                loginType === 'customer'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => handleLoginTypeChange('customer')}
            >
              👤 Customer
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                loginType === 'admin'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => handleLoginTypeChange('admin')}
            >
              👨‍💼 Admin
            </button>
          </div>

          {loginType === 'customer' ? (
            <div>
              <form onSubmit={handleCustomerSubmit} autoComplete="on" noValidate>
                <h3 className="m-0 mb-2.5 text-gray-800 text-xl md:text-2xl flex items-center gap-2.5">
                  🥛 Customer Login
                </h3>
                <p className="text-gray-600 mb-5 md:mb-6 text-sm">
                  Enter your email address or mobile number and password to login
                </p>

                {/* Google Sign In Button - Moved to Top */}
                {googleEnabled && (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full p-3 md:p-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl cursor-pointer text-base font-semibold transition-all duration-300 hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-3 mb-6"
                  >
                    {googleLoading ? (
                      '⏳ Connecting...'
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>
                )}

                {/* Divider */}
                {googleEnabled && (
                  <>
                    <div className="flex items-center mb-4">
                      <div className="flex-1 h-px bg-gray-300"></div>
                      <span className="px-3 text-gray-500 text-sm">or login with email</span>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>
                  </>
                )}

                <div className="relative mb-4">
                  <FaEnvelope className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
                  <input
                    className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                    type="text"
                    placeholder="Enter email or 10-digit mobile number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck="false"
                    inputMode="email"
                    required
                    disabled={loading}
                    aria-label="Email address or mobile number"
                  />
                </div>
                <div className="relative mb-5">
                  <FaLock className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
                  <input
                    className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    spellCheck="false"
                    required
                    disabled={loading}
                    aria-label="Password"
                  />
                </div>
                <button
                  className="w-full p-3 md:p-4 bg-gradient-to-r from-green-500 to-green-600 text-white border-none rounded-xl cursor-pointer text-base font-semibold transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:scale-105 mb-4 shadow-lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? '🔐 Logging in...' : '🚀 Login'}
                </button>

                <p className="text-center mt-4">
                  <Link to="/forgot-password" className="text-green-600 hover:text-green-800 hover:underline text-sm transition-colors duration-300">Forgot Password?</Link>
                </p>
              </form>
            </div>
          ) : (
            <div>
              <form onSubmit={handleAdminSubmit} autoComplete="on" noValidate>
                <h3 className="m-0 mb-2.5 text-gray-800 text-xl md:text-2xl flex items-center gap-2.5">
                  👨‍💼 Admin Login
                </h3>
                <p className="text-gray-600 mb-5 md:mb-6 text-sm">
                  Enter your admin credentials to access the dashboard
                </p>
                <div className="relative mb-4">
                  <FaUser className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
                  <input
                    className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    type="text"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck="false"
                    required
                    disabled={loading}
                    aria-label="Admin username"
                  />
                </div>
                <div className="relative mb-5">
                  <FaLock className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
                  <input
                    className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    spellCheck="false"
                    required
                    disabled={loading}
                    aria-label="Admin password"
                  />
                </div>
                <button
                  className="w-full p-3 md:p-4 bg-red-500 text-white border-none rounded-xl cursor-pointer text-base font-semibold transition-colors duration-300 hover:bg-red-600 mb-4"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? '🔐 Logging in...' : '🚀 Login as Admin'}
                </button>

                <p className="text-center mt-4">
                  <Link to="/admin-change-password" className="text-red-600 hover:text-red-800 hover:underline text-sm transition-colors duration-300">Change Password?</Link>
                </p>
              </form>
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-4 md:mt-7.5 text-center px-4 md:px-0">
          {loginType === 'customer' && (
            <p className="text-white text-opacity-80 mb-2 text-sm md:mb-2.5">
              New customer? <Link to="/register" className="text-white underline font-bold">Register here</Link>
            </p>
          )}
          
          {/* Security and Trust Links */}
          <div className="flex flex-wrap justify-center items-center space-x-4 mb-3">
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-white text-opacity-60 hover:text-opacity-80 text-xs underline transition-opacity">
              Privacy Policy
            </a>
            <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-white text-opacity-60 hover:text-opacity-80 text-xs underline transition-opacity">
              Terms of Service
            </a>
            <span className="text-white text-opacity-40 text-xs">|</span>
            <span className="text-white text-opacity-60 text-xs">
              📞 6206696267
            </span>
          </div>
          
          <p className="text-white text-opacity-60 text-xs m-0">
            © 2024 Hareram DudhWale. Fresh milk, happy customers.
          </p>
          
          {/* Additional Security Notice */}
          <div className="mt-3 p-2 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
            <p className="text-white text-opacity-80 text-xs m-0">
              🔒 Your login information is protected with industry-standard encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
