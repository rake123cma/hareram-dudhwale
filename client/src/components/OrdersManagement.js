import React, { useState, useEffect } from 'react';
import { FaEye, FaCheckCircle, FaShoppingCart, FaClock, FaBox, FaCalendarAlt, FaRupeeSign } from 'react-icons/fa';
import axios from 'axios';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [specialReservations, setSpecialReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('normal');
  const [editingDeliveryDate, setEditingDeliveryDate] = useState(false);
  const [newDeliveryDate, setNewDeliveryDate] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchSpecialReservations();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('/api/orders', config);
      if (response.data && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
      } else {
        setOrders([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
      setLoading(false);
    }
  };

  const fetchSpecialReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSpecialReservations([]);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('/api/special-reservations', config);
      setSpecialReservations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch special reservations:', err);
      setSpecialReservations([]);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`/api/orders/${orderId}/status`, { order_status: newStatus }, config);

      // Refresh orders list
      await fetchOrders();

      // Close modal if open
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: newStatus });
      }

      showAlert(`Order ${orderId} status updated to ${getStatusText(newStatus)}`, 'success');
    } catch (err) {
      console.error('Failed to update order status:', err);
      showAlert('Failed to update order status', 'error');
    }
  };

  const updateSpecialReservationStatus = async (reservationId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`/api/special-reservations/${reservationId}/status`, { status: newStatus }, config);
      fetchSpecialReservations();
      showAlert(`Special reservation status updated to ${newStatus}`, 'success');
    } catch (err) {
      showAlert('Failed to update special reservation status', 'error');
    }
  };

  const updateSpecialReservationPaymentStatus = async (reservationId, newPaymentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`/api/special-reservations/${reservationId}/payment`, { payment_status: newPaymentStatus }, config);
      fetchSpecialReservations();
      showAlert(`Payment status updated to ${newPaymentStatus}`, 'success');
    } catch (err) {
      showAlert('Failed to update payment status', 'error');
    }
  };

  const updateSpecialReservationDeliveryDate = async (reservationId, newDeliveryDate) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`/api/special-reservations/${reservationId}/delivery-date`, { expected_delivery_date: newDeliveryDate }, config);
      fetchSpecialReservations();
      setEditingDeliveryDate(false);
      setNewDeliveryDate('');
      showAlert('Delivery date updated successfully', 'success');
    } catch (err) {
      showAlert('Failed to update delivery date', 'error');
    }
  };

  const showAlert = (message, type = 'info') => {
    // Create custom alert since SweetAlert2 is not available
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert custom-alert-${type}`;
    alertDiv.innerHTML = `
      <div class="alert-content">
        <span class="alert-message">${message}</span>
        <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    document.body.appendChild(alertDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return '#ffc107';
      case 'confirmed': return '#17a2b8';
      case 'processing': return '#17a2b8';
      case 'ready': return '#fd7e14';
      case 'out_for_delivery': return '#fd7e14';
      case 'delivered': return '#28a745';
      case 'cancelled': return '#dc3545';
      // Special reservation statuses
      case 'active': return '#007bff';
      case 'expired': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'placed': return 'Order Placed';
      case 'confirmed': return 'Confirmed';
      case 'processing': return 'Processing';
      case 'ready': return 'Ready';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      // Special reservation statuses
      case 'active': return 'Booking Active';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const getSpecialStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpecialPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'placed': return 'confirmed';
      case 'confirmed': return 'processing';
      case 'processing': return 'ready';
      case 'ready': return 'out_for_delivery';
      case 'out_for_delivery': return 'delivered';
      default: return currentStatus;
    }
  };

  const filteredOrders = (orders || []).filter(order =>
    filterStatus === 'all' || order.status === filterStatus
  );

  const viewOrderDetails = (order) => {
    // Handle special reservations which have different field structure
    if (order.product_id) {
      // This is a special reservation
      const formattedReservation = {
        id: order._id,
        customerName: order.customer_id?.name || 'N/A',
        customerPhone: order.customer_id?.phone || 'N/A',
        customerAddress: 'N/A', // Special reservations don't have address
        date: order.createdAt || order.expected_delivery_date,
        paymentMethod: order.payment_method || 'N/A',
        order_status: order.status,
        items: [{
          name: order.product_id?.name || 'Special Product',
          quantity: order.quantity,
          price: order.total_amount / order.quantity
        }],
        total: order.total_amount,
        isSpecialReservation: true,
        expected_delivery_date: order.expected_delivery_date,
        payment_status: order.payment_status
      };
      setSelectedOrder(formattedReservation);
    } else {
      // This is a regular order from API
      const formattedOrder = {
        id: order._id,
        customerName: order.customer_id?.name || 'N/A',
        customerPhone: order.customer_id?.phone || 'N/A',
        customerAddress: order.delivery_address || 'N/A',
        date: order.createdAt,
        paymentMethod: order.payment_method,
        order_status: order.order_status,
        items: order.items?.map(item => ({
          name: item.product_id?.name || 'Product',
          quantity: item.quantity,
          price: item.unit_price
        })) || [],
        total: order.total_amount,
        isSpecialReservation: false
      };
      setSelectedOrder(formattedOrder);
    }
    setShowOrderModal(true);
  };

  if (loading) return <div className="text-center p-[50px] text-lg text-gray-600">Loading orders...</div>;

  return (
    <div className="p-5 max-w-[1400px] mx-auto sm:p-4">
      <div className="flex justify-between items-center mb-[30px] pb-5 border-b-2 border-gray-300 sm:flex-col sm:gap-5 sm:text-center">
        <h2 className="m-0 text-gray-800 text-[2rem]">Customer Orders Management</h2>
        <div className="flex gap-[30px] sm:justify-center sm:flex-wrap">
          <div className="w-64 bg-blue-50 shadow-md rounded-lg p-6 text-center border border-blue-200 hover:shadow-lg transition-shadow">
            <FaShoppingCart className="text-blue-500 text-3xl mx-auto mb-2" />
            <span className="block text-[2rem] font-bold text-blue-600 mb-[5px]">{orders.length + specialReservations.length}</span>
            <span className="text-sm text-gray-700 uppercase tracking-wider font-medium">Total Orders</span>
          </div>
          <div className="w-64 bg-green-50 shadow-md rounded-lg p-6 text-center border border-green-200 hover:shadow-lg transition-shadow">
            <FaCheckCircle className="text-green-500 text-3xl mx-auto mb-2" />
            <span className="block text-[2rem] font-bold text-green-600 mb-[5px]">
              {orders.filter(o => o.order_status === 'delivered').length + specialReservations.filter(r => r.status === 'delivered').length}
            </span>
            <span className="text-sm text-gray-700 uppercase tracking-wider font-medium">Delivered</span>
          </div>
          <div className="w-64 bg-yellow-50 shadow-md rounded-lg p-6 text-center border border-yellow-200 hover:shadow-lg transition-shadow">
            <FaClock className="text-yellow-500 text-3xl mx-auto mb-2" />
            <span className="block text-[2rem] font-bold text-yellow-600 mb-[5px]">
              {orders.filter(o => o.order_status === 'processing' || o.order_status === 'out_for_delivery').length + specialReservations.filter(r => r.status === 'active').length}
            </span>
            <span className="text-sm text-gray-700 uppercase tracking-wider font-medium">In Progress</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'normal'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('normal')}
          >
            <FaShoppingCart className="inline mr-2" />
            Normal Products ({orders.length})
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'special'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('special')}
          >
            <FaBox className="inline mr-2" />
            Special Products ({specialReservations.length})
          </button>
        </div>
      </div>

      {/* Normal Products Tab */}
      {activeTab === 'normal' && (
        <>
          <div className="mb-5 p-[15px] bg-gray-50 rounded-lg">
            <div className="flex items-center gap-[15px]">
              <label className="font-semibold text-black">Filter by Status:</label>
              <select className="p-2 px-3 border border-gray-300 rounded-md text-sm bg-white text-black" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Orders</option>
                <option value="placed">Order Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-300">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Order ID</th>
                  <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Customer</th>
                  <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Date</th>
                  <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider sm:hidden">Items</th>
                  <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider sm:hidden">Total</th>
                  <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Status</th>
                  <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filteredOrders || []).map(order => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="p-[15px] text-left border-b border-gray-100 font-semibold text-blue-500 font-mono">#{order._id.slice(-8).toUpperCase()}</td>
                    <td className="p-[15px] text-left border-b border-gray-100">
                      <div className="flex flex-col gap-[2px]">
                        <div className="font-semibold text-gray-800">{order.customer_id?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{order.customer_id?.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="p-[15px] text-left border-b border-gray-100 text-black">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="p-[15px] text-left border-b border-gray-100 sm:hidden">
                      <div className="text-sm text-gray-600">
                        {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="p-[15px] text-left border-b border-gray-100 font-semibold text-green-600 text-base sm:hidden">₹{order.total_amount}</td>
                    <td className="p-[15px] text-left border-b border-gray-100">
                      <span
                        className="px-3 py-[6px] rounded-full text-white text-xs font-semibold uppercase tracking-wider"
                        style={{ backgroundColor: getStatusColor(order.order_status) }}
                      >
                        {getStatusText(order.order_status)}
                      </span>
                    </td>
                    <td className="p-[15px] text-left border-b border-gray-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="p-2 px-3 border-none rounded-md cursor-pointer text-sm transition-all duration-200 flex items-center gap-[5px] bg-blue-500 text-white hover:bg-blue-700"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {order.order_status !== 'delivered' && order.order_status !== 'cancelled' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, getNextStatus(order.order_status))}
                            className="p-2 px-3 border-none rounded-md cursor-pointer text-sm transition-all duration-200 flex items-center gap-[5px] bg-green-500 text-white hover:bg-green-600"
                            title={`Mark as ${getStatusText(getNextStatus(order.order_status))}`}
                          >
                            <FaCheckCircle />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-800 mb-2">No normal product orders</h4>
                <p className="text-gray-600">Normal product orders will appear here.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Special Products Tab */}
      {activeTab === 'special' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-300">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Customer</th>
                <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Product</th>
                <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Quantity</th>
                <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Delivery Date</th>
                <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Total (₹)</th>
                <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Status</th>
                <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Payment</th>
                <th className="p-[15px] text-left border-b border-gray-100 bg-gray-50 font-semibold text-gray-800 text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(specialReservations || []).map((reservation, index) => (
                <tr key={reservation._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                  <td className="p-[15px] text-left border-b border-gray-200 text-gray-800 text-sm">
                    <div>
                      <div className="font-medium">{reservation.customer_id?.name}</div>
                      <div className="text-gray-500 text-xs">{reservation.customer_id?.phone}</div>
                    </div>
                  </td>
                  <td className="p-[15px] text-left border-b border-gray-200 text-gray-800 text-sm">{reservation.product_id?.name}</td>
                  <td className="p-[15px] text-left border-b border-gray-200 text-gray-800 text-sm">{reservation.quantity}</td>
                  <td className="p-[15px] text-left border-b border-gray-200 text-gray-800 text-sm">
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt className="text-gray-400 text-xs" />
                      {reservation.expected_delivery_date ? new Date(reservation.expected_delivery_date).toLocaleDateString() : 'Not Set'}
                    </div>
                  </td>
                  <td className="p-[15px] text-left border-b border-gray-200 text-gray-800 text-sm">
                    <div className="flex items-center gap-1">
                      <FaRupeeSign className="text-gray-400 text-xs" />
                      {reservation.total_amount?.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-[15px] text-left border-b border-gray-200">
                    <select
                      value={reservation.status}
                      onChange={(e) => updateSpecialReservationStatus(reservation._id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getSpecialStatusColor(reservation.status)}`}
                    >
                      <option value="active">Active</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </td>
                  <td className="p-[15px] text-left border-b border-gray-200">
                    <select
                      value={reservation.payment_status}
                      onChange={(e) => updateSpecialReservationPaymentStatus(reservation._id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getSpecialPaymentStatusColor(reservation.payment_status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="p-[15px] text-left border-b border-gray-200">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewOrderDetails(reservation)}
                        className="p-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1"
                        title="View Details"
                      >
                        <FaEye className="text-xs" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {specialReservations.length === 0 && (
            <div className="text-center py-12">
              <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-800 mb-2">No special product reservations</h4>
              <p className="text-gray-600">Special product reservations will appear here.</p>
            </div>
          )}
        </div>
      )}

      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5" onClick={() => setShowOrderModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-[700px] w-full max-h-[90vh] overflow-y-auto sm:m-2 sm:max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 px-6 border-b border-gray-300 bg-gray-50 rounded-t-xl">
              <h3 className="m-0 text-gray-800 text-xl">
                {selectedOrder.isSpecialReservation ? 'Reservation Details' : 'Order Details'} - #{selectedOrder.id}
              </h3>
              <button onClick={() => setShowOrderModal(false)} className="bg-none border-none text-2xl cursor-pointer text-gray-600 p-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-gray-300 hover:text-gray-800">×</button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6 sm:grid-cols-1">
                <div className="">
                  <h4 className="m-0 mb-4 text-gray-800 text-lg border-b-2 border-blue-500 pb-2">
                    {selectedOrder.isSpecialReservation ? 'Customer Information' : 'Customer Information'}
                  </h4>
                  <p className="my-2 text-gray-700 leading-relaxed"><strong>Name:</strong> {selectedOrder.customerName}</p>
                  <p className="my-2 text-gray-700 leading-relaxed"><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                  <p className="my-2 text-gray-700 leading-relaxed"><strong>Address:</strong> {selectedOrder.customerAddress}</p>
                  {selectedOrder.isSpecialReservation && (
                    <p className="my-2 text-gray-700 leading-relaxed"><strong>Payment Status:</strong>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSpecialPaymentStatusColor(selectedOrder.payment_status)}`}>
                        {selectedOrder.payment_status?.charAt(0).toUpperCase() + selectedOrder.payment_status?.slice(1)}
                      </span>
                    </p>
                  )}
                </div>

                <div className="">
                  <h4 className="m-0 mb-4 text-gray-800 text-lg border-b-2 border-blue-500 pb-2">
                    {selectedOrder.isSpecialReservation ? 'Reservation Information' : 'Order Information'}
                  </h4>
                  <p className="my-2 text-gray-700 leading-relaxed"><strong>
                    {selectedOrder.isSpecialReservation ? 'Booking Date:' : 'Order Date:'}
                  </strong> {selectedOrder.date && !isNaN(new Date(selectedOrder.date).getTime()) ? new Date(selectedOrder.date).toLocaleDateString('en-IN') : 'N/A'}</p>
                  {selectedOrder.isSpecialReservation ? (
                    <>
                      <div className="my-2 text-gray-700 leading-relaxed">
                        <div className="flex items-center justify-between">
                          <strong>Expected Delivery:</strong>
                          <button
                            onClick={() => {
                              setEditingDeliveryDate(true);
                              setNewDeliveryDate(selectedOrder.expected_delivery_date ? new Date(selectedOrder.expected_delivery_date).toISOString().split('T')[0] : '');
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm underline ml-2"
                          >
                            Edit
                          </button>
                        </div>
                        {editingDeliveryDate ? (
                          <div className="mt-2 space-y-2">
                            <input
                              type="date"
                              value={newDeliveryDate}
                              onChange={(e) => setNewDeliveryDate(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateSpecialReservationDeliveryDate(selectedOrder.id, newDeliveryDate)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingDeliveryDate(false);
                                  setNewDeliveryDate('');
                                }}
                                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1">
                            {selectedOrder.expected_delivery_date && !isNaN(new Date(selectedOrder.expected_delivery_date).getTime()) ? new Date(selectedOrder.expected_delivery_date).toLocaleDateString('en-IN') : 'Not Set'}
                          </div>
                        )}
                      </div>
                      <p className="my-2 text-gray-700 leading-relaxed"><strong>Payment Method:</strong> {selectedOrder.paymentMethod || 'N/A'}</p>
                    </>
                  ) : (
                    <p className="my-2 text-gray-700 leading-relaxed"><strong>Payment:</strong> {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                  )}
                  <p className="my-2 text-gray-700 leading-relaxed"><strong>Status:</strong>
                    <span
                      className="px-3 py-[6px] rounded-full text-white text-xs font-semibold uppercase tracking-wider"
                      style={{ backgroundColor: selectedOrder.isSpecialReservation ? getStatusColor(selectedOrder.order_status) : getStatusColor(selectedOrder.order_status) }}
                    >
                      {selectedOrder.isSpecialReservation ? getStatusText(selectedOrder.order_status) : getStatusText(selectedOrder.order_status)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="">
                <h4 className="m-0 mb-4 text-gray-800 text-lg border-b-2 border-blue-500 pb-2">
                  {selectedOrder.isSpecialReservation ? 'Reservation Details' : 'Order Items'}
                </h4>
                <div className="mb-5">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                      <span className="flex-1 font-medium text-gray-800">{item.name}</span>
                      <span className="text-gray-600 mx-4">× {item.quantity}</span>
                      <span className="text-gray-600 mr-4">₹{item.price?.toFixed(2)}</span>
                      <span className="font-semibold text-green-600">₹{(item.quantity * item.price)?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-right p-4 bg-gray-50 rounded-lg text-lg">
                  <strong>Total Amount: ₹{selectedOrder.total?.toFixed(2)}</strong>
                </div>
              </div>

              {/* Action buttons - only show for regular orders, not special reservations */}
              {!selectedOrder.isSpecialReservation && selectedOrder.order_status !== 'delivered' && selectedOrder.order_status !== 'cancelled' && (
                <div className="flex gap-4 justify-end mt-6 pt-5 border-t border-gray-300 sm:flex-col">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.order_status))}
                    className="p-3 px-5 border-none rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 bg-green-500 text-white hover:bg-green-600"
                  >
                    Mark as {getStatusText(getNextStatus(selectedOrder.order_status))}
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    className="p-3 px-5 border-none rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 bg-red-500 text-white hover:bg-red-700"
                  >
                    Cancel Order
                  </button>
                </div>
              )}

              {/* Special reservation actions */}
              {selectedOrder.isSpecialReservation && (
                <div className="flex gap-4 justify-end mt-6 pt-5 border-t border-gray-300 sm:flex-col">
                  <div className="text-sm text-gray-600">
                    <p><strong>Note:</strong> Special reservation status can only be updated by administrators.</p>
                    <p>Contact admin to modify reservation status or payment details.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
