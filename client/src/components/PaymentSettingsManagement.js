import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlus, FaWallet, FaCheck, FaTimesCircle } from 'react-icons/fa';

const PaymentSettingsManagement = () => {
  const [paymentSettings, setPaymentSettings] = useState({
    account_number: '',
    account_holder_name: '',
    bank_name: '',
    ifsc_code: '',
    upi_id: '',
    qr_code_image: ''
  });
  const [showPaymentSettingsForm, setShowPaymentSettingsForm] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);

  useEffect(() => {
    fetchPaymentSettings();
    fetchPendingPayments();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('http://localhost:5000/api/payments/settings', config);
      setPaymentSettings(response.data);
    } catch (err) {
      console.log('No payment settings found');
    }
  };

  const handlePaymentSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post('http://localhost:5000/api/payments/settings', paymentSettings, config);
      Swal.fire('Success', 'Payment settings updated successfully!', 'success');
      setShowPaymentSettingsForm(false);
      fetchPaymentSettings();
    } catch (err) {
      Swal.fire('Error', 'Failed to update payment settings', 'error');
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('http://localhost:5000/api/payments/pending', config);
      setPendingPayments(response.data);
    } catch (err) {
      console.log('Failed to fetch pending payments');
    }
  };

  const handlePaymentApproval = async (paymentId, status, rejectionReason = '') => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Update payment status
      await axios.put(`http://localhost:5000/api/payments/${paymentId}/status`, {
        status,
        rejection_reason: rejectionReason
      }, config);

      // If payment is approved, also update the corresponding bill status
      if (status === 'approved') {
        // Find the payment to get bill month and customer info
        const payment = pendingPayments.find(p => p._id === paymentId);
        if (payment && payment.bill_month && payment.customer_id) {
          try {
            // Update bill status to paid
            await axios.put(`http://localhost:5000/api/billing/customer/${payment.customer_id._id}/status`, {
              bill_month: payment.bill_month,
              status: 'paid'
            }, config);
          } catch (billErr) {
            console.log('Failed to update bill status:', billErr);
            // Don't fail the whole operation if bill update fails
          }
        }
      }

      Swal.fire('Success', `Payment ${status} successfully!`, 'success');
      fetchPendingPayments();
    } catch (err) {
      Swal.fire('Error', `Failed to ${status} payment`, 'error');
    }
  };

  const renderPaymentSettingsForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">Configure Payment Settings</h3>
          <button onClick={() => setShowPaymentSettingsForm(false)} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200">×</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <form onSubmit={handlePaymentSettingsSubmit} className="space-y-6">
            <div className="p-5 bg-primary-800 rounded-lg border border-secondary-700">
              <h4 className="text-white m-0 mb-4 text-base font-semibold">Bank Account Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">Account Number *</label>
                  <input
                    type="text"
                    value={paymentSettings.account_number}
                    onChange={(e) => setPaymentSettings({...paymentSettings, account_number: e.target.value})}
                    className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">Account Holder Name *</label>
                  <input
                    type="text"
                    value={paymentSettings.account_holder_name}
                    onChange={(e) => setPaymentSettings({...paymentSettings, account_holder_name: e.target.value})}
                    className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">Bank Name *</label>
                  <input
                    type="text"
                    value={paymentSettings.bank_name}
                    onChange={(e) => setPaymentSettings({...paymentSettings, bank_name: e.target.value})}
                    className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">IFSC Code *</label>
                  <input
                    type="text"
                    value={paymentSettings.ifsc_code}
                    onChange={(e) => setPaymentSettings({...paymentSettings, ifsc_code: e.target.value})}
                    className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">UPI ID (Optional)</label>
                <input
                  type="text"
                  value={paymentSettings.upi_id}
                  onChange={(e) => setPaymentSettings({...paymentSettings, upi_id: e.target.value})}
                  placeholder="e.g., merchant@upi"
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-white mb-2 text-sm font-medium">QR Code Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setPaymentSettings({...paymentSettings, qr_code_image: e.target.result});
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent-blue file:text-white hover:file:bg-accent-blue-dark"
                />
                <small className="text-secondary-400 text-xs mt-1 block">Upload QR code image for UPI/PhonePay payments. Supported: JPG, PNG, GIF</small>
                {paymentSettings.qr_code_image && (
                  <div className="mt-3">
                    <p className="text-white text-sm font-medium mb-2">Preview:</p>
                    <img src={paymentSettings.qr_code_image} alt="QR Code Preview" className="w-32 h-32 border border-secondary-600 rounded" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-secondary-700">
              <button type="button" onClick={() => setShowPaymentSettingsForm(false)} className="w-full sm:w-48 h-12 bg-secondary-600 hover:bg-secondary-500 text-white font-semibold rounded-xl border border-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Cancel
              </button>
              <button type="submit" className="w-full sm:w-48 h-12 bg-gradient-to-r from-accent-blue to-accent-blue-dark hover:from-accent-blue-dark hover:to-accent-blue text-white font-semibold rounded-xl border border-accent-blue transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary-700 rounded-lg p-6 mb-5 border border-secondary-700">
        <div className="flex items-center justify-between mb-5">
          <h3 className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent mb-0 flex items-center gap-3">
            <FaWallet className="text-accent-blue text-xl" />
            Payment Management
          </h3>
          <button onClick={() => setShowPaymentSettingsForm(true)} className="bg-accent-blue text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-2 text-sm hover:bg-accent-blue-dark">
            <FaPlus /> Configure Payment Settings
          </button>
        </div>

        {/* Payment Settings */}
        <div className="bg-primary-800 border border-secondary-700 rounded-lg p-6">
          <h4 className="text-white text-lg font-semibold mb-4">Current Payment Settings</h4>
          {paymentSettings.account_number ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-secondary-300 mb-2 text-sm">Account Number</label>
                <p className="text-white font-medium">{paymentSettings.account_number}</p>
              </div>
              <div>
                <label className="block text-secondary-300 mb-2 text-sm">Account Holder</label>
                <p className="text-white font-medium">{paymentSettings.account_holder_name}</p>
              </div>
              <div>
                <label className="block text-secondary-300 mb-2 text-sm">Bank Name</label>
                <p className="text-white font-medium">{paymentSettings.bank_name}</p>
              </div>
              <div>
                <label className="block text-secondary-300 mb-2 text-sm">IFSC Code</label>
                <p className="text-white font-medium">{paymentSettings.ifsc_code}</p>
              </div>
              {paymentSettings.upi_id && (
                <div>
                  <label className="block text-secondary-300 mb-2 text-sm">UPI ID</label>
                  <p className="text-white font-medium">{paymentSettings.upi_id}</p>
                </div>
              )}
              {paymentSettings.qr_code_image && (
                <div>
                  <label className="block text-secondary-300 mb-2 text-sm">QR Code</label>
                  <img src={paymentSettings.qr_code_image} alt="Payment QR Code" className="w-32 h-32 border border-secondary-600 rounded mb-2" />
                </div>
              )}
            </div>
          ) : (
            <p className="text-secondary-400">No payment settings configured yet.</p>
          )}
        </div>
      </div>

      {/* Pending Payments */}
      <div className="bg-primary-700 rounded-lg p-6 mb-5 border border-secondary-700">
        <h4 className="text-white text-lg font-semibold mb-4">Pending Payment Approvals</h4>
        {pendingPayments.length > 0 ? (
          <div className="space-y-4">
            {pendingPayments.map(payment => (
              <div key={payment._id} className="bg-primary-800 border border-secondary-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h5 className="text-white font-semibold">{payment.customer_id?.name}</h5>
                    <p className="text-secondary-300 text-sm">{payment.customer_id?.phone}</p>
                    <p className="text-secondary-300 text-sm">Bill Month: {payment.bill_month}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-accent-green text-xl font-bold">₹{payment.amount}</p>
                    <p className="text-secondary-400 text-xs">{new Date(payment.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {payment.transaction_id && (
                  <p className="text-secondary-300 text-sm mb-2">
                    <span className="font-medium">Transaction ID:</span> {payment.transaction_id}
                  </p>
                )}

                {payment.notes && (
                  <p className="text-secondary-300 text-sm mb-4">
                    <span className="font-medium">Notes:</span> {payment.notes}
                  </p>
                )}

                {payment.payment_screenshot && (
                  <div className="mb-4">
                    <p className="text-secondary-300 text-sm font-medium mb-2">Payment Screenshot:</p>
                    <img
                      src={payment.payment_screenshot}
                      alt="Payment Screenshot"
                      className="w-32 h-32 object-cover border border-secondary-600 rounded cursor-pointer"
                      onClick={() => {
                        Swal.fire({
                          imageUrl: payment.payment_screenshot,
                          imageAlt: 'Payment Screenshot',
                          showConfirmButton: false,
                          background: '#1f2937'
                        });
                      }}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePaymentApproval(payment._id, 'approved')}
                    className="bg-accent-green text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-1 text-sm hover:bg-accent-green-dark"
                  >
                    <FaCheck /> Approve
                  </button>
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: 'Reject Payment',
                        input: 'textarea',
                        inputLabel: 'Rejection Reason',
                        inputPlaceholder: 'Enter reason for rejection...',
                        showCancelButton: true,
                        confirmButtonText: 'Reject',
                        cancelButtonText: 'Cancel'
                      }).then((result) => {
                        if (result.isConfirmed && result.value) {
                          handlePaymentApproval(payment._id, 'rejected', result.value);
                        }
                      });
                    }}
                    className="bg-red-500 text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-1 text-sm hover:bg-red-600"
                  >
                    <FaTimesCircle /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-primary-800 border-2 border-dashed border-secondary-600 rounded-lg">
            <FaWallet className="text-accent-blue text-6xl mx-auto mb-4" />
            <h4 className="text-white text-xl mb-2">No pending payments</h4>
            <p className="text-secondary-400">All payments have been processed.</p>
          </div>
        )}
      </div>

      {showPaymentSettingsForm && renderPaymentSettingsForm()}
    </div>
  );
};

export default PaymentSettingsManagement;
