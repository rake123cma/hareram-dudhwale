import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    pincode: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill mobile number if coming from login
  useEffect(() => {
    if (location.state && location.state.mobile) {
      setFormData(prev => ({
        ...prev,
        phone: location.state.mobile
      }));
    }
  }, [location.state]);

  // Handle Google OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const user = searchParams.get('user');
    const error = searchParams.get('error');

    if (token && refreshToken && user) {
      // Successful OAuth registration/login
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
        alert('Google signup failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (error) {
      // OAuth error
      alert('Google signup failed. Please try again.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const registrationData = {
      ...formData
    };

    try {
      // Check if phone number already exists in database
      const existingCheck = await axios.get(`/api/customers?phone=${formData.phone}`);
      if (existingCheck.data && existingCheck.data.length > 0) {
        const userChoice = window.confirm('This mobile number is already registered. Would you like to reset your password instead?');
        if (userChoice) {
          navigate('/forgot-password', { state: { mobile: formData.phone } });
        } else {
          navigate('/login');
        }
        setLoading(false);
        return;
      }

      await axios.post('/api/auth/register', registrationData);
      alert('Registration successful! You can now login with your mobile number and password.');
      navigate('/login');
    } catch (err) {
      // Registration failed - show error message
      alert('Registration failed. Please try again later or contact support.');
      // Don't navigate to login on failure
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      pincode: '',
      password: ''
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-5">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
        <h2 className="bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent mb-2.5 text-4xl font-bold">Hareram DudhWale</h2>
        <p className="text-gray-600 mb-7.5 text-lg">Create your customer account</p>

        {/* Google Signup Button - Moved to Top */}
        <div className="mb-6">
          <button
            className="w-full p-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-base font-semibold transition-all duration-300 hover:bg-gray-50 hover:shadow-md flex items-center justify-center gap-3"
            type="button"
            onClick={() => {
              // Simple direct redirect - React proxy will handle it
              window.location.href = '/api/auth/google';
            }}
            disabled={loading}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <div className="relative mt-6 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">Or create account manually</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <h3 className="text-gray-800 mb-5 text-xl">Customer Registration</h3>

          <div className="flex gap-[15px] mb-5 sm:flex-col">
            <div className="flex-1 text-left">
              <label className="block mb-[5px] font-semibold text-gray-700 text-sm">Full Name *</label>
              <input
                className="w-full p-3 px-[15px] border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="flex-1 text-left">
              <label className="block mb-[5px] font-semibold text-gray-700 text-sm">Mobile Number *</label>
              <input
                className="w-full p-3 px-[15px] border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
                maxLength="10"
                required
              />
            </div>
          </div>

          <div className="flex gap-[15px] mb-5 sm:flex-col">
            <div className="flex-1 text-left">
              <label className="block mb-[5px] font-semibold text-gray-700 text-sm">Email Address</label>
              <input
                className="w-full p-3 px-[15px] border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
            </div>
            <div className="flex-1 text-left">
              <label className="block mb-[5px] font-semibold text-gray-700 text-sm">Password *</label>
              <input
                className="w-full p-3 px-[15px] border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create password"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="mb-5 text-left">
            <label className="block mb-[5px] font-semibold text-gray-700 text-sm">Pincode</label>
            <input
              className="w-full p-3 px-[15px] border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none"
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
              placeholder="Enter pincode"
              pattern="[0-9]{6}"
              maxLength="6"
            />
          </div>

          <div className="mb-5 text-left">
            <label className="block mb-[5px] font-semibold text-gray-700 text-sm">Delivery Address *</label>
            <textarea
              className="w-full p-3 px-[15px] border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none resize-y min-h-20"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter your complete delivery address"
              rows="3"
              required
            />
          </div>

          <button className="w-full p-4 bg-green-500 text-white border-none rounded-lg text-base font-bold cursor-pointer transition-colors duration-300 hover:bg-green-600 mb-4 disabled:bg-gray-500 disabled:cursor-not-allowed" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          <button className="w-full p-3 bg-gray-500 text-white border-none rounded-lg text-base cursor-pointer transition-colors duration-300 hover:bg-gray-600" type="button" onClick={resetForm}>
            Reset Form
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-5 pt-5 border-t border-gray-200">
          <p className="m-0 text-gray-600 text-sm">Already have an account? <a href="/login" className="text-blue-500 no-underline font-bold hover:underline">Login here</a></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
