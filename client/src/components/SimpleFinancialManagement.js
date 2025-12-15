import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlus, FaRupeeSign, FaArrowUp, FaArrowDown, FaUsers, FaBuilding, FaCreditCard, FaCheck } from 'react-icons/fa';

const SimpleFinancialManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Simple data structures
  const [payables, setPayables] = useState([]); // People/businesses you owe money to
  const [receivables, setReceivables] = useState([]); // People who owe you money
  const [payments, setPayments] = useState([]); // Payment records

  // Forms
  const [showPayableForm, setShowPayableForm] = useState(false);
  const [showReceivableForm, setShowReceivableForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [payableForm, setPayableForm] = useState({
    person_name: '',
    amount: '',
    description: '',
    due_date: '',
    paid_amount: 0
  });

  const [receivableForm, setReceivableForm] = useState({
    person_name: '',
    amount: '',
    description: '',
    due_date: '',
    received_amount: 0
  });

  const [paymentForm, setPaymentForm] = useState({
    type: 'payable', // 'payable' or 'receivable'
    person_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchPayables();
    fetchReceivables();
    fetchPayments();
  }, []);

  const fetchPayables = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/financial/payables-simple', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayables(response.data);
    } catch (err) {
      console.log('Payables API not available, using empty data');
      setPayables([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivables = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/financial/receivables-simple', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReceivables(response.data);
    } catch (err) {
      console.log('Receivables API not available, using empty data');
      setReceivables([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/financial/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (err) {
      console.log('Payments API not available, using empty data');
      setPayments([]);
    }
  };

  const handleCreatePayable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/financial/payables-simple', payableForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success', 'Payable added successfully', 'success');
      setShowPayableForm(false);
      setPayableForm({
        person_name: '',
        amount: '',
        description: '',
        due_date: '',
        paid_amount: 0
      });
      fetchPayables();
    } catch (err) {
      Swal.fire('Error', 'Failed to add payable', 'error');
    }
  };

  const handleCreateReceivable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/financial/receivables-simple', receivableForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success', 'Receivable added successfully', 'success');
      setShowReceivableForm(false);
      setReceivableForm({
        person_name: '',
        amount: '',
        description: '',
        due_date: '',
        received_amount: 0
      });
      fetchReceivables();
    } catch (err) {
      Swal.fire('Error', 'Failed to add receivable', 'error');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/financial/payments', paymentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success', 'Payment recorded successfully', 'success');
      setShowPaymentForm(false);
      setPaymentForm({
        type: 'payable',
        person_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: ''
      });
      fetchPayables();
      fetchReceivables();
      fetchPayments();
    } catch (err) {
      Swal.fire('Error', 'Failed to record payment', 'error');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getTotalPayables = () => {
    return payables.reduce((sum, item) => sum + (item.amount - item.paid_amount), 0);
  };

  const getTotalReceivables = () => {
    return receivables.reduce((sum, item) => sum + (item.amount - item.received_amount), 0);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaRupeeSign },
    { id: 'payables', label: 'किसको पैसा देना है (Payables)', icon: FaArrowUp },
    { id: 'receivables', label: 'किससे पैसा लेना है (Receivables)', icon: FaArrowDown },
    { id: 'payments', label: 'Payments History', icon: FaCheck }
  ];

  if (loading) {
    return <div className="text-center p-10 text-sm sm:text-base md:text-lg text-gray-500">Loading financial data...</div>;
  }

  return (
    <div className="max-w-screen-xl mx-auto p-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-4 sm:gap-[15px]">
        <h2 className="m-0 text-gray-800 text-lg sm:text-xl md:text-2xl lg:text-3xl">Simple Financial Management</h2>
      </div>

      {error && <div className="bg-red-500 text-white p-2.5 rounded mb-5">{error}</div>}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="text-sm" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">किसको देना है</h3>
              <FaArrowUp className="text-red-500 text-xl" />
            </div>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(getTotalPayables())}</p>
            <p className="text-sm text-gray-600">Total Payables</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">किससे लेना है</h3>
              <FaArrowDown className="text-green-500 text-xl" />
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(getTotalReceivables())}</p>
            <p className="text-sm text-gray-600">Total Receivables</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Net Position</h3>
              <FaRupeeSign className="text-blue-500 text-xl" />
            </div>
            <p className={`text-3xl font-bold ${getTotalReceivables() - getTotalPayables() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(getTotalReceivables() - getTotalPayables())}
            </p>
            <p className="text-sm text-gray-600">Receivables - Payables</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Total Transactions</h3>
              <FaCheck className="text-purple-500 text-xl" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{payments.length}</p>
            <p className="text-sm text-gray-600">Payment Records</p>
          </div>
        </div>
      )}

      {/* Payables Tab */}
      {activeTab === 'payables' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">किसको पैसा देना है (Payables)</h3>
            <button
              onClick={() => setShowPayableForm(true)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
            >
              <FaPlus /> Add Payable
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="p-3 text-left">Person/Business</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Total Amount</th>
                  <th className="p-3 text-left">Paid Amount</th>
                  <th className="p-3 text-left">Balance Due</th>
                  <th className="p-3 text-left">Due Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payables.map((payable, index) => (
                  <tr key={payable._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 font-semibold">{payable.person_name}</td>
                    <td className="p-3">{payable.description}</td>
                    <td className="p-3 font-semibold">{formatCurrency(payable.amount)}</td>
                    <td className="p-3 text-green-600">{formatCurrency(payable.paid_amount)}</td>
                    <td className="p-3 font-semibold text-red-600">{formatCurrency(payable.amount - payable.paid_amount)}</td>
                    <td className="p-3">{payable.due_date ? formatDate(payable.due_date) : 'N/A'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setPaymentForm({
                            type: 'payable',
                            person_id: payable._id,
                            amount: '',
                            payment_date: new Date().toISOString().split('T')[0],
                            payment_method: 'cash',
                            notes: `Payment to ${payable.person_name}`
                          });
                          setShowPaymentForm(true);
                        }}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receivables Tab */}
      {activeTab === 'receivables' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">किससे पैसा लेना है (Receivables)</h3>
            <button
              onClick={() => setShowReceivableForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
            >
              <FaPlus /> Add Receivable
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="p-3 text-left">Person/Customer</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Total Amount</th>
                  <th className="p-3 text-left">Received Amount</th>
                  <th className="p-3 text-left">Balance Due</th>
                  <th className="p-3 text-left">Due Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {receivables.map((receivable, index) => (
                  <tr key={receivable._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 font-semibold">{receivable.person_name}</td>
                    <td className="p-3">{receivable.description}</td>
                    <td className="p-3 font-semibold">{formatCurrency(receivable.amount)}</td>
                    <td className="p-3 text-green-600">{formatCurrency(receivable.received_amount)}</td>
                    <td className="p-3 font-semibold text-yellow-600">{formatCurrency(receivable.amount - receivable.received_amount)}</td>
                    <td className="p-3">{receivable.due_date ? formatDate(receivable.due_date) : 'N/A'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setPaymentForm({
                            type: 'receivable',
                            person_id: receivable._id,
                            amount: '',
                            payment_date: new Date().toISOString().split('T')[0],
                            payment_method: 'cash',
                            notes: `Payment from ${receivable.person_name}`
                          });
                          setShowPaymentForm(true);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Receive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments History Tab */}
      {activeTab === 'payments' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Payment History</h3>
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Person</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Method</th>
                  <th className="p-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={payment._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3">{formatDate(payment.payment_date)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        payment.type === 'payable' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {payment.type === 'payable' ? 'Paid' : 'Received'}
                      </span>
                    </td>
                    <td className="p-3">{payment.person_name}</td>
                    <td className="p-3 font-semibold">{formatCurrency(payment.amount)}</td>
                    <td className="p-3">{payment.payment_method}</td>
                    <td className="p-3">{payment.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payable Form Modal */}
      {showPayableForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Payable (किसको देना है)</h3>
            <form onSubmit={handleCreatePayable}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Person/Business Name *</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={payableForm.person_name}
                    onChange={(e) => setPayableForm({...payableForm, person_name: e.target.value})}
                    placeholder="e.g., Cow Supplier, Feed Shop"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={payableForm.description}
                    onChange={(e) => setPayableForm({...payableForm, description: e.target.value})}
                    placeholder="e.g., 2 cows purchased, Feed for 500kg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded"
                    value={payableForm.amount}
                    onChange={(e) => setPayableForm({...payableForm, amount: e.target.value})}
                    placeholder="50000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Already Paid (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded"
                    value={payableForm.paid_amount}
                    onChange={(e) => setPayableForm({...payableForm, paid_amount: e.target.value})}
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={payableForm.due_date}
                    onChange={(e) => setPayableForm({...payableForm, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowPayableForm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                  Add Payable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receivable Form Modal */}
      {showReceivableForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Receivable (किससे लेना है)</h3>
            <form onSubmit={handleCreateReceivable}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Person/Customer Name *</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={receivableForm.person_name}
                    onChange={(e) => setReceivableForm({...receivableForm, person_name: e.target.value})}
                    placeholder="e.g., Customer Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={receivableForm.description}
                    onChange={(e) => setReceivableForm({...receivableForm, description: e.target.value})}
                    placeholder="e.g., Milk bill for March"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded"
                    value={receivableForm.amount}
                    onChange={(e) => setReceivableForm({...receivableForm, amount: e.target.value})}
                    placeholder="5000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Already Received (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded"
                    value={receivableForm.received_amount}
                    onChange={(e) => setReceivableForm({...receivableForm, received_amount: e.target.value})}
                    placeholder="2000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={receivableForm.due_date}
                    onChange={(e) => setReceivableForm({...receivableForm, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowReceivableForm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Add Receivable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              Record Payment ({paymentForm.type === 'payable' ? 'किसको दिया' : 'किससे लिया'})
            </h3>
            <form onSubmit={handleRecordPayment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Type</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value})}
                    required
                  >
                    <option value="payable">Payable (किसको दिया)</option>
                    <option value="receivable">Receivable (किससे लिया)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Person *</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={paymentForm.person_id}
                    onChange={(e) => setPaymentForm({...paymentForm, person_id: e.target.value})}
                    required
                  >
                    <option value="">Select Person</option>
                    {paymentForm.type === 'payable' ?
                      payables.map(p => (
                        <option key={p._id} value={p._id}>{p.person_name}</option>
                      )) :
                      receivables.map(r => (
                        <option key={r._id} value={r._id}>{r.person_name}</option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    placeholder="25000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Date *</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method *</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    rows="2"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowPaymentForm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleFinancialManagement;