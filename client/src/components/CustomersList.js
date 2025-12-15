import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSync } from 'react-icons/fa';

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    pincode: '',
    category: '',
    billing_type: 'subscription',
    billing_frequency: 'monthly',
    delivery_time: 'morning',
    subscription_amount: '',
    balance_due: '',
    customer_type: 'daily milk customer',
    registration_source: 'admin',
    is_active: true
  });

  useEffect(() => {
    fetchCustomers();
    fetchCategories();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/customers');
      // Filter to show only milk customers (those with customer_type === 'daily milk customer')
      const milkCustomers = response.data.filter(customer => customer.customer_type === 'daily milk customer');
      setCustomers(milkCustomers);
      setLoading(false);
    } catch (err) {
      // API not available - using empty data as no temporary storage allowed
      setCustomers([]);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = {
        ...formData,
        price_per_liter: formData.price_per_liter ? parseFloat(formData.price_per_liter) : undefined
      };

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (editingCustomer) {
        await axios.put(`http://localhost:5000/api/customers/${editingCustomer._id}`, data, config);
      } else {
        await axios.post('http://localhost:5000/api/customers', data, config);
      }

      fetchCustomers();
      resetForm();
    } catch (err) {
      console.error('API not available:', err);
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: 'Unable to save customer data. API is not available and temporary storage is not allowed.',
        timer: 3000,
        showConfirmButton: true
      });
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      pincode: customer.pincode || '',
      category: customer.category || '',
      billing_type: customer.billing_type,
      billing_frequency: customer.billing_frequency || 'monthly',
      delivery_time: customer.delivery_time || 'morning',
      price_per_liter: customer.price_per_liter?.toString() || '',
      customer_type: customer.customer_type || 'daily milk customer',
      registration_source: customer.registration_source || 'admin',
      is_active: customer.is_active !== undefined ? customer.is_active : true
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        await axios.delete(`http://localhost:5000/api/customers/${id}`, config);
        fetchCustomers();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Customer has been deleted.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        console.error('API not available:', err);
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: 'Unable to delete customer data. API is not available and temporary storage is not allowed.',
          timer: 3000,
          showConfirmButton: true
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      pincode: '',
      category: '',
      billing_type: 'subscription',
      billing_frequency: 'monthly',
      delivery_time: 'morning',
      price_per_liter: '',
      customer_type: 'daily milk customer',
      registration_source: 'admin',
      is_active: true
    });
    setEditingCustomer(null);
    setShowForm(false);
    setError('');
  };

  if (loading) return <div className="text-center p-10 text-sm sm:text-base md:text-lg text-gray-500">Loading customers...</div>;

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-5">
        <div className="flex justify-between items-center">
          <h2 className="m-0 text-gray-800 text-xl sm:text-2xl md:text-3xl">Milk Customers Management</h2>
          <button onClick={fetchCustomers} className="p-2.5 px-5 border-none rounded cursor-pointer text-sm font-medium transition-colors duration-300 bg-purple-500 text-white hover:bg-purple-600 flex items-center gap-2">
            <FaSync className="text-sm" />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500 text-white p-2.5 rounded mb-5">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto border border-gray-200">
            <h3 className="mt-0 mb-5 text-gray-800 text-lg sm:text-xl md:text-2xl">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="flex gap-[15px] mb-[15px] sm:flex-col sm:gap-0">
                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Name:</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Phone:</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-[15px] mb-[15px] sm:flex-col sm:gap-0">
                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Email:</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Registration Source:</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.registration_source}
                    onChange={(e) => setFormData({...formData, registration_source: e.target.value})}
                  >
                    <option value="admin">Admin Added</option>
                    <option value="homepage">Homepage Registration</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-[15px] mb-[15px] sm:flex-col sm:gap-0">
                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Address:</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows="2"
                  />
                </div>

                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Pincode:</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                    placeholder="Enter pincode"
                  />
                </div>
              </div>

              <div className="mb-[15px]">
                <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Category:</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-[15px]">
                <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Customer Type:</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={formData.customer_type}
                  onChange={(e) => setFormData({...formData, customer_type: e.target.value})}
                >
                  <option value="guest customer">Guest Customer</option>
                  <option value="daily milk customer">Daily Milk Customer</option>
                </select>
              </div>

              <div className="flex gap-[15px] mb-[15px] sm:flex-col sm:gap-0">
                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Billing Type:</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.billing_type}
                    onChange={(e) => setFormData({...formData, billing_type: e.target.value})}
                  >
                    <option value="subscription">Monthly Subscription</option>
                    <option value="per_liter">Per Liter</option>
                  </select>
                </div>

                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Billing Frequency:</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.billing_frequency}
                    onChange={(e) => setFormData({...formData, billing_frequency: e.target.value})}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-[15px] mb-[15px] sm:flex-col sm:gap-0">
                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Delivery Time:</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({...formData, delivery_time: e.target.value})}
                  >
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                    <option value="both">Both (Morning & Evening)</option>
                  </select>
                </div>

                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Price Per Liter (₹):</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="number"
                    step="0.01"
                    value={formData.price_per_liter}
                    onChange={(e) => setFormData({...formData, price_per_liter: e.target.value})}
                    placeholder="Price per liter"
                  />
                </div>
              </div>

              <div className="flex mb-[15px]">
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    />
                    <span className="text-sm sm:text-base text-gray-700 font-medium">Active Customer</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2" type="submit">
                  <FaCheck className="text-sm" />
                  {editingCustomer ? 'Update' : 'Create'}
                </button>
                <button className="flex-1 h-12 px-6 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2" type="button" onClick={resetForm}>
                  <FaTimes className="text-sm" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Name</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Phone</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Category</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Delivery Time</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Billing</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Balance (₹)</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Source</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Status</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr key={customer._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">{customer.name}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">{customer.phone}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">{customer.category}</td>
                <td className="p-3 text-left border-b border-gray-200">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    customer.delivery_time === 'morning' ? 'bg-yellow-100 text-yellow-800' :
                    customer.delivery_time === 'evening' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {customer.delivery_time === 'both' ? 'Morning & Evening' :
                     customer.delivery_time === 'morning' ? 'Morning' : 'Evening'}
                  </span>
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <div className="flex flex-col gap-[2px]">
                    <span className="font-medium text-gray-800 text-sm">{customer.billing_type === 'subscription' ? 'Monthly' : 'Per Liter'}</span>
                    <span className="text-xs text-gray-500">({customer.billing_frequency})</span>
                  </div>
                </td>
                <td className={`p-3 text-left border-b border-gray-200 font-semibold text-sm sm:text-base ${
                  (customer.balance_due || 0) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  ₹{customer.balance_due || 0}
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    customer.registration_source === 'homepage' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {customer.registration_source === 'homepage' ? 'Homepage' : 'Admin'}
                  </span>
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {customer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(customer)} className="p-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-1">
                      <FaEdit className="text-xs" />
                      <span className="text-xs sm:text-sm">Edit</span>
                    </button>
                    <button onClick={() => handleDelete(customer._id)} className="p-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-red-500 text-white hover:bg-red-600 flex items-center gap-1">
                      <FaTrash className="text-xs" />
                      <span className="text-xs sm:text-sm">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        className="fixed bottom-5 right-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none p-4 rounded-full cursor-pointer text-lg transition-all duration-300 hover:from-blue-600 hover:to-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl z-50"
        onClick={() => setShowForm(true)}
        disabled={showForm}
        title="Add New Customer"
      >
        <FaPlus />
      </button>
    </div>
  );
};

export default CustomersList;
