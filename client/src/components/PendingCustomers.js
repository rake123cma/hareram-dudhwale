import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaTimes, FaUserPlus } from 'react-icons/fa';

const PendingCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    billing_type: 'subscription',
    billing_frequency: 'monthly',
    delivery_time: 'morning',
    subscription_amount: '',
    balance_due: '',
    customer_type: 'guest customer'
  });

  useEffect(() => {
    fetchPendingCustomers();
  }, []);

  const fetchPendingCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');

      // Show all customers in New Registrations table permanently
      let allCustomers = response.data.map(customer => ({
        ...customer,
        isLocalStorage: false // All customers from DB are permanent
      }));

      setCustomers(allCustomers);
      setLoading(false);
    } catch (err) {
      // API not available - no temporary storage allowed
      setCustomers([]);
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price_per_liter: formData.price_per_liter ? parseFloat(formData.price_per_liter) : undefined,
        subscription_amount: formData.subscription_amount ? parseFloat(formData.subscription_amount) : undefined
      };

      // Update customer through API
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      await axios.put(`/api/customers/${editingCustomer._id}`, data, config);

      Swal.fire({
        icon: 'success',
        title: 'Customer Updated!',
        text: data.customer_type === 'daily milk customer'
          ? 'Customer has been updated and will appear in Milk Customers list'
          : 'Customer information has been updated',
        timer: 2000,
        showConfirmButton: false
      });

      fetchPendingCustomers();
      resetForm();
    } catch (err) {
      console.error('API not available:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Unable to update customer data. API is not available and temporary storage is not allowed.',
        timer: 3000,
        showConfirmButton: true
      });
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      billing_type: customer.billing_type || 'subscription',
      billing_frequency: customer.billing_frequency || 'monthly',
      delivery_time: customer.delivery_time || 'morning',
      price_per_liter: customer.price_per_liter?.toString() || '',
      subscription_amount: customer.subscription_amount?.toString() || '',
      balance_due: customer.balance_due || '',
      customer_type: customer.customer_type || 'guest customer' // Default to existing or guest customer
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this! This will permanently delete the customer.',
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
        await axios.delete(`/api/customers/${id}`, config);
        fetchPendingCustomers();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Customer has been deleted.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        setError('Failed to delete customer');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete customer'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      billing_type: 'subscription',
      billing_frequency: 'monthly',
      delivery_time: 'morning',
      subscription_amount: '',
      balance_due: '',
      customer_type: 'guest customer'
    });
    setEditingCustomer(null);
    setShowForm(false);
    setError('');
  };

  // Debounce search term to improve performance
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getFilteredCustomers = useCallback(() => {
    if (debouncedSearchTerm.trim() === '') {
      return customers;
    }
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return customers.filter(customer => {
      const customerName = (customer.name || '').toLowerCase();
      const customerPhone = customer.phone || '';
      const customerEmail = (customer.email || '').toLowerCase();
      const customerAddress = (customer.address || '').toLowerCase();
      
      return customerName.includes(searchLower) ||
             customerPhone.includes(debouncedSearchTerm) ||
             customerEmail.includes(searchLower) ||
             customerAddress.includes(searchLower);
    });
  }, [customers, debouncedSearchTerm]);

  if (loading) return <div className="text-center p-10 text-sm sm:text-base md:text-lg text-gray-500">Loading pending customers...</div>;

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-5">
        <h2 className="m-0 text-gray-800 text-xl sm:text-2xl md:text-3xl flex items-center gap-3">
          <FaUserPlus className="text-blue-600" />
          New Customer Registrations
        </h2>
        <p className="text-gray-600 mt-2">Review and activate new customer registrations</p>
        
        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search customers by name, phone, email, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={loading}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {isSearching ? '⏳' : '🔍'}
            </div>
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
              <span>Showing {getFilteredCustomers().length} of {customers.length} registrations</span>
              {isSearching && <span className="text-blue-500">Searching...</span>}
            </div>
          )}
        </div>
      </div>

      {error && <div className="bg-red-500 text-white p-2.5 rounded mb-5">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto border border-gray-200">
            <h3 className="mt-0 mb-5 text-gray-800 text-lg sm:text-xl md:text-2xl flex items-center gap-2">
              <FaEdit className="text-blue-600" />
              Edit Customer: {editingCustomer?.name}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-[15px]">
                <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Billing Type:</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={formData.billing_type}
                  onChange={(e) => setFormData({...formData, billing_type: e.target.value})}
                  required
                >
                  <option value="subscription">Monthly Subscription</option>
                  <option value="per_liter">Per Liter</option>
                </select>
              </div>

              <div className="flex gap-[15px] mb-[15px] sm:flex-col sm:gap-0">
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
              </div>

              {formData.billing_type === 'subscription' && (
                <div className="mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Monthly Subscription Amount (₹):</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="number"
                    step="0.01"
                    value={formData.subscription_amount}
                    onChange={(e) => setFormData({...formData, subscription_amount: e.target.value})}
                    placeholder="Enter monthly amount"
                    required
                  />
                </div>
              )}

              {formData.billing_type === 'per_liter' && (
                <div className="mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Price Per Liter (₹):</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="number"
                    step="0.01"
                    value={formData.price_per_liter}
                    onChange={(e) => setFormData({...formData, price_per_liter: e.target.value})}
                    placeholder="Price per liter"
                    required
                  />
                </div>
              )}

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

              <div className="flex gap-3 mt-6">
                <button className="flex-1 h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2" type="submit">
                  <FaEdit className="text-sm" />
                  Update Customer
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
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Email</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Address</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Registration Date</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Status</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredCustomers().map((customer, index) => (
              <tr key={customer._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">{customer.name}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">{customer.phone}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">{customer.email || 'N/A'}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base max-w-xs truncate" title={customer.address}>{customer.address || 'N/A'}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">
                  {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    customer.customer_type === 'daily milk customer'
                      ? 'bg-green-100 text-green-800'
                      : customer.customer_type === 'guest customer'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {customer.customer_type === 'daily milk customer'
                      ? 'Milk Customer'
                      : customer.customer_type === 'guest customer'
                      ? 'Guest Customer'
                      : 'New Registration'
                    }
                  </span>
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(customer)} className="p-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1">
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
        
        {getFilteredCustomers().length === 0 && searchTerm && (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-4">🔍</div>
            <h4 className="text-xl font-semibold text-gray-800 mb-2">No registrations found</h4>
            <p className="text-gray-600">No registrations match your search criteria "{searchTerm}"</p>
          </div>
        )}
      </div>

      {customers.length === 0 && (!searchTerm || getFilteredCustomers().length === 0) && (
        <div className="text-center py-12">
          <FaUserPlus className="text-6xl text-gray-300 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-gray-800 mb-2">No pending registrations</h4>
          <p className="text-gray-600">All customer registrations have been processed.</p>
        </div>
      )}
    </div>
  );
};

export default PendingCustomers;
