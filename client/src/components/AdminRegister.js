import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaMobile, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: '',
    mobile: ''
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      Swal.fire('Error', 'Passwords do not match', 'error');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      Swal.fire('Error', passwordError, 'error');
      return;
    }

    setLoading(true);

    try {
      // Show loading state immediately
      Swal.fire({
        title: 'Creating Admin Account...',
        text: 'Please wait while we create your admin account',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await axios.post('/api/auth/register-admin-user', {
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim() || undefined,
        name: formData.name.trim() || undefined,
        mobile: formData.mobile.trim() || undefined
      }, {
        timeout: 10000 // 10 second timeout
      });

      Swal.close();
      
      if (response.data.message) {
        await Swal.fire({
          icon: 'success',
          title: 'Admin Registration Successful!',
          text: response.data.message,
          timer: 3000,
          showConfirmButton: false
        });
        
        // Redirect to admin login
        navigate('/login?admin=true');
      }
    } catch (err) {
      Swal.close();
      
      if (err.code === 'ECONNABORTED') {
        Swal.fire('Timeout', 'Request took too long. Please try again.', 'error');
      } else if (err.response?.status === 400) {
        const errorMessage = err.response.data.message;
        // Handle specific validation errors
        if (errorMessage.includes('username')) {
          setValidationErrors({ username: errorMessage });
        } else {
          Swal.fire('Validation Error', errorMessage, 'error');
        }
      } else {
        const errorMessage = err.response?.data?.message || 'Registration failed. Please check your connection and try again.';
        Swal.fire('Error', errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-purple-600 p-0 md:p-5 font-sans">
      {/* Header with Back Button */}
      <div className="absolute top-2 left-2 md:top-5 md:left-5 z-10">
        <Link to="/login?admin=true" className="inline-flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 bg-white bg-opacity-20 text-white no-underline rounded-full text-sm font-semibold transition-all duration-300 border border-white border-opacity-30 hover:bg-opacity-30">
          ← Back to Login
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
            Admin Registration
          </p>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white/90 backdrop-blur-lg p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden border border-white/20">
          {/* Decorative background */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>

          <form onSubmit={handleSubmit}>
            <h3 className="m-0 mb-2.5 text-gray-800 text-xl md:text-2xl flex items-center gap-2.5">
              <FaUserPlus className="text-red-500" />
              Create Admin Account
            </h3>
            <p className="text-gray-600 mb-5 md:mb-6 text-sm">
              Create a new administrator account for Hareram DudhWale
            </p>

            <div className="relative mb-4">
              <FaUser className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
              <input
                className={`w-full pl-10 md:pl-12 p-3 md:p-4 border-2 rounded-xl text-base transition-colors duration-300 focus:outline-none focus:ring-2 ${
                  validationErrors.username 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-red-500 focus:ring-red-200'
                }`}
                type="text"
                name="username"
                placeholder="Enter admin username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
              {validationErrors.username && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.username}</p>
              )}
            </div>

            <div className="relative mb-4">
              <FaEnvelope className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
              <input
                className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                type="email"
                name="email"
                placeholder="Enter email address (optional)"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="relative mb-4">
              <FaMobile className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
              <input
                className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                type="tel"
                name="mobile"
                placeholder="Enter mobile number (optional)"
                value={formData.mobile}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="relative mb-4">
              <FaLock className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
              <input
                className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="text-xs space-y-1">
                    <div className={`flex items-center gap-1 ${
                      formData.password.length >= 8 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {formData.password.length >= 8 ? '✓' : '✗'} 8+ characters
                    </div>
                    <div className={`flex items-center gap-1 ${
                      /[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {/[A-Z]/.test(formData.password) ? '✓' : '✗'} Uppercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${
                      /[a-z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {/[a-z]/.test(formData.password) ? '✓' : '✗'} Lowercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${
                      /\d/.test(formData.password) ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {/\d/.test(formData.password) ? '✓' : '✗'} Number
                    </div>
                    <div className={`flex items-center gap-1 ${
                      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '✗'} Special character
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative mb-5">
              <FaLock className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
              <input
                className={`w-full pl-10 md:pl-12 p-3 md:p-4 border-2 rounded-xl text-base transition-colors duration-300 focus:outline-none focus:ring-2 ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-red-500 focus:ring-red-200'
                }`}
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-green-500 text-xs mt-1">Passwords match</p>
              )}
            </div>

            <button
              className="w-full p-3 md:p-4 bg-red-500 text-white border-none rounded-xl cursor-pointer text-base font-semibold transition-colors duration-300 hover:bg-red-600 mb-4"
              type="submit"
              disabled={loading}
            >
              {loading ? '🔐 Creating Account...' : '🚀 Create Admin Account'}
            </button>

            {/* Password Requirements */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Password Requirements:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Must contain uppercase letter</li>
                <li>• Must contain lowercase letter</li>
                <li>• Must contain a number</li>
                <li>• Must contain a special character</li>
              </ul>
            </div>
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-4 md:mt-7.5 text-center px-4 md:px-0">
          <p className="text-white text-opacity-60 text-xs m-0">
            © 2024 Hareram DudhWale. Fresh milk, happy customers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;