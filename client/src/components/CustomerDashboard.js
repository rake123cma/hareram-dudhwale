import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaUser, FaShoppingCart, FaHistory, FaFileInvoice, FaEdit, FaCreditCard, FaBell, FaRupeeSign, FaCheckCircle, FaTimesCircle, FaDownload, FaPlus, FaMinus, FaTrash, FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaSignOutAlt, FaBox, FaCog, FaTruck, FaCheck, FaCalendarAlt, FaClock, FaShoppingBag, FaRoute, FaEye, FaExclamationTriangle } from 'react-icons/fa';
import { GiMilkCarton } from 'react-icons/gi';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [orderSubTab, setOrderSubTab] = useState('orders');
  const [profile, setProfile] = useState({});
  const [balance, setBalance] = useState(0);
  const [recentSales, setRecentSales] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ address: '', paymentMethod: 'cod' });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({});
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    bill_month: '',
    payment_screenshot: '',
    transaction_id: '',
    notes: ''
  });
  const [approvedPayments, setApprovedPayments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [billPreviewContent, setBillPreviewContent] = useState('');
  const [billPreviewInvoice, setBillPreviewInvoice] = useState('');
  const [pendingPayments, setPendingPayments] = useState([]);
  const [specialReservations, setSpecialReservations] = useState([]);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    review_text: '',
    location: ''
  });
  const [myReview, setMyReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordChanging, setPasswordChanging] = useState(false);

  // Helper functions for special reservations
  const getSpecialStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSpecialStatusIcon = (status) => {
    switch (status) {
      case 'active': return <FaClock className="text-blue-600" />;
      case 'delivered': return <FaCheckCircle className="text-green-600" />;
      case 'cancelled': return <FaTimesCircle className="text-red-600" />;
      case 'expired': return <FaExclamationTriangle className="text-yellow-600" />;
      default: return <FaBox className="text-gray-600" />;
    }
  };

  const getSpecialStatusText = (status) => {
    switch (status) {
      case 'active': return 'Booking Active';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const getSpecialTrackingStages = (reservation) => {
    const expectedDate = reservation.expected_delivery_date ? new Date(reservation.expected_delivery_date) : null;

    const stages = [
      {
        id: 'booked',
        label: 'Booked',
        description: 'Advance booking confirmed',
        completed: true,
        date: reservation.createdAt,
        icon: <FaCalendarAlt className="text-sm" />
      },
      {
        id: 'payment',
        label: 'Payment',
        description: reservation.payment_status === 'completed' ? 'Payment completed' : 'Payment pending',
        completed: reservation.payment_status === 'completed',
        date: reservation.payment_status === 'completed' ? reservation.updatedAt : null,
        icon: <FaCreditCard className="text-sm" />
      },
      {
        id: 'processing',
        label: 'Processing',
        description: 'Product being prepared',
        completed: reservation.status === 'active' && expectedDate,
        date: expectedDate ? new Date(expectedDate.getTime() - 7 * 24 * 60 * 60 * 1000) : null,
        icon: <FaCog className="text-sm" />
      },
      {
        id: 'ready',
        label: 'Ready',
        description: 'Product ready for delivery',
        completed: reservation.status === 'active' && expectedDate && new Date() >= new Date(expectedDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        date: expectedDate ? new Date(expectedDate.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
        icon: <FaCheck className="text-sm" />
      },
      {
        id: 'delivered',
        label: 'Delivered',
        description: 'Product delivered successfully',
        completed: reservation.status === 'delivered',
        date: reservation.status === 'delivered' ? reservation.updatedAt : null,
        icon: <FaCheckCircle className="text-sm" />
      }
    ];

    return stages;
  };

  const getSpecialDeliveryProgress = (reservation) => {
    if (reservation.status === 'delivered') return 100;
    if (reservation.status === 'cancelled' || reservation.status === 'expired') return 0;

    const stages = getSpecialTrackingStages(reservation);
    const completedStages = stages.filter(stage => stage.completed).length;
    return Math.round((completedStages / stages.length) * 100);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchProducts();
    fetchCustomerOrders();
    fetchPaymentSettings();
    fetchApprovedPayments();
    fetchReminders();
    fetchPendingPayments();
    fetchSpecialReservations();
    fetchMyReview();
  }, []);

  useEffect(() => {
    if (profile._id) {
      fetchBills();
    }
  }, [profile._id]);

  useEffect(() => {
    if (activeTab === 'bills' && profile._id) {
      fetchBills();
    }
  }, [activeTab]);

  const fetchCustomerOrders = async () => {
    try {
      setOrdersLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('/api/orders/my-orders', config);

      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [profileRes, balanceRes, salesRes] = await Promise.all([
        axios.get('/api/customers/my-profile', config),
        axios.get('/api/customers/my-balance', config),
        axios.get('/api/customers/my-sales', config)
      ]);

      setProfile(profileRes.data);
      setBalance(balanceRes.data.balance);
      setRecentSales(salesRes.data.slice(0, 5)); // Last 5 deliveries
      setSalesHistory(salesRes.data);

      // Process monthly data
      const monthlyStats = processMonthlyData(salesRes.data);
      setMonthlyData(monthlyStats);

      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        // Token invalid, redirect to login
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      setProfile({
        _id: '',
        name: 'Customer',
        phone: '',
        email: '',
        address: '',
        pincode: ''
      });
      setBalance(0);
      setRecentSales([]);
      setSalesHistory([]);
      setMonthlyData([]);
      setLoading(false);
    }
  };

  const processMonthlyData = (salesData) => {
    const monthlyMap = {};

    salesData.forEach(sale => {
      const date = new Date(sale.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
      const dayKey = date.toISOString().split('T')[0]; // Unique day identifier

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthName,
          totalLiters: 0,
          totalAmount: 0,
          deliveries: 0,
          deliveryDays: new Set(), // Track unique days
          additionalProducts: 0
        };
      }

      // Only count if this day hasn't been counted yet
      if (!monthlyMap[monthKey].deliveryDays.has(dayKey)) {
        monthlyMap[monthKey].deliveryDays.add(dayKey);
        monthlyMap[monthKey].deliveries += 1;
      }

      monthlyMap[monthKey].totalLiters += sale.quantity;
      monthlyMap[monthKey].totalAmount += sale.total_amount;
      monthlyMap[monthKey].additionalProducts += (sale.additional_products || []).reduce((sum, p) => sum + (p.total_amount || 0), 0);
    });

    // Convert Sets to counts for JSON serialization
    Object.values(monthlyMap).forEach(month => {
      month.deliveries = month.deliveryDays.size;
      delete month.deliveryDays;
    });

    return Object.values(monthlyMap).sort((a, b) => new Date(b.month) - new Date(a.month));
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      setCart(cart.map(item =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item._id !== productId));
    } else {
      setCart(cart.map(item =>
        item._id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const getTotalCartAmount = () => {
    return cart.reduce((total, item) => total + (item.default_price * item.quantity), 0);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showAlert('Your cart is empty!', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('Please login to place an order', 'error');
        return;
      }

      // Prepare order data
      const orderData = {
        items: cart.map(item => ({
          product_id: item._id,
          quantity: item.quantity,
          unit_price: item.default_price
        })),
        delivery_address: checkoutData.address || profile.address,
        payment_method: checkoutData.paymentMethod,
        special_instructions: checkoutData.specialInstructions || ''
      };

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post('/api/orders', orderData, config);

      // Refresh orders list
      await fetchCustomerOrders();

      setOrderSuccess(true);
      setCart([]);
      setShowCheckout(false);
      setCheckoutData({ address: '', paymentMethod: 'cod' });

      showAlert('Order placed successfully!', 'success');
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to place order. Please try again.';
      showAlert(errorMessage, 'error');
    }
  };

  const showAlert = (message, type = 'info') => {
    Swal.fire({
      title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info',
      text: message,
      icon: type,
      confirmButtonText: 'OK'
    });
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    // Navigate to login page
    navigate('/login');
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      const activeProducts = response.data.filter(product => product.is_active);
      setProducts(activeProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const response = await axios.get('/api/payments/settings');
      setPaymentSettings(response.data);
    } catch (err) {
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    // For development/testing, allow payments for any month
    // In production, uncomment the date restrictions below

    /*
    // Validate payment date restrictions
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const selectedMonth = paymentData.bill_month;

    if (!selectedMonth) {
      Swal.fire('Error', 'Please select a bill month', 'error');
      return;
    }

    // Check if selected month is previous month
    const selectedDate = new Date(selectedMonth + '-01');
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

    if (selectedDate.getTime() !== previousMonth.getTime()) {
      Swal.fire('Error', 'You can only pay for the previous month', 'error');
      return;
    }

    // Check if current date is between 1-10
    if (currentDay < 1 || currentDay > 10) {
      Swal.fire('Error', 'Payments can only be made between 1st to 10th of each month', 'error');
      return;
    }
    */

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post('/api/payments/submit', paymentData, config);
      Swal.fire('Success', 'Payment submitted successfully! It will be reviewed by admin.', 'success');
      setShowPaymentForm(false);
      setPaymentData({
        amount: '',
        bill_month: '',
        payment_screenshot: '',
        transaction_id: '',
        notes: ''
      });
      // Refresh pending payments to show the new status
      fetchPendingPayments();
    } catch (err) {
      Swal.fire('Error', 'Failed to submit payment', 'error');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPaymentData({...paymentData, payment_screenshot: e.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchApprovedPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('/api/payments/my-approved', config);
      setApprovedPayments(response.data);
    } catch (err) {
      console.log('No approved payments found');
    }
  };

  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('/api/reminders/my-reminders', config);
      setReminders(response.data);
    } catch (err) {
      console.log('No reminders found');
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('/api/payments/my-pending', config);
      setPendingPayments(response.data);
    } catch (err) {
      console.log('No pending payments found');
      setPendingPayments([]);
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
      const response = await axios.get('/api/special-reservations/my-reservations', config);
      setSpecialReservations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.log('No special reservations found');
      setSpecialReservations([]);
    }
  };

  const fetchMyReview = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Don't make request if not authenticated

    try {
      const response = await fetch('/api/reviews/my-review', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyReview(data);
        setReviewData({
          rating: data.rating,
          review_text: data.review_text,
          location: data.location
        });
      } else {
        // Silently handle errors without console logging
        setMyReview(null);
      }
    } catch (err) {
      // Network error or other issues - silently handle
      setMyReview(null);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (myReview) {
        // Update existing review
        await axios.put(`/api/reviews/${myReview._id}`, reviewData, config);
        showAlert('Review updated successfully!', 'success');
      } else {
        // Submit new review
        await axios.post('/api/reviews', reviewData, config);
        showAlert('Review submitted successfully! It will be published after admin approval.', 'success');
      }

      fetchMyReview();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to submit review';
      showAlert(errorMessage, 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  // Helper functions for special reservations display
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <FaClock className="text-blue-600" />;
      case 'delivered': return <FaCheckCircle className="text-green-600" />;
      case 'cancelled': return <FaTimesCircle className="text-red-600" />;
      case 'expired': return <FaExclamationTriangle className="text-yellow-600" />;
      default: return <FaBox className="text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Booking Active';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const getDeliveryProgress = (reservation) => {
    if (reservation.status === 'delivered') return 100;
    if (reservation.status === 'cancelled' || reservation.status === 'expired') return 0;

    let expectedDeliveryDate = null;
    if (reservation.expected_delivery_date) {
      const date = new Date(reservation.expected_delivery_date);
      if (!isNaN(date.getTime())) {
        expectedDeliveryDate = date;
      }
    }

    const stages = [
      { id: 'booked', completed: true },
      { id: 'payment', completed: reservation.payment_status === 'completed' },
      { id: 'processing', completed: reservation.status === 'active' && expectedDeliveryDate },
      { id: 'ready', completed: reservation.status === 'active' && expectedDeliveryDate && new Date() >= new Date(expectedDeliveryDate.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { id: 'delivered', completed: reservation.status === 'delivered' }
    ];

    const completedStages = stages.filter(stage => stage.completed).length;
    return Math.round((completedStages / stages.length) * 100);
  };

  const fetchBills = async (showSuccessMessage = false) => {
    try {
      setBillsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('/api/billing/customer/' + profile._id, config);
      setBills(response.data);

      if (showSuccessMessage) {
        Swal.fire('Success', 'Bills updated successfully!', 'success');
      }
    } catch (err) {
      console.log('No bills found');
      setBills([]);
      if (showSuccessMessage) {
        Swal.fire('Error', 'Failed to load bills', 'error');
      }
    } finally {
      setBillsLoading(false);
    }
  };

  const viewBillPreview = async (billId, invoiceNumber) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'You are not logged in. Please login again.', 'error');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      console.log('Fetching bill with token:', token ? 'Token exists' : 'No token');
      const response = await axios.get(`/api/billing/${billId}/pdf`, config);
      setBillPreviewContent(response.data);
      setBillPreviewInvoice(invoiceNumber);
      setShowBillPreview(true);
    } catch (err) {
      console.error('Failed to load bill:', err);
      if (err.response?.status === 401) {
        Swal.fire('Error', 'Session expired. Please login again.', 'error');
      } else {
        Swal.fire('Error', 'Failed to load bill preview', 'error');
      }
    }
  };

  const downloadBillFromPreview = () => {
    const blob = new Blob([billPreviewContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${billPreviewInvoice}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    Swal.fire('Success', 'Bill downloaded successfully!', 'success');
  };

  const initiatePayment = (bill) => {
    // Pre-fill payment form with bill details
    setPaymentData({
      amount: bill.total_amount.toString(),
      bill_month: bill.billing_period,
      payment_screenshot: '',
      transaction_id: '',
      notes: `Payment for ${bill.invoice_number}`
    });
    setShowPaymentForm(true);
  };

  const markReminderAsRead = async (reminderId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`/api/reminders/${reminderId}/read`, {}, config);
      // Remove from local state
      setReminders(reminders.filter(r => r._id !== reminderId));
    } catch (err) {
      console.log('Failed to mark reminder as read');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put('/api/customers/my-profile', profileForm, config);
      setProfile({ ...profile, ...profileForm });
      setEditingProfile(false);
      Swal.fire('Profile updated successfully!', '', 'success');
    } catch (err) {
      Swal.fire('Failed to update profile. Please try again.', '', 'error');
    }
  };


  const downloadInvoice = (saleId) => {
    // Simulate PDF download
    Swal.fire(`Downloading invoice for sale ID: ${saleId}`, '', 'info');
    // In a real app, this would trigger a PDF download
  };

  const startEditingProfile = () => {
    setProfileForm({
      ...profile,
      billing_type: profile.billing_type || 'subscription',
      subscription_amount: profile.subscription_amount || '',
      price_per_liter: profile.price_per_liter || ''
    });
    setEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setEditingProfile(false);
    setProfileForm({});
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert('New password and confirmation do not match', 'error');
      return;
    }

    setPasswordChanging(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put('/api/customers/change-password', passwordData, config);
      showAlert('Password changed successfully!', 'success');
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to change password';
      showAlert(errorMessage, 'error');
    } finally {
      setPasswordChanging(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Reminders Section */}
      {(reminders.length > 0 || specialReservations.some(r => r.status === 'active' && r.expected_delivery_date)) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FaBell className="text-yellow-600" />
            <h4 className="text-lg font-semibold text-yellow-800">Notifications & Updates</h4>
          </div>
          <div className="space-y-2">
            {/* Payment Reminders */}
            {reminders.map(reminder => (
              <div key={reminder._id} className="bg-white p-3 rounded border border-yellow-200 flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-800 text-sm">{reminder.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(reminder.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => markReminderAsRead(reminder._id)}
                  className="text-yellow-600 hover:text-yellow-800 text-sm underline ml-3"
                >
                  Mark as Read
                </button>
              </div>
            ))}

            {/* Special Product Delivery Alerts */}
            {specialReservations
              .filter(r => r.status === 'active' && r.expected_delivery_date)
              .map(reservation => {
                const deliveryDate = new Date(reservation.expected_delivery_date);
                if (isNaN(deliveryDate.getTime())) return null;

                const today = new Date();
                const daysUntilDelivery = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntilDelivery <= 3 && daysUntilDelivery >= 0) {
                  return (
                    <div key={`delivery-${reservation._id}`} className="bg-purple-50 p-3 rounded border border-purple-200">
                      <div className="flex items-start gap-3">
                        <FaTruck className="text-purple-600 text-lg mt-1" />
                        <div className="flex-1">
                          <p className="text-purple-800 text-sm font-medium">
                            {reservation.product_id?.name} delivery {daysUntilDelivery === 0 ? 'today' : `in ${daysUntilDelivery} day${daysUntilDelivery > 1 ? 's' : ''}`}
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            Expected delivery: {deliveryDate.toLocaleDateString('en-IN', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })
            }

            {/* Special Product Status Updates */}
            {specialReservations
              .filter(r => r.status === 'active' && r.payment_status === 'pending')
              .slice(0, 2) // Show max 2 pending payment alerts
              .map(reservation => (
                <div key={`payment-${reservation._id}`} className="bg-orange-50 p-3 rounded border border-orange-200">
                  <div className="flex items-start gap-3">
                    <FaCreditCard className="text-orange-600 text-lg mt-1" />
                    <div className="flex-1">
                      <p className="text-orange-800 text-sm font-medium">
                        Payment pending for {reservation.product_id?.name}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Deposit amount: ₹{reservation.deposit_amount?.toLocaleString()}
                      </p>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-orange-700 hover:text-orange-800 text-xs underline mt-1"
                      >
                        View booking details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <FaUser className="text-blue-600 text-xl" />
        <h3 className="text-2xl font-bold text-gray-800">Milk Delivery Dashboard</h3>
      </div>

      {/* Special Reservations Quick View */}
      {specialReservations.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaBox className="text-purple-600 text-xl" />
            <div>
              <h4 className="text-lg font-semibold text-gray-800">Special Product Bookings</h4>
              <p className="text-gray-600 text-sm">Track your advance booked special products</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-2xl font-bold">{specialReservations.length}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="text-green-600 text-2xl font-bold">
                {specialReservations.filter(r => r.status === 'delivered').length}
              </div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 text-2xl font-bold">
                {specialReservations.filter(r => r.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>

          {/* Recent Special Reservation */}
          {specialReservations.slice(0, 1).map(reservation => (
            <div key={reservation._id} className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{reservation.product_id?.name}</div>
                  <div className="text-sm text-gray-600">Quantity: {reservation.quantity}</div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                    {getStatusIcon(reservation.status)}
                    <span>{getStatusText(reservation.status)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Progress: {getDeliveryProgress(reservation)}%
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getDeliveryProgress(reservation)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-4 text-center">
            <button
              onClick={() => setActiveTab('orders')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View All Bookings
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <FaUser className="text-blue-600 text-xl" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800">Customer Details</h4>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FaUser className="text-blue-500 text-sm" />
              <span className="font-semibold text-gray-800">{profile.name || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaPhone className="text-green-500 text-sm" />
              <span className="text-gray-600">{profile.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt className="text-red-500 text-sm" />
              <span className="text-gray-600">{profile.address || 'Not set'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <FaRupeeSign className="text-green-600 text-xl" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800">Outstanding Balance</h4>
            </div>
          </div>
          <div className={`text-3xl font-bold mb-2 ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ₹{Math.abs(balance).toFixed(2)}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {balance > 0 ? (
              <>
                <FaTimesCircle className="text-red-500" />
                <span className="text-red-600 font-medium">Amount Due</span>
              </>
            ) : balance < 0 ? (
              <>
                <FaCheckCircle className="text-green-500" />
                <span className="text-green-600 font-medium">Advance Payment</span>
              </>
            ) : (
              <>
                <FaCheckCircle className="text-green-500" />
                <span className="text-green-600 font-medium">Paid Up</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <GiMilkCarton className="text-yellow-600 text-xl" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800">Today's Milk</h4>
            </div>
          </div>
          {recentSales.length > 0 && recentSales[0].date === new Date().toISOString().split('T')[0] ? (
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{recentSales[0].quantity} L</div>
              <p className="text-gray-600 mb-1">Delivered today</p>
              <small className="text-green-600 font-medium">₹{Number(recentSales[0].total_amount).toFixed(2)}</small>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-1">No delivery today</p>
              <small className="text-gray-500">Check back later</small>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h4 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('orders')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex flex-col items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <FaHistory className="text-xl" />
            <span className="text-sm">Track Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className="bg-white text-gray-700 p-4 rounded-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 flex flex-col items-center gap-2 shadow-md hover:shadow-lg"
          >
            <FaShoppingCart className="text-xl" />
            <span className="text-sm">Shop Products</span>
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className="bg-white text-gray-700 p-4 rounded-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 flex flex-col items-center gap-2 shadow-md hover:shadow-lg"
          >
            <GiMilkCarton className="text-xl" />
            <span className="text-sm">Daily Milk</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className="bg-white text-gray-700 p-4 rounded-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 flex flex-col items-center gap-2 shadow-md hover:shadow-lg"
          >
            <FaEdit className="text-xl" />
            <span className="text-sm">Update Profile</span>
          </button>
        </div>
      </div>

      {/* Payment QR Code Section */}
      {paymentSettings.qr_code_image && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <FaCreditCard className="text-green-600 text-xl" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-800">Make Payment</h4>
              <p className="text-gray-600">Scan QR code or use bank details below</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR Code Section */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-center mb-4">
                <h5 className="text-lg font-semibold text-gray-800 mb-2">Scan to Pay</h5>
                <p className="text-sm text-gray-600">Scan with any UPI app</p>
              </div>
              <div className="flex justify-center">
                <img
                  src={paymentSettings.qr_code_image}
                  alt="Payment QR Code"
                  className="w-48 h-48 border border-gray-300 rounded-lg shadow-md"
                />
              </div>
              <div className="text-center mt-4">
                <p className="text-xs text-gray-500">QR Code for instant payment</p>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h5 className="text-md font-semibold text-gray-800 mb-3">Bank Transfer Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600 font-medium">Account Number:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{paymentSettings.account_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600 font-medium">Account Holder:</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">{paymentSettings.account_holder_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600 font-medium">Bank Name:</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">{paymentSettings.bank_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600 font-medium">IFSC Code:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{paymentSettings.ifsc_code || 'N/A'}</span>
                  </div>
                  {paymentSettings.upi_id && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">UPI ID:</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">{paymentSettings.upi_id}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaCreditCard className="text-blue-600" />
                  <span className="font-semibold text-blue-800">Make Payment</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  After making payment, submit proof using the button below.
                </p>
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-colors"
                >
                  Submit Payment Proof
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDailyMilk = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <GiMilkCarton className="text-blue-600 text-xl" />
        <h3 className="text-2xl font-bold text-gray-800">Daily Milk Deliveries</h3>
      </div>

      {salesHistory.length > 0 ? (
        <div className="space-y-4">
          {salesHistory.map(sale => (
            <div key={sale._id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800">
                      {new Date(sale.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                      new Date(sale.date).toDateString() === new Date().toDateString()
                        ? 'bg-blue-100 text-blue-800'
                        : new Date(sale.date) > new Date()
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {new Date(sale.date).toDateString() === new Date().toDateString() ? 'Today' :
                       new Date(sale.date) > new Date() ? 'Upcoming' : 'Delivered'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-yellow-600 text-3xl">
                      <GiMilkCarton />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-800">{sale.quantity} Liters</div>
                      <div className="text-green-600 font-semibold">₹{sale.total_amount}</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    sale.status === 'present'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {sale.status === 'present' ? (
                      <>
                        <FaCheckCircle className="text-sm" /> Delivered
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="text-sm" /> Missed
                      </>
                    )}
                  </span>
                </div>
              </div>

              {sale.status === 'present' && (
                <div className="text-center pt-3 border-t border-gray-100">
                  <small className="text-gray-500">Morning delivery • 6:00-10:00 AM</small>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4">
            <GiMilkCarton />
          </div>
          <h4 className="text-xl font-semibold text-gray-800 mb-2">No milk deliveries yet</h4>
          <p className="text-gray-600">Your daily milk delivery records will appear here.</p>
        </div>
      )}
    </div>
  );

  const renderMonthlyBills = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FaFileInvoice className="text-blue-600 text-xl" />
        <h3 className="text-2xl font-bold text-gray-800">Monthly Milk Bills</h3>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              max={new Date().toISOString().slice(0, 7)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
            <button
              onClick={() => fetchBills(true)}
              disabled={billsLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FaEye /> {billsLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Pay Bill
          </button>
        </div>

        {monthlyData.length > 0 ? (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-100">
              <h4 className="text-xl font-bold text-gray-800 mb-4">
                {new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
              </h4>
              {(() => {
                const selectedMonthData = monthlyData.find(month =>
                  month.month.includes(new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }).split(' ')[0])
                );

                // Check if payment is approved for this month
                const hasApprovedPayment = approvedPayments.some(payment =>
                  payment.bill_month === selectedMonth && payment.status === 'approved'
                );

                if (selectedMonthData) {
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-1">{selectedMonthData.totalLiters.toFixed(1)} L</div>
                          <div className="text-sm text-gray-600 font-medium">Total Milk</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-1">{selectedMonthData.deliveries}</div>
                          <div className="text-sm text-gray-600 font-medium">Deliveries</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 mb-1">₹{selectedMonthData.totalAmount.toFixed(2)}</div>
                          <div className="text-sm text-gray-600 font-medium">Total Bill</div>
                        </div>
                      </div>

                      {/* Payment Status */}
                      <div className="flex justify-center">
                        {hasApprovedPayment ? (
                          <div className="bg-green-100 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2">
                            <FaCheckCircle className="text-green-600" />
                            <span className="text-green-800 font-semibold">Bill Paid</span>
                          </div>
                        ) : (
                          <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-4 py-2 flex items-center gap-2">
                            <FaExclamationTriangle className="text-yellow-600" />
                            <span className="text-yellow-800 font-semibold">Payment Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-600 text-lg">No milk deliveries for this month</p>
                    </div>
                  );
                }
              })()}
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-4">All Months Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthlyData.map((month, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                    <div className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-200">
                      {month.month}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Milk:</span>
                        <span className="font-bold text-blue-600">{month.totalLiters.toFixed(1)} L</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Days:</span>
                        <span className="font-bold text-green-600">{month.deliveries}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Additional Products:</span>
                        <span className="font-bold text-orange-600">₹{month.additionalProducts.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Total Bill:</span>
                        <span className="font-bold text-purple-600">₹{(month.totalAmount + month.additionalProducts).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-4">
              <FaFileInvoice />
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-2">No billing history</h4>
            <p className="text-gray-600">Your monthly milk bills will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderShop = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FaShoppingCart className="text-blue-600 text-xl" />
        <h3 className="text-2xl font-bold text-gray-800">Shop Other Products</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.filter(product => product.category !== 'Milk').map(product => (
          <div key={product._id} className={`bg-white rounded-xl shadow-lg overflow-hidden border hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
            product.is_special_product ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-100'
          }`}>
            <div className={`h-32 flex items-center justify-center ${
              product.is_special_product
                ? 'bg-gradient-to-br from-purple-50 to-pink-50'
                : 'bg-gradient-to-br from-blue-50 to-purple-50'
            }`}>
              <div className={`text-3xl ${product.is_special_product ? 'text-purple-600' : 'text-blue-600'}`}>
                <FaShoppingCart />
              </div>
              {product.is_special_product && (
                <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  Special
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold text-gray-800">{product.name}</h4>
                {product.is_special_product && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                    Advance Bookable
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-2xl font-bold text-blue-600">₹{Number(product.default_price).toFixed(2)}</span>
                  <span className="text-gray-500 text-sm ml-1">per {product.unit}</span>
                </div>
              </div>
              <div className="mb-4">
                {product.is_special_product ? (
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <FaCalendarAlt className="text-xs" /> Advance Booking Available
                    </span>
                    {product.advance_booking_available_from && (
                      <div className="text-xs text-gray-600">
                        Available from: {new Date(product.advance_booking_available_from).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    product.stock_quantity > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock_quantity > 0 ? (
                      <>
                        <FaCheckCircle className="text-xs" /> In Stock ({product.stock_quantity})
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="text-xs" /> Out of Stock
                      </>
                    )}
                  </span>
                )}
              </div>
              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    // Show product details modal
                    Swal.fire({
                      title: product.name,
                      html: `
                        <div class="text-left space-y-3">
                          <div class="flex items-center gap-3 mb-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                              <FaShoppingCart class="text-blue-600 text-lg" />
                            </div>
                            <div>
                              <h3 class="text-lg font-bold text-gray-800">${product.name}</h3>
                              <p class="text-blue-600 font-semibold">₹${product.default_price} per ${product.unit}</p>
                            </div>
                          </div>
                          <div class="bg-gray-50 p-3 rounded-lg">
                            <h4 class="font-semibold text-gray-700 mb-2">Description</h4>
                            <p class="text-gray-600">${product.description}</p>
                          </div>
                          <div class="grid grid-cols-2 gap-4">
                            <div class="${product.is_special_product ? 'bg-purple-50' : 'bg-green-50'} p-3 rounded-lg">
                              <div class="text-sm ${product.is_special_product ? 'text-purple-700' : 'text-green-700'} font-medium">
                                ${product.is_special_product ? 'Booking Status' : 'Stock Status'}
                              </div>
                              <div class="${product.is_special_product ? 'text-purple-800' : 'text-green-800'} font-semibold">
                                ${product.is_special_product ? 'Advance Bookable' : (product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock')}
                              </div>
                            </div>
                            <div class="bg-blue-50 p-3 rounded-lg">
                              <div class="text-sm text-blue-700 font-medium">Category</div>
                              <div class="text-blue-800 font-semibold">${product.category}</div>
                            </div>
                          </div>
                          ${product.is_special_product && product.advance_booking_available_from ? `
                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div class="text-sm text-yellow-800 font-medium">Advance Booking Available From</div>
                              <div class="text-yellow-900 font-semibold">${new Date(product.advance_booking_available_from).toLocaleDateString('en-IN')}</div>
                            </div>
                          ` : ''}
                        </div>
                      `,
                      confirmButtonText: 'Close',
                      confirmButtonColor: '#667eea',
                      width: '500px'
                    });
                  }}
                  className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-1 text-sm"
                >
                  <FaEye className="text-xs" /> View
                </button>
                {product.is_special_product ? (
                  <button
                    onClick={() => {
                      // Check if customer is logged in
                      if (!profile._id || profile._id === '') {
                        Swal.fire('Error', 'Please log in to make a booking.', 'error');
                        return;
                      }

                      // Show advance booking modal
                      Swal.fire({
                        title: `Book ${product.name}`,
                        html: `
                          <div class="text-left space-y-4">
                            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <h4 class="text-purple-800 font-semibold mb-2">Advance Booking Details</h4>
                              <p class="text-purple-700 text-sm">This is a special product that requires advance booking. You can book it now and pick it up later.</p>
                            </div>
                            <div class="grid grid-cols-1 gap-4">
                              <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input type="number" id="booking-quantity" min="1" value="1" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                              </div>
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (₹)</label>
                              <input type="number" id="deposit-amount" min="0" step="0.01" placeholder="Enter deposit amount" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                              <textarea id="special-instructions" rows="3" placeholder="Any special instructions..." class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"></textarea>
                            </div>
                          </div>
                        `,
                        showCancelButton: true,
                        confirmButtonText: 'Book Now',
                        confirmButtonColor: '#8b5cf6',
                        cancelButtonText: 'Cancel',
                        preConfirm: () => {
                          const quantity = document.getElementById('booking-quantity').value;
                          const depositAmount = document.getElementById('deposit-amount').value;
                          const specialInstructions = document.getElementById('special-instructions').value;

                          if (!quantity || !depositAmount) {
                            Swal.showValidationMessage('Please fill in all required fields');
                            return false;
                          }

                          return { quantity, depositAmount, specialInstructions };
                        }
                      }).then((result) => {
                        if (result.isConfirmed) {
                          // Handle advance booking
                          const bookingData = {
                            product_id: product._id,
                            customer_id: profile._id,
                            quantity: parseInt(result.value.quantity),
                            deposit_amount: parseFloat(result.value.depositAmount),
                            total_amount: parseFloat(result.value.depositAmount), // For now, deposit = total
                            payment_method: 'cash', // Default
                            notes: `Advance booking for ${product.name}`,
                            special_instructions: result.value.specialInstructions
                          };

                          // Submit booking to backend
                          const token = localStorage.getItem('token');
                          axios.post('/api/special-reservations', bookingData, {
                            headers: { Authorization: `Bearer ${token}` }
                          })
                          .then(() => {
                            Swal.fire('Success!', 'Your advance booking has been submitted successfully!', 'success');
                          })
                          .catch((error) => {
                            const errorMessage = error.response?.data?.message || 'Failed to submit booking. Please try again.';
                            Swal.fire('Error', errorMessage, 'error');
                          });
                        }
                      });
                    }}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 flex items-center justify-center gap-1 text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FaCalendarAlt className="text-xs" /> Book Now
                  </button>
                ) : (
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock_quantity <= 0}
                    className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-1 text-sm ${
                      product.stock_quantity > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FaPlus className="text-xs" /> Add to Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FaShoppingCart className="text-blue-600 text-xl" />
              <h4 className="text-xl font-bold text-gray-800">Your Shopping Cart</h4>
            </div>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              {cart.length} items
            </span>
          </div>

          <div className="space-y-4 mb-6">
            {cart.map(item => (
              <div key={item._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-800">{item.name}</h5>
                  <span className="text-gray-600 text-sm">₹{item.default_price} each</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300">
                    <button
                      onClick={() => updateCartQuantity(item._id, item.quantity - 1)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-l-lg transition-colors"
                    >
                      <FaMinus className="text-xs" />
                    </button>
                    <span className="px-3 py-2 font-semibold text-gray-800 min-w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item._id, item.quantity + 1)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-r-lg transition-colors"
                    >
                      <FaPlus className="text-xs" />
                    </button>
                  </div>
                  <div className="text-right min-w-20">
                    <span className="font-bold text-gray-800">₹{(item.default_price * item.quantity).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => updateCartQuantity(item._id, 0)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-800">₹{getTotalCartAmount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Delivery:</span>
              <span className="font-semibold text-green-600">₹0.00</span>
            </div>
            <div className="flex justify-between items-center py-3 border-t-2 border-blue-200">
              <span className="text-lg font-bold text-gray-800">Total:</span>
              <span className="text-xl font-bold text-blue-600">₹{getTotalCartAmount().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setCart([])}
              className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Clear Cart
            </button>
            <button
              onClick={() => setShowCheckout(true)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <FaCreditCard /> Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FaCreditCard className="text-blue-600 text-xl" />
                <h3 className="text-xl font-bold text-gray-800">Checkout</h3>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Delivery Address</h4>
                <textarea
                  value={checkoutData.address}
                  onChange={(e) => setCheckoutData({...checkoutData, address: e.target.value})}
                  placeholder="Enter your delivery address"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-vertical min-h-[80px] font-medium"
                  required
                />
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Payment Method</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      value="cod"
                      checked={checkoutData.paymentMethod === 'cod'}
                      onChange={(e) => setCheckoutData({...checkoutData, paymentMethod: e.target.value})}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-700">Cash on Delivery</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      value="online"
                      checked={checkoutData.paymentMethod === 'online'}
                      onChange={(e) => setCheckoutData({...checkoutData, paymentMethod: e.target.value})}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-700">Online Payment</span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Order Summary</h4>
                <div className="space-y-2 mb-4">
                  {cart.map(item => (
                    <div key={item._id} className="flex justify-between items-center">
                      <span className="text-gray-700">{item.name} × {item.quantity}</span>
                      <span className="font-semibold text-gray-800">₹{(item.default_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                  <strong className="text-lg text-gray-800">Total:</strong>
                  <strong className="text-xl text-blue-600">₹{getTotalCartAmount().toFixed(2)}</strong>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
            <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Order Placed Successfully!</h3>
            <p className="text-gray-600 mb-2">Your order has been placed and will be delivered soon.</p>
            <p className="text-blue-600 font-semibold mb-6">Order ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            <button
              onClick={() => setOrderSuccess(false)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );

  const renderOrders = () => {
    return (
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <FaHistory className="text-white text-2xl" />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h3>
          <p className="text-gray-600">Track and manage your order history</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg p-2 border border-gray-200">
            <div className="flex gap-2">
              <button
                key="orders-tab"
                onClick={() => setOrderSubTab('orders')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  orderSubTab === 'orders'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                <FaShoppingCart className="inline mr-2" />
                Orders
              </button>
              <button
                key="special-orders-tab"
                onClick={() => setOrderSubTab('special')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  orderSubTab === 'special'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
                }`}
              >
                <FaBox className="inline mr-2" />
                Special Orders
              </button>
            </div>
          </div>
        </div>

        {/* Content based on sub-tab */}
        {orderSubTab === 'orders' && renderRegularOrders()}
        {orderSubTab === 'special' && renderSpecialOrders()}
      </div>
    );
  };

  const renderRegularOrders = () => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'placed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'ready': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'out_for_delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'placed': return <FaBox className="text-yellow-600" />;
        case 'confirmed': return <FaCheckCircle className="text-blue-600" />;
        case 'processing': return <FaCog className="text-blue-600" />;
        case 'ready': return <FaCheck className="text-orange-600" />;
        case 'out_for_delivery': return <FaTruck className="text-orange-600" />;
        case 'delivered': return <FaCheck className="text-green-600" />;
        case 'cancelled': return <FaTimesCircle className="text-red-600" />;
        default: return <FaHistory className="text-gray-600" />;
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
        default: return 'Unknown';
      }
    };

    const getTrackingProgress = (status) => {
      switch (status) {
        case 'placed': return 20;
        case 'confirmed': return 25;
        case 'processing': return 50;
        case 'ready': return 75;
        case 'out_for_delivery': return 90;
        case 'delivered': return 100;
        default: return 0;
      }
    };

    return (
      <div className="space-y-6">

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order._id || order.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 p-6 border-b border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                        <FaShoppingCart className="text-white text-lg" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-800">Order #{order.order_number || order._id}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaClock className="text-gray-400" />
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm ${getStatusColor(order.order_status)} shadow-sm`}>
                      {getStatusIcon(order.order_status)}
                      <span>{getStatusText(order.order_status)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Order Items */}
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaShoppingBag className="text-blue-600" />
                      Order Items
                    </h5>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <FaBox className="text-blue-600 text-sm" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800">{item.name}</span>
                              <div className="text-sm text-gray-600">₹{item.unit_price} per unit</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600 mb-1">Qty: {item.quantity}</div>
                            <div className="font-bold text-blue-600">₹{item.total_price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6 border border-green-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <FaCreditCard className="text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Payment Method</div>
                          <div className="font-semibold text-gray-800">
                            {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method === 'online' ? 'Online Payment' : 'Cash'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Order Total</div>
                        <div className="text-2xl font-bold text-green-600">₹{order.total_amount}</div>
                      </div>
                    </div>
                  </div>

                  {/* Order Tracking - Blinkit Style */}
                  {order.order_status !== 'delivered' && order.order_status !== 'cancelled' && (
                    <div className="border-t border-gray-200 pt-6">
                      <h5 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <FaRoute className="text-blue-600" />
                        Order Tracking
                      </h5>

                      {/* Vertical Timeline */}
                      <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                        {/* Timeline Steps */}
                        <div className="space-y-8">
                          {/* Order Placed */}
                          <div className="relative flex items-start gap-4">
                            <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                              ['placed', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered'].includes(order.order_status)
                                ? 'bg-green-500 text-white'
                                : order.order_status === 'placed'
                                ? 'bg-blue-500 text-white animate-pulse'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {['placed', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered'].includes(order.order_status) ? (
                                <FaCheck className="text-sm" />
                              ) : (
                                <FaBox className="text-sm" />
                              )}
                            </div>
                            <div className="flex-1 pb-8">
                              <div className={`font-semibold text-base ${
                                ['placed', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered'].includes(order.order_status)
                                  ? 'text-green-700'
                                  : order.order_status === 'placed'
                                  ? 'text-blue-700'
                                  : 'text-gray-600'
                              }`}>
                                Order Placed
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Your order has been confirmed and is being prepared
                              </div>
                              {order.order_status === 'placed' && (
                                <div className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  Currently processing your order
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Confirmed */}
                          <div className="relative flex items-start gap-4">
                            <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                              ['confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered'].includes(order.order_status)
                                ? 'bg-green-500 text-white'
                                : order.order_status === 'confirmed'
                                ? 'bg-blue-500 text-white animate-pulse'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {['confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered'].includes(order.order_status) ? (
                                <FaCheck className="text-sm" />
                              ) : (
                                <FaCheckCircle className="text-sm" />
                              )}
                            </div>
                            <div className="flex-1 pb-8">
                              <div className={`font-semibold text-base ${
                                ['confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered'].includes(order.order_status)
                                  ? 'text-green-700'
                                  : order.order_status === 'confirmed'
                                  ? 'text-blue-700'
                                  : 'text-gray-600'
                              }`}>
                                Order Confirmed
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Your order has been confirmed by the admin
                              </div>
                              {order.order_status === 'confirmed' && (
                                <div className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  Preparing your order
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Processing */}
                          <div className="relative flex items-start gap-4">
                            <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                              ['processing', 'ready', 'out_for_delivery', 'delivered'].includes(order.order_status)
                                ? 'bg-green-500 text-white'
                                : order.order_status === 'processing'
                                ? 'bg-blue-500 text-white animate-pulse'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {['processing', 'ready', 'out_for_delivery', 'delivered'].includes(order.order_status) ? (
                                <FaCheck className="text-sm" />
                              ) : (
                                <FaCog className="text-sm" />
                              )}
                            </div>
                            <div className="flex-1 pb-8">
                              <div className={`font-semibold text-base ${
                                ['processing', 'ready', 'out_for_delivery', 'delivered'].includes(order.order_status)
                                  ? 'text-green-700'
                                  : order.order_status === 'processing'
                                  ? 'text-blue-700'
                                  : 'text-gray-600'
                              }`}>
                                Order Processing
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                We're preparing your items with care
                              </div>
                              {order.order_status === 'processing' && (
                                <div className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  Packing your order
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Ready */}
                          <div className="relative flex items-start gap-4">
                            <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                              ['ready', 'out_for_delivery', 'delivered'].includes(order.order_status)
                                ? 'bg-green-500 text-white'
                                : order.order_status === 'ready'
                                ? 'bg-orange-500 text-white animate-pulse'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {['ready', 'out_for_delivery', 'delivered'].includes(order.order_status) ? (
                                <FaCheck className="text-sm" />
                              ) : (
                                <FaCheck className="text-sm" />
                              )}
                            </div>
                            <div className="flex-1 pb-8">
                              <div className={`font-semibold text-base ${
                                ['ready', 'out_for_delivery', 'delivered'].includes(order.order_status)
                                  ? 'text-green-700'
                                  : order.order_status === 'ready'
                                  ? 'text-orange-700'
                                  : 'text-gray-600'
                              }`}>
                                Order Ready
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Your order is ready for pickup/delivery
                              </div>
                              {order.order_status === 'ready' && (
                                <div className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-1">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                  Ready for delivery
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Out for Delivery */}
                          <div className="relative flex items-start gap-4">
                            <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                              ['out_for_delivery', 'delivered'].includes(order.order_status)
                                ? 'bg-green-500 text-white'
                                : order.order_status === 'out_for_delivery'
                                ? 'bg-orange-500 text-white animate-pulse'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {['out_for_delivery', 'delivered'].includes(order.order_status) ? (
                                <FaCheck className="text-sm" />
                              ) : (
                                <FaTruck className="text-sm" />
                              )}
                            </div>
                            <div className="flex-1 pb-8">
                              <div className={`font-semibold text-base ${
                                ['out_for_delivery', 'delivered'].includes(order.order_status)
                                  ? 'text-green-700'
                                  : order.order_status === 'out_for_delivery'
                                  ? 'text-orange-700'
                                  : 'text-gray-600'
                              }`}>
                                Out for Delivery
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Your order is on the way to your doorstep
                              </div>
                              {order.order_status === 'out_for_delivery' && (
                                <div className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-1">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                  Delivery partner assigned
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Delivered */}
                          <div className="relative flex items-start gap-4">
                            <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                              order.order_status === 'delivered'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {order.order_status === 'delivered' ? (
                                <FaCheck className="text-sm" />
                              ) : (
                                <FaCheck className="text-sm" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`font-semibold text-base ${
                                order.order_status === 'delivered'
                                  ? 'text-green-700'
                                  : 'text-gray-600'
                              }`}>
                                Delivered
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Your order has been successfully delivered
                              </div>
                              {order.order_status === 'delivered' && (
                                <div className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                                  <FaCheckCircle className="text-sm" />
                                  Order completed successfully
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Address */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-start gap-3">
                      <FaMapMarkerAlt className="text-purple-600 text-lg mt-1" />
                      <div>
                        <div className="text-sm font-semibold text-gray-700 mb-1">Delivery Address</div>
                        <div className="text-gray-800">{order.delivery_address || order.customer_address}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FaHistory className="text-4xl text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                <FaShoppingCart className="text-white text-sm" />
              </div>
            </div>
            <h4 className="text-2xl font-bold text-gray-800 mb-3">No orders yet</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Your order history will appear here once you place your first order. Start shopping to see your orders here!</p>
            <button
              onClick={() => setActiveTab('shop')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaShoppingCart className="inline mr-2" />
              Start Shopping
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSpecialOrders = () => {
    const getSpecialStatusColor = (status) => {
      switch (status) {
        case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
        case 'expired': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getSpecialStatusIcon = (status) => {
      switch (status) {
        case 'active': return <FaClock className="text-blue-600" />;
        case 'delivered': return <FaCheckCircle className="text-green-600" />;
        case 'cancelled': return <FaTimesCircle className="text-red-600" />;
        case 'expired': return <FaExclamationTriangle className="text-yellow-600" />;
        default: return <FaBox className="text-gray-600" />;
      }
    };

    const getSpecialStatusText = (status) => {
      switch (status) {
        case 'active': return 'Booking Active';
        case 'delivered': return 'Delivered';
        case 'cancelled': return 'Cancelled';
        case 'expired': return 'Expired';
        default: return 'Unknown';
      }
    };

    const getSpecialDeliveryProgress = (reservation) => {
      if (reservation.status === 'delivered') return 100;
      if (reservation.status === 'cancelled' || reservation.status === 'expired') return 0;

      const stages = getSpecialTrackingStages(reservation);
      const completedStages = stages.filter(stage => stage.completed).length;
      return Math.round((completedStages / stages.length) * 100);
    };

    return (
      <div className="space-y-6">

        {/* Special Orders Tracking Section */}
        {specialReservations.length > 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4 shadow-lg">
                <FaBox className="text-white text-2xl" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">Special Orders Tracking</h3>
              <p className="text-gray-600">Track your advance booked special products</p>
            </div>

            {specialReservations.map(reservation => (
              <div key={reservation._id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 p-6 border-b border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                        <FaBox className="text-white text-lg" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-800">Booking #{reservation._id.slice(-8).toUpperCase()}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(reservation.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm ${getSpecialStatusColor(reservation.status)} shadow-sm`}>
                      {getSpecialStatusIcon(reservation.status)}
                      <span>{getSpecialStatusText(reservation.status)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaBox className="text-purple-600" />
                      Product Details
                    </h5>
                    <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center shadow-sm">
                          <FaBox className="text-purple-600 text-2xl" />
                        </div>
                        <div className="flex-1">
                          <h6 className="text-xl font-bold text-gray-800">{reservation.product_id?.name}</h6>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <FaBox className="text-gray-400" />
                              Quantity: {reservation.quantity}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaRupeeSign className="text-gray-400" />
                              Total: ₹{reservation.total_amount?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                    <div className="flex items-center gap-3 mb-4">
                      <FaTruck className="text-indigo-600 text-xl" />
                      <div>
                        <h5 className="text-lg font-semibold text-gray-800">Delivery Tracking</h5>
                        <div className="text-sm text-gray-600">Track your special product delivery progress</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm font-bold text-indigo-600">{getSpecialDeliveryProgress(reservation)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${getSpecialDeliveryProgress(reservation)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h6 className="text-md font-semibold text-gray-800 mb-3">Tracking Timeline</h6>
                      {getSpecialTrackingStages(reservation).map((stage, index) => (
                        <div key={stage.id} className="flex items-start gap-4">
                          <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                            stage.completed
                              ? 'bg-green-500 text-white'
                              : stage.id === 'payment' && reservation.payment_status === 'pending'
                              ? 'bg-yellow-500 text-white animate-pulse'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {stage.completed ? <FaCheck className="text-sm" /> : stage.icon}
                          </div>

                          <div className="flex-1 pb-4">
                            <div className={`font-semibold text-base ${stage.completed ? 'text-green-700' : 'text-gray-600'}`}>
                              {stage.label}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {stage.description}
                            </div>
                            {stage.date && (
                              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <FaClock className="text-gray-400" />
                                {new Date(stage.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSalesHistory = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <FaHistory className="section-icon" />
        <h3>Delivery History</h3>
      </div>

      {salesHistory.length > 0 ? (
        <div className="sales-history">
          <div className="history-stats">
            <div className="stat-card">
              <FaShoppingCart className="stat-icon" />
              <div className="stat-info">
                <span className="stat-number">{salesHistory.length}</span>
                <span className="stat-label">Total Deliveries</span>
              </div>
            </div>
            <div className="stat-card">
              <FaRupeeSign className="stat-icon" />
              <div className="stat-info">
                <span className="stat-number">₹{salesHistory.reduce((sum, sale) => sum + sale.total_amount, 0).toFixed(2)}</span>
                <span className="stat-label">Total Spent</span>
              </div>
            </div>
          </div>

          <div className="history-list">
            {salesHistory.map(sale => (
              <div key={sale._id} className="history-item">
                <div className="history-icon">
                  <FaShoppingCart />
                </div>
                <div className="history-details">
                  <div className="history-header">
                    <h5>{sale.product_name || 'Milk'}</h5>
                    <span className={`status-badge ${sale.status === 'present' ? 'delivered' : 'missed'}`}>
                      {sale.status === 'present' ? 'Delivered' : 'Missed'}
                    </span>
                  </div>
                  <div className="history-meta">
                    <span className="date">{new Date(sale.date).toLocaleDateString('en-IN')}</span>
                    <span className="quantity">{sale.quantity} {sale.unit}</span>
                    <span className="amount">₹{sale.total_amount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <FaHistory className="empty-icon" />
          <h4>No delivery history yet</h4>
          <p>Your delivery records will appear here once you start receiving products.</p>
        </div>
      )}
    </div>
  );

  const renderInvoices = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <FaFileInvoice className="section-icon" />
        <h3>Invoice Downloads</h3>
      </div>

      {salesHistory.length > 0 ? (
        <div className="invoices-container">
          <div className="invoice-stats">
            <div className="stat-card">
              <FaFileInvoice className="stat-icon" />
              <div className="stat-info">
                <span className="stat-number">{salesHistory.length}</span>
                <span className="stat-label">Total Invoices</span>
              </div>
            </div>
            <div className="stat-card">
              <FaDownload className="stat-icon" />
              <div className="stat-info">
                <span className="stat-number">{salesHistory.filter(s => s.status === 'present').length}</span>
                <span className="stat-label">Downloadable</span>
              </div>
            </div>
          </div>

          <div className="invoices-list">
            {salesHistory.map(sale => (
              <div key={sale._id} className="invoice-card">
                <div className="invoice-header">
                  <div className="invoice-icon">
                    <FaFileInvoice />
                  </div>
                  <div className="invoice-info">
                    <h5>Invoice #{sale._id.slice(-8).toUpperCase()}</h5>
                    <span className="invoice-date">{new Date(sale.date).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                <div className="invoice-details">
                  <div className="detail-row">
                    <span>Product:</span>
                    <span>{sale.product_name || 'Milk'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Quantity:</span>
                    <span>{sale.quantity} {sale.unit}</span>
                  </div>
                  <div className="detail-row">
                    <span>Amount:</span>
                    <span>₹{sale.total_amount}</span>
                  </div>
                  <div className="detail-row">
                    <span>Status:</span>
                    <span className={`status ${sale.status === 'present' ? 'delivered' : 'pending'}`}>
                      {sale.status === 'present' ? 'Delivered' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="invoice-actions">
                  <button
                    onClick={() => downloadInvoice(sale._id)}
                    className="btn-download"
                    disabled={sale.status !== 'present'}
                  >
                    <FaDownload /> Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <FaFileInvoice className="empty-icon" />
          <h4>No invoices yet</h4>
          <p>Your invoices will be available here after deliveries.</p>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FaUser className="text-blue-600 text-xl" />
        <h3 className="text-2xl font-bold text-gray-800">Profile Management</h3>
      </div>

      {!editingProfile ? (
        <div className="max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FaUser className="text-white text-3xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <FaUser className="text-blue-500 text-lg" />
                <div>
                  <label className="text-sm font-semibold text-gray-600 block">Full Name</label>
                  <p className="text-gray-800 font-medium">{profile.name || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <FaPhone className="text-green-500 text-lg" />
                <div>
                  <label className="text-sm font-semibold text-gray-600 block">Mobile Number</label>
                  <p className="text-gray-800 font-medium">{profile.phone}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <FaEnvelope className="text-purple-500 text-lg" />
                <div>
                  <label className="text-sm font-semibold text-gray-600 block">Email Address</label>
                  <p className="text-gray-800 font-medium">{profile.email || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <FaMapMarkerAlt className="text-red-500 text-lg" />
                <div>
                  <label className="text-sm font-semibold text-gray-600 block">Pincode</label>
                  <p className="text-gray-800 font-medium">{profile.pincode || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-6">
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-red-500 text-lg mt-1" />
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-600 block mb-2">Delivery Address</label>
                <p className="text-gray-800">{profile.address || 'Not set'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FaEdit className="text-blue-500 text-lg" />
              <div>
                <label className="text-sm font-semibold text-gray-600 block">Account Security</label>
                <p className="text-gray-700 font-medium">Manage your account password</p>
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={() => setShowPasswordChange(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FaEdit className="inline mr-2" /> Change Password
              </button>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={startEditingProfile}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaEdit className="inline mr-2" /> Edit Profile
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleProfileUpdate} className="max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-gray-800">Edit Your Information</h4>
            <button
              type="button"
              onClick={cancelEditingProfile}
              className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <FaTimesCircle className="text-lg" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Full Name *</label>
              <input
                type="text"
                value={profileForm.name || ''}
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
              <input
                type="tel"
                value={profile.phone}
                disabled
                className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <small className="text-gray-500 text-xs">Contact admin to change mobile number</small>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                value={profileForm.email || ''}
                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Pincode</label>
              <input
                type="text"
                value={profileForm.pincode || ''}
                onChange={(e) => setProfileForm({...profileForm, pincode: e.target.value})}
                pattern="[0-9]{6}"
                maxLength="6"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <label className="text-sm font-semibold text-gray-700">Delivery Address *</label>
            <textarea
              value={profileForm.address || ''}
              onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
              rows="4"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-vertical"
              required
            />
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-sm font-semibold text-gray-700">Billing Type</label>
            <select
              value={profileForm.billing_type || 'subscription'}
              onChange={(e) => setProfileForm({...profileForm, billing_type: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="subscription">Monthly Subscription</option>
              <option value="per_liter">Per Liter</option>
            </select>
          </div>

          {profileForm.billing_type === 'subscription' && (
            <div className="space-y-2 mb-6">
              <label className="text-sm font-semibold text-gray-700">Monthly Subscription Amount (₹)</label>
              <input
                type="number"
                value={profileForm.subscription_amount || ''}
                onChange={(e) => setProfileForm({...profileForm, subscription_amount: e.target.value})}
                placeholder="Enter monthly amount"
                min="0"
                step="0.01"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {profileForm.billing_type === 'per_liter' && (
            <div className="space-y-2 mb-6">
              <label className="text-sm font-semibold text-gray-700">Price Per Liter (₹)</label>
              <input
                type="number"
                value={profileForm.price_per_liter || ''}
                onChange={(e) => setProfileForm({...profileForm, price_per_liter: e.target.value})}
                placeholder="Enter price per liter"
                min="0"
                step="0.01"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={cancelEditingProfile}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <FaCheckCircle /> Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const renderPayments = () => (
    <div className="dashboard-section">
      <h3>Payment History</h3>
      <p>Payment history feature coming soon...</p>
    </div>
  );

  const renderBills = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FaFileInvoice className="text-blue-600 text-xl" />
        <h3 className="text-2xl font-bold text-gray-800">My Bills</h3>
      </div>

      {billsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your bills...</p>
        </div>
      ) : bills.length > 0 ? (
        <div className="space-y-4">
          {bills.map(bill => (
            <div key={bill._id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 relative">
              {/* Responsive: Buttons at bottom in same row for smaller screens */}
              <div className="lg:hidden absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white to-transparent">
                <div className="flex gap-2">
                  <button
                    onClick={() => viewBillPreview(bill._id, bill.invoice_number)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm"
                  >
                    <FaEye /> View Bill
                  </button>
                  {bill.status === 'unpaid' && !pendingPayments.some(payment => payment.bill_month === bill.billing_period) && (
                    <button
                      onClick={() => initiatePayment(bill)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <FaCreditCard /> Pay Now
                    </button>
                  )}
                  {bill.status === 'unpaid' && pendingPayments.some(payment => payment.bill_month === bill.billing_period) && (
                    <button
                      disabled
                      className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-1 text-sm"
                    >
                      <FaClock /> Under Review
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 pb-20 md:pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">
                        {new Date(bill.billing_period + '-01').toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </div>
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                        bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                        bill.status === 'unpaid' ? (
                          pendingPayments.some(payment => payment.bill_month === bill.billing_period)
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        ) :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bill.status === 'paid' ? 'Paid' :
                         bill.status === 'unpaid' && pendingPayments.some(payment => payment.bill_month === bill.billing_period)
                           ? 'Payment Pending Review'
                           : bill.status}
                      </div>
                      {bill.status === 'unpaid' && new Date() > new Date(bill.due_date) && (
                        <div className="text-xs text-red-600 font-medium mt-1">
                          Overdue by {Math.floor((new Date() - new Date(bill.due_date)) / (1000 * 60 * 60 * 24))} days
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-xl font-bold text-gray-800">₹{Number(bill.total_amount).toFixed(2)}</div>
                        <div className="text-green-600 font-semibold">{bill.total_liters} L milk</div>
                      </div>
                    </div>
                  </div>
                  {/* Desktop: Buttons on the right */}
                  <div className="hidden md:flex flex-col gap-2">
                    <button
                      onClick={() => viewBillPreview(bill._id, bill.invoice_number)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaEye /> View Bill
                    </button>
                    {bill.status === 'unpaid' && !pendingPayments.some(payment => payment.bill_month === bill.billing_period) && (
                      <button
                        onClick={() => initiatePayment(bill)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaCreditCard /> Pay Now
                      </button>
                    )}
                    {bill.status === 'unpaid' && pendingPayments.some(payment => payment.bill_month === bill.billing_period) && (
                      <button
                        disabled
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <FaClock /> Payment Under Review
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Invoice: {bill.invoice_number} | Due: {new Date(bill.due_date).toLocaleDateString('en-IN')}
                  {bill.status === 'unpaid' && new Date() > new Date(bill.due_date) && (
                    <span className="text-red-600 font-medium ml-2">
                      (Overdue by {Math.floor((new Date() - new Date(bill.due_date)) / (1000 * 60 * 60 * 24))} days)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4">
            <FaFileInvoice />
          </div>
          <h4 className="text-xl font-semibold text-gray-800 mb-2">No bills yet</h4>
          <p className="text-gray-600">Your monthly milk bills will appear here.</p>
        </div>
      )}
    </div>
  );

  const renderSpecialReservations = () => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
        case 'expired': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'active': return <FaClock className="text-blue-600" />;
        case 'delivered': return <FaCheckCircle className="text-green-600" />;
        case 'cancelled': return <FaTimesCircle className="text-red-600" />;
        case 'expired': return <FaExclamationTriangle className="text-yellow-600" />;
        default: return <FaBox className="text-gray-600" />;
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'active': return 'Booking Active';
        case 'delivered': return 'Delivered';
        case 'cancelled': return 'Cancelled';
        case 'expired': return 'Expired';
        default: return 'Unknown';
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

    const getTrackingStages = (reservation) => {
      const expectedDate = reservation.expected_delivery_date ? new Date(reservation.expected_delivery_date) : null;

      const stages = [
        {
          id: 'booked',
          label: 'Booked',
          description: 'Advance booking confirmed',
          completed: true,
          date: reservation.createdAt,
          icon: <FaCalendarAlt className="text-sm" />
        },
        {
          id: 'payment',
          label: 'Payment',
          description: reservation.payment_status === 'completed' ? 'Payment completed' : 'Payment pending',
          completed: reservation.payment_status === 'completed',
          date: reservation.payment_status === 'completed' ? reservation.updatedAt : null,
          icon: <FaCreditCard className="text-sm" />
        },
        {
          id: 'processing',
          label: 'Processing',
          description: 'Product being prepared',
          completed: reservation.status === 'active' && expectedDate,
          date: expectedDate ? new Date(expectedDate.getTime() - 7 * 24 * 60 * 60 * 1000) : null,
          icon: <FaCog className="text-sm" />
        },
        {
          id: 'ready',
          label: 'Ready',
          description: 'Product ready for delivery',
          completed: reservation.status === 'active' && expectedDate && new Date() >= new Date(expectedDate.getTime() - 2 * 24 * 60 * 60 * 1000),
          date: expectedDate ? new Date(expectedDate.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
          icon: <FaCheck className="text-sm" />
        },
        {
          id: 'delivered',
          label: 'Delivered',
          description: 'Product delivered successfully',
          completed: reservation.status === 'delivered',
          date: reservation.status === 'delivered' ? reservation.updatedAt : null,
          icon: <FaCheckCircle className="text-sm" />
        }
      ];

      return stages;
    };

    const getDeliveryProgress = (reservation) => {
      if (reservation.status === 'delivered') return 100;
      if (reservation.status === 'cancelled' || reservation.status === 'expired') return 0;

      const stages = getTrackingStages(reservation);
      const completedStages = stages.filter(stage => stage.completed).length;
      return Math.round((completedStages / stages.length) * 100);
    };

    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <FaBox className="text-white text-2xl" />
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-2">Special Product Bookings</h3>
          <p className="text-gray-600">Track your advance bookings for special products</p>
        </div>

        {specialReservations.length > 0 ? (
          <div className="space-y-6">
            {specialReservations.map(reservation => (
              <div key={reservation._id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                {/* Reservation Header */}
                <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 p-6 border-b border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                        <FaBox className="text-white text-lg" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-800">Booking #{reservation._id.slice(-8).toUpperCase()}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(reservation.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm ${getStatusColor(reservation.status)} shadow-sm`}>
                      {getStatusIcon(reservation.status)}
                      <span>{getStatusText(reservation.status)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Product Details */}
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaBox className="text-purple-600" />
                      Product Details
                    </h5>
                    <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center shadow-sm">
                          <FaBox className="text-purple-600 text-2xl" />
                        </div>
                        <div className="flex-1">
                          <h6 className="text-xl font-bold text-gray-800">{reservation.product_id?.name}</h6>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <FaBox className="text-gray-400" />
                              Quantity: {reservation.quantity}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaRupeeSign className="text-gray-400" />
                              Total: ₹{reservation.total_amount?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <FaCalendarAlt className="text-blue-600 text-lg mt-1" />
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-1">Expected Delivery</div>
                          <div className="text-gray-800 font-medium">
                            {(() => {
                              if (!reservation.expected_delivery_date) return 'To be scheduled by admin';
                              const date = new Date(reservation.expected_delivery_date);
                              return !isNaN(date.getTime())
                                ? date.toLocaleDateString('en-IN', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })
                                : 'To be scheduled by admin';
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-start gap-3">
                        <FaCreditCard className="text-green-600 text-lg mt-1" />
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-1">Payment Status</div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(reservation.payment_status)}`}>
                            {reservation.payment_status === 'completed' ? (
                              <FaCheckCircle className="text-sm" />
                            ) : reservation.payment_status === 'pending' ? (
                              <FaClock className="text-sm" />
                            ) : (
                              <FaTimesCircle className="text-sm" />
                            )}
                            {reservation.payment_status?.charAt(0).toUpperCase() + reservation.payment_status?.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deposit Information */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaRupeeSign className="text-yellow-600 text-xl" />
                        <div>
                          <div className="text-sm font-semibold text-gray-700">Deposit Amount</div>
                          <div className="text-2xl font-bold text-yellow-600">₹{reservation.deposit_amount?.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Payment Method</div>
                        <div className="font-semibold text-gray-800 capitalize">{reservation.payment_method}</div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Progress Tracking */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FaTruck className="text-indigo-600 text-xl" />
                      <div>
                        <h5 className="text-lg font-semibold text-gray-800">Delivery Tracking</h5>
                        <div className="text-sm text-gray-600">Track your special product delivery progress</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm font-bold text-indigo-600">{getDeliveryProgress(reservation)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${getDeliveryProgress(reservation)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Tracking Timeline */}
                    <div className="space-y-4">
                      <h6 className="text-md font-semibold text-gray-800 mb-3">Tracking Timeline</h6>
                      {getTrackingStages(reservation).map((stage, index) => (
                        <div key={stage.id} className="flex items-start gap-4">
                          {/* Timeline Line */}
                          {index < getTrackingStages(reservation).length - 1 && (
                            <div className={`absolute left-6 top-12 w-0.5 h-12 ${stage.completed ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                          )}

                          {/* Stage Icon */}
                          <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                            stage.completed
                              ? 'bg-green-500 text-white'
                              : stage.id === 'payment' && reservation.payment_status === 'pending'
                              ? 'bg-yellow-500 text-white animate-pulse'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {stage.completed ? <FaCheck className="text-sm" /> : stage.icon}
                          </div>

                          {/* Stage Details */}
                          <div className="flex-1 pb-4">
                            <div className={`font-semibold text-base ${stage.completed ? 'text-green-700' : 'text-gray-600'}`}>
                              {stage.label}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {stage.description}
                            </div>
                            {stage.date && (
                              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <FaClock className="text-gray-400" />
                                {new Date(stage.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {reservation.special_instructions && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-start gap-3">
                        <FaExclamationTriangle className="text-purple-600 text-lg mt-1" />
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-1">Special Instructions</div>
                          <div className="text-gray-800">{reservation.special_instructions}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FaBox className="text-4xl text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                <FaCalendarAlt className="text-white text-sm" />
              </div>
            </div>
            <h4 className="text-2xl font-bold text-gray-800 mb-3">No special bookings yet</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Your advance bookings for special products will appear here. Book special products like cow urine, cow penis, and other dairy by-products.</p>
            <button
              onClick={() => setActiveTab('shop')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaShoppingCart className="inline mr-2" />
              Browse Special Products
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="dashboard-section">
      <h3>Notifications</h3>
      <p>No new notifications</p>
    </div>
  );

  const renderReviews = () => {
    const renderStars = (rating, interactive = false) => {
      return [1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} ${
            interactive ? 'cursor-pointer hover:text-yellow-400' : ''
          }`}
          onClick={interactive ? () => setReviewData({...reviewData, rating: star}) : undefined}
        />
      ));
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <FaStar className="text-yellow-600 text-xl" />
          <h3 className="text-2xl font-bold text-gray-800">Share Your Experience</h3>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
          <div className="text-center mb-6">
            <h4 className="text-xl font-semibold text-gray-800 mb-2">
              {myReview ? 'Update Your Review' : 'Write a Review'}
            </h4>
            <p className="text-gray-600">
              {myReview
                ? 'Update your feedback about our service'
                : 'Share your experience with Hareram DudhWale'
              }
            </p>
          </div>

          <form onSubmit={handleReviewSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Rating</label>
              <div className="flex gap-1 justify-center">
                {renderStars(reviewData.rating, true)}
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                {reviewData.rating} out of 5 stars
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reviewData.review_text}
                onChange={(e) => setReviewData({...reviewData, review_text: e.target.value})}
                placeholder="Tell us about your experience with our milk delivery service..."
                rows="4"
                maxLength="500"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors resize-vertical"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {reviewData.review_text.length}/500 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                value={reviewData.location}
                onChange={(e) => setReviewData({...reviewData, location: e.target.value})}
                placeholder="e.g., Sector 15, Gurgaon"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={reviewLoading || !reviewData.review_text.trim()}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {reviewLoading ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </form>

          {myReview && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-700">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  myReview.is_approved
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {myReview.is_approved ? 'Approved & Published' : 'Pending Approval'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {myReview.is_approved
                  ? 'Your review is live on our homepage!'
                  : 'Your review has been submitted and is waiting for admin approval.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h3 className="text-red-800 font-bold text-lg mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20 font-sans">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-6 shadow-xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        <div className="flex justify-between items-center max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <FaUser className="text-xl" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Customer Dashboard
              </h2>
              <p className="text-blue-100 text-lg font-medium">
                Welcome back, <span className="text-white font-semibold">{profile.name || 'Customer'}</span>! 👋
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile Quick Actions */}
            <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <FaCheckCircle className="text-white text-sm" />
              </div>
              <span className="text-sm font-medium">Active</span>
            </div>

            {/* Enhanced Logout Button */}
            <button
              onClick={handleLogout}
              className="group bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-2 border-white/30 rounded-xl px-6 py-3 font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm relative overflow-hidden"
            >
              {/* Button Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

              {/* Icon with animation */}
              <div className="relative z-10 flex items-center gap-2">
                <FaSignOutAlt className="text-lg group-hover:rotate-12 transition-transform duration-300" />
                <span className="hidden sm:inline font-bold">Logout</span>
              </div>

              {/* Hover indicator */}
              <div className="absolute inset-0 rounded-xl border-2 border-white/0 group-hover:border-white/50 transition-all duration-300"></div>
            </button>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </div>

      {/* Enhanced Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl z-50">
        <div className="flex justify-around max-w-lg mx-auto px-2 py-3">
          {/* Home */}
          <div
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 min-w-0 flex-1 relative group ${
              activeTab === 'overview'
                ? 'text-white bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              activeTab === 'overview'
                ? 'bg-white/20'
                : 'group-hover:bg-blue-50'
            }`}>
              <FaUser className={`text-lg transition-all duration-300 ${
                activeTab === 'overview' ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
              }`} />
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${
              activeTab === 'overview' ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
            }`}>
              Home
            </span>
            {activeTab === 'overview' && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
            )}
          </div>

          {/* Daily */}
          <div
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 min-w-0 flex-1 relative group ${
              activeTab === 'daily'
                ? 'text-white bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-50 hover:text-orange-600'
            }`}
            onClick={() => setActiveTab('daily')}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              activeTab === 'daily'
                ? 'bg-white/20'
                : 'group-hover:bg-orange-50'
            }`}>
              <GiMilkCarton className={`text-lg transition-all duration-300 ${
                activeTab === 'daily' ? 'text-white' : 'text-gray-500 group-hover:text-orange-600'
              }`} />
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${
              activeTab === 'daily' ? 'text-white' : 'text-gray-600 group-hover:text-orange-600'
            }`}>
              Daily
            </span>
            {activeTab === 'daily' && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
            )}
          </div>


          {/* Shop */}
          <div
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 min-w-0 flex-1 relative group ${
              activeTab === 'shop'
                ? 'text-white bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
            }`}
            onClick={() => setActiveTab('shop')}
          >
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${
              activeTab === 'shop'
                ? 'bg-white/20'
                : 'group-hover:bg-purple-50'
            }`}>
              <FaShoppingCart className={`text-lg transition-all duration-300 ${
                activeTab === 'shop' ? 'text-white' : 'text-gray-500 group-hover:text-purple-600'
              }`} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {cart.length > 9 ? '9+' : cart.length}
                </span>
              )}
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${
              activeTab === 'shop' ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'
            }`}>
              Shop
            </span>
            {activeTab === 'shop' && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
            )}
          </div>

          {/* Orders */}
          <div
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 min-w-0 flex-1 relative group ${
              activeTab === 'orders'
                ? 'text-white bg-gradient-to-br from-green-500 to-green-600 shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
            }`}
            onClick={() => setActiveTab('orders')}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              activeTab === 'orders'
                ? 'bg-white/20'
                : 'group-hover:bg-green-50'
            }`}>
              <FaHistory className={`text-lg transition-all duration-300 ${
                activeTab === 'orders' ? 'text-white' : 'text-gray-500 group-hover:text-green-600'
              }`} />
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${
              activeTab === 'orders' ? 'text-white' : 'text-gray-600 group-hover:text-green-600'
            }`}>
              Orders
            </span>
            {activeTab === 'orders' && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
            )}
          </div>

          {/* Bills */}
          <div
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 min-w-0 flex-1 relative group ${
              activeTab === 'bills'
                ? 'text-white bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-50 hover:text-teal-600'
            }`}
            onClick={() => setActiveTab('bills')}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              activeTab === 'bills'
                ? 'bg-white/20'
                : 'group-hover:bg-teal-50'
            }`}>
              <FaFileInvoice className={`text-lg transition-all duration-300 ${
                activeTab === 'bills' ? 'text-white' : 'text-gray-500 group-hover:text-teal-600'
              }`} />
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${
              activeTab === 'bills' ? 'text-white' : 'text-gray-600 group-hover:text-teal-600'
            }`}>
              Bills
            </span>
            {activeTab === 'bills' && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
            )}
          </div>


          {/* Reviews */}
          <div
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 min-w-0 flex-1 relative group ${
              activeTab === 'reviews'
                ? 'text-white bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-50 hover:text-orange-600'
            }`}
            onClick={() => setActiveTab('reviews')}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              activeTab === 'reviews'
                ? 'bg-white/20'
                : 'group-hover:bg-orange-50'
            }`}>
              <FaStar className={`text-lg transition-all duration-300 ${
                activeTab === 'reviews' ? 'text-white' : 'text-gray-500 group-hover:text-orange-600'
              }`} />
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${
              activeTab === 'reviews' ? 'text-white' : 'text-gray-600 group-hover:text-orange-600'
            }`}>
              Reviews
            </span>
            {activeTab === 'reviews' && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
            )}
          </div>

          {/* Profile */}
          <div
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 min-w-0 flex-1 relative group ${
              activeTab === 'profile'
                ? 'text-white bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-50 hover:text-pink-600'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              activeTab === 'profile'
                ? 'bg-white/20'
                : 'group-hover:bg-pink-50'
            }`}>
              <FaUser className={`text-lg transition-all duration-300 ${
                activeTab === 'profile' ? 'text-white' : 'text-gray-500 group-hover:text-pink-600'
              }`} />
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${
              activeTab === 'profile' ? 'text-white' : 'text-gray-600 group-hover:text-pink-600'
            }`}>
              Profile
            </span>
            {activeTab === 'profile' && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
            )}
          </div>
        </div>

        {/* Safe area for iOS devices */}
        <div className="h-safe-area-inset-bottom"></div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'shop' && renderShop()}
        {activeTab === 'daily' && renderDailyMilk()}
        {activeTab === 'bills' && renderBills()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'profile' && renderProfile()}
      </div>

      {/* Bill Preview Modal */}
      {showBillPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FaFileInvoice className="text-blue-600 text-xl" />
                <h3 className="text-xl font-bold text-gray-800">Bill Preview - {billPreviewInvoice}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadBillFromPreview}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FaDownload /> Download
                </button>
                <button
                  onClick={() => setShowBillPreview(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              <div
                className="bill-content"
                dangerouslySetInnerHTML={{ __html: billPreviewContent }}
                style={{
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: '1.6',
                  color: '#333'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FaCreditCard className="text-blue-600 text-xl" />
                <h3 className="text-xl font-bold text-gray-800">Make Payment</h3>
              </div>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
              {/* Payment Settings Display */}
              {paymentSettings.account_number && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-800 mb-3">Payment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Account Number:</span>
                      <p className="text-gray-800 font-mono">{paymentSettings.account_number}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Account Holder:</span>
                      <p className="text-gray-800">{paymentSettings.account_holder_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Bank:</span>
                      <p className="text-gray-800">{paymentSettings.bank_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">IFSC:</span>
                      <p className="text-gray-800 font-mono">{paymentSettings.ifsc_code}</p>
                    </div>
                    {paymentSettings.upi_id && (
                      <div>
                        <span className="font-medium text-gray-700">UPI ID:</span>
                        <p className="text-gray-800">{paymentSettings.upi_id}</p>
                      </div>
                    )}
                  </div>
                  {paymentSettings.qr_code_image && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-700">QR Code:</span>
                      <div className="mt-2">
                        <img src={paymentSettings.qr_code_image} alt="Payment QR Code" className="w-32 h-32 border border-gray-300 rounded" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter payment amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bill Month *</label>
                  <input
                    type="month"
                    value={paymentData.bill_month}
                    onChange={(e) => setPaymentData({...paymentData, bill_month: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    required
                  />
                  <small className="text-gray-500 text-xs mt-1 block">
                    You can only pay for the previous month between 1st-10th of current month
                  </small>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction ID</label>
                <input
                  type="text"
                  value={paymentData.transaction_id}
                  onChange={(e) => setPaymentData({...paymentData, transaction_id: e.target.value})}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter transaction ID from bank/UPI app"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Screenshot *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  required
                />
                {paymentData.payment_screenshot && (
                  <div className="mt-2">
                    <img src={paymentData.payment_screenshot} alt="Payment Screenshot" className="w-32 h-32 object-cover border border-gray-300 rounded" />
                  </div>
                )}
                <small className="text-gray-500 text-xs mt-1 block">Upload a screenshot of your payment confirmation</small>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  rows="3"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-vertical"
                  placeholder="Any additional notes"
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FaEdit className="text-orange-600 text-xl" />
                <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Update Your Account Password</h4>
                <p className="text-sm text-gray-600 mb-6">
                  For security, you'll need to enter your current password and choose a strong new password.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Enter your new password"
                  required
                />
                <small className="text-gray-500 text-xs mt-1 block">
                  Password must be at least 8 characters with uppercase, lowercase, number and special character
                </small>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Re-enter your new password"
                  required
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordChanging}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                  {passwordChanging ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Changing...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="text-sm" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
