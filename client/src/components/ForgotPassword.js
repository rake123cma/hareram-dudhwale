import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: enter mobile, 2: enter OTP and new password
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill mobile number if coming from register
  useEffect(() => {
    if (location.state && location.state.mobile) {
      setMobile(location.state.mobile);
    }
  }, [location.state]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/auth/forgot-password', { mobile });
      alert('OTP sent to your mobile number');
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/reset-password', {
        mobile,
        otp,
        newPassword
      });
      alert('Password reset successful! Please login with your new password.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-5">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
        <h2 className="bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent mb-2.5 text-4xl font-bold">Hareram DudhWale</h2>
        <p className="text-gray-600 mb-7.5 text-lg">Reset Your Password</p>
        
        {/* Security Trust Indicators */}
        <div className="flex items-center justify-center space-x-4 mb-4 text-gray-500">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Secure Process</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">SSL Protected</span>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} autoComplete="on" noValidate>
            <h3 className="text-gray-800 mb-5 text-xl">Enter Your Mobile Number</h3>
            <div className="mb-5 text-left">
              <label className="block mb-[5px] font-semibold text-gray-700 text-sm">Mobile Number *</label>
              <input
                className="w-full p-3 px-[15px] border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
                maxLength="10"
                autoComplete="tel"
                autoCapitalize="none"
                spellCheck="false"
                inputMode="tel"
                required
                aria-label="Mobile number"
              />
            </div>
            <button
              className="w-full p-4 bg-green-500 text-white border-none rounded-lg text-base font-bold cursor-pointer transition-colors duration-300 hover:bg-green-600 mb-4 disabled:bg-gray-500 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} autoComplete="on" noValidate>
            <h3 className="text-gray-800 mb-5 text-xl">Enter OTP and New Password</h3>
            <div className="mb-5 text-left">
              <label className="block mb-[5px] font-semibold text-gray-700 text-sm">OTP *</label>
              <input
                className="w-full p-3 px-[15px] border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                pattern="[0-9]{6}"
                maxLength="6"
                autoComplete="one-time-code"
                autoCapitalize="none"
                spellCheck="false"
                inputMode="numeric"
                required
                aria-label="OTP code"
              />
            </div>
            <div className="mb-5 text-left">
              <label className="block mb-[5px] font-semibold text-gray-700 text-sm">New Password *</label>
              <input
                className="w-full p-3 px-[15px] border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                autoCapitalize="none"
                spellCheck="false"
                required
                aria-label="New password"
              />
            </div>
            <div className="mb-5 text-left">
              <label className="block mb-[5px] font-semibold text-gray-700 text-sm">Confirm New Password *</label>
              <input
                className="w-full p-3 px-[15px] border-2 border-gray-200 rounded-lg text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                autoCapitalize="none"
                spellCheck="false"
                required
                aria-label="Confirm new password"
              />
            </div>
            <button
              className="w-full p-4 bg-green-500 text-white border-none rounded-lg text-base font-bold cursor-pointer transition-colors duration-300 hover:bg-green-600 mb-4 disabled:bg-gray-500 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-5 pt-5 border-t border-gray-200">
          <p className="m-0 text-gray-600 text-sm">
            Remember your password? <a href="/login" className="text-blue-500 no-underline font-bold hover:underline">Login here</a>
          </p>
          
          {/* Security Notice */}
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-xs m-0 text-center">
              🔒 Your information is protected with bank-level security
            </p>
          </div>
          
          {/* Contact Information */}
          <div className="mt-2 text-center">
            <p className="text-gray-500 text-xs m-0">
              Need help? Contact: 6206696267
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
