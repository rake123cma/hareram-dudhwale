import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaSave, FaTimes, FaPlus } from 'react-icons/fa';

const ExpensesManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterForm, setFilterForm] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    category: ''
  });

  const expenseCategories = [
    { value: 'feed', label: 'Feed & Nutrition' },
    { value: 'medicine', label: 'Medicine' },
    { value: 'vet', label: 'Veterinary & Healthcare' },
    { value: 'labour', label: 'Labor' },
    { value: 'electricity', label: 'Utilities' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'transport', label: 'Transportation' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'misc', label: 'Miscellaneous' }
  ];

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, filterForm]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      const response = await axios.get('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data);
      setLoading(false);
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      setError('Failed to fetch expenses: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const startDate = new Date(filterForm.startDate);
      const endDate = new Date(filterForm.endDate);

      const dateMatch = expenseDate >= startDate && expenseDate <= endDate;
      const categoryMatch = !filterForm.category || expense.category === filterForm.category;

      return dateMatch && categoryMatch;
    });

    setFilteredExpenses(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = { ...formData, amount: parseFloat(formData.amount) };

      if (editingExpense) {
        await axios.put(`/api/expenses/${editingExpense._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
          icon: 'success',
          title: 'Expense Updated!',
          text: 'Expense has been updated successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await axios.post('/api/expenses', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
          icon: 'success',
          title: 'Expense Added!',
          text: 'New expense has been added successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      }

      setShowForm(false);
      setEditingExpense(null);
      resetForm();
      fetchExpenses();
    } catch (err) {
      setError('Failed to save expense');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save expense'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      date: new Date(expense.date).toISOString().split('T')[0],
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description || ''
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
        await axios.delete(`/api/expenses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Expense has been deleted.',
          timer: 2000,
          showConfirmButton: false
        });
        fetchExpenses();
      } catch (err) {
        setError('Failed to delete expense');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete expense'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      amount: '',
      description: ''
    });
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

  const getCategoryLabel = (value) => {
    const category = expenseCategories.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  const getCategorySummary = () => {
    const summary = {};
    filteredExpenses.forEach(expense => {
      const label = getCategoryLabel(expense.category);
      summary[label] = (summary[label] || 0) + expense.amount;
    });
    return summary;
  };

  const categorySummary = getCategorySummary();
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading && expenses.length === 0) return (
    <div className="flex justify-center items-center min-h-screen text-white text-xl">
      <div className="animate-pulse">Loading expenses...</div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-slate-800 font-inter relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-400 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-cyan-400 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-5"></div>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Expenses Management</h2>
          <button
            className="bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 hover:-translate-y-1 hover:shadow-xl border border-white/10"
            onClick={() => {
              setEditingExpense(null);
              resetForm();
              setShowForm(true);
            }}
          >
            Add New Expense
          </button>
        </div>

      {error && <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl mb-6 shadow-lg border border-red-400/20">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="mt-0 text-white mb-8 text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block font-semibold text-blue-100 text-sm">Date:</label>
                  <input
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="block font-semibold text-blue-100 text-sm">Category:</label>
                  <select
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="" className="bg-gray-800">Select Category</option>
                    {expenseCategories.map(category => (
                      <option key={category.value} value={category.value} className="bg-gray-800">{category.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block font-semibold text-blue-100 text-sm">Amount (₹):</label>
                  <input
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="block font-semibold text-blue-100 text-sm">Description:</label>
                  <input
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex gap-4 justify-end pt-6 border-t border-white/10">
                <button className="h-12 px-6 bg-gray-600/80 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 hover:-translate-y-1 hover:shadow-lg border border-white/10" type="button" onClick={() => setShowForm(false)}>
                  <FaTimes />
                  Cancel
                </button>
                <button className="h-12 px-6 bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 hover:-translate-y-1 hover:shadow-lg border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed" type="submit" disabled={loading}>
                  {loading ? <FaSave /> : (editingExpense ? <FaSave /> : <FaPlus />)}
                  {loading ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Add Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 shadow-xl">
        <div className="relative z-10">
          <h3 className="m-0 mb-6 text-white text-xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Filter Expenses</h3>
          <div className="flex gap-6 items-end flex-wrap">
            <div className="flex flex-col min-w-[140px]">
              <label className="mb-2 font-semibold text-blue-100 text-sm">Start Date:</label>
              <input
                className="p-3 px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                type="date"
                value={filterForm.startDate}
                onChange={(e) => setFilterForm({...filterForm, startDate: e.target.value})}
              />
            </div>
            <div className="flex flex-col min-w-[140px]">
              <label className="mb-2 font-semibold text-blue-100 text-sm">End Date:</label>
              <input
                className="p-3 px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                type="date"
                value={filterForm.endDate}
                onChange={(e) => setFilterForm({...filterForm, endDate: e.target.value})}
              />
            </div>
            <div className="flex flex-col min-w-[140px]">
              <label className="mb-2 font-semibold text-blue-100 text-sm">Category:</label>
              <select
                className="p-3 px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                value={filterForm.category}
                onChange={(e) => setFilterForm({...filterForm, category: e.target.value})}
              >
                <option value="" className="bg-gray-800">All Categories</option>
                {expenseCategories.map(category => (
                  <option key={category.value} value={category.value} className="bg-gray-800">{category.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-xl border border-red-500/30 p-6 rounded-2xl text-center shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
          <h3 className="m-0 mb-3 text-red-300 text-sm font-bold uppercase tracking-wide">Total Expenses</h3>
          <p className="m-0 text-3xl font-black text-white">{formatCurrency(totalExpenses)}</p>
        </div>
        {Object.entries(categorySummary).map(([category, amount]) => (
          <div key={category} className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 backdrop-blur-xl border border-amber-500/30 p-6 rounded-2xl text-center shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
            <h3 className="m-0 mb-3 text-amber-300 text-sm font-bold uppercase tracking-wide">{category}</h3>
            <p className="m-0 text-3xl font-black text-white">{formatCurrency(amount)}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl overflow-x-auto border border-white/10">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-4 text-left border-b border-white/10 bg-gradient-to-r from-blue-500/20 to-green-500/20 font-bold text-white text-sm uppercase tracking-wider">Date</th>
              <th className="p-4 text-left border-b border-white/10 bg-gradient-to-r from-blue-500/20 to-green-500/20 font-bold text-white text-sm uppercase tracking-wider">Category</th>
              <th className="p-4 text-left border-b border-white/10 bg-gradient-to-r from-blue-500/20 to-green-500/20 font-bold text-white text-sm uppercase tracking-wider">Description</th>
              <th className="p-4 text-left border-b border-white/10 bg-gradient-to-r from-blue-500/20 to-green-500/20 font-bold text-white text-sm uppercase tracking-wider">Amount</th>
              <th className="p-4 text-left border-b border-white/10 bg-gradient-to-r from-blue-500/20 to-green-500/20 font-bold text-white text-sm uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense, index) => (
              <tr key={expense._id} className={`${index % 2 === 0 ? 'bg-white/5' : 'bg-white/2'} hover:bg-blue-500/10 transition-colors duration-200`}>
                <td className="p-4 text-left border-b border-white/5 text-blue-100 text-sm">{formatDate(expense.date)}</td>
                <td className="p-4 text-left border-b border-white/5 text-blue-100 text-sm">{getCategoryLabel(expense.category)}</td>
                <td className="p-4 text-left border-b border-white/5 text-blue-100 text-sm">{expense.description || '-'}</td>
                <td className="p-4 text-left border-b border-white/5 text-white text-sm font-bold">{formatCurrency(expense.amount)}</td>
                <td className="p-4 text-left border-b border-white/5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-white/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense._id)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-white/10"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredExpenses.length === 0 && (
          <div className="text-center py-16 text-blue-100 text-lg italic">No expenses found for the selected filters.</div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ExpensesManagement;
