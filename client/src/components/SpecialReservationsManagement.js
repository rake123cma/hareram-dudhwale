import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlus, FaEye, FaEdit, FaTrash, FaCheck, FaTimes, FaCalendarAlt, FaRupeeSign } from 'react-icons/fa';

const SpecialReservationsManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    product_id: '',
    customer_id: '',
    quantity: '',
    expected_delivery_date: '',
    deposit_amount: '',
    total_amount: '',
    payment_method: 'cash',
    transaction_id: '',
    notes: '',
    special_instructions: ''
  });

  useEffect(() => {
    fetchReservations();
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('http://localhost:5000/api/special-reservations', config);
      setReservations(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch reservations');
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      // Filter only special advance bookable products
      setProducts(response.data.filter(p => p.is_special_product && p.is_advance_bookable));
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('http://localhost:5000/api/customers', config);
      setCustomers(response.data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const data = {
        ...formData,
        quantity: parseInt(formData.quantity),
        deposit_amount: parseFloat(formData.deposit_amount),
        total_amount: parseFloat(formData.total_amount)
      };

      // Only include expected_delivery_date if provided
      if (formData.expected_delivery_date) {
        data.expected_delivery_date = new Date(formData.expected_delivery_date);
      }

      if (editingReservation) {
        await axios.put(`http://localhost:5000/api/special-reservations/${editingReservation._id}`, data, config);
      } else {
        await axios.post('http://localhost:5000/api/special-reservations', data, config);
      }

      fetchReservations();
      resetForm();
      Swal.fire('Success', `Reservation ${editingReservation ? 'updated' : 'created'} successfully!`, 'success');
    } catch (err) {
      setError(editingReservation ? 'Failed to update reservation' : 'Failed to create reservation');
      Swal.fire('Error', err.response?.data?.message || 'Failed to save reservation', 'error');
    }
  };

  const handleEdit = (reservation) => {
    setEditingReservation(reservation);
    setFormData({
      product_id: reservation.product_id._id,
      customer_id: reservation.customer_id._id,
      quantity: reservation.quantity.toString(),
      expected_delivery_date: reservation.expected_delivery_date ? new Date(reservation.expected_delivery_date).toISOString().split('T')[0] : '',
      deposit_amount: reservation.deposit_amount.toString(),
      total_amount: reservation.total_amount.toString(),
      payment_method: reservation.payment_method,
      transaction_id: reservation.transaction_id || '',
      notes: reservation.notes || '',
      special_instructions: reservation.special_instructions || ''
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
        const config = { headers: { Authorization: `Bearer ${token}` } };

        await axios.delete(`http://localhost:5000/api/special-reservations/${id}`, config);
        fetchReservations();
        Swal.fire('Deleted!', 'Reservation has been deleted.', 'success');
      } catch (err) {
        setError('Failed to delete reservation');
        Swal.fire('Error', 'Failed to delete reservation', 'error');
      }
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`http://localhost:5000/api/special-reservations/${id}/status`, { status }, config);
      fetchReservations();
      Swal.fire('Success', `Reservation status updated to ${status}!`, 'success');
    } catch (err) {
      Swal.fire('Error', 'Failed to update status', 'error');
    }
  };

  const updatePaymentStatus = async (id, payment_status) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`http://localhost:5000/api/special-reservations/${id}/payment`, { payment_status }, config);
      fetchReservations();
      Swal.fire('Success', `Payment status updated to ${payment_status}!`, 'success');
    } catch (err) {
      Swal.fire('Error', 'Failed to update payment status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      customer_id: '',
      quantity: '',
      expected_delivery_date: '',
      deposit_amount: '',
      total_amount: '',
      payment_method: 'cash',
      transaction_id: '',
      notes: '',
      special_instructions: ''
    });
    setEditingReservation(null);
    setShowForm(false);
    setError('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center p-10 text-sm sm:text-base md:text-lg text-gray-500">Loading reservations...</div>;

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-5">
        <h2 className="m-0 text-gray-800 text-xl sm:text-2xl md:text-3xl">Special Product Reservations</h2>
        <p className="text-gray-600 mt-2">Manage advance bookings for special products</p>
      </div>

      {error && <div className="bg-red-500 text-white p-2.5 rounded mb-5">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto border border-gray-200">
            <h3 className="mt-0 mb-5 text-gray-800 text-lg sm:text-xl md:text-2xl">{editingReservation ? 'Edit Reservation' : 'Create New Reservation'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">Product *</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.product_id}
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} - ₹{product.default_price}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">Customer *</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">Quantity *</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">Expected Delivery Date *</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">Deposit Amount (₹) *</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({...formData, deposit_amount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">Total Amount (₹) *</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">Payment Method *</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">Transaction ID</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="text"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                    placeholder="Optional transaction reference"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">Notes</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  placeholder="Additional notes"
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">Special Instructions</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={formData.special_instructions}
                  onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                  rows="3"
                  placeholder="Special handling instructions"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2" type="submit">
                  <FaCheck className="text-sm" />
                  {editingReservation ? 'Update' : 'Create'}
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
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Customer</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Product</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Quantity</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Delivery Date</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Total (₹)</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Status</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Payment</th>
              <th className="p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-sm uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation, index) => (
              <tr key={reservation._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">
                  <div>
                    <div className="font-medium">{reservation.customer_id?.name}</div>
                    <div className="text-gray-500 text-xs">{reservation.customer_id?.phone}</div>
                  </div>
                </td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">{reservation.product_id?.name}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">{reservation.quantity}</td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt className="text-gray-400 text-xs" />
                    {reservation.expected_delivery_date ? new Date(reservation.expected_delivery_date).toLocaleDateString() : 'Not Set'}
                  </div>
                </td>
                <td className="p-3 text-left border-b border-gray-200 text-gray-800 text-sm sm:text-base">
                  <div className="flex items-center gap-1">
                    <FaRupeeSign className="text-gray-400 text-xs" />
                    {reservation.total_amount?.toLocaleString()}
                  </div>
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <select
                    value={reservation.status}
                    onChange={(e) => updateStatus(reservation._id, e.target.value)}
                    className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(reservation.status)}`}
                  >
                    <option value="active">Active</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </select>
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <select
                    value={reservation.payment_status}
                    onChange={(e) => updatePaymentStatus(reservation._id, e.target.value)}
                    className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getPaymentStatusColor(reservation.payment_status)}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(reservation)} className="p-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-1">
                      <FaEdit className="text-xs" />
                      <span className="text-xs sm:text-sm">Edit</span>
                    </button>
                    <button onClick={() => handleDelete(reservation._id)} className="p-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-red-500 text-white hover:bg-red-600 flex items-center gap-1">
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
        title="Add New Reservation"
      >
        <FaPlus />
      </button>
    </div>
  );
};

export default SpecialReservationsManagement;