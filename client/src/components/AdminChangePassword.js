import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

const AdminChangePassword = () => {
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      alert('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/change-admin-password', {
        username,
        currentPassword,
        newPassword
      });

      alert('Password changed successfully! Please login with your new password.');
      navigate('/login?admin=true');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 p-0 md:p-5 font-sans">
      {/* Header with Back Button */}
      <div className="absolute top-2 left-2 md:top-5 md:left-5 z-10">
        <Link to="/login" className="inline-flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 bg-white bg-opacity-20 text-white no-underline rounded-full text-sm font-semibold transition-all duration-300 border border-white border-opacity-30 hover:bg-opacity-30">
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
            Admin Password Change
          </p>
        </div>

        {/* Change Password Form Card */}
        <div className="bg-white/90 backdrop-blur-lg p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden border border-white/20">
          {/* Decorative background */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>

          <form onSubmit={handleSubmit}>
            <h3 className="m-0 mb-2.5 text-gray-800 text-xl md:text-2xl flex items-center gap-2.5">
              🔒 Change Admin Password
            </h3>
            <p className="text-gray-600 mb-5 md:mb-6 text-sm">
              Enter your admin credentials to change password
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

            <div className="relative mb-4">
              <FaLock className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
              <input
                className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                type={showPasswords ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            <div className="relative mb-4">
              <FaLock className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
              <input
                className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                type={showPasswords ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </div>

            <div className="relative mb-5">
              <FaLock className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base md:text-lg" />
              <input
                className="w-full pl-10 md:pl-12 p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base transition-colors duration-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                type={showPasswords ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </div>

            {/* Show/Hide Password Toggle */}
            <div className="flex items-center mb-5">
              <button
                type="button"
                className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm transition-colors duration-300"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <FaEyeSlash /> : <FaEye />}
                {showPasswords ? 'Hide' : 'Show'} passwords
              </button>
            </div>

            <button
              className="w-full p-3 md:p-4 bg-red-500 text-white border-none rounded-xl cursor-pointer text-base font-semibold transition-colors duration-300 hover:bg-red-600 mb-4"
              type="submit"
              disabled={loading}
            >
              {loading ? '🔄 Changing Password...' : '🔒 Change Password'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 md:mt-7.5 text-center px-4 md:px-0">
          <p className="text-white text-opacity-60 text-xs m-0">
            © 2024 Hareram DudhWale. Fresh milk, happy customers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminChangePassword;