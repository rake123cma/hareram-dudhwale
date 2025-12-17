import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FaPhone, FaLock, FaUser } from 'react-icons/fa';
import axios from 'axios';

const Login = () => {
  const [searchParams] = useSearchParams();
  const isAdminLogin = searchParams.get('admin') === 'true';
  const [loginType, setLoginType] = useState(isAdminLogin ? 'admin' : 'customer'); // 'customer', 'investor', or 'admin'
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone', 'email', 'google'
  const navigate = useNavigate();

  useEffect(() => {
    setLoginType(isAdminLogin ? 'admin' : 'customer');
  }, [isAdminLogin]);

  // Handle Google OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const user = searchParams.get('user');
    const error = searchParams.get('error');

    if (token && refreshToken && user) {
      // Successful OAuth login
      setLoading(true);
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        const userData = JSON.parse(decodeURIComponent(user));
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/customer');
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        alert('Google login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (error) {
      // OAuth error
      alert('Google login failed. Please try again.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, navigate]);

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res;

      if (authMethod === 'phone') {
        // Phone/password login
        res = await axios.post('/api/auth/login', { username: mobile, password }, { timeout: 5000 });
      } else {
        // Email/password login
        res = await axios.post('/api/auth/email-login', { email, password: emailPassword }, { timeout: 5000 });
      }

      try {
        localStorage.setItem('token', res.data.token);
        if (res.data.refreshToken) {
          localStorage.setItem('refreshToken', res.data.refreshToken);
        }
      } catch (storageErr) {
        alert('Login successful, but failed to save authentication data. Please check browser storage permissions.');
        return;
      }
      navigate('/customer');
    } catch (err) {
      // Handle authentication errors
      if (err.response?.status === 401) {
        if (authMethod === 'phone') {
          // Check if mobile is registered by trying to send OTP (silently)
          try {
            await axios.post('/api/auth/send-otp', { mobile }, { timeout: 3000 });
            alert('Invalid password. Please check your password.');
          } catch (otpErr) {
            alert('This mobile number is not registered. Redirecting to registration page.');
            navigate('/register', { state: { mobile } });
          }
        } else {
          alert('Invalid email or password. Please check your credentials.');
        }
      } else {
        alert('Login failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { username, password: adminPassword }, { timeout: 5000 });
      try {
        localStorage.setItem('token', res.data.token);
      } catch (storageErr) {
        alert('Login successful, but failed to save authentication data. Please check browser storage permissions.');
        return;
      }
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/customer');
      }
    } catch (err) {
      // Handle authentication errors
      if (err.response?.status === 401) {
        alert('Invalid username or password. Please check your credentials.');
      } else {
        alert('Login failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMobile('');
    setPassword('');
    setUsername('');
    setAdminPassword('');
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    resetForm();
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    try {
      // Redirect to backend OAuth endpoint
      window.location.href = `${window.location.protocol}//${window.location.hostname}:5000/api/auth/google`;
    } catch (error) {
      alert('Failed to initiate Google login. Please try again.');
      setGoogleLoading(false);
    }
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
        </div>

        {/* Login Form Card */}
        <div className="bg-white/90 backdrop-blur-lg p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden border border-white/20">
          {/* Decorative background */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${loginType === 'customer' ? 'bg-green-500' : 'bg-red-500'}`}></div>

          {loginType === 'customer' ? (
            <div>
              <form onSubmit={handleCustomerSubmit}>
                <h3 className="m-0 mb-2.5 text-gray-800 text-xl md:text-2xl flex items-center gap-2.5">
                  🥛 Customer Login
                </h3>
                {/* Auth Method Selector */}
                <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                      authMethod === 'phone'
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setAuthMethod('phone')}
                  >
                    📱 Phone
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                      authMethod === 'email'
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setAuthMethod('email')}
                  >
                    ✉️ Email
                  </button>
                </div>

                <p className="text-gray-600 mb-5 md:mb-6 text-sm">
                  {authMethod === 'phone'
                    ? 'Enter your mobile number and password to login'
                    : 'Enter your email and password to login'
                  }
                </p>
                {authMethod === 'phone' ? (
                  <>
                    <div className="relative mb-4">
                      <FaPhone className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
                      <input
                        className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        pattern="[0-9]{10}"
                        maxLength="10"
                        autoComplete="username"
                        required
                        disabled={loading}
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
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative mb-4">
                      <FaUser className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
                      <input
                        className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="relative mb-5">
                      <FaLock className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
                      <input
                        className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                        type="password"
                        placeholder="Enter your password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
                <button
                  className="w-full p-3 md:p-4 bg-gradient-to-r from-green-500 to-green-600 text-white border-none rounded-xl cursor-pointer text-base font-semibold transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:scale-105 mb-4 shadow-lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? '🔐 Logging in...' : '🚀 Login'}
                </button>

                {/* Google Login Button */}
                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>
                  <button
                    className="w-full mt-4 p-3 md:p-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl cursor-pointer text-base font-semibold transition-all duration-300 hover:bg-gray-50 hover:shadow-md flex items-center justify-center gap-3"
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {googleLoading ? '🔄 Signing in with Google...' : 'Continue with Google'}
                  </button>
                </div>

                <p className="text-center mt-4">
                  <Link to="/forgot-password" className="text-green-600 hover:text-green-800 hover:underline text-sm transition-colors duration-300">Forgot Password?</Link>
                </p>
              </form>
            </div>
          ) : (
            <div>
              <form onSubmit={handleAdminSubmit}>
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
                    required
                    disabled={loading}
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
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  className="w-full p-3 md:p-4 bg-red-500 text-white border-none rounded-xl cursor-pointer text-base font-semibold transition-colors duration-300 hover:bg-red-600"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? '🔐 Logging in...' : '🚀 Login as Admin'}
                </button>
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
          <p className="text-white text-opacity-60 text-xs m-0">
            © 2024 Hareram DudhWale. Fresh milk, happy customers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
