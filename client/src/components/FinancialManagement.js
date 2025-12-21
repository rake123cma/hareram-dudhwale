import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  FaMoneyBillWave, FaCreditCard, FaUniversity, FaHandHoldingUsd,
  FaPlus, FaEdit, FaTrash,
  FaCalculator, FaHistory, FaDownload, FaFileInvoiceDollar, FaChartLine
} from 'react-icons/fa';

const FinancialManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payables, setPayables] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [bankBalances, setBankBalances] = useState([]);
  const [loans, setLoans] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [salesSelectedMonth, setSalesSelectedMonth] = useState(new Date().getMonth());
  const [salesSelectedYear, setSalesSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showPayableForm, setShowPayableForm] = useState(false);
  const [showReceivableForm, setShowReceivableForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showLoanPaymentForm, setShowLoanPaymentForm] = useState(false);
  const [showLoanPaymentHistory, setShowLoanPaymentHistory] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form data
  const [payableForm, setPayableForm] = useState({
    person_name: '',
    amount: '',
    description: '',
    due_date: '',
    category: 'supplier'
  });

  const [receivableForm, setReceivableForm] = useState({
    customer_name: '',
    amount: '',
    description: '',
    due_date: '',
    category: 'customer'
  });

  const [transactionForm, setTransactionForm] = useState({
    type: 'deposit',
    amount: '',
    description: '',
    bank_name: '',
    account_number: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [loanForm, setLoanForm] = useState({
    loan_name: '',
    lender_name: '',
    loan_type: 'business',
    principal_amount: '',
    outstanding_balance: '',
    interest_rate: '',
    loan_date: new Date().toISOString().split('T')[0],
    maturity_date: '',
    tenure_months: '',
    repayment_frequency: 'monthly',
    loan_account_number: '',
    bank_name: '',
    branch_name: '',
    collateral_details: '',
    notes: ''
  });

  const [loanPaymentForm, setLoanPaymentForm] = useState({
    loan_id: '',
    payment_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    payment_reference: '',
    description: '',
    bank_name: '',
    account_number: '',
    notes: ''
  });

  const [loanPayments, setLoanPayments] = useState([]);

  const [paymentForm, setPaymentForm] = useState({
    type: 'payable',
    person_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    description: ''
  });

  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_id: '',
    items: [{ description: '', quantity: '', rate: '', amount: '' }],
    total: 0,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: ''
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    gst_number: '',
    vendor_type: 'feed_supplier',
    credit_limit: '',
    payment_terms: '30_days'
  });

  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    supplier_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    items: [{ description: '', quantity: '', rate: '', amount: '', category: 'feed' }],
    total_amount: 0,
    payment_status: 'unpaid',
    payment_method: 'cash',
    notes: ''
  });

  // Reports and analytics
  const [reportsData, setReportsData] = useState({
    agingPayables: [],
    agingReceivables: [],
    cashFlow: [],
    financialRatios: {}
  });

  // Monthly income report
  const [monthlyIncomeReport, setMonthlyIncomeReport] = useState([]);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  const calculateOverviewData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [
        salesRes,
        paymentsRes,
        billsRes,
        expensesRes
      ] = await Promise.all([
        axios.get('/api/sales', { headers }),
        axios.get('/api/financial/payments', { headers }),
        axios.get('/api/billing', { headers }),
        axios.get('/api/expenses', { headers })
      ]);

      // Calculate selected month income (using selectedMonth and selectedYear)
      const sales = salesRes.data || [];
      const payments = paymentsRes.data || [];
      const bills = billsRes.data || [];
      const expenses = expensesRes.data || [];


      const monthlySalesIncome = sales
        .filter(sale => {
          const saleDate = new Date(sale.date || sale.createdAt);
          return saleDate.getMonth() === selectedMonth && saleDate.getFullYear() === selectedYear;
        })
        .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

      const monthlyPaymentIncome = payments
        .filter(payment => {
          const paymentDate = new Date(payment.payment_date || payment.createdAt || payment.date);
          return paymentDate.getMonth() === selectedMonth && paymentDate.getFullYear() === selectedYear;
        })
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      // Bills generated in the month (milk delivery revenue - this IS income when billed)
      const monthlyBillsGenerated = bills
        .filter(bill => {
          const billDate = new Date(bill.createdAt || bill.date || bill.bill_date);
          return billDate.getMonth() === selectedMonth && billDate.getFullYear() === selectedYear;
        })
        .reduce((sum, bill) => sum + (bill.total_amount || 0), 0);

      const monthlyExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.createdAt || expense.date);
          return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
        })
        .reduce((sum, expense) => sum + (expense.amount || 0), 0);

      // Income = Sales + Milk Delivery Bills (customer collections are just payments against existing bills, not new revenue)
      const totalMonthlyIncome = monthlySalesIncome + monthlyBillsGenerated;
      const monthlyNetProfit = totalMonthlyIncome - monthlyExpenses;


      // Calculate total income (all time) - Only actual cash received (sales + payments)
      const totalSalesIncome = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalPaymentIncome = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const totalBillingIncome = bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const totalIncome = totalSalesIncome + totalPaymentIncome; // Removed totalBillingIncome as bills are receivables, not income
      const totalNetProfit = totalIncome - totalExpenses;

      // Update overview with real income data
      const overviewData = {
        monthly_revenue: totalMonthlyIncome,
        monthly_expenses: monthlyExpenses,
        net_profit: monthlyNetProfit,
        total_revenue: totalIncome, // Now only includes actual cash received (sales + payments)
        total_expenses: totalExpenses,
        total_net_profit: totalNetProfit,
        sales_income: totalSalesIncome,
        payment_income: totalPaymentIncome,
        billing_income: totalBillingIncome, // Total outstanding receivables from bills
        monthly_sales: monthlySalesIncome,
        monthly_payments: monthlyPaymentIncome,
        monthly_bills_generated: monthlyBillsGenerated,
        total_sales_count: sales.length,
        total_payments_count: payments.length,
        total_bills_count: bills.length,
        current_ratio: 0, // Will be calculated from financial ratios
        cash_flow: totalIncome - totalExpenses,
        selected_month: selectedMonth,
        selected_year: selectedYear
      };

      setOverview(overviewData);
    } catch (err) {
      console.error('Error calculating overview data:', err);
    }
  }, [selectedMonth, selectedYear]);

  const fetchFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [
        payablesRes,
        receivablesRes,
        bankBalanceRes,
        loansRes,
        suppliersRes,
        salesRes,
        paymentsRes,
        billsRes,
        expensesRes
      ] = await Promise.all([
        axios.get('/api/financial/payables-simple', { headers }),
        axios.get('/api/financial/receivables-simple', { headers }),
        axios.get('/api/financial/bank-balance', { headers }),
        axios.get('/api/financial/loans', { headers }),
        axios.get('/api/financial/vendors', { headers }),
        axios.get('/api/sales', { headers }),
        axios.get('/api/payments', { headers }),
        axios.get('/api/billing', { headers }),
        axios.get('/api/expenses', { headers })
      ]);

      setPayables(payablesRes.data);
      setReceivables(receivablesRes.data);
      setBankBalances(bankBalanceRes.data);
      setLoans(loansRes.data);
      setSuppliers(suppliersRes.data);
      setSalesData(salesRes.data);

      // Calculate dynamic income from sales, payments, bills and expenses
      const sales = salesRes.data || [];
      const payments = paymentsRes.data || [];
      const bills = billsRes.data || [];
      const expenses = expensesRes.data || [];

      // Calculate selected month income (using selectedMonth and selectedYear)
      const monthlySalesIncome = sales
        .filter(sale => {
          const saleDate = new Date(sale.createdAt || sale.date || sale.sale_date);
          return saleDate.getMonth() === selectedMonth && saleDate.getFullYear() === selectedYear;
        })
        .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

      const monthlyPaymentIncome = payments
        .filter(payment => {
          const paymentDate = new Date(payment.payment_date || payment.createdAt || payment.date);
          return paymentDate.getMonth() === selectedMonth && paymentDate.getFullYear() === selectedYear;
        })
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      // Bills generated in the month (milk delivery revenue - this IS income when billed)
      const monthlyBillsGenerated = bills
        .filter(bill => {
          // Parse billing_period (format: "YYYY-MM")
          const billingPeriod = bill.billing_period; // e.g., "2025-11"
          const [periodYear, periodMonth] = billingPeriod.split('-').map(Number);

          // Convert to 0-indexed month for comparison
          const billMonth = periodMonth - 1; // January = 0, February = 1, etc.
          const billYear = periodYear;

          const matches = billMonth === selectedMonth && billYear === selectedYear;


          return matches;
        })
        .reduce((sum, bill) => sum + (bill.total_amount || 0), 0);


      const monthlyExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.createdAt || expense.date);
          return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
        })
        .reduce((sum, expense) => sum + (expense.amount || 0), 0);

      // Income = Sales + Milk Delivery Bills (revenue earned this month)
      const totalMonthlyIncome = monthlySalesIncome + monthlyBillsGenerated;
      const monthlyNetProfit = totalMonthlyIncome - monthlyExpenses;

      // Calculate total income (all time) - Only actual cash received (sales + payments)
      const totalSalesIncome = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalPaymentIncome = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const totalBillingIncome = bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const totalIncome = totalSalesIncome + totalPaymentIncome; // Removed totalBillingIncome as bills are receivables, not income
      const totalNetProfit = totalIncome - totalExpenses;


      // Update overview with real income data
      const overviewData = {
        monthly_revenue: totalMonthlyIncome,
        monthly_expenses: monthlyExpenses,
        net_profit: monthlyNetProfit,
        total_revenue: totalIncome,
        total_expenses: totalExpenses,
        total_net_profit: totalNetProfit,
        sales_income: totalSalesIncome,
        payment_income: totalPaymentIncome,
        billing_income: totalBillingIncome, // Total outstanding receivables from bills
        monthly_sales: monthlySalesIncome,
        monthly_payments: monthlyPaymentIncome,
        monthly_bills_generated: monthlyBillsGenerated, // Bills generated this month (not income)
        total_sales_count: sales.length,
        total_payments_count: payments.length,
        total_bills_count: bills.length,
        current_ratio: 0, // Will be calculated from financial ratios
        cash_flow: totalIncome - totalExpenses,
        selected_month: selectedMonth,
        selected_year: selectedYear
      };

      setOverview(overviewData);

    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      setError('Failed to fetch financial data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyIncomeReport = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`/api/reports/monthly-income?year=${reportYear}`, { headers });

      setMonthlyIncomeReport(response.data.monthly_income || []);
    } catch (err) {
      console.error('Error fetching monthly income report:', err);
    }
  }, [reportYear]);

  useEffect(() => {
    fetchFinancialData();
    fetchMonthlyIncomeReport();
  }, [fetchFinancialData, fetchMonthlyIncomeReport]);

  useEffect(() => {
    // Recalculate overview data when month/year changes
    calculateOverviewData();
  }, [selectedMonth, selectedYear, calculateOverviewData]);

  useEffect(() => {
    // Fetch monthly income report when year changes
    fetchMonthlyIncomeReport();
  }, [reportYear, fetchMonthlyIncomeReport]);

  const resetForms = () => {
    setPayableForm({ person_name: '', amount: '', description: '', due_date: '', category: 'supplier' });
    setReceivableForm({ customer_name: '', amount: '', description: '', due_date: '', category: 'customer' });
    setTransactionForm({ type: 'deposit', amount: '', description: '', bank_name: '', account_number: '', date: new Date().toISOString().split('T')[0] });
    setLoanForm({ loan_name: '', lender_name: '', loan_type: 'business', principal_amount: '', outstanding_balance: '', interest_rate: '', loan_date: new Date().toISOString().split('T')[0], maturity_date: '', tenure_months: '', repayment_frequency: 'monthly', loan_account_number: '', bank_name: '', branch_name: '', collateral_details: '', notes: '' });
    setPaymentForm({ type: 'payable', person_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'cash', description: '' });
    setInvoiceForm({ customer_name: '', customer_id: '', items: [{ description: '', quantity: '', rate: '', amount: '' }], total: 0, invoice_date: new Date().toISOString().split('T')[0], due_date: '' });
    setSupplierForm({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      gst_number: '',
      vendor_type: 'feed_supplier',
      credit_limit: '',
      payment_terms: '30_days',
      monthly_installment: '',
      installment_months: '',
      first_payment_date: '',
      payment_frequency: 'monthly'
    });
    setPurchaseForm({ supplier_id: '', supplier_name: '', purchase_date: new Date().toISOString().split('T')[0], items: [{ description: '', quantity: '', rate: '', amount: '', category: 'feed' }], total_amount: 0, payment_status: 'unpaid', payment_method: 'cash', notes: '' });
    setEditingItem(null);
  };

  // Payment processing handler
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = { ...paymentForm, amount: parseFloat(paymentForm.amount) };

      await axios.post('/api/financial/payments', data, {
        headers: { Authorization: `Bearer ${token}` }
      });

                Swal.fire({
                  title: 'Success',
                  text: `Payment of ₹${formatCurrency(paymentForm.amount)} recorded successfully!`,
                  icon: 'success',
                  confirmButtonText: 'OK'
                });
                setShowPaymentForm(false);
                resetForms();
                fetchFinancialData();
    } catch (err) {
      Swal.fire('Error', 'Failed to record payment', 'error');
    }
  };

  // Invoice generation handler
  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const total = invoiceForm.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

      // Create receivable record from invoice
      const receivableData = {
        customer_name: invoiceForm.customer_name,
        amount: total,
        description: `Invoice: ${invoiceForm.items.map(item => item.description).join(', ')}`,
        due_date: invoiceForm.due_date,
        category: 'customer'
      };

      await axios.post('/api/financial/receivables-simple', receivableData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire('Success', `Invoice generated! Total: ${formatCurrency(total)}`, 'success');
      setShowInvoiceForm(false);
      resetForms();
      fetchFinancialData();
    } catch (err) {
      Swal.fire('Error', 'Failed to generate invoice', 'error');
    }
  };

  // Invoice item management
  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: '', rate: '', amount: '' }]
    });
  };

  const updateInvoiceItem = (index, field, value) => {
    const updatedItems = [...invoiceForm.items];
    updatedItems[index][field] = value;

    if (field === 'quantity' || field === 'rate') {
      const quantity = parseFloat(updatedItems[index].quantity) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].amount = (quantity * rate).toString();
    }

    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems
    });
  };

  // Supplier handlers
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = { ...supplierForm, credit_limit: parseFloat(supplierForm.credit_limit || 0) };

      // Submitting supplier data

      if (editingItem) {
        const response = await axios.put(`/api/financial/vendors/${editingItem._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Success', 'Supplier updated successfully', 'success');
      } else {
        const response = await axios.post('/api/financial/vendors', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Success', 'Supplier added successfully', 'success');
      }

      setShowSupplierForm(false);
      resetForms();
      fetchFinancialData();
    } catch (err) {
      console.error('Supplier submit error:', err);
      console.error('Error response:', err.response);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save supplier';
      Swal.fire('Error', errorMsg, 'error');
    }
  };

  // Purchase handlers
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const total = purchaseForm.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const data = { ...purchaseForm, total_amount: total };

      // Create payable for the purchase
      const payableData = {
        person_name: purchaseForm.supplier_name,
        amount: total,
        description: `Purchase: ${purchaseForm.items.map(item => item.description).join(', ')}`,
        due_date: purchaseForm.purchase_date,
        category: 'supplier'
      };

      await axios.post('/api/financial/payables-simple', payableData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire('Success', `Purchase recorded! Total: ${formatCurrency(total)}`, 'success');
      setShowPurchaseForm(false);
      resetForms();
      fetchFinancialData();
    } catch (err) {
      Swal.fire('Error', 'Failed to record purchase', 'error');
    }
  };

  // Purchase item management
  const addPurchaseItem = () => {
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, { description: '', quantity: '', rate: '', amount: '', category: 'feed' }]
    });
  };

  const updatePurchaseItem = (index, field, value) => {
    const updatedItems = [...purchaseForm.items];
    updatedItems[index][field] = value;

    if (field === 'quantity' || field === 'rate') {
      const quantity = parseFloat(updatedItems[index].quantity) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].amount = (quantity * rate).toString();
    }

    setPurchaseForm({
      ...purchaseForm,
      items: updatedItems
    });
  };

  // Get supplier transactions
  const getSupplierTransactions = (supplierId) => {
    const supplierPayables = payables.filter(p => p.person_name === suppliers.find(s => s._id === supplierId)?.name);
    const supplierPayments = payables.filter(p => p.person_name === suppliers.find(s => s._id === supplierId)?.name && p.paid_amount > 0);

    return {
      purchases: supplierPayables,
      payments: supplierPayments,
      totalPurchased: supplierPayables.reduce((sum, p) => sum + p.amount, 0),
      totalPaid: supplierPayments.reduce((sum, p) => sum + p.paid_amount, 0),
      outstanding: supplierPayables.reduce((sum, p) => sum + (p.amount - p.paid_amount), 0)
    };
  };

  // Search and filter functions
  const filterData = (data, type) => {
    return data.filter(item => {
      const matchesSearch = !searchTerm ||
        item.person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !categoryFilter ||
        item.category === categoryFilter;

      const matchesDate = (!dateFilter.start || !dateFilter.end) ||
        (item.due_date && item.due_date >= dateFilter.start && item.due_date <= dateFilter.end) ||
        (item.createdAt && item.createdAt >= dateFilter.start && item.createdAt <= dateFilter.end);

      return matchesSearch && matchesCategory && matchesDate;
    });
  };

  // Aging analysis
  const getAgingAnalysis = (data, type) => {
    const today = new Date();
    const aging = {
      current: [],
      '1-30': [],
      '31-60': [],
      '61-90': [],
      '90+': []
    };

    data.forEach(item => {
      const dueDate = new Date(item.due_date);
      const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 0) aging.current.push(item);
      else if (daysDiff <= 30) aging['1-30'].push(item);
      else if (daysDiff <= 60) aging['31-60'].push(item);
      else if (daysDiff <= 90) aging['61-90'].push(item);
      else aging['90+'].push(item);
    });

    return aging;
  };

  // Financial ratios calculation
  const calculateFinancialRatios = () => {
    const totalReceivables = getTotalReceivables();
    const totalPayables = getTotalPayables();
    const totalBankBalance = getTotalBankBalance();
    const totalLoans = getTotalLoans();

    const currentAssets = totalReceivables + totalBankBalance;
    const currentLiabilities = totalPayables + totalLoans;

    return {
      currentRatio: currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : 'N/A',
      debtToEquityRatio: totalLoans > 0 ? ((totalLoans / (currentAssets - totalLoans)) * 100).toFixed(2) : '0.00',
      cashReserveRatio: totalPayables > 0 ? ((totalBankBalance / totalPayables) * 100).toFixed(2) : 'N/A'
    };
  };

  // Export functionality
  const exportToCSV = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + data.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate reports
  const generateReports = () => {
    const agingPayables = getAgingAnalysis(payables, 'payables');
    const agingReceivables = getAgingAnalysis(receivables, 'receivables');
    const financialRatios = calculateFinancialRatios();

    setReportsData({
      agingPayables,
      agingReceivables,
      financialRatios,
      cashFlow: {
        totalReceivables: getTotalReceivables(),
        totalPayables: getTotalPayables(),
        netCashFlow: getTotalReceivables() - getTotalPayables(),
        bankBalance: getTotalBankBalance()
      }
    });

    setShowReports(true);
  };

  // Payables handlers
  const handlePayableSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = { ...payableForm, amount: parseFloat(payableForm.amount) };

      if (editingItem) {
        await axios.put(`/api/financial/payables-simple/${editingItem._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Success', 'Payable updated successfully', 'success');
      } else {
        await axios.post('/api/financial/payables-simple', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Success', 'Payable added successfully', 'success');
      }

      setShowPayableForm(false);
      resetForms();
      fetchFinancialData();
    } catch (err) {
      Swal.fire('Error', 'Failed to save payable', 'error');
    }
  };

  // Receivables handlers
  const handleReceivableSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = { ...receivableForm, amount: parseFloat(receivableForm.amount) };

      if (editingItem) {
        await axios.put(`/api/financial/receivables-simple/${editingItem._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Success', 'Receivable updated successfully', 'success');
      } else {
        await axios.post('/api/financial/receivables-simple', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Success', 'Receivable added successfully', 'success');
      }

      setShowReceivableForm(false);
      resetForms();
      fetchFinancialData();
    } catch (err) {
      Swal.fire('Error', 'Failed to save receivable', 'error');
    }
  };

  // Transaction handlers
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = { ...transactionForm, amount: parseFloat(transactionForm.amount) };

      await axios.post('/api/financial/transactions', data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire('Success', 'Transaction recorded successfully', 'success');
      setShowTransactionForm(false);
      resetForms();
      fetchFinancialData();
    } catch (err) {
      Swal.fire('Error', 'Failed to record transaction', 'error');
    }
  };

  // Loan handlers
  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = {
        ...loanForm,
        principal_amount: parseFloat(loanForm.principal_amount),
        outstanding_balance: parseFloat(loanForm.outstanding_balance || loanForm.principal_amount),
        interest_rate: parseFloat(loanForm.interest_rate),
        tenure_months: parseInt(loanForm.tenure_months),
        loan_date: loanForm.loan_date,
        maturity_date: loanForm.maturity_date || new Date(new Date(loanForm.loan_date).getTime() + (parseInt(loanForm.tenure_months) * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      };

      // Submitting loan data

      if (editingItem) {
        const response = await axios.put(`/api/financial/loans/${editingItem._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Success', 'Loan updated successfully', 'success');
      } else {
        const response = await axios.post('/api/financial/loans', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Success', 'Loan added successfully', 'success');
      }

      setShowLoanForm(false);
      resetForms();
      fetchFinancialData();
    } catch (err) {
      console.error('Loan submit error:', err);
      console.error('Error response:', err.response);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save loan';
      Swal.fire('Error', errorMsg, 'error');
    }
  };

  // Loan Payment handler
  const handleLoanPaymentSubmit = async (paymentForm, loanId) => {
    try {
      const token = localStorage.getItem('token');
      const data = {
        ...paymentForm,
        payment_amount: parseFloat(paymentForm.payment_amount),
        loan_id: loanId
      };

      // Submitting loan payment data

      await axios.post('/api/financial/loan-payments', data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire('Success', `Loan payment of ${formatCurrency(paymentForm.payment_amount)} recorded successfully!`, 'success');

      setShowLoanPaymentForm(false);
      setLoanPaymentForm({
        loan_id: '',
        payment_amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        payment_reference: '',
        description: '',
        bank_name: '',
        account_number: '',
        notes: ''
      });

      // Refresh data to update loan balances
      fetchFinancialData();
    } catch (err) {
      console.error('Loan payment submit error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to record loan payment';
      Swal.fire('Error', errorMsg, 'error');
    }
  };

  // Delete handlers
  const handleDelete = async (type, id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        let endpoint = '';

        switch (type) {
          case 'payable':
            endpoint = `payables-simple/${id}`;
            break;
          case 'receivable':
            endpoint = `receivables-simple/${id}`;
            break;
          case 'loan':
            endpoint = `loans/${id}`;
            break;
          case 'supplier':
            endpoint = `vendors/${id}`;
            break;
          default:
            throw new Error('Invalid type');
        }

        await axios.delete(`/api/financial/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire('Deleted!', 'Record has been deleted.', 'success');
        fetchFinancialData();
      } catch (err) {
        Swal.fire('Error', 'Failed to delete record', 'error');
      }
    }
  };

  // Edit handlers
  const handleEdit = (type, item) => {
    setEditingItem(item);
    switch (type) {
      case 'payable':
        setPayableForm({
          person_name: item.person_name,
          amount: item.amount.toString(),
          description: item.description || '',
          due_date: item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '',
          category: item.category || 'supplier'
        });
        setShowPayableForm(true);
        break;
      case 'receivable':
        setReceivableForm({
          customer_name: item.customer_name,
          amount: item.amount.toString(),
          description: item.description || '',
          due_date: item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '',
          category: item.category || 'customer'
        });
        setShowReceivableForm(true);
        break;
      case 'loan':
        setLoanForm({
          loan_name: item.loan_name,
          lender_name: item.lender_name,
          loan_type: item.loan_type || 'business',
          principal_amount: item.principal_amount.toString(),
          outstanding_balance: item.outstanding_balance?.toString() || item.principal_amount.toString(),
          interest_rate: item.interest_rate.toString(),
          loan_date: new Date(item.loan_date).toISOString().split('T')[0],
          maturity_date: item.maturity_date ? new Date(item.maturity_date).toISOString().split('T')[0] : '',
          tenure_months: item.tenure_months.toString(),
          repayment_frequency: item.repayment_frequency || 'monthly',
          loan_account_number: item.loan_account_number || '',
          bank_name: item.bank_name || '',
          branch_name: item.branch_name || '',
          collateral_details: item.collateral_details || '',
          notes: item.notes || ''
        });
        setShowLoanForm(true);
        break;
      case 'supplier':
        setSupplierForm({
          name: item.name,
          contact_person: item.contact_person || '',
          phone: item.phone || '',
          email: item.email || '',
          address: item.address || '',
          gst_number: item.gst_number || '',
          vendor_type: item.vendor_type || 'feed_supplier',
          credit_limit: item.credit_limit?.toString() || '',
          payment_terms: item.payment_terms || '30_days',
          monthly_installment: item.monthly_installment || '',
          installment_months: item.installment_months || '',
          first_payment_date: item.first_payment_date || '',
          payment_frequency: item.payment_frequency || 'monthly'
        });
        setShowSupplierForm(true);
        break;
    }
  };

  // EMI Calculation Function
  const calculateLoanEMI = (principal, annualRate, tenureMonths, frequency = 'monthly') => {
    const principalAmount = parseFloat(principal) || 0;
    const rate = parseFloat(annualRate) || 0;
    const months = parseInt(tenureMonths) || 1;

    if (principalAmount <= 0 || rate <= 0 || months <= 1) return 0;

    // Convert annual rate to monthly rate
    const monthlyRate = rate / 100 / 12;

    // EMI Formula: [P * r * (1+r)^n] / [(1+r)^n - 1]
    const emi = (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                (Math.pow(1 + monthlyRate, months) - 1);

    // Adjust for frequency
    let adjustedEMI = emi;
    switch (frequency) {
      case 'quarterly':
        adjustedEMI = emi * 3;
        break;
      case 'half_yearly':
        adjustedEMI = emi * 6;
        break;
      case 'yearly':
        adjustedEMI = emi * 12;
        break;
      default:
        adjustedEMI = emi;
    }

    return Math.round(adjustedEMI);
  };

  const calculateTotalAmount = (principal, annualRate, tenureMonths, frequency = 'monthly') => {
    const emi = calculateLoanEMI(principal, annualRate, tenureMonths, frequency);

    let numberOfPayments = tenureMonths;
    switch (frequency) {
      case 'quarterly':
        numberOfPayments = Math.ceil(tenureMonths / 3);
        break;
      case 'half_yearly':
        numberOfPayments = Math.ceil(tenureMonths / 6);
        break;
      case 'yearly':
        numberOfPayments = Math.ceil(tenureMonths / 12);
        break;
      default:
        numberOfPayments = tenureMonths;
    }

    return emi * numberOfPayments;
  };

  const calculateTotalInterest = (principal, annualRate, tenureMonths, frequency = 'monthly') => {
    const totalAmount = calculateTotalAmount(principal, annualRate, tenureMonths, frequency);
    const principalAmount = parseFloat(principal) || 0;
    return totalAmount - principalAmount;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getTotalPayables = () => {
    return payables.reduce((sum, payable) => sum + (payable.amount - payable.paid_amount), 0);
  };

  const getTotalReceivables = () => {
    return receivables.reduce((sum, receivable) => sum + (receivable.amount - receivable.received_amount), 0);
  };

  const getTotalBankBalance = () => {
    return bankBalances.reduce((sum, balance) => sum + (balance.balance || 0), 0);
  };

  const getTotalLoans = () => {
    return loans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);
  };

  const getTodaysPayables = () => {
    const today = new Date().toISOString().split('T')[0];
    return payables.filter(payable => payable.due_date === today);
  };


  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto p-5">
        <div className="text-center p-10 text-base text-gray-500">Loading financial data...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview (अवलोकन)', icon: FaChartLine, color: 'bg-green-500' },
    { id: 'daily-sales', label: 'Daily Sales (दैनिक बिक्री)', icon: FaMoneyBillWave, color: 'bg-cyan-500' },
    { id: 'suppliers', label: 'Suppliers (सप्लायर)', icon: FaUniversity, color: 'bg-orange-500' },
    { id: 'payables', label: 'Payables (किसको देना है)', icon: FaMoneyBillWave, color: 'bg-red-500' },
    { id: 'receivables', label: 'Receivables (किससे लेना है)', icon: FaCreditCard, color: 'bg-green-500' },
    { id: 'bank', label: 'Bank Balance (बैंक में कितना)', icon: FaUniversity, color: 'bg-blue-500' },
    { id: 'loans', label: 'Loans (लोन कितना)', icon: FaHandHoldingUsd, color: 'bg-purple-500' },
    { id: 'payments', label: 'Payments (भुगतान)', icon: FaCalculator, color: 'bg-indigo-500' },
    { id: 'reports', label: 'Reports (रिपोर्ट)', icon: FaFileInvoiceDollar, color: 'bg-teal-500' }
  ];

  return (
    <div className="max-w-screen-xl mx-auto p-5">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
        <h2 className="m-0 text-gray-800 text-2xl font-bold">Financial Management</h2>
        <button
          className="p-2.5 px-5 bg-blue-500 text-white border-none rounded cursor-pointer text-sm font-medium transition-colors duration-300 hover:bg-blue-700"
          onClick={fetchFinancialData}
        >
          Refresh Data
        </button>
      </div>

      {error && <div className="bg-red-500 text-white p-2.5 rounded mb-5">{error}</div>}

      {/* Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-4 rounded-lg text-white font-medium transition-all duration-300 hover:shadow-lg ${
              activeTab === tab.id ? 'ring-2 ring-white shadow-lg scale-105' : ''
            } ${tab.color}`}
          >
            <tab.icon className="text-2xl mb-2 mx-auto" />
            <div className="text-sm">{tab.label}</div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div>
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Financial Overview Dashboard</h3>
                  <p className="text-gray-600">Real-time income and expense tracking from customer orders, payments, and monthly billing</p>
                </div>

                {/* Month/Year Selection */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border">
                  <button
                    onClick={() => {
                      if (selectedMonth === 0) {
                        setSelectedMonth(11);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                    title="Previous Month"
                  >
                    ‹
                  </button>

                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-1 border rounded text-sm font-medium"
                  >
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-1 border rounded text-sm font-medium"
                  >
                    {Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      if (selectedMonth === 11) {
                        setSelectedMonth(0);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                    title="Next Month"
                  >
                    ›
                  </button>

                  <button
                    onClick={() => {
                      const now = new Date();
                      setSelectedMonth(now.getMonth());
                      setSelectedYear(now.getFullYear());
                    }}
                    className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Current Month
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                Showing data for: <span className="font-medium text-gray-700">
                  {new Date(selectedYear, selectedMonth).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="m-0 mb-2 text-gray-700 text-sm font-semibold">Monthly Revenue</h3>
                    <p className="m-0 text-2xl font-bold text-gray-800">{formatCurrency(overview.monthly_revenue)}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      Milk Delivery Bills: {formatCurrency(overview.monthly_bills_generated)}<br/>
                      (Monthly revenue from milk deliveries)
                    </div>
                  </div>
                  <FaChartLine className="text-green-500 text-3xl" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="m-0 mb-2 text-gray-700 text-sm font-semibold">Monthly Expenses</h3>
                    <p className="m-0 text-2xl font-bold text-gray-800">{formatCurrency(overview.monthly_expenses)}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      From purchases & operations
                    </div>
                  </div>
                  <FaMoneyBillWave className="text-red-500 text-3xl" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="m-0 mb-2 text-gray-700 text-sm font-semibold">Net Profit</h3>
                    <p className={`m-0 text-2xl font-bold ${overview.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(overview.net_profit)}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      Revenue - Expenses
                    </div>
                  </div>
                  <FaChartLine className={`text-3xl ${overview.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </div>
            </div>

            {/* Income Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Income Sources Breakdown (आय स्रोत)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">{formatCurrency(overview.monthly_bills_generated || 0)}</div>
                  <div className="text-sm text-gray-600">Milk Delivery Revenue (दूध आपूर्ति आय)</div>
                  <div className="text-xs text-gray-500 mt-1">Monthly bills generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">{formatCurrency(overview.monthly_sales)}</div>
                  <div className="text-sm text-gray-600">Other Sales (अन्य बिक्री)</div>
                  <div className="text-xs text-gray-500 mt-1">Additional sales revenue</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-700 mb-2">Monthly Summary</div>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Milk Delivery Bills:</span>
                      <span className="font-bold text-blue-600 ml-2">{formatCurrency(overview.monthly_bills_generated || 0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Other Sales:</span>
                      <span className="font-bold text-purple-600 ml-2">{formatCurrency(overview.monthly_sales)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-300">
                      <span className="text-gray-600">Total Monthly Revenue:</span>
                      <span className="font-bold text-red-600 ml-2">{formatCurrency(overview.monthly_revenue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Health Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-semibold mb-4">Cash Flow Status</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Monthly Cash Flow:</span>
                    <span className={`font-bold ${overview.cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(overview.cash_flow)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Bank Balance:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(getTotalBankBalance())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Outstanding Receivables:</span>
                    <span className="font-bold text-green-600">{formatCurrency(getTotalReceivables())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Outstanding Payables:</span>
                    <span className="font-bold text-red-600">{formatCurrency(getTotalPayables())}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-semibold mb-4">Business Health Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Profit Margin:</span>
                    <span className={`font-bold ${overview.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {overview.monthly_revenue > 0 ? ((overview.net_profit / overview.monthly_revenue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Collection Rate:</span>
                    <span className="font-bold text-blue-600">
                      {overview.billing_income > 0 ? ((overview.payment_income / overview.billing_income) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg. Transaction Value:</span>
                    <span className="font-bold text-purple-600">
                      {overview.total_sales_count > 0 ? formatCurrency(overview.sales_income / overview.total_sales_count) : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Customers:</span>
                    <span className="font-bold text-green-600">{receivables.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold mb-4">Recent Financial Activity</h4>
              <div className="text-center py-8 text-gray-500">
                Recent transactions, payments, and invoices will be displayed here
              </div>
            </div>
          </div>
        )}

        {activeTab === 'daily-sales' && (
          <div>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
              <h3 className="text-xl font-semibold">Daily Sales Records (दैनिक बिक्री रिकॉर्ड)</h3>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
                onClick={fetchFinancialData}
              >
                <FaCalculator /> Refresh Sales Data
              </button>
            </div>

            {/* Month/Year Selection for Sales */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h4 className="text-lg font-semibold">Filter Sales by Month</h4>
                  <p className="text-gray-600">View sales data for specific months</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border">
                  <button
                    onClick={() => {
                      if (salesSelectedMonth === 0) {
                        setSalesSelectedMonth(11);
                        setSalesSelectedYear(salesSelectedYear - 1);
                      } else {
                        setSalesSelectedMonth(salesSelectedMonth - 1);
                      }
                    }}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                    title="Previous Month"
                  >
                    ‹
                  </button>

                  <select
                    value={salesSelectedMonth}
                    onChange={(e) => setSalesSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-1 border rounded text-sm font-medium"
                  >
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>

                  <select
                    value={salesSelectedYear}
                    onChange={(e) => setSalesSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-1 border rounded text-sm font-medium"
                  >
                    {Array.from({ length: 5 }, (_, i) => salesSelectedYear - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      if (salesSelectedMonth === 11) {
                        setSalesSelectedMonth(0);
                        setSalesSelectedYear(salesSelectedYear + 1);
                      } else {
                        setSalesSelectedMonth(salesSelectedMonth + 1);
                      }
                    }}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                    title="Next Month"
                  >
                    ›
                  </button>

                  <button
                    onClick={() => {
                      const now = new Date();
                      setSalesSelectedMonth(now.getMonth());
                      setSalesSelectedYear(now.getFullYear());
                    }}
                    className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Current Month
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                Showing sales for: <span className="font-medium text-gray-700">
                  {new Date(salesSelectedYear, salesSelectedMonth).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
            </div>

            {/* Filter sales data by selected month/year */}
            {(() => {
              const filteredSales = salesData.filter(sale => {
                const saleDate = new Date(sale.date || sale.createdAt);
                return saleDate.getMonth() === salesSelectedMonth && saleDate.getFullYear() === salesSelectedYear;
              });

              return (
                <>
                  {/* Sales Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                      <div className="text-cyan-800 font-semibold">Total Sales</div>
                      <div className="text-2xl font-bold text-cyan-600">{filteredSales.length}</div>
                      <div className="text-xs text-gray-500 mt-1">This month</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-green-800 font-semibold">Total Revenue</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">This month</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-blue-800 font-semibold">Paid Sales</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {filteredSales.filter(sale => sale.paid).length}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">This month</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-red-800 font-semibold">Outstanding</div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(filteredSales.filter(sale => !sale.paid).reduce((sum, sale) => sum + (sale.total_amount || 0), 0))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">This month</div>
                    </div>
                  </div>

                  {/* Sales Table */}
                  <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-3 text-left border-b">Date</th>
                          <th className="p-3 text-left border-b">Customer</th>
                          <th className="p-3 text-left border-b">Product</th>
                          <th className="p-3 text-left border-b">Quantity</th>
                          <th className="p-3 text-left border-b">Unit Price</th>
                          <th className="p-3 text-left border-b">Total Amount</th>
                          <th className="p-3 text-left border-b">Payment Status</th>
                          <th className="p-3 text-left border-b">Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((sale) => (
                          <tr key={sale._id} className="hover:bg-gray-50">
                            <td className="p-3 border-b">
                              {sale.date ? new Date(sale.date).toLocaleDateString('en-IN') : 'N/A'}
                            </td>
                            <td className="p-3 border-b">
                              {sale.customer_id?.name || 'N/A'}
                            </td>
                            <td className="p-3 border-b capitalize">
                              {sale.product_type || 'N/A'}
                            </td>
                            <td className="p-3 border-b">
                              {sale.quantity || 0}
                            </td>
                            <td className="p-3 border-b">
                              {formatCurrency(sale.unit_price || 0)}
                            </td>
                            <td className="p-3 border-b font-semibold text-green-600">
                              {formatCurrency(sale.total_amount || 0)}
                            </td>
                            <td className="p-3 border-b">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                sale.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {sale.paid ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                            <td className="p-3 border-b">
                              {sale.invoice_number || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredSales.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No sales records found for {new Date(salesSelectedYear, salesSelectedMonth).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long'
                        })}. Try selecting a different month or add sales records.
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

          </div>
        )}

        {activeTab === 'suppliers' && (
          <div>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
              <h3 className="text-xl font-semibold">Supplier Management (सप्लायर प्रबंधन)</h3>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  onClick={() => setShowSupplierForm(true)}
                >
                  <FaPlus /> Add Supplier
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={() => setShowPurchaseForm(true)}
                >
                  <FaPlus /> Record Purchase
                </button>
              </div>
            </div>

            {/* Supplier Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-orange-800 font-semibold">Total Suppliers</div>
                <div className="text-2xl font-bold text-orange-600">{suppliers.length}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-blue-800 font-semibold">Active Suppliers</div>
                <div className="text-2xl font-bold text-blue-600">
                  {suppliers.filter(s => s.status !== 'inactive').length}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-green-800 font-semibold">Total Purchases</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(payables.filter(p => p.category === 'supplier').reduce((sum, p) => sum + p.amount, 0))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800 font-semibold">Outstanding Payments</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(payables.filter(p => p.category === 'supplier').reduce((sum, p) => sum + (p.amount - p.paid_amount), 0))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left border-b">Supplier Name</th>
                    <th className="p-3 text-left border-b">Type</th>
                    <th className="p-3 text-left border-b">Contact</th>
                    <th className="p-3 text-left border-b">Credit Limit</th>
                    <th className="p-3 text-left border-b">Total Purchased</th>
                    <th className="p-3 text-left border-b">Outstanding</th>
                    <th className="p-3 text-left border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => {
                    const supplierTransactions = getSupplierTransactions(supplier._id);
                    return (
                      <tr key={supplier._id} className="hover:bg-gray-50">
                        <td className="p-3 border-b">
                          <div>
                            <div className="font-medium text-gray-800">{supplier.name}</div>
                            <div className="text-sm text-gray-500">{supplier.contact_person}</div>
                          </div>
                        </td>
                <td className="p-3 border-b capitalize">{supplier.vendor_type?.replace('_', ' ') || 'General'}
                  {supplier.vendor_type === 'cow_purchase' && supplier.monthly_installment && supplier.installment_months && (
                    <div className="text-xs text-blue-600 mt-1">
                      ₹{parseFloat(supplier.monthly_installment).toLocaleString('en-IN')} × {supplier.installment_months} months
                    </div>
                  )}
                </td>
                        <td className="p-3 border-b">
                          <div className="text-sm">
                            {supplier.phone && <div>📞 {supplier.phone}</div>}
                            {supplier.email && <div>✉️ {supplier.email}</div>}
                          </div>
                        </td>
                        <td className="p-3 border-b">{formatCurrency(supplier.credit_limit || 0)}</td>
                        <td className="p-3 border-b font-semibold text-green-600">
                          {formatCurrency(supplierTransactions.totalPurchased)}
                        </td>
                        <td className="p-3 border-b font-semibold text-red-600">
                          {formatCurrency(supplierTransactions.outstanding)}
                        </td>
                        <td className="p-3 border-b">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit('supplier', supplier)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit Supplier"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => {
                                // Show supplier transaction history
                                const transactions = supplierTransactions;
                                Swal.fire({
                                  title: `${supplier.name} - Transaction History`,
                                  html: `
                                    <div class="text-left">
                                      <p><strong>Total Purchased:</strong> ${formatCurrency(transactions.totalPurchased)}</p>
                                      <p><strong>Total Paid:</strong> ${formatCurrency(transactions.totalPaid)}</p>
                                      <p><strong>Outstanding:</strong> ${formatCurrency(transactions.outstanding)}</p>
                                      <p><strong>Transactions:</strong> ${transactions.purchases.length}</p>
                                    </div>
                                  `,
                                  confirmButtonText: 'Close'
                                });
                              }}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="View History"
                            >
                              <FaHistory />
                            </button>
                            <button
                              onClick={() => handleDelete('supplier', supplier._id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete Supplier"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {suppliers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No suppliers found. Add your first supplier to start tracking purchases and payments.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payables' && (
          <div>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
              <h3 className="text-xl font-semibold">Payables Management (किसको पैसा देना है)</h3>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => setShowPayableForm(true)}
                >
                  <FaPlus /> Add Payable
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={() => setShowPaymentForm(true)}
                >
                  <FaCalculator /> Record Payment
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => exportToCSV(filterData(payables, 'payables'), 'payables.csv')}
                >
                  <FaDownload /> Export
                </button>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Search</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="supplier">Supplier Payment</option>
                    <option value="investor">Investor Payout</option>
                    <option value="loan">Loan Repayment</option>
                    <option value="operational">Operational Expense</option>
                    <option value="tax">Tax Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">From Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800 font-semibold">Total Payables</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(getTotalPayables())}</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-orange-800 font-semibold">Due Today</div>
                <div className="text-2xl font-bold text-orange-600">{getTodaysPayables().length}</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-800 font-semibold">Overdue (1-30 days)</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {getAgingAnalysis(payables, 'payables')['1-30'].length}
                </div>
              </div>
              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <div className="text-red-900 font-semibold">Overdue (90+ days)</div>
                <div className="text-2xl font-bold text-red-700">
                  {getAgingAnalysis(payables, 'payables')['90+'].length}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left border-b">Person/Supplier</th>
                    <th className="p-3 text-left border-b">Category</th>
                    <th className="p-3 text-left border-b">Amount</th>
                    <th className="p-3 text-left border-b">Paid</th>
                    <th className="p-3 text-left border-b">Balance</th>
                    <th className="p-3 text-left border-b">Due Date</th>
                    <th className="p-3 text-left border-b">Status</th>
                    <th className="p-3 text-left border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-500">
                        No suppliers found. Add suppliers first to see them in payables section.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => {
                      // Find any payables for this supplier
                      const supplierPayables = payables.filter(p => p.person_name === supplier.name);
                      const totalPurchased = supplierPayables.reduce((sum, p) => sum + (p.amount || 0), 0);
                      const totalPaid = supplierPayables.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
                      const balance = totalPurchased - totalPaid;

                      // Find the latest due date
                      const validDueDates = supplierPayables
                        .filter(p => p.due_date)
                        .map(p => new Date(p.due_date))
                        .sort((a, b) => b - a);
                      const dueDateString = validDueDates[0] ? validDueDates[0].toLocaleDateString('en-IN') : 'N/A';

                      // Calculate status
                      let statusText = 'No Outstanding';
                      let statusColor = 'text-gray-600';
                      if (balance > 0) {
                        statusText = 'Outstanding';
                        statusColor = 'text-red-600';
                      } else if (supplierPayables.length > 0) {
                        statusText = 'Paid';
                        statusColor = 'text-green-600';
                      }

                      return (
                        <tr key={supplier._id} className="hover:bg-gray-50">
                          <td className="p-3 border-b">
                            <div>
                              <div className="font-medium text-gray-800">{supplier.name}</div>
                              <div className="text-sm text-gray-500">{supplier.vendor_type?.replace('_', ' ') || 'General'}</div>
                            </div>
                          </td>
                          <td className="p-3 border-b capitalize">supplier</td>
                          <td className="p-3 border-b">{formatCurrency(totalPurchased)}</td>
                          <td className="p-3 border-b">{formatCurrency(totalPaid)}</td>
                          <td className="p-3 border-b font-semibold text-red-600">
                            {formatCurrency(balance)}
                          </td>
                          <td className="p-3 border-b">{dueDateString}</td>
                          <td className={`p-3 border-b font-semibold ${statusColor}`}>
                            {statusText}
                          </td>
                          <td className="p-3 border-b">
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const supplierName = supplier.name;
                                    const token = localStorage.getItem('token');

                                    // Get all payables for this supplier
                                    const allPayablesResponse = await axios.get('/api/financial/payables-simple', {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });

                                    const allPayables = allPayablesResponse.data || [];
                                    const supplierPayables = allPayables.filter(p => p.person_name === supplierName);

                                    // Calculate totals from payables' paid amounts (since payments are tracked here)
                                    const totalPurchased = supplierPayables.reduce((sum, p) => sum + (p.amount || 0), 0);
                                    const totalPaid = supplierPayables.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
                                    const totalBalance = totalPurchased - totalPaid;

                                    // Create fake payment records from payables that have been paid
                                    const supplierPayments = [];
                                    supplierPayables.forEach(payable => {
                                      if (parseFloat(payable.paid_amount || 0) > 0) {
                                        supplierPayments.push({
                                          payment_date: payable.updatedAt || payable.createdAt || new Date().toISOString(),
                                          amount: payable.paid_amount,
                                          description: `Payment for: ${payable.description || 'Purchase'}`,
                                          payment_method: payable.payment_method || 'cash'
                                        });
                                      }
                                    });

                                    // Group payments by date
                                    const paymentsByDate = supplierPayments.reduce((acc, payment) => {
                                      const paymentDate = new Date(payment.payment_date).toLocaleDateString('en-IN');
                                      if (!acc[paymentDate]) {
                                        acc[paymentDate] = {
                                          date: paymentDate,
                                          payments: [],
                                          total: 0
                                        };
                                      }
                                      acc[paymentDate].payments.push(payment);
                                      acc[paymentDate].total += payment.amount || 0;
                                      return acc;
                                    }, {});

                                    // Group purchases by date
                                    const purchasesByDate = supplierPayables.reduce((acc, payable) => {
                                      const purchaseDate = payable.createdAt ? new Date(payable.createdAt).toLocaleDateString('en-IN') : 'N/A';
                                      if (!acc[purchaseDate]) {
                                        acc[purchaseDate] = {
                                          date: purchaseDate,
                                          purchases: [],
                                          total: 0
                                        };
                                      }
                                      acc[purchaseDate].purchases.push(payable);
                                      acc[purchaseDate].total += payable.amount || 0;
                                      return acc;
                                    }, {});

                                    const sortedPaymentDates = Object.keys(paymentsByDate).sort((a, b) =>
                                      new Date(a.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) - new Date(b.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'))
                                    );

                                    const sortedPurchaseDates = Object.keys(purchasesByDate).sort((a, b) => {
                                      if (a === 'N/A') return 1;
                                      if (b === 'N/A') return -1;
                                      return new Date(a.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) - new Date(b.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
                                    });

                                    const purchasesHistoryHTML = sortedPurchaseDates.map(dateKey => {
                                      const dateData = purchasesByDate[dateKey];
                                      return `
                                        <div class="mb-3 p-3 bg-orange-50 rounded border-l-4 border-orange-500">
                                          <div class="flex justify-between items-center mb-2">
                                            <strong class="text-orange-800">${dateData.date}</strong>
                                            <span class="font-bold text-orange-600">खरीद: ₹${formatCurrency(dateData.total)}</span>
                                          </div>
                                          <div class="space-y-1 text-sm">
                                            ${dateData.purchases.map(purchase => `
                                              <div class="flex justify-between items-center p-2 bg-white rounded">
                                                <div class="flex-1">
                                                  <div class="text-gray-600">${purchase.description || 'Purchase'}</div>
                                                  <div class="text-xs text-gray-500">Category: ${purchase.category}</div>
                                                </div>
                                                <div class="text-right font-semibold text-orange-600">
                                                  ₹${formatCurrency(purchase.amount)}
                                                </div>
                                              </div>
                                            `).join('')}
                                          </div>
                                        </div>
                                      `;
                                    }).join('');

                                    const paymentsHistoryHTML = supplierPayments.length > 0
                                      ? sortedPaymentDates.map(dateKey => {
                                          const dateData = paymentsByDate[dateKey];
                                          return `
                                            <div class="mb-3 p-3 bg-green-50 rounded border-l-4 border-green-500">
                                              <div class="flex justify-between items-center mb-2">
                                                <strong class="text-green-800">${dateData.date}</strong>
                                                <span class="font-bold text-green-600">भुगतान: ₹${formatCurrency(dateData.total)}</span>
                                              </div>
                                              <div class="space-y-1 text-sm">
                                                ${dateData.payments.map(payment => `
                                                  <div class="flex justify-between items-center p-2 bg-white rounded">
                                                    <div class="flex-1">
                                                      <div class="text-gray-600">${payment.description}</div>
                                                      <div class="text-xs text-gray-500">Method: ${payment.payment_method}</div>
                                                    </div>
                                                    <div class="text-right font-semibold text-green-600">
                                                      ₹${formatCurrency(payment.amount)}
                                                    </div>
                                                  </div>
                                                `).join('')}
                                              </div>
                                            </div>
                                          `;
                                        }).join('')
                                      : `<div class="p-3 bg-yellow-50 rounded text-sm text-yellow-800">
                                           <strong>कोई भुगतान रिकॉर्ड नहीं मिला</strong>
                                           <p>इस सुप्लायर के लिए अब तक कोई भुगतान दर्ज नहीं हुआ है।</p>
                                         </div>`;

                                    // Combine purchases and payments into a single array for table display
                                    const allTransactions = [];

                                    // Add purchase transactions
                                    supplierPayables.forEach(purchase => {
                                      allTransactions.push({
                                        type: 'purchase',
                                        date: purchase.createdAt || 'N/A',
                                        sl: allTransactions.length + 1,
                                        item: purchase.description || 'Purchase',
                                        category: purchase.category || 'Supplier',
                                        amountPurchased: purchase.amount,
                                        paymentMade: 0,
                                        remarks: purchase.description || 'Purchase record',
                                        balance: purchase.amount - (purchase.paid_amount || 0)
                                      });
                                    });

                                    // Add payment transactions
                                    supplierPayments.forEach(payment => {
                                      allTransactions.push({
                                        type: 'payment',
                                        date: payment.payment_date,
                                        sl: allTransactions.length + 1,
                                        item: payment.description || 'Payment',
                                        category: 'Payment',
                                        amountPurchased: 0,
                                        paymentMade: payment.amount,
                                        remarks: payment.description || 'Payment made',
                                        balance: 0
                                      });
                                    });

                                    // Sort by date (newest first)
                                    allTransactions.sort((a, b) => {
                                      if (a.date === 'N/A') return 1;
                                      if (b.date === 'N/A') return -1;
                                      return new Date(b.date) - new Date(a.date);
                                    });

                                    // Generate table HTML
                                    const tableHTML = `
                                      <div class="mb-4 p-4 bg-blue-50 rounded-lg">
                                        <table className="w-full border-collapse border border-gray-300">
                                          <thead>
                                            <tr class="bg-blue-100">
                                              <th class="border border-gray-300 px-4 py-2 text-left">Sl.</th>
                                              <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
                                              <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                                              <th className="border border-gray-300 px-4 py-2 text-right">Amount Purchased (₹)</th>
                                              <th className="border border-gray-300 px-4 py-2 text-right">Payment Made (₹)</th>
                                              <th className="border border-gray-300 px-4 py-2 text-left">Remarks</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            ${allTransactions.map(transaction => `
                                              <tr class="${transaction.type === 'purchase' ? 'bg-orange-50' : 'bg-green-50'} hover:bg-gray-50">
                                                <td class="border border-gray-300 px-4 py-2">${transaction.sl}</td>
                                                <td class="border border-gray-300 px-4 py-2 font-medium">${transaction.item}</td>
                                                <td class="border border-gray-300 px-4 py-2">${transaction.date !== 'N/A' ? new Date(transaction.date).toLocaleDateString('en-IN') : 'N/A'}</td>
                                                <td class="border border-gray-300 px-4 py-2 text-right ${transaction.type === 'purchase' ? 'font-semibold text-orange-600' : ''}">${transaction.type === 'purchase' ? formatCurrency(transaction.amountPurchased) : '-'}</td>
                                                <td class="border border-gray-300 px-4 py-2 text-right ${transaction.type === 'payment' ? 'font-semibold text-green-600' : ''}">${transaction.type === 'payment' ? formatCurrency(transaction.paymentMade) : '-'}</td>
                                                <td class="border border-gray-300 px-4 py-2 text-sm">${transaction.remarks}</td>
                                              </tr>
                                            `).join('')}
                                          </tbody>
                                          <tfoot>
                                            <tr class="bg-gray-200 font-bold">
                                              <td colspan="3" class="border border-gray-300 px-4 py-2 text-center">Total</td>
                                              <td class="border border-gray-300 px-4 py-2 text-right font-bold text-orange-600">${formatCurrency(totalPurchased)}</td>
                                              <td class="border border-gray-300 px-4 py-2 text-right font-bold text-green-600">${formatCurrency(totalPaid)}</td>
                                              <td class="border border-gray-300 px-4 py-2 text-right ${totalBalance > 0 ? 'text-red-600' : 'text-blue-600'} font-bold">
                                                Balance: ${formatCurrency(totalBalance)}
                                                ${totalBalance > 0 ? '(Due)' : '(Paid)'}
                                              </td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    `;

                                    Swal.fire({
                                      title: `${supplierName} - Complete Transaction History`,
                                      html: `
                                        <div class="text-left max-h-[80vh] overflow-y-auto">
                                          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6 p-4 bg-gray-100 rounded-lg">
                                            <div class="text-center p-3 bg-orange-100 rounded">
                                              <div class="font-bold text-orange-800">कुल खरीद</div>
                                              <div class="text-xl font-bold text-orange-600">₹${formatCurrency(totalPurchased)}</div>
                                              <div class="text-xs">${supplierPayables.length} transactions</div>
                                            </div>
                                            <div className="text-center p-3 bg-green-100 rounded">
                                              <div className="font-bold text-green-800">कुल भुगतान</div>
                                              <div className="text-xl font-bold text-green-600">₹${formatCurrency(totalPaid)}</div>
                                              <div class="text-xs">${supplierPayments.length} payments</div>
                                            </div>
                                            <div className="text-center p-3 ${totalBalance > 0 ? 'bg-red-100' : 'bg-blue-100'} rounded">
                                              <div class="font-bold ${totalBalance > 0 ? 'text-red-800' : 'text-blue-800'}">बकाया राशि</div>
                                              <div class="text-xl font-bold ${totalBalance > 0 ? 'text-red-600' : 'text-blue-600'}">₹${formatCurrency(totalBalance)}</div>
                                              <div class="text-xs">${totalBalance > 0 ? 'Due' : 'Paid'}</div>
                                            </div>
                                          </div>

                                          <div class="mt-4">
                                            <h4 class="font-semibold mb-2 text-blue-700">📊 संपूर्ण लेन-देन विवरण (Complete Transaction Details)</h4>
                                            ${tableHTML}
                                          </div>

                                          <div class="mt-4 p-3 bg-gray-50 rounded border">
                                            <h5 class="font-semibold text-gray-800 mb-2">सारांश (Summary)</h5>
                                            <div class="text-sm space-y-1">
                                              <div><strong>सुप्लायर (Supplier):</strong> ${supplierName}</div>
                                              <div><strong>कुल खरीद राशि (Total Purchased):</strong> ₹${formatCurrency(totalPurchased)}</div>
                                              <div><strong>कुल भुगतान राशि (Total Paid):</strong> ₹${formatCurrency(totalPaid)}</div>
                                              <div><strong>बचे हुए राशि (Balance):</strong> <span class="${totalBalance > 0 ? 'text-red-600' : 'text-green-600'} font-bold">₹${formatCurrency(totalBalance)}</span></div>
                                            </div>
                                          </div>
                                        </div>
                                      `,
                                      confirmButtonText: 'बंद करें (Close)',
                                      width: '1100px',
                                      heightAuto: false
                                    });
                                  } catch (error) {
                                    console.error('Error fetching complete transaction history:', error);
                                    Swal.fire({
                                      title: 'Error',
                                      text: 'Failed to fetch complete transaction history. Please try again.',
                                      icon: 'error'
                                    });
                                  }
                                }}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="View Complete Transaction History"
                              >
                                <FaHistory />
                              </button>
                              <button
                                onClick={() => handleEdit('supplier', supplier)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Edit Supplier"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete('supplier', supplier._id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete Supplier"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              
              {filterData(payables, 'payables').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {payables.length === 0 ? 'No payables found' : 'No payables match your filters'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'receivables' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold">Receivables Management (किससे पैसा लेना है)</h3>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => setShowReceivableForm(true)}
              >
                <FaPlus /> Add Receivable
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left border-b">Customer</th>
                    <th className="p-3 text-left border-b">Category</th>
                    <th className="p-3 text-left border-b">Amount</th>
                    <th className="p-3 text-left border-b">Received</th>
                    <th className="p-3 text-left border-b">Balance</th>
                    <th className="p-3 text-left border-b">Due Date</th>
                    <th className="p-3 text-left border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((receivable) => (
                    <tr key={receivable._id} className="hover:bg-gray-50">
                      <td className="p-3 border-b">{receivable.customer_name}</td>
                      <td className="p-3 border-b capitalize">{receivable.category || 'customer'}</td>
                      <td className="p-3 border-b">{formatCurrency(receivable.amount)}</td>
                      <td className="p-3 border-b">{formatCurrency(receivable.received_amount || 0)}</td>
                      <td className="p-3 border-b font-semibold text-green-600">
                        {formatCurrency(receivable.amount - (receivable.received_amount || 0))}
                      </td>
                      <td className="p-3 border-b">
                        {receivable.due_date ? new Date(receivable.due_date).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="p-3 border-b">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit('receivable', receivable)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete('receivable', receivable._id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {receivables.length === 0 && (
                <div className="text-center py-8 text-gray-500">No receivables found</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold">Bank Account Balance (बैंक A/C में कितना पैसा है)</h3>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setShowTransactionForm(true)}
              >
                <FaPlus /> Add Transaction
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-800 mb-3">Bank Reconciliation</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Bank Balance:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(getTotalBankBalance())}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-3">
                    Reconcile bank statements regularly to ensure accuracy
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3">Cash Flow Planning</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monthly Cash Reserve:</span>
                    <span className="font-bold text-green-600">{formatCurrency(getTotalBankBalance() * 0.3)}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-3">
                    Maintain 30 days of expenses as reserve
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left border-b">Bank Name</th>
                    <th className="p-3 text-left border-b">Account Number</th>
                    <th className="p-3 text-left border-b">Balance</th>
                    <th className="p-3 text-left border-b">Last Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {bankBalances.map((balance, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-3 border-b">{balance.bank_name}</td>
                      <td className="p-3 border-b">{balance.account_number}</td>
                      <td className="p-3 border-b font-semibold text-blue-600">
                        {formatCurrency(balance.balance)}
                      </td>
                      <td className="p-3 border-b">
                        {balance.last_transaction ? new Date(balance.last_transaction).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bankBalances.length === 0 && (
                <div className="text-center py-8 text-gray-500">No bank accounts found</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'loans' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold">Loan Management (लोन कितना है)</h3>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                onClick={() => setShowLoanForm(true)}
              >
                <FaPlus /> Add Loan
              </button>
            </div>

            {/* Loans Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-purple-800 font-semibold">Total Loans</div>
                <div className="text-2xl font-bold text-purple-600">{loans.length}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-green-800 font-semibold">Total Principal</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(loans.reduce((sum, loan) => sum + (loan.principal_amount || 0), 0))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800 font-semibold">Outstanding Balance</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(loans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0))}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-blue-800 font-semibold">Monthly EMI Total</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(loans.reduce((sum, loan) => sum + (loan.emi_amount || 0), 0))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left border-b">Loan Name</th>
                    <th className="p-3 text-left border-b">Lender</th>
                    <th className="p-3 text-left border-b">Principal</th>
                    <th className="p-3 text-left border-b">Outstanding</th>
                    <th className="p-3 text-left border-b">Interest Rate</th>
                    <th className="p-3 text-left border-b">Monthly EMI</th>
                    <th className="p-3 text-left border-b">Total Interest</th>
                    <th className="p-3 text-left border-b">Total Amount</th>
                    <th className="p-3 text-left border-b">Next Payment</th>
                    <th className="p-3 text-left border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => {
                    // Calculate EMI values using frontend functions if not available from backend
                    const emi = loan.emi_amount || calculateLoanEMI(loan.principal_amount, loan.interest_rate, loan.tenure_months, loan.repayment_frequency);
                    const totalInterest = loan.total_interest_payable || calculateTotalInterest(loan.principal_amount, loan.interest_rate, loan.tenure_months, loan.repayment_frequency);
                    const totalAmount = loan.total_amount_payable || calculateTotalAmount(loan.principal_amount, loan.interest_rate, loan.tenure_months, loan.repayment_frequency);

                    return (
                      <tr key={loan._id} className="hover:bg-gray-50">
                        <td className="p-3 border-b font-medium">{loan.loan_name}</td>
                        <td className="p-3 border-b">{loan.lender_name}</td>
                        <td className="p-3 border-b">{formatCurrency(loan.principal_amount)}</td>
                        <td className="p-3 border-b font-semibold text-purple-600">
                          {formatCurrency(loan.outstanding_balance)}
                        </td>
                        <td className="p-3 border-b">{loan.interest_rate}%</td>
                        <td className="p-3 border-b font-semibold text-blue-600">
                          {formatCurrency(emi)}
                        </td>
                        <td className="p-3 border-b font-semibold text-red-600">
                          {formatCurrency(totalInterest)}
                        </td>
                        <td className="p-3 border-b font-semibold text-green-600">
                          {formatCurrency(totalAmount)}
                        </td>
                        <td className="p-3 border-b">
                          {loan.next_payment_date ? new Date(loan.next_payment_date).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="p-3 border-b">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedLoanId(loan._id);
                                setShowLoanPaymentHistory(true);
                              }}
                              className="p-1 text-purple-600 hover:text-purple-800"
                              title="View Payment History"
                            >
                              <FaHistory />
                            </button>
                            <button
                              onClick={() => {
                                setLoanPaymentForm({
                                  ...loanPaymentForm,
                                  loan_id: loan._id
                                });
                                setSelectedLoanId(loan._id);
                                setShowLoanPaymentForm(true);
                              }}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Record Payment"
                            >
                              <FaMoneyBillWave />
                            </button>
                            <button
                              onClick={() => handleEdit('loan', loan)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete('loan', loan._id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {loans.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No loans found. Use the "Add Loan" button above to add loans and see EMI calculations.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold">Payment Processing (भुगतान प्रोसेसिंग)</h3>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                onClick={() => setShowPaymentForm(true)}
              >
                <FaPlus /> Record Payment
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 className="font-semibold text-red-800 mb-3">Payable Payments</h4>
                <p className="text-sm text-red-600 mb-4">Record payments made to suppliers/vendors</p>
                <div className="text-2xl font-bold text-red-600">
                  {payables.filter(p => (p.paid_amount || 0) > 0).length} payments recorded
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3">Receivable Payments</h4>
                <p className="text-sm text-green-600 mb-4">Record payments received from customers</p>
                <div className="text-2xl font-bold text-green-600">
                  {receivables.filter(r => (r.received_amount || 0) > 0).length} payments recorded
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold mb-4">Quick Payment Actions</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setPaymentForm({...paymentForm, type: 'payable'});
                    setShowPaymentForm(true);
                  }}
                  className="p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <FaMoneyBillWave className="text-2xl mb-2" />
                  <div className="font-medium">Pay Supplier</div>
                  <div className="text-sm opacity-90">Record payable payment</div>
                </button>
                <button
                  onClick={() => {
                    setPaymentForm({...paymentForm, type: 'receivable'});
                    setShowPaymentForm(true);
                  }}
                  className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FaCreditCard className="text-2xl mb-2" />
                  <div className="font-medium">Receive Payment</div>
                  <div className="text-sm opacity-90">Record receivable payment</div>
                </button>
                <button
                  onClick={() => setShowInvoiceForm(true)}
                  className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <FaFileInvoiceDollar className="text-2xl mb-2" />
                  <div className="font-medium">Generate Invoice</div>
                  <div className="text-sm opacity-90">Create customer invoice</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold">Financial Reports & Analytics (रिपोर्ट और विश्लेषण)</h3>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
                onClick={generateReports}
              >
                <FaCalculator /> Generate Reports
              </button>
            </div>

            {showReports && (
              <div className="space-y-6">
                {/* Financial Ratios */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-lg font-semibold mb-4">Financial Ratios & KPIs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{reportsData.financialRatios.currentRatio}</div>
                      <div className="text-sm text-gray-600">Current Ratio</div>
                      <div className="text-xs text-gray-500 mt-1">Current Assets / Current Liabilities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{reportsData.financialRatios.debtToEquityRatio}%</div>
                      <div className="text-sm text-gray-600">Debt-to-Equity Ratio</div>
                      <div className="text-xs text-gray-500 mt-1">Total Loans / Owner's Equity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{reportsData.financialRatios.cashReserveRatio}%</div>
                      <div className="text-sm text-gray-600">Cash Reserve Ratio</div>
                      <div className="text-xs text-gray-500 mt-1">Bank Balance / Monthly Expenses</div>
                    </div>
                  </div>
                </div>

                {/* Cash Flow Analysis */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-lg font-semibold mb-4">Cash Flow Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(reportsData.cashFlow.totalReceivables)}</div>
                      <div className="text-sm text-green-800">Total Receivables</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded">
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(reportsData.cashFlow.totalPayables)}</div>
                      <div className="text-sm text-red-800">Total Payables</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(reportsData.cashFlow.netCashFlow)}</div>
                      <div className="text-sm text-blue-800">Net Cash Flow</div>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded">
                      <div className="text-2xl font-bold text-indigo-600">{formatCurrency(reportsData.cashFlow.bankBalance)}</div>
                      <div className="text-sm text-indigo-800">Bank Balance</div>
                    </div>
                  </div>
                </div>

                {/* Aging Reports */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payables Aging */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h4 className="text-lg font-semibold mb-4">Payables Aging Report</h4>
                    <div className="space-y-3">
                      {Object.entries(reportsData.agingPayables).map(([period, items]) => (
                        <div key={period} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">{period === 'current' ? 'Current' : period + ' days'}</span>
                          <div className="text-right">
                            <div className="font-bold text-red-600">{items.length} items</div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(items.reduce((sum, item) => sum + (item.amount - (item.paid_amount || 0)), 0))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Receivables Aging */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h4 className="text-lg font-semibold mb-4">Receivables Aging Report</h4>
                    <div className="space-y-3">
                      {Object.entries(reportsData.agingReceivables).map(([period, items]) => (
                        <div key={period} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">{period === 'current' ? 'Current' : period + ' days'}</span>
                          <div className="text-right">
                            <div className="font-bold text-green-600">{items.length} items</div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(items.reduce((sum, item) => sum + (item.amount - (item.received_amount || 0)), 0))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Monthly Income Report */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Monthly Income Report (मासिक आय रिपोर्ट)</h4>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Year:</label>
                      <select
                        value={reportYear}
                        onChange={(e) => setReportYear(parseInt(e.target.value))}
                        className="px-3 py-1 border rounded text-sm"
                      >
                        {Array.from({ length: 5 }, (_, i) => reportYear - 2 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-3 text-left border-b">Month</th>
                          <th className="p-3 text-left border-b">Total Income</th>
                          <th className="p-3 text-left border-b">Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyIncomeReport.map((item) => (
                          <tr key={item.month} className="hover:bg-gray-50">
                            <td className="p-3 border-b font-medium">{item.month_name}</td>
                            <td className="p-3 border-b font-semibold text-green-600">
                              {formatCurrency(item.total_income)}
                            </td>
                            <td className="p-3 border-b text-center">{item.transaction_count}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-bold">
                          <td className="p-3 border-t">Total</td>
                          <td className="p-3 border-t text-green-600">
                            {formatCurrency(monthlyIncomeReport.reduce((sum, item) => sum + item.total_income, 0))}
                          </td>
                          <td className="p-3 border-t text-center">
                            {monthlyIncomeReport.reduce((sum, item) => sum + item.transaction_count, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {monthlyIncomeReport.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No income data found for {reportYear}. Add income records to see monthly reports.
                    </div>
                  )}
                </div>

                {/* Export Options */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-lg font-semibold mb-4">Export Reports</h4>
                  <div className="flex gap-4">
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => exportToCSV(payables, 'payables_report.csv')}
                    >
                      <FaFileInvoiceDollar /> Export Payables
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      onClick={() => exportToCSV(receivables, 'receivables_report.csv')}
                    >
                      <FaFileInvoiceDollar /> Export Receivables
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                      onClick={() => exportToCSV(loans, 'loans_report.csv')}
                    >
                      <FaFileInvoiceDollar /> Export Loans
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!showReports && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FaCalculator className="text-6xl text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-600 mb-2">Generate Financial Reports</h4>
                <p className="text-gray-500 mb-6">Click the "Generate Reports" button to view detailed financial analytics</p>
                <button
                  className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium"
                  onClick={generateReports}
                >
                  Generate Reports
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Payable Form Modal */}
      {showPayableForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Payable' : 'Add New Payable'}
            </h3>
            <form onSubmit={handlePayableSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Person/Supplier Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded"
                    value={payableForm.person_name}
                    onChange={(e) => setPayableForm({...payableForm, person_name: e.target.value})}
                    placeholder="e.g., Feed Supplier, Vet Doctor"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    className="w-full p-3 border rounded"
                    value={payableForm.category}
                    onChange={(e) => setPayableForm({...payableForm, category: e.target.value})}
                  >
                    <option value="supplier">Supplier Payment</option>
                    <option value="investor">Investor Payout</option>
                    <option value="loan">Loan Repayment</option>
                    <option value="operational">Operational Expense</option>
                    <option value="tax">Tax Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-3 border rounded"
                    value={payableForm.amount}
                    onChange={(e) => setPayableForm({...payableForm, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-3 border rounded"
                    value={payableForm.description}
                    onChange={(e) => setPayableForm({...payableForm, description: e.target.value})}
                    rows="3"
                    placeholder="Details about this payable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full p-3 border rounded"
                    value={payableForm.due_date}
                    onChange={(e) => setPayableForm({...payableForm, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                  onClick={() => setShowPayableForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  {editingItem ? 'Update' : 'Add'} Payable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receivable Form Modal */}
      {showReceivableForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Receivable' : 'Add New Receivable'}
            </h3>
            <form onSubmit={handleReceivableSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded"
                    value={receivableForm.customer_name}
                    onChange={(e) => setReceivableForm({...receivableForm, customer_name: e.target.value})}
                    placeholder="e.g., Milk Customer, Shop Owner"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    className="w-full p-3 border rounded"
                    value={receivableForm.category}
                    onChange={(e) => setReceivableForm({...receivableForm, category: e.target.value})}
                  >
                    <option value="customer">Customer Payment</option>
                    <option value="advance">Advance Payment</option>
                    <option value="subsidy">Government Subsidy</option>
                    <option value="insurance">Insurance Claim</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-3 border rounded"
                    value={receivableForm.amount}
                    onChange={(e) => setReceivableForm({...receivableForm, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-3 border rounded"
                    value={receivableForm.description}
                    onChange={(e) => setReceivableForm({...receivableForm, description: e.target.value})}
                    rows="3"
                    placeholder="Details about this receivable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full p-3 border rounded"
                    value={receivableForm.due_date}
                    onChange={(e) => setReceivableForm({...receivableForm, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                  onClick={() => setShowReceivableForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  {editingItem ? 'Update' : 'Add'} Receivable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Bank Transaction</h3>
            <form onSubmit={handleTransactionSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Transaction Type</label>
                  <select
                    className="w-full p-3 border rounded"
                    value={transactionForm.type}
                    onChange={(e) => setTransactionForm({...transactionForm, type: e.target.value})}
                    required
                  >
                    <option value="deposit">Deposit (जमा)</option>
                    <option value="withdrawal">Withdrawal (निकासी)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-3 border rounded"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bank Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded"
                    value={transactionForm.bank_name}
                    onChange={(e) => setTransactionForm({...transactionForm, bank_name: e.target.value})}
                    placeholder="e.g., SBI, HDFC"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Number</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded"
                    value={transactionForm.account_number}
                    onChange={(e) => setTransactionForm({...transactionForm, account_number: e.target.value})}
                    placeholder="Bank account number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-3 border rounded"
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                    rows="3"
                    placeholder="Transaction details"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full p-3 border rounded"
                    value={transactionForm.date}
                    onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                  onClick={() => setShowTransactionForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Form Modal */}
      {showLoanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Loan' : 'Add New Loan'}
            </h3>
            <form onSubmit={handleLoanSubmit}>
          <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Loan Name *</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded"
                    value={loanForm.loan_name}
                    onChange={(e) => setLoanForm({...loanForm, loan_name: e.target.value})}
                    placeholder="e.g., Cow Purchase Loan"
                    required
                    minLength="2"
                    maxLength="100"
                  />
                  {loanForm.loan_name && loanForm.loan_name.length < 2 && (
                    <div className="text-red-500 text-xs mt-1">Loan name must be at least 2 characters</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lender Name *</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded"
                    value={loanForm.lender_name}
                    onChange={(e) => setLoanForm({...loanForm, lender_name: e.target.value})}
                    placeholder="e.g., Bank, Cooperative"
                    required
                    minLength="2"
                    maxLength="100"
                  />
                  {loanForm.lender_name && loanForm.lender_name.length < 2 && (
                    <div className="text-red-500 text-xs mt-1">Lender name must be at least 2 characters</div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Loan Type *</label>
                    <select
                      className="w-full p-3 border rounded"
                      value={loanForm.loan_type}
                      onChange={(e) => setLoanForm({...loanForm, loan_type: e.target.value})}
                      required
                    >
                      <option value="">Select Loan Type</option>
                      <option value="business">Business</option>
                      <option value="agricultural">Agricultural</option>
                      <option value="equipment">Equipment</option>
                      <option value="working_capital">Working Capital</option>
                      <option value="personal">Personal</option>
                    </select>
                    {!loanForm.loan_type && (
                      <div className="text-red-500 text-xs mt-1">Please select a loan type</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Repayment Frequency</label>
                    <select
                      className="w-full p-3 border rounded"
                      value={loanForm.repayment_frequency}
                      onChange={(e) => setLoanForm({...loanForm, repayment_frequency: e.target.value})}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="half_yearly">Half Yearly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Principal Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-3 border rounded"
                      value={loanForm.principal_amount}
                      onChange={(e) => setLoanForm({...loanForm, principal_amount: e.target.value})}
                      placeholder="10000.00"
                      required
                      min="1000"
                      max="10000000"
                    />
                    {loanForm.principal_amount && parseFloat(loanForm.principal_amount) < 1000 && (
                      <div className="text-red-500 text-xs mt-1">Principal must be at least ₹1,000</div>
                    )}
                    {loanForm.principal_amount && parseFloat(loanForm.principal_amount) > 10000000 && (
                      <div className="text-red-500 text-xs mt-1">Principal cannot exceed ₹10,000,000</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Outstanding Balance (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-3 border rounded"
                      value={loanForm.outstanding_balance}
                      onChange={(e) => setLoanForm({...loanForm, outstanding_balance: e.target.value})}
                      placeholder="0.00"
                      max={loanForm.principal_amount}
                    />
                    {loanForm.outstanding_balance && parseFloat(loanForm.outstanding_balance) > parseFloat(loanForm.principal_amount || 0) && (
                      <div className="text-red-500 text-xs mt-1">Outstanding balance cannot exceed principal amount</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Interest Rate (%) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-3 border rounded"
                      value={loanForm.interest_rate}
                      onChange={(e) => setLoanForm({...loanForm, interest_rate: e.target.value})}
                      placeholder="e.g., 12.5"
                      required
                      min="0"
                      max="50"
                    />
                    {loanForm.interest_rate && parseFloat(loanForm.interest_rate) < 0 && (
                      <div className="text-red-500 text-xs mt-1">Interest rate cannot be negative</div>
                    )}
                    {loanForm.interest_rate && parseFloat(loanForm.interest_rate) > 50 && (
                      <div className="text-red-500 text-xs mt-1">Interest rate cannot exceed 50%</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Term (Months) *</label>
                    <input
                      type="number"
                      className="w-full p-3 border rounded"
                      value={loanForm.tenure_months}
                      onChange={(e) => setLoanForm({...loanForm, tenure_months: e.target.value})}
                      placeholder="e.g., 60"
                      required
                      min="1"
                      max="360"
                    />
                    {loanForm.tenure_months && parseInt(loanForm.tenure_months) < 1 && (
                      <div className="text-red-500 text-xs mt-1">Term must be at least 1 month</div>
                    )}
                    {loanForm.tenure_months && parseInt(loanForm.tenure_months) > 360 && (
                      <div className="text-red-500 text-xs mt-1">Term cannot exceed 360 months (30 years)</div>
                    )}
                  </div>
                </div>

                {/* EMI Calculation Display */}
                {(loanForm.principal_amount && loanForm.interest_rate && loanForm.tenure_months) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                    <h4 className="text-md font-semibold mb-3 text-blue-800">EMI Calculation Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-lg text-green-600">
                          ₹{formatCurrency(calculateLoanEMI(loanForm.principal_amount, loanForm.interest_rate, loanForm.tenure_months, loanForm.repayment_frequency))}
                        </div>
                        <div className="text-gray-600">Monthly EMI</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-red-600">
                          ₹{formatCurrency(calculateTotalInterest(loanForm.principal_amount, loanForm.interest_rate, loanForm.tenure_months, loanForm.repayment_frequency))}
                        </div>
                        <div className="text-gray-600">Total Interest</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-purple-600">
                          ₹{formatCurrency(calculateTotalAmount(loanForm.principal_amount, loanForm.interest_rate, loanForm.tenure_months, loanForm.repayment_frequency))}
                        </div>
                        <div className="text-gray-600">Total Amount</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-3 p-2 bg-white rounded">
                      <strong>Note:</strong> EMI is calculated using the standard reducing balance method. Actual EMI may vary based on bank calculation method.
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Loan Date *</label>
                  <input
                    type="date"
                    className="w-full p-3 border rounded"
                    value={loanForm.loan_date}
                    onChange={(e) => setLoanForm({...loanForm, loan_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Maturity Date</label>
                  <input
                    type="date"
                    className="w-full p-3 border rounded"
                    value={loanForm.maturity_date}
                    onChange={(e) => setLoanForm({...loanForm, maturity_date: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Bank Name</label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded"
                      value={loanForm.bank_name}
                      onChange={(e) => setLoanForm({...loanForm, bank_name: e.target.value})}
                      placeholder="Bank name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number</label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded"
                      value={loanForm.loan_account_number}
                      onChange={(e) => setLoanForm({...loanForm, loan_account_number: e.target.value})}
                      placeholder="Loan account number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Branch Name</label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded"
                      value={loanForm.branch_name}
                      onChange={(e) => setLoanForm({...loanForm, branch_name: e.target.value})}
                      placeholder="Branch name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Next Payment Date</label>
                    <input
                      type="date"
                      className="w-full p-3 border rounded"
                      value={loanForm.next_payment_date}
                      onChange={(e) => setLoanForm({...loanForm, next_payment_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Collateral Details</label>
                  <textarea
                    className="w-full p-3 border rounded"
                    value={loanForm.collateral_details}
                    onChange={(e) => setLoanForm({...loanForm, collateral_details: e.target.value})}
                    rows="2"
                    placeholder="Collateral information"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    className="w-full p-3 border rounded"
                    value={loanForm.notes}
                    onChange={(e) => setLoanForm({...loanForm, notes: e.target.value})}
                    rows="2"
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                  onClick={() => setShowLoanForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  {editingItem ? 'Update' : 'Add'} Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
            <form onSubmit={handlePaymentSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Type</label>
                  <select
                    className="w-full p-3 border rounded"
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value, person_id: ''})}
                    required
                  >
                    <option value="payable">Pay Supplier (Payable Payment)</option>
                    <option value="receivable">Receive from Customer (Receivable Payment)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {paymentForm.type === 'payable' ? 'Supplier' : 'Customer'}
                  </label>
                  <select
                    className="w-full p-3 border rounded"
                    value={paymentForm.person_id}
                    onChange={(e) => setPaymentForm({...paymentForm, person_id: e.target.value})}
                    required
                  >
                    <option value="">
                      Select {paymentForm.type === 'payable' ? 'Supplier' : 'Customer'}
                    </option>
                    {(paymentForm.type === 'payable' ? payables : receivables).map((person) => (
                      <option key={person._id} value={person._id}>
                        {person.person_name || person.customer_name} - Balance: {formatCurrency(
                          person.amount - (person.paid_amount || person.received_amount || 0)
                        )}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-3 border rounded"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Date</label>
                  <input
                    type="date"
                    className="w-full p-3 border rounded"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    className="w-full p-3 border rounded"
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="upi">UPI</option>
                    <option value="use_dale">Use Dale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-3 border rounded"
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                    rows="3"
                    placeholder="Payment details"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                  onClick={() => setShowPaymentForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>
            <form onSubmit={handleSupplierSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                    placeholder="e.g., ABC Feed Suppliers"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded"
                    value={supplierForm.contact_person}
                    onChange={(e) => setSupplierForm({...supplierForm, contact_person: e.target.value})}
                    placeholder="e.g., Mr. Sharma"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full p-3 border rounded"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full p-3 border rounded"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    className="w-full p-3 border rounded"
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                    rows="3"
                    placeholder="Supplier address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Supplier Type</label>
                    <select
                      className="w-full p-3 border rounded"
                      value={supplierForm.vendor_type}
                      onChange={(e) => setSupplierForm({...supplierForm, vendor_type: e.target.value})}
                    >
                      <option value="feed_supplier">Feed Supplier</option>
                      <option value="cow_purchase">Cow Purchase (गाय खरीद)</option>
                      <option value="medicine_supplier">Medicine Supplier</option>
                      <option value="veterinary_services">Veterinary Services</option>
                      <option value="equipment_supplier">Equipment Supplier</option>
                      <option value="general_supplier">General Supplier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Terms</label>
                    <select
                      className="w-full p-3 border rounded"
                      value={supplierForm.payment_terms}
                      onChange={(e) => setSupplierForm({...supplierForm, payment_terms: e.target.value})}
                    >
                      <option value="immediate">Immediate</option>
                      <option value="7_days">7 Days</option>
                      <option value="15_days">15 Days</option>
                      <option value="30_days">30 Days</option>
                      <option value="45_days">45 Days</option>
                      <option value="60_days">60 Days</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-3 border rounded"
                    value={supplierForm.credit_limit}
                    onChange={(e) => setSupplierForm({...supplierForm, credit_limit: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GST Number</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded"
                    value={supplierForm.gst_number}
                    onChange={(e) => setSupplierForm({...supplierForm, gst_number: e.target.value})}
                    placeholder="GST number if applicable"
                  />
                </div>

                {/* Monthly Payment Plan - Show only for Cow Purchase suppliers */}
                {supplierForm.vendor_type === 'cow_purchase' && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-md font-semibold mb-3 text-blue-600">Monthly Payment Plan (मासिक भुगतान योजना)</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Monthly Installment (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full p-3 border rounded"
                          value={supplierForm.monthly_installment}
                          onChange={(e) => setSupplierForm({...supplierForm, monthly_installment: e.target.value})}
                          placeholder="e.g., 5000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Number of Months</label>
                        <input
                          type="number"
                          className="w-full p-3 border rounded"
                          value={supplierForm.installment_months}
                          onChange={(e) => setSupplierForm({...supplierForm, installment_months: e.target.value})}
                          placeholder="e.g., 12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">First Payment Date</label>
                        <input
                          type="date"
                          className="w-full p-3 border rounded"
                          value={supplierForm.first_payment_date}
                          onChange={(e) => setSupplierForm({...supplierForm, first_payment_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Payment Frequency</label>
                        <select
                          className="w-full p-3 border rounded"
                          value={supplierForm.payment_frequency || 'monthly'}
                          onChange={(e) => setSupplierForm({...supplierForm, payment_frequency: e.target.value})}
                        >
                          <option value="monthly">Monthly (मासिक)</option>
                          <option value="quarterly">Quarterly (त्रैमासिक)</option>
                        </select>
                      </div>
                    </div>

                    {(supplierForm.monthly_installment && supplierForm.installment_months) && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                        <div className="text-sm text-green-800">
                          <strong>Payment Plan Summary:</strong><br/>
                          Monthly Amount: ₹{parseFloat(supplierForm.monthly_installment).toLocaleString('en-IN')}<br/>
                          Total Months: {supplierForm.installment_months}<br/>
                          Total Amount: ₹{(parseFloat(supplierForm.monthly_installment) * parseInt(supplierForm.installment_months)).toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                  onClick={() => setShowSupplierForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  {editingItem ? 'Update' : 'Add'} Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Form Modal */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Record Purchase from Supplier</h3>
            <form onSubmit={handlePurchaseSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Supplier *</label>
                    <select
                      className="w-full p-3 border rounded"
                      value={purchaseForm.supplier_id}
                      onChange={(e) => {
                        const selectedSupplier = suppliers.find(s => s._id === e.target.value);
                        setPurchaseForm({
                          ...purchaseForm,
                          supplier_id: e.target.value,
                          supplier_name: selectedSupplier?.name || ''
                        });
                      }}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name} ({supplier.vendor_type?.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Purchase Date *</label>
                    <input
                      type="date"
                      className="w-full p-3 border rounded"
                      value={purchaseForm.purchase_date}
                      onChange={(e) => setPurchaseForm({...purchaseForm, purchase_date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Purchase Items *</label>
                    <button
                      type="button"
                      onClick={addPurchaseItem}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {purchaseForm.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded">
                        <div className="col-span-3">
                          <select
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            value={item.category}
                            onChange={(e) => updatePurchaseItem(index, 'category', e.target.value)}
                          >
                            <option value="feed">Feed</option>
                            <option value="cow_purchase">Cow Purchase (गाय खरीद)</option>
                            <option value="medicine">Medicine</option>
                            <option value="veterinary">Veterinary</option>
                            <option value="equipment">Equipment</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Item description"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            value={item.description}
                            onChange={(e) => updatePurchaseItem(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            value={item.quantity}
                            onChange={(e) => updatePurchaseItem(index, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Rate"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            value={item.rate}
                            onChange={(e) => updatePurchaseItem(index, 'rate', e.target.value)}
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-100 text-xs"
                            value={item.amount}
                            readOnly
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-right mt-4">
                    <div className="text-lg font-bold">
                      Total: {formatCurrency(purchaseForm.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Status</label>
                    <select
                      className="w-full p-3 border rounded"
                      value={purchaseForm.payment_status}
                      onChange={(e) => setPurchaseForm({...purchaseForm, payment_status: e.target.value})}
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="partial">Partial Payment</option>
                      <option value="paid">Fully Paid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Method</label>
                    <select
                      className="w-full p-3 border rounded"
                      value={purchaseForm.payment_method}
                      onChange={(e) => setPurchaseForm({...purchaseForm, payment_method: e.target.value})}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      className="w-full p-3 border rounded"
                      value={purchaseForm.due_date}
                      onChange={(e) => setPurchaseForm({...purchaseForm, due_date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    className="w-full p-3 border rounded"
                    value={purchaseForm.notes}
                    onChange={(e) => setPurchaseForm({...purchaseForm, notes: e.target.value})}
                    rows="3"
                    placeholder="Additional notes about this purchase"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                  onClick={() => setShowPurchaseForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Record Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Generate Invoice</h3>
            <form onSubmit={handleInvoiceSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Customer Name</label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded"
                      value={invoiceForm.customer_name}
                      onChange={(e) => setInvoiceForm({...invoiceForm, customer_name: e.target.value})}
                      placeholder="Customer name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Invoice Date</label>
                    <input
                      type="date"
                      className="w-full p-3 border rounded"
                      value={invoiceForm.invoice_date}
                      onChange={(e) => setInvoiceForm({...invoiceForm, invoice_date: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full p-3 border rounded"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({...invoiceForm, due_date: e.target.value})}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Items</label>
                    <button
                      type="button"
                      onClick={addInvoiceItem}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {invoiceForm.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded">
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Item description"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Rate"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            value={item.rate}
                            onChange={(e) => updateInvoiceItem(index, 'rate', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-100"
                            value={item.amount}
                            readOnly
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          {invoiceForm.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updatedItems = invoiceForm.items.filter((_, i) => i !== index);
                                setInvoiceForm({...invoiceForm, items: updatedItems});
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-right mt-4">
                    <div className="text-lg font-bold">
                      Total: {formatCurrency(invoiceForm.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                  onClick={() => setShowInvoiceForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Payment Form Modal */}
      {showLoanPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Record Loan Payment</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleLoanPaymentSubmit(loanPaymentForm, selectedLoanId);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-3 border rounded"
                    value={loanPaymentForm.payment_amount}
                    onChange={(e) => setLoanPaymentForm({...loanPaymentForm, payment_amount: e.target.value})}
                    placeholder="1000.00"
                    required
                    min="1"
                    max="1000000"
                  />
                  {loanPaymentForm.payment_amount && parseFloat(loanPaymentForm.payment_amount) < 1 && (
                    <div className="text-red-500 text-xs mt-1">Payment amount must be at least ₹1</div>
                  )}
                  {loanPaymentForm.payment_amount && parseFloat(loanPaymentForm.payment_amount) > 1000000 && (
                    <div className="text-red-500 text-xs mt-1">Payment amount cannot exceed ₹1,000,000</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Date *</label>
                  <input
                    type="date"
                    className="w-full p-3 border rounded"
                    value={loanPaymentForm.payment_date}
                    onChange={(e) => setLoanPaymentForm({...loanPaymentForm, payment_date: e.target.value})}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {loanPaymentForm.payment_date && new Date(loanPaymentForm.payment_date) > new Date() && (
                    <div className="text-red-500 text-xs mt-1">Payment date cannot be in the future</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method *</label>
                  <select
                    className="w-full p-3 border rounded"
                    value={loanPaymentForm.payment_method}
                    onChange={(e) => setLoanPaymentForm({...loanPaymentForm, payment_method: e.target.value})}
                    required
                  >
                    <option value="">Select Payment Method</option>
                    <option value="cash">Cash (नकद)</option>
                    <option value="bank_transfer">Bank Transfer (बैंक ट्रांसफर)</option>
                    <option value="cheque">Cheque (चेक)</option>
                    <option value="upi">UPI (यूपीआई)</option>
                  </select>
                  {!loanPaymentForm.payment_method && (
                    <div className="text-red-500 text-xs mt-1">Please select a payment method</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reference/Cheque Number</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded"
                    value={loanPaymentForm.payment_reference}
                    onChange={(e) => setLoanPaymentForm({...loanPaymentForm, payment_reference: e.target.value})}
                    placeholder="Cheque number or transaction ID"
                    maxLength="50"
                  />
                </div>
                {(loanPaymentForm.payment_method === 'bank_transfer' || loanPaymentForm.payment_method === 'cheque') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Bank Name *</label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded"
                      value={loanPaymentForm.bank_name}
                      onChange={(e) => setLoanPaymentForm({...loanPaymentForm, bank_name: e.target.value})}
                      placeholder="e.g., SBI, HDFC"
                      required
                      minLength="2"
                      maxLength="100"
                    />
                    {loanPaymentForm.bank_name && loanPaymentForm.bank_name.length < 2 && (
                      <div className="text-red-500 text-xs mt-1">Bank name must be at least 2 characters</div>
                    )}
                  </div>
                )}
                {(loanPaymentForm.payment_method === 'bank_transfer' || loanPaymentForm.payment_method === 'cheque') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number *</label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded"
                      value={loanPaymentForm.account_number}
                      onChange={(e) => setLoanPaymentForm({...loanPaymentForm, account_number: e.target.value})}
                      placeholder="Account number"
                      required
                      pattern="[0-9]{10,18}"
                      title="Account number must be 10-18 digits"
                    />
                    {loanPaymentForm.account_number && !/^[0-9]{10,18}$/.test(loanPaymentForm.account_number) && (
                      <div className="text-red-500 text-xs mt-1">Account number must be 10-18 digits</div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea
                    className="w-full p-3 border rounded"
                    value={loanPaymentForm.description}
                    onChange={(e) => setLoanPaymentForm({...loanPaymentForm, description: e.target.value})}
                    rows="3"
                    placeholder="e.g., Monthly EMI payment for January 2025"
                    required
                    minLength="5"
                    maxLength="200"
                  />
                  {loanPaymentForm.description && loanPaymentForm.description.length < 5 && (
                    <div className="text-red-500 text-xs mt-1">Description must be at least 5 characters</div>
                  )}
                  {loanPaymentForm.description && loanPaymentForm.description.length > 200 && (
                    <div className="text-red-500 text-xs mt-1">Description cannot exceed 200 characters</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    className="w-full p-3 border rounded"
                    value={loanPaymentForm.notes}
                    onChange={(e) => setLoanPaymentForm({...loanPaymentForm, notes: e.target.value})}
                    rows="2"
                    placeholder="Additional notes (optional)"
                    maxLength="100"
                  />
                  {loanPaymentForm.notes && loanPaymentForm.notes.length > 100 && (
                    <div className="text-red-500 text-xs mt-1">Notes cannot exceed 100 characters</div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  className="px-6 py-2 border rounded hover:bg-gray-50"
                  onClick={() => setShowLoanPaymentForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Payment History Modal */}
      {showLoanPaymentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Loan Payment History</h3>

            {/* Loan Summary */}
            {selectedLoanId && loans.find(loan => loan._id === selectedLoanId) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-md font-semibold mb-3 text-blue-800">
                  {loans.find(loan => loan._id === selectedLoanId)?.loan_name || 'Loan Details'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Loan Amount:</span>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(loans.find(loan => loan._id === selectedLoanId)?.principal_amount || 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Outstanding Balance:</span>
                    <div className="font-semibold text-red-600">
                      {formatCurrency(loans.find(loan => loan._id === selectedLoanId)?.outstanding_balance || 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Monthly EMI:</span>
                    <div className="font-semibold text-blue-600">
                      {formatCurrency(loans.find(loan => loan._id === selectedLoanId)?.emi_amount ||
                        calculateLoanEMI(loans.find(loan => loan._id === selectedLoanId)?.principal_amount,
                                        loans.find(loan => loan._id === selectedLoanId)?.interest_rate,
                                        loans.find(loan => loan._id === selectedLoanId)?.tenure_months,
                                        loans.find(loan => loan._id === selectedLoanId)?.repayment_frequency) || 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Rate:</span>
                    <div className="font-semibold text-purple-600">
                      {loans.find(loan => loan._id === selectedLoanId)?.interest_rate || 0}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left border-b">Date</th>
                    <th className="p-3 text-left border-b">Amount</th>
                    <th className="p-3 text-left border-b">Method</th>
                    <th className="p-3 text-left border-b">Reference</th>
                    <th className="p-3 text-left border-b">Description</th>
                    <th className="p-3 text-left border-b">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loanPayments.filter(payment => payment.loan_id === selectedLoanId).map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="p-3 border-b">
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="p-3 border-b font-semibold text-green-600">
                        {formatCurrency(payment.payment_amount)}
                      </td>
                      <td className="p-3 border-b capitalize">
                        {payment.payment_method?.replace('_', ' ') || 'N/A'}
                      </td>
                      <td className="p-3 border-b">
                        {payment.payment_reference || 'N/A'}
                      </td>
                      <td className="p-3 border-b text-sm">
                        {payment.description || 'N/A'}
                      </td>
                      <td className="p-3 border-b text-sm">
                        {payment.notes || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {loanPayments.filter(payment => payment.loan_id === selectedLoanId).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No payments recorded for this loan yet. Click "Record Payment" to add payments.
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                className="px-6 py-2 border rounded hover:bg-gray-50"
                onClick={() => setShowLoanPaymentHistory(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialManagement;
