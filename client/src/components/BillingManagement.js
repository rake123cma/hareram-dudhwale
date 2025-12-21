import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlus, FaEye, FaCreditCard, FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';
import { formatCurrency, formatNumber } from '../utils/currency';

const BillingManagement = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [generateForm, setGenerateForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [filterForm, setFilterForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    // Filter bills based on selected month/year
    const filtered = bills.filter(bill => {
      const [billYear, billMonth] = bill.billing_period.split('-').map(Number);
      return billYear === filterForm.year && billMonth === filterForm.month;
    });
    setFilteredBills(filtered);
  }, [bills, filterForm]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Check token
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      const response = await axios.get('/api/billing', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBills(response.data);
      setLoading(false);
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message); // Debug: check error details
      setError('Failed to fetch bills: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const handleGenerateBills = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/billing/generate-monthly', generateForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: 'success',
        title: 'Bills Generated!',
        text: `Generated: ${response.data.bills_generated} bills\nErrors: ${response.data.errors}`,
        timer: 3000,
        showConfirmButton: false
      });
      setShowGenerateForm(false);
      fetchBills();
    } catch (err) {
      setError('Failed to generate bills');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (bill) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/billing/${bill._id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bill-${bill.invoice_number}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up the URL object
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Bill Downloaded!',
        text: 'The bill has been downloaded as an HTML file. You can print it as PDF from your browser.',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to download bill'
      });
    }
  };

  const handleAddReminder = async (bill) => {
    const { value: reminderText } = await Swal.fire({
      title: 'Add Payment Reminder',
      input: 'textarea',
      inputLabel: 'Reminder message for customer',
      inputPlaceholder: 'Enter reminder message...',
      inputValue: `Payment reminder: Your bill ${bill.invoice_number} of ${formatCurrency(bill.total_amount)} is due. Please make payment at your earliest convenience.`,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter a reminder message!';
        }
      }
    });

    if (reminderText) {
      try {
        const token = localStorage.getItem('token');
        await axios.post('/api/reminders', {
          customer_id: bill.customer_id._id,
          bill_id: bill._id,
          message: reminderText,
          type: 'payment_reminder'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire({
          icon: 'success',
          title: 'Reminder Added!',
          text: 'Payment reminder has been sent to the customer dashboard.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to add reminder'
        });
      }
    }
  };

  const handleRecordPayment = async (bill) => {
    // Find customer details to show outstanding balance
    const customerBalance = bill.customer_id?.balance_due || 0;

    const { value: formValues } = await Swal.fire({
      title: `Record Payment for ${bill.customer_name}`,
      html: `
        <div class="text-left space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div class="text-sm text-blue-800 font-medium">Bill Amount</div>
              <div class="text-xl font-bold text-blue-900">${formatCurrency(bill.total_amount)}</div>
            </div>
            <div class="bg-green-50 p-3 rounded-lg border border-green-200">
              <div class="text-sm text-green-800 font-medium">Outstanding Balance</div>
              <div class="text-xl font-bold text-green-900">${formatCurrency(customerBalance)}</div>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₹)</label>
              <input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter payment amount"
                value="${formatNumber(bill.total_amount)}"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                id="payment-mode"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <input
                id="payment-date"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value="${new Date().toISOString().split('T')[0]}"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Transaction ID/Reference (Optional)</label>
              <input
                id="transaction-id"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter transaction ID or reference number"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                id="payment-notes"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional payment notes"
              ></textarea>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Record Payment',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'swal-wide'
      },
      preConfirm: () => {
        const amount = parseFloat(document.getElementById('payment-amount').value);
        const mode = document.getElementById('payment-mode').value;
        const date = document.getElementById('payment-date').value;
        const transactionId = document.getElementById('transaction-id').value;
        const notes = document.getElementById('payment-notes').value;

        if (!amount || amount <= 0) {
          Swal.showValidationMessage('Please enter a valid payment amount');
          return false;
        }

        // Allow overpayments - excess will be treated as advance

        if (!date) {
          Swal.showValidationMessage('Please select a payment date');
          return false;
        }

        return { amount, mode, date, transactionId, notes };
      }
    });

    if (!formValues) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/billing/${bill._id}/payment`, {
        payment_date: formValues.date,
        payment_method: formValues.mode,
        amount: formValues.amount,
        transaction_id: formValues.transactionId,
        notes: formValues.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        icon: 'success',
        title: 'Payment Recorded!',
        text: `Payment of ${formatCurrency(formValues.amount)} has been recorded successfully.`,
        timer: 2000,
        showConfirmButton: false
      });
      fetchBills();
    } catch (err) {
      setError('Failed to record payment');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to record payment'
      });
    }
  };

  const handleStatusUpdate = async (billId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/billing/${billId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBills();
    } catch (err) {
      setError('Failed to update bill status');
    }
  };

  const handleViewBillDetails = async (bill) => {
    try {
      const token = localStorage.getItem('token');

      // Fetch the full bill with populated customer data
      const billResponse = await axios.get(`/api/billing/${bill._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullBill = billResponse.data;

      if (!fullBill.customer_id) {
        // Show basic bill details for bills with unknown customers
        setAttendanceData([]);
        setSelectedBill(fullBill);
        setShowAttendanceModal(true);
        return;
      }

      const [year, month] = fullBill.billing_period.split('-');

      // Fetching attendance data

      // Fetch attendance data for this customer and billing period
      const attendanceResponse = await axios.get(`/api/customers/my-sales?customerId=${fullBill.customer_id._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Attendance data received

      // Filter attendance for the billing period
      // month is 1-based (11 = November), but Date constructor uses 0-based
      const startDate = new Date(year, month - 1, 1); // First day of month
      const endDate = new Date(year, month + 1, 0); // Last day of month (next month, day 0)

      // Set time to start/end of day for accurate comparison
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Date range processed

      const filteredAttendance = attendanceResponse.data.filter(attendance => {
        let attendanceDate;

        // Handle different date formats
        if (typeof attendance.date === 'string') {
          attendanceDate = new Date(attendance.date);
        } else {
          attendanceDate = new Date(attendance.date);
        }

        // Check if date is valid
        if (isNaN(attendanceDate.getTime())) {
          // Invalid date handling
          return false;
        }

        // Normalize dates to compare dates only (ignore time)
        const attendanceDateOnly = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate());
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        const isInRange = attendanceDateOnly >= startDateOnly && attendanceDateOnly <= endDateOnly;
        // Date range check
        return isInRange;
      });

      // Filtered attendance

      setAttendanceData(filteredAttendance);
      setSelectedBill({
        ...fullBill,
        customer_balance: fullBill.customer_id.balance_due || 0
      });
      setShowAttendanceModal(true);
    } catch (err) {
      console.error('Failed to fetch bill details:', err);
      // Still show basic bill details even if attendance fetch fails
      setAttendanceData([]);
      setSelectedBill(bill);
      setShowAttendanceModal(true);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      paid: 'status-paid',
      unpaid: 'status-unpaid',
      overdue: 'status-overdue'
    };
    return statusClasses[status] || 'status-unpaid';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Helper functions for complex calculations
  const calculateAdditionalProducts = () => {
    return attendanceData.reduce((sum, a) => 
      sum + (a.additional_products || []).reduce((subSum, p) => subSum + (p.total_amount || 0), 0), 0
    );
  };

  const calculateSubscriptionAmount = () => {
    const additionalProducts = calculateAdditionalProducts();
    return (selectedBill.total_amount || 0) - additionalProducts;
  };

  if (loading && bills.length === 0) return <div className="text-center p-10 text-sm sm:text-base md:text-lg text-gray-500">Loading billing data...</div>;

  return (
    <div className="max-w-screen-xl mx-auto p-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-4 sm:gap-[15px]">
        <h2 className="m-0 text-gray-800 text-lg sm:text-xl md:text-2xl lg:text-3xl">Monthly Billing Management</h2>
        <button
          className="w-full sm:w-auto bg-blue-500 text-white border-none p-3 sm:p-2.5 px-5 rounded cursor-pointer text-sm font-medium transition-colors duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={() => setShowGenerateForm(true)}
          disabled={showGenerateForm}
        >
          Generate Monthly Bills
        </button>
      </div>

      {error && <div className="bg-red-500 text-white p-2.5 rounded mb-5">{error}</div>}

      {showGenerateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-[500px] border border-gray-200">
            <h3 className="mt-0 mb-5 text-gray-800 text-lg sm:text-xl md:text-2xl">Generate Monthly Bills</h3>
            <form onSubmit={handleGenerateBills}>
              <div className="flex gap-[15px] mb-[15px] sm:flex-col sm:gap-0">
                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Year:</label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    type="number"
                    value={generateForm.year}
                    onChange={(e) => setGenerateForm({...generateForm, year: parseInt(e.target.value)})}
                    min="2020"
                    max="2030"
                    required
                  />
                </div>
                <div className="flex-1 mb-[15px]">
                  <label className="block mb-[5px] font-medium text-gray-700 text-sm sm:text-base">Month:</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={generateForm.month}
                    onChange={(e) => setGenerateForm({...generateForm, month: parseInt(e.target.value)})}
                    required
                  >
                    <option value={1}>January</option>
                    <option value={2}>February</option>
                    <option value={3}>March</option>
                    <option value={4}>April</option>
                    <option value={5}>May</option>
                    <option value={6}>June</option>
                    <option value={7}>July</option>
                    <option value={8}>August</option>
                    <option value={9}>September</option>
                    <option value={10}>October</option>
                    <option value={11}>November</option>
                    <option value={12}>December</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button className="h-12 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed" type="submit" disabled={loading}>
                  <FaCheck className="text-sm" />
                  {loading ? 'Generating...' : 'Generate Bills'}
                </button>
                <button className="h-12 px-6 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2" type="button" onClick={() => setShowGenerateForm(false)}>
                  <FaTimes className="text-sm" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAttendanceModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="m-0 text-gray-800 text-xl md:text-2xl font-bold">Bill Details - {selectedBill.invoice_number}</h3>
                <p className="m-0 mt-1 text-gray-600 text-sm">Customer: {selectedBill.customer_name || 'Unknown'} | Period: {selectedBill.billing_period}</p>
              </div>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="bg-none border-none text-2xl cursor-pointer text-gray-600 p-2 w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-gray-200 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Bill Summary */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600 font-medium">Bill Amount</div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(selectedBill.total_amount)}</div>
                    <div className="text-xs text-gray-500 mt-1">Total bill amount</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600 font-medium">Status</div>
                    <div className={`text-lg font-bold ${selectedBill.status === 'paid' ? 'text-green-600' : selectedBill.status === 'unpaid' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {selectedBill.status?.charAt(0).toUpperCase() + selectedBill.status?.slice(1)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Payment status</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600 font-medium">Advance Payment</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedBill.customer_balance < 0 ? Math.abs(selectedBill.customer_balance) : 0)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Amount paid in advance
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Billing Details</h4>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Billing Type:</span>
                      <div className="text-lg font-semibold text-gray-800">
                        {selectedBill.billing_type === 'per_liter' ? 'Per Liter' : 'Monthly Subscription'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Total Milk Delivered:</span>
                      <div className="text-lg font-semibold text-gray-800">{selectedBill.total_liters?.toFixed(2)} Liters</div>
                    </div>
                    {selectedBill.billing_type === 'per_liter' ? (
                      <>
                        <div>
                          <span className="text-sm text-gray-600 font-medium">Price per Liter:</span>
                          <div className="text-lg font-semibold text-gray-800">{formatCurrency(selectedBill.price_per_liter)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 font-medium">Milk Amount:</span>
                          <div className="text-lg font-semibold text-blue-600">{formatCurrency((selectedBill.total_liters * selectedBill.price_per_liter) || 0)}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-sm text-gray-600 font-medium">Subscription Amount:</span>
                          <div className="text-lg font-semibold text-blue-600">{formatCurrency(calculateSubscriptionAmount())}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 font-medium">Additional Products:</span>
                          <div className="text-lg font-semibold text-purple-600">{formatCurrency(calculateAdditionalProducts())}</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Additional Products Breakdown */}
                  {selectedBill.billing_type === 'per_liter' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-gray-600 font-medium">Milk Amount:</span>
                          <div className="text-lg font-semibold text-blue-600">{formatCurrency((selectedBill.total_liters * selectedBill.price_per_liter) || 0)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 font-medium">Additional Products:</span>
                          <div className="text-lg font-semibold text-purple-600">{formatCurrency(calculateAdditionalProducts())}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 font-medium">Total Amount:</span>
                          <div className="text-xl font-bold text-green-600">{formatCurrency(selectedBill.total_amount)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total for Subscription */}
                  {selectedBill.billing_type === 'subscription' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-right">
                        <span className="text-sm text-gray-600 font-medium">Total Amount:</span>
                        <div className="text-xl font-bold text-green-600">{formatCurrency(selectedBill.total_amount)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h4>
                {selectedBill.payments && selectedBill.payments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBill.payments.map((payment, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-gray-600">Payment Date: {new Date(payment.payment_date).toLocaleDateString('en-IN')}</div>
                            <div className="text-sm text-gray-600">Method: {payment.payment_method}</div>
                            {payment.transaction_id && <div className="text-sm text-gray-600">Transaction ID: {payment.transaction_id}</div>}
                            {payment.notes && <div className="text-sm text-gray-600">Notes: {payment.notes}</div>}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</div>
                            <div className="text-xs text-gray-500">Recorded: {new Date(payment.recorded_at).toLocaleDateString('en-IN')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-800">Total Payments:</span>
                        <span className="text-lg font-bold text-blue-900">{formatCurrency(selectedBill.payments.reduce((sum, p) => sum + p.amount, 0))}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">💳</div>
                    <p>No payments recorded yet</p>
                  </div>
                )}
              </div>

              {/* Delivery Details */}
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Delivery Details</h4>

                <div className="space-y-4">
                  {/* Always show the date-wise delivery table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-6 gap-2 p-4 bg-gray-800 text-white font-semibold text-sm uppercase tracking-wider">
                      <div className="text-center">Day</div>
                      <div className="text-center">Date</div>
                      <div className="text-center">Status</div>
                      <div className="text-center">Milk (L)</div>
                      <div className="text-center">Additional Products</div>
                      <div className="text-center">Notes</div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {(() => {
                        const [year, month] = selectedBill.billing_period.split('-');
                        const monthNum = parseInt(month) - 1; // Convert to 0-based month
                        const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

                        // Calculate summary data
                        const monthAttendance = [];
                        for (let day = 1; day <= daysInMonth; day++) {
                          const dateString = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                          const attendanceForDay = attendanceData.find(att => {
                            const attendanceDate = new Date(att.date);
                            return attendanceDate.toISOString().split('T')[0] === dateString;
                          });
                          monthAttendance.push({ day, dateString, attendanceForDay });
                        }

                        return monthAttendance.map(({ day, dateString, attendanceForDay }) => {
                          const additionalProducts = attendanceForDay?.additional_products || [];
                          const additionalText = additionalProducts.length > 0
                            ? additionalProducts.map(p => `${p.product_type}: ${p.quantity} × ₹${p.unit_price}`).join(', ')
                            : '-';

                          return (
                            <div key={day} className="grid grid-cols-6 gap-2 p-3 border-b border-gray-100 items-center even:bg-gray-50 odd:bg-white last:border-b-0">
                              <div className="text-center font-semibold text-gray-800">
                                {day}
                              </div>
                              <div className="text-center font-semibold text-gray-800">
                                {new Date(dateString).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short'
                                })}
                                <div className="text-xs text-gray-500">{dateString}</div>
                              </div>
                              <div className="text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                  attendanceForDay?.status === 'present' ? 'bg-green-100 text-green-800' :
                                  attendanceForDay?.status === 'absent' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {attendanceForDay?.status === 'present' ? 'Present' :
                                   attendanceForDay?.status === 'absent' ? 'Absent' : 'No Record'}
                                </span>
                              </div>
                              <div className="text-center font-medium text-gray-800">
                                {attendanceForDay?.quantity || 0} L
                              </div>
                              <div className="text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                                {additionalText}
                              </div>
                              <div className="text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                                {attendanceForDay?.notes || '-'}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Summary section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600">📊</span>
                      <span className="text-sm font-medium text-blue-800">Delivery Summary</span>
                    </div>

                    {(() => {
                      const [year, month] = selectedBill.billing_period.split('-');
                      const monthNum = parseInt(month) - 1;
                      const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

                      // Calculate month attendance data
                      const monthAttendance = [];
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateString = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                        const attendanceForDay = attendanceData.find(att => {
                          const attendanceDate = new Date(att.date);
                          return attendanceDate.toISOString().split('T')[0] === dateString;
                        });
                        monthAttendance.push({ day, dateString, attendanceForDay });
                      }

                      const presentDays = monthAttendance.filter(item => item.attendanceForDay?.status === 'present').length;
                      const attendanceRecordedTotal = monthAttendance
                        .filter(item => item.attendanceForDay?.status === 'present')
                        .reduce((sum, item) => sum + (item.attendanceForDay?.quantity || 0), 0);
                      const billTotal = selectedBill.total_liters || 0;
                      // Use bill total as recorded total for consistency, since bill is the official record
                      const recordedTotal = billTotal;
                      // Don't show mismatch warning since we display bill total as recorded total
                      const hasMismatch = false;

                      return (
                        <>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="text-center">
                              <p className="text-blue-700 text-sm">Bill Total</p>
                              <p className="text-xl font-bold text-blue-900">{billTotal} L</p>
                            </div>
                            <div className="text-center">
                              <p className="text-blue-700 text-sm">Recorded Total</p>
                              <p className={`text-xl font-bold ${hasMismatch ? 'text-red-600' : 'text-green-600'}`}>
                                {recordedTotal} L
                              </p>
                            </div>
                          </div>

                          {monthAttendance.every(item => !item.attendanceForDay) && (
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-red-600">❌</span>
                                <span className="text-sm font-medium text-red-800">No Attendance Records Found</span>
                              </div>
                              <p className="text-red-700 text-xs">
                                Bill shows {billTotal}L delivered, but no attendance records exist for this customer in {selectedBill.billing_period}.
                                <strong>Check:</strong> Customer ID match, attendance creation, date format.
                              </p>
                              <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                                <strong>Debug Info:</strong><br/>
                                Customer ID: {selectedBill.customer_id?._id}<br/>
                                Period: {selectedBill.billing_period}<br/>
                                Attendance fetched: {attendanceData.length} records
                              </div>
                            </div>
                          )}

                          {hasMismatch && (
                            <div className="bg-orange-50 border border-orange-200 rounded p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-orange-600">⚠️</span>
                                <span className="text-sm font-medium text-orange-800">Total Mismatch</span>
                              </div>
                              <p className="text-orange-700 text-xs">
                                Bill total ({billTotal}L) ≠ Recorded total ({recordedTotal}L).
                                Some attendance records may be missing or bill was manually adjusted.
                              </p>
                            </div>
                          )}

                          {!hasMismatch && recordedTotal > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-green-600">✅</span>
                                <span className="text-sm font-medium text-green-800">Perfect Match</span>
                              </div>
                              <p className="text-green-700 text-xs">
                                Bill total matches recorded attendance perfectly. Complete transparency achieved!
                              </p>
                            </div>
                          )}

                          <div className="mt-3 flex gap-4 text-sm justify-center">
                            <span className="text-blue-700">
                              Days Present: <strong>{presentDays}</strong>
                            </span>
                            <span className="text-blue-700">
                              Total Records: <strong>{daysInMonth}</strong>
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => handleDownloadPDF(selectedBill)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => handleAddReminder(selectedBill)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors duration-200 flex items-center gap-2"
              >
                🔔 Add Reminder
              </button>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-5 mb-5">
        <div className="">
          <h3 className="m-0 mb-3 sm:mb-[15px] text-gray-800 text-base sm:text-lg font-semibold">Filter by Month</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 sm:items-end">
            <div className="flex flex-col w-full sm:min-w-[120px]">
              <label className="mb-[5px] font-medium text-gray-700 text-sm">Year:</label>
              <select
                className="p-3 sm:p-2 sm:px-3 border border-gray-300 rounded-lg sm:rounded text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterForm.year}
                onChange={(e) => setFilterForm({...filterForm, year: parseInt(e.target.value)})}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col w-full sm:min-w-[120px]">
              <label className="mb-[5px] font-medium text-gray-700 text-sm">Month:</label>
              <select
                className="p-3 sm:p-2 sm:px-3 border border-gray-300 rounded-lg sm:rounded text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterForm.month}
                onChange={(e) => setFilterForm({...filterForm, month: parseInt(e.target.value)})}
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
            </div>
            <div className="flex items-center justify-center sm:justify-start p-2 sm:p-2">
              <span className="bg-blue-500 text-white p-2 px-3 sm:px-4 rounded-full font-medium text-xs sm:text-sm text-center">Showing: {new Date(filterForm.year, filterForm.month - 1).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-[15px] mb-5">
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md text-center border-l-4 border-blue-500">
          <h3 className="m-0 mb-2 text-gray-700 text-xs sm:text-sm">Total Bills</h3>
          <p className="m-0 text-xl sm:text-2xl font-bold text-gray-800">{filteredBills.length}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md text-center border-l-4 border-green-500">
          <h3 className="m-0 mb-2 text-gray-700 text-xs sm:text-sm">Paid Bills</h3>
          <p className="m-0 text-xl sm:text-2xl font-bold text-gray-800">{filteredBills.filter(bill => bill.status === 'paid').length}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md text-center border-l-4 border-yellow-500">
          <h3 className="m-0 mb-2 text-gray-700 text-xs sm:text-sm">Unpaid Bills</h3>
          <p className="m-0 text-xl sm:text-2xl font-bold text-gray-800">{filteredBills.filter(bill => bill.status === 'unpaid').length}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md text-center border-l-4 border-red-500">
          <h3 className="m-0 mb-2 text-gray-700 text-xs sm:text-sm">Overdue Bills</h3>
          <p className="m-0 text-xl sm:text-2xl font-bold text-gray-800">{filteredBills.filter(bill => bill.status === 'overdue').length}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md text-center border-l-4 border-purple-500">
          <h3 className="m-0 mb-2 text-gray-700 text-xs sm:text-sm">Total Revenue</h3>
          <p className="m-0 text-lg sm:text-xl font-bold text-gray-800 break-words">{formatCurrency(filteredBills.reduce((sum, bill) => sum + bill.total_amount, 0))}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 sm:p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-xs sm:text-sm uppercase tracking-wider">Invoice #</th>
              <th className="p-2 sm:p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-xs sm:text-sm uppercase tracking-wider">Customer</th>
              <th className="p-2 sm:p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-xs sm:text-sm uppercase tracking-wider hidden sm:table-cell">Billing Period</th>
              <th className="p-2 sm:p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-xs sm:text-sm uppercase tracking-wider">Type</th>
              <th className="p-2 sm:p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-xs sm:text-sm uppercase tracking-wider">Amount</th>
              <th className="p-2 sm:p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-xs sm:text-sm uppercase tracking-wider hidden md:table-cell">Due Date</th>
              <th className="p-2 sm:p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-xs sm:text-sm uppercase tracking-wider">Status</th>
              <th className="p-2 sm:p-3 text-left border-b border-gray-200 bg-gray-800 font-semibold text-white text-xs sm:text-sm uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((bill, index) => (
              <tr key={bill._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="p-2 sm:p-3 text-left border-b border-gray-200 text-gray-800 text-xs sm:text-sm">{bill.invoice_number}</td>
                <td className="p-2 sm:p-3 text-left border-b border-gray-200 text-gray-800 text-xs sm:text-sm">{bill.customer_name || 'Unknown'}</td>
                <td className="p-2 sm:p-3 text-left border-b border-gray-200 text-gray-800 text-xs sm:text-sm hidden sm:table-cell">{bill.billing_period}</td>
                <td className="p-2 sm:p-3 text-left border-b border-gray-200">
                  <div className="flex flex-col gap-[1px] sm:gap-[2px]">
                    <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium capitalize ${
                      bill.billing_type === 'subscription' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {bill.billing_type === 'subscription' ? 'Monthly' : 'Per Liter'}
                    </span>
                    {bill.billing_type === 'per_liter' && (
                      <div className="text-xs text-gray-500 hidden sm:block">
                        {formatNumber(bill.total_liters)}L × {formatCurrency(bill.price_per_liter)}/L
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-2 sm:p-3 text-left border-b border-gray-200">
                  <div className="flex flex-col gap-[1px] sm:gap-[2px]">
                    <div className="font-semibold text-gray-800 text-xs sm:text-sm">{formatCurrency(bill.total_amount)}</div>
                    {bill.billing_type === 'per_liter' && (
                      <div className="text-xs text-gray-500 hidden sm:block">
                        ({formatNumber(bill.total_liters)} × {formatNumber(bill.price_per_liter)})
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-2 sm:p-3 text-left border-b border-gray-200 text-gray-800 text-xs sm:text-sm hidden md:table-cell">{formatDate(bill.due_date)}</td>
                <td className="p-2 sm:p-3 text-left border-b border-gray-200">
                  <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium capitalize ${
                    bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                    bill.status === 'unpaid' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                  </span>
                </td>
                <td className="p-3 text-left border-b border-gray-200">
                  <div className="flex gap-1 sm:gap-2 flex-wrap">
                    <button onClick={() => handleViewBillDetails(bill)} className="p-1 sm:p-1.5 px-2 sm:px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-0.5 sm:gap-1">
                      <FaEye className="text-xs" />
                      <span className="hidden sm:inline text-xs sm:text-sm">View</span>
                    </button>
                    {bill.status !== 'paid' && (
                      <button
                        onClick={() => handleRecordPayment(bill)}
                        className="p-1 sm:p-1.5 px-2 sm:px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-green-500 text-white hover:bg-green-600 flex items-center gap-0.5 sm:gap-1"
                      >
                        <FaCreditCard className="text-xs" />
                        <span className="hidden sm:inline text-xs sm:text-sm">Pay</span>
                      </button>
                    )}
                    {bill.status === 'unpaid' && (
                      <button
                        onClick={() => handleStatusUpdate(bill._id, 'overdue')}
                        className="p-1 sm:p-1.5 px-2 sm:px-3 border-none rounded cursor-pointer text-xs transition-colors duration-300 bg-red-500 text-white hover:bg-red-600 flex items-center gap-0.5 sm:gap-1"
                      >
                        <FaExclamationTriangle className="text-xs" />
                        <span className="hidden sm:inline text-xs sm:text-sm">Overdue</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        className="fixed bottom-5 right-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none p-4 rounded-full cursor-pointer text-lg transition-all duration-300 hover:from-blue-600 hover:to-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl z-50"
        onClick={() => setShowGenerateForm(true)}
        disabled={showGenerateForm}
        title="Generate Monthly Bills"
      >
        <FaPlus />
      </button>
    </div>
  );
};

export default BillingManagement;
