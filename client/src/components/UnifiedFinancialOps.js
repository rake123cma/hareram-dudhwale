import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlus, FaFilePdf, FaRupeeSign, FaArrowUp, FaArrowDown, FaBuilding, FaUser, FaCreditCard, FaWallet } from 'react-icons/fa';

const UnifiedFinancialOps = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [operationType, setOperationType] = useState('payable');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states for different operations
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

  const [vendorForm, setVendorForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    vendor_type: 'feed_supplier',
    payment_terms: '30_days',
    credit_limit: 0
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    billing_type: 'per_liter',
    price_per_liter: 0,
    subscription_amount: 0,
    balance_due: 0
  });

  const [loanForm, setLoanForm] = useState({
    loan_name: '',
    lender_name: '',
    loan_type: 'business',
    principal_amount: '',
    interest_rate: '',
    loan_date: new Date().toISOString().split('T')[0],
    maturity_date: '',
    tenure_months: ''
  });

  const [incomeForm, setIncomeForm] = useState({
    source: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'milk_sales'
  });

  // Bill generation
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [selectedReceivable, setSelectedReceivable] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const handlePayableSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/financial/payables-simple', payableForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success', 'Payable added successfully', 'success');
      resetPayableForm();
    } catch (err) {
      Swal.fire('Error', 'Failed to add payable', 'error');
    }
  };

  const handleReceivableSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/financial/receivables-simple', receivableForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success', 'Receivable added successfully', 'success');
      resetReceivableForm();
    } catch (err) {
      Swal.fire('Error', 'Failed to add receivable', 'error');
    }
  };

  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/financial/vendors', vendorForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success', 'Vendor added successfully', 'success');
      resetVendorForm();
    } catch (err) {
      Swal.fire('Error', 'Failed to add vendor', 'error');
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/customers', customerForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success', 'Customer added successfully', 'success');
      resetCustomerForm();
    } catch (err) {
      Swal.fire('Error', 'Failed to add customer', 'error');
    }
  };

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/financial/loans', loanForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success', 'Loan added successfully', 'success');
      resetLoanForm();
    } catch (err) {
      Swal.fire('Error', 'Failed to add loan', 'error');
    }
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/financial/income', incomeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success', 'Income recorded successfully', 'success');
      resetIncomeForm();
    } catch (err) {
      Swal.fire('Error', 'Failed to record income', 'error');
    }
  };

  const resetPayableForm = () => {
    setPayableForm({
      person_name: '',
      amount: '',
      description: '',
      due_date: '',
      paid_amount: 0
    });
  };

  const resetReceivableForm = () => {
    setReceivableForm({
      person_name: '',
      amount: '',
      description: '',
      due_date: '',
      received_amount: 0
    });
  };

  const resetVendorForm = () => {
    setVendorForm({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      vendor_type: 'feed_supplier',
      payment_terms: '30_days',
      credit_limit: 0
    });
  };

  const resetCustomerForm = () => {
    setCustomerForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      billing_type: 'per_liter',
      price_per_liter: 0,
      subscription_amount: 0,
      balance_due: 0
    });
  };

  const resetLoanForm = () => {
    setLoanForm({
      loan_name: '',
      lender_name: '',
      loan_type: 'business',
      principal_amount: '',
      interest_rate: '',
      loan_date: new Date().toISOString().split('T')[0],
      maturity_date: '',
      tenure_months: ''
    });
  };

  const resetIncomeForm = () => {
    setIncomeForm({
      source: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: 'milk_sales'
    });
  };

  const generateBillPDF = (type, data) => {
    // Simple PDF generation using browser print
    const printWindow = window.open('', '_blank');
    const billHTML = generateBillHTML(type, data);

    printWindow.document.write(billHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const generateBillHTML = (type, data) => {
    const today = new Date().toLocaleDateString('en-IN');

    if (type === 'payable') {
      return `
        <html>
        <head>
          <title>Payment Bill - ${data.person_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .bill-details { margin: 20px 0; }
            .amount { font-size: 18px; font-weight: bold; color: #d32f2f; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hareram Dudhwale</h1>
            <h2>Payment Bill</h2>
          </div>

          <div class="bill-details">
            <p><strong>Bill To:</strong> ${data.person_name}</p>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Total Amount:</strong> <span class="amount">₹${data.amount}</span></p>
            <p><strong>Amount Paid:</strong> ₹${data.paid_amount}</p>
            <p><strong>Balance Due:</strong> <span class="amount">₹${data.amount - data.paid_amount}</span></p>
            <p><strong>Due Date:</strong> ${data.due_date ? formatDate(data.due_date) : 'N/A'}</p>
            <p><strong>Bill Date:</strong> ${today}</p>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Generated by Hareram Dudhwale Management System</p>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'receivable') {
      return `
        <html>
        <head>
          <title>Invoice - ${data.person_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .bill-details { margin: 20px 0; }
            .amount { font-size: 18px; font-weight: bold; color: #2e7d32; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hareram Dudhwale</h1>
            <h2>Invoice</h2>
          </div>

          <div class="bill-details">
            <p><strong>Bill From:</strong> Hareram Dudhwale</p>
            <p><strong>Bill To:</strong> ${data.person_name}</p>
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Total Amount:</strong> <span class="amount">₹${data.amount}</span></p>
            <p><strong>Amount Received:</strong> ₹${data.received_amount}</p>
            <p><strong>Balance Due:</strong> <span class="amount">₹${data.amount - data.received_amount}</span></p>
            <p><strong>Due Date:</strong> ${data.due_date ? formatDate(data.due_date) : 'N/A'}</p>
            <p><strong>Invoice Date:</strong> ${today}</p>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Generated by Hareram Dudhwale Management System</p>
          </div>
        </body>
        </html>
      `;
    }
  };

  const tabs = [
    { id: 'add', label: 'Add Operations', icon: FaPlus },
    { id: 'bills', label: 'Generate Bills', icon: FaFilePdf }
  ];

  const operationTypes = [
    { value: 'payable', label: 'किसको पैसा देना है (Add Payable)', icon: FaArrowUp, color: 'red' },
    { value: 'receivable', label: 'किससे पैसा लेना है (Add Receivable)', icon: FaArrowDown, color: 'green' },
    { value: 'vendor', label: 'Add Vendor Account', icon: FaBuilding, color: 'blue' },
    { value: 'customer', label: 'Add Customer Account', icon: FaUser, color: 'purple' },
    { value: 'loan', label: 'Add Loan Account', icon: FaCreditCard, color: 'orange' },
    { value: 'income', label: 'Add Income (कही से पैसा आया)', icon: FaRupeeSign, color: 'teal' }
  ];

  if (loading) {
    return <div className="text-center p-10 text-sm sm:text-base md:text-lg text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-screen-xl mx-auto p-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-4 sm:gap-[15px]">
        <h2 className="m-0 text-gray-800 text-lg sm:text-xl md:text-2xl lg:text-3xl">Unified Financial Operations</h2>
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

      {/* Add Operations Tab */}
      {activeTab === 'add' && (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Select Operation Type:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {operationTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setOperationType(type.value)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                    operationType === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <type.icon className={`text-xl text-${type.color}-500`} />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Forms Based on Operation Type */}
          {operationType === 'payable' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-red-600">किसको पैसा देना है (Add Payable)</h3>
              <form onSubmit={handlePayableSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Person/Business Name *</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={payableForm.person_name}
                      onChange={(e) => setPayableForm({...payableForm, person_name: e.target.value})}
                      placeholder="e.g., Ramu Cow Supplier"
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
                      placeholder="e.g., 2 cows purchased"
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
                  <button type="button" onClick={resetPayableForm} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    Reset
                  </button>
                  <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                    Add Payable
                  </button>
                </div>
              </form>
            </div>
          )}

          {operationType === 'receivable' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-green-600">किससे पैसा लेना है (Add Receivable)</h3>
              <form onSubmit={handleReceivableSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Person/Customer Name *</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={receivableForm.person_name}
                      onChange={(e) => setReceivableForm({...receivableForm, person_name: e.target.value})}
                      placeholder="e.g., Shyam Dairy"
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
                  <button type="button" onClick={resetReceivableForm} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    Reset
                  </button>
                  <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    Add Receivable
                  </button>
                </div>
              </form>
            </div>
          )}

          {operationType === 'vendor' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-blue-600">Add Vendor Account</h3>
              <form onSubmit={handleVendorSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor Name *</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={vendorForm.name}
                      onChange={(e) => setVendorForm({...vendorForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Person</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={vendorForm.contact_person}
                      onChange={(e) => setVendorForm({...vendorForm, contact_person: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={vendorForm.phone}
                      onChange={(e) => setVendorForm({...vendorForm, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full p-2 border rounded"
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor Type *</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={vendorForm.vendor_type}
                      onChange={(e) => setVendorForm({...vendorForm, vendor_type: e.target.value})}
                      required
                    >
                      <option value="feed_supplier">Feed Supplier</option>
                      <option value="medicine_supplier">Medicine Supplier</option>
                      <option value="vet_services">Vet Services</option>
                      <option value="equipment_supplier">Equipment Supplier</option>
                      <option value="utility_provider">Utility Provider</option>
                      <option value="transport">Transport</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Terms</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={vendorForm.payment_terms}
                      onChange={(e) => setVendorForm({...vendorForm, payment_terms: e.target.value})}
                    >
                      <option value="immediate">Immediate</option>
                      <option value="7_days">7 Days</option>
                      <option value="15_days">15 Days</option>
                      <option value="30_days">30 Days</option>
                      <option value="45_days">45 Days</option>
                      <option value="60_days">60 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Credit Limit (₹)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={vendorForm.credit_limit}
                      onChange={(e) => setVendorForm({...vendorForm, credit_limit: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={resetVendorForm} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    Reset
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Add Vendor
                  </button>
                </div>
              </form>
            </div>
          )}

          {operationType === 'customer' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-purple-600">Add Customer Account</h3>
              <form onSubmit={handleCustomerSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Customer Name *</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full p-2 border rounded"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <textarea
                      className="w-full p-2 border rounded"
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Billing Type *</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={customerForm.billing_type}
                      onChange={(e) => setCustomerForm({...customerForm, billing_type: e.target.value})}
                      required
                    >
                      <option value="per_liter">Per Liter</option>
                      <option value="subscription">Monthly Subscription</option>
                    </select>
                  </div>
                  {customerForm.billing_type === 'per_liter' ? (
                    <div>
                      <label className="block text-sm font-medium mb-1">Price per Liter (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 border rounded"
                        value={customerForm.price_per_liter}
                        onChange={(e) => setCustomerForm({...customerForm, price_per_liter: e.target.value})}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">Monthly Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 border rounded"
                        value={customerForm.subscription_amount}
                        onChange={(e) => setCustomerForm({...customerForm, subscription_amount: e.target.value})}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Opening Balance (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border rounded"
                      value={customerForm.balance_due}
                      onChange={(e) => setCustomerForm({...customerForm, balance_due: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={resetCustomerForm} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    Reset
                  </button>
                  <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          )}

          {operationType === 'loan' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-orange-600">Add Loan Account</h3>
              <form onSubmit={handleLoanSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Loan Name *</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={loanForm.loan_name}
                      onChange={(e) => setLoanForm({...loanForm, loan_name: e.target.value})}
                      placeholder="e.g., Working Capital Loan"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Lender Name *</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={loanForm.lender_name}
                      onChange={(e) => setLoanForm({...loanForm, lender_name: e.target.value})}
                      placeholder="e.g., Bank Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Loan Type *</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={loanForm.loan_type}
                      onChange={(e) => setLoanForm({...loanForm, loan_type: e.target.value})}
                      required
                    >
                      <option value="business">Business</option>
                      <option value="agricultural">Agricultural</option>
                      <option value="equipment">Equipment</option>
                      <option value="working_capital">Working Capital</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Principal Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border rounded"
                      value={loanForm.principal_amount}
                      onChange={(e) => setLoanForm({...loanForm, principal_amount: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Interest Rate (% per annum) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border rounded"
                      value={loanForm.interest_rate}
                      onChange={(e) => setLoanForm({...loanForm, interest_rate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Loan Date *</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded"
                      value={loanForm.loan_date}
                      onChange={(e) => setLoanForm({...loanForm, loan_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Maturity Date *</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded"
                      value={loanForm.maturity_date}
                      onChange={(e) => setLoanForm({...loanForm, maturity_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tenure (Months) *</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={loanForm.tenure_months}
                      onChange={(e) => setLoanForm({...loanForm, tenure_months: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={resetLoanForm} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    Reset
                  </button>
                  <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                    Add Loan
                  </button>
                </div>
              </form>
            </div>
          )}

          {operationType === 'income' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-teal-600">कही से पैसा आया (Add Income)</h3>
              <form onSubmit={handleIncomeSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Income Source *</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={incomeForm.source}
                      onChange={(e) => setIncomeForm({...incomeForm, source: e.target.value})}
                      placeholder="e.g., Milk Sales, Investment Returns"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border rounded"
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm({...incomeForm, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={incomeForm.description}
                      onChange={(e) => setIncomeForm({...incomeForm, description: e.target.value})}
                      placeholder="Optional details"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded"
                      value={incomeForm.date}
                      onChange={(e) => setIncomeForm({...incomeForm, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={incomeForm.category}
                      onChange={(e) => setIncomeForm({...incomeForm, category: e.target.value})}
                      required
                    >
                      <option value="milk_sales">Milk Sales</option>
                      <option value="product_sales">Product Sales</option>
                      <option value="investment_returns">Investment Returns</option>
                      <option value="subsidies">Government Subsidies</option>
                      <option value="other_income">Other Income</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={resetIncomeForm} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    Reset
                  </button>
                  <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600">
                    Record Income
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Generate Bills Tab */}
      {activeTab === 'bills' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Generate Bills (PDF)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-4 text-red-600">Payment Bills (किसको देना है)</h4>
              <p className="text-sm text-gray-600 mb-4">Generate bills for amounts you need to pay</p>
              <button
                onClick={() => {
                  // For demo, create a sample payable bill
                  const samplePayable = {
                    person_name: 'Ramu Cow Supplier',
                    description: '2 cows purchased',
                    amount: 50000,
                    paid_amount: 25000,
                    due_date: '2025-12-15'
                  };
                  generateBillPDF('payable', samplePayable);
                }}
                className="w-full bg-red-500 text-white px-4 py-3 rounded hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <FaFilePdf /> Generate Sample Payment Bill
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-4 text-green-600">Invoices (किससे लेना है)</h4>
              <p className="text-sm text-gray-600 mb-4">Generate invoices for amounts owed to you</p>
              <button
                onClick={() => {
                  // For demo, create a sample receivable invoice
                  const sampleReceivable = {
                    person_name: 'Shyam Dairy',
                    description: 'Milk bill for March 2025',
                    amount: 5000,
                    received_amount: 2000,
                    due_date: '2025-12-10'
                  };
                  generateBillPDF('receivable', sampleReceivable);
                }}
                className="w-full bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <FaFilePdf /> Generate Sample Invoice
              </button>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">How to Generate Bills:</h4>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Add payables/receivables in the "Add Operations" tab first</li>
              <li>2. Come back to this "Generate Bills" tab</li>
              <li>3. Click the appropriate bill generation button</li>
              <li>4. PDF will open in a new window for printing</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedFinancialOps;