import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
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

        <div className="mt-5 pt-5 border-t border-gray-200">
          <p className="m-0 text-gray-600 text-sm">Already have an account? <a href="/login" className="text-blue-500 no-underline font-bold hover:underline">Login here</a></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
