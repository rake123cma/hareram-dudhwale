import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPlus, FaEye, FaEdit, FaTrash, FaRupeeSign, FaChartLine, FaUser, FaTimesCircle, FaWallet, FaCheck, FaCalendarCheck, FaStar, FaSyringe, FaBaby, FaPills, FaDownload, FaPrint } from 'react-icons/fa';
import { GiMilkCarton } from 'react-icons/gi';

import InseminationForm from './InseminationForm';
import CalvingForm from './CalvingForm';
import DewormingForm from './DewormingForm';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [cows, setCows] = useState([]);
  const [stats, setStats] = useState({
    totalCattle: 0,
    activeCattle: 0,
    pregnantCattle: 0,
    dryCattle: 0
  });
  const [showCowForm, setShowCowForm] = useState(false);
  const [editingCow, setEditingCow] = useState(null);
  const [showCrossingForm, setShowCrossingForm] = useState(false);
  const [crossingCow, setCrossingCow] = useState(null);
  const [showInseminationForm, setShowInseminationForm] = useState(false);
  const [showCalvingForm, setShowCalvingForm] = useState(false);
  const [showDewormingForm, setShowDewormingForm] = useState(false);
  const [selectedCow, setSelectedCow] = useState(null);
  const [selectedCowForRecords, setSelectedCowForRecords] = useState('');
  const [crossingData, setCrossingData] = useState({
    last_insemination_date: ''
  });
  const [cowForm, setCowForm] = useState({
    listing_id: '',
    name: '',
    type: 'cow',
    date_of_birth: '',
    date_of_entry: '',
    source: '',
    health_summary: '',
    image: ''
  });
  const [milkData, setMilkData] = useState({
    cow_id: '',
    date: new Date().toISOString().split('T')[0],
    morning_milk: '',
    evening_milk: ''
  });
  const [showMilkForm, setShowMilkForm] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchPaymentSettings();
    fetchPendingPayments();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    
    // Set active tab based on current URL
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') {
      setActiveTab('overview');
    } else if (path === '/admin/overview') {
      setActiveTab('overview');
    } else if (path === '/admin/livestock') {
      setActiveTab('cows');
    } else if (path === '/admin/payments') {
      setActiveTab('payments');
    } else if (path === '/admin/reviews') {
      setActiveTab('reviews');
    } else if (path === '/admin/record-update') {
      setActiveTab('records');
    } else if (path === '/admin/cattle-reports') {
      setActiveTab('reports');
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab, route) => {
    setActiveTab(tab);
    navigate(route);
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch cows
      const cowsRes = await axios.get('/api/cows', config);
      setCows(cowsRes.data);

      // Calculate stats
      calculateStats(cowsRes.data);

    } catch (err) {
      console.log('API not available, using empty data');
      setCows([]);
    }
  };

  const calculateStats = (cowsData) => {
    const stats = {
      totalCattle: cowsData.length,
      activeCattle: cowsData.filter(cow => cow.status === 'active').length,
      pregnantCattle: cowsData.filter(cow => cow.status === 'pregnant').length,
      dryCattle: cowsData.filter(cow => cow.status === 'dry').length
    };
    setStats(stats);
  };

  const getUpcomingReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize today to midnight
    const reminders = [];

    cows.forEach(cow => {
      // Check for upcoming calving dates
      if (cow.status === 'pregnant') {
        let calvingDate;
        if (cow.insemination_records && cow.insemination_records.length > 0) {
          const lastInsem = new Date(cow.insemination_records[cow.insemination_records.length - 1].insemination_date);
          const gestationMonths = cow.type === 'buffalo' ? 10 : 9;
          lastInsem.setMonth(lastInsem.getMonth() + gestationMonths);
          calvingDate = lastInsem;
        } else if (cow.expected_calving_date) {
          calvingDate = new Date(cow.expected_calving_date);
        }
        
        if (calvingDate) {
          const daysUntilCalving = Math.ceil((calvingDate - today) / (1000 * 60 * 60 * 24));

          if (daysUntilCalving >= -15 && daysUntilCalving <= 15) {
            reminders.push({
              type: 'calving',
              cow: cow.name,
              date: calvingDate,
              days: daysUntilCalving,
              message: daysUntilCalving < 0 
                ? `${cow.name} की बच्चा देने की तारीख ${Math.abs(daysUntilCalving)} दिन पहले बीत चुकी है` 
                : `${cow.name} को ${daysUntilCalving} दिन में बच्चा देना है`
            });
          }
        }
      }

      // Check for upcoming deworming dates
      if (cow.deworming_records && cow.deworming_records.length > 0) {
        const lastDeworming = cow.deworming_records[cow.deworming_records.length - 1];
        if (lastDeworming.next_due_date) {
          const nextDewormingDate = new Date(lastDeworming.next_due_date);
          const daysUntilDeworming = Math.ceil((nextDewormingDate - today) / (1000 * 60 * 60 * 24));

          if (daysUntilDeworming >= -15 && daysUntilDeworming <= 15) {
            reminders.push({
              type: 'deworming',
              cow: cow.name,
              date: nextDewormingDate,
              days: daysUntilDeworming,
              message: daysUntilDeworming < 0
                ? `${cow.name} की डीवॉर्मिंग ${Math.abs(daysUntilDeworming)} दिन ओवरड्यू है`
                : `${cow.name} की डीवॉर्मिंग ${daysUntilDeworming} दिन में बाकी है`
            });
          }
        }
      }

      // Check for upcoming vaccination dates
      if (cow.vaccination_records && cow.vaccination_records.length > 0) {
        const lastVaccine = cow.vaccination_records[cow.vaccination_records.length - 1];
        if (lastVaccine.next_due_date) {
          const nextVaccineDate = new Date(lastVaccine.next_due_date);
          const daysUntilVaccine = Math.ceil((nextVaccineDate - today) / (1000 * 60 * 60 * 24));

          if (daysUntilVaccine >= -15 && daysUntilVaccine <= 15) {
            reminders.push({
              type: 'vaccination',
              cow: cow.name,
              date: nextVaccineDate,
              days: daysUntilVaccine,
              message: daysUntilVaccine < 0
                ? `${cow.name} का टीकाकरण ${Math.abs(daysUntilVaccine)} दिन ओवरड्यू है`
                : `${cow.name} का टीकाकरण ${daysUntilVaccine} दिन में बाकी है`
            });
          }
        }
      }
    });

    return reminders.sort((a, b) => a.days - b.days);
  };

  const handleEditCow = (cow) => {
    setEditingCow(cow);
    setCowForm({
      listing_id: cow.listing_id || '',
      name: cow.name || '',
      type: cow.type || 'cow',
      date_of_birth: cow.date_of_birth ? new Date(cow.date_of_birth).toISOString().split('T')[0] : '',
      date_of_entry: cow.date_of_entry ? new Date(cow.date_of_entry).toISOString().split('T')[0] : '',
      source: cow.source || '',
      health_summary: cow.health_summary || '',
      image: cow.image || ''
    });
    setShowCowForm(true);
  };

  const resetCowForm = () => {
    setCowForm({
      listing_id: '',
      name: '',
      type: 'cow',
      date_of_birth: '',
      date_of_entry: '',
      source: '',
      health_summary: '',
      image: ''
    });
  };

  const handleDeleteCow = async (cowId) => {
    const result = await Swal.fire({
      title: 'क्या आप सुनिश्चित हैं?',
      text: "आप इस पशु का रिकॉर्ड हटाना चाहते हैं। यह वापस नहीं किया जा सकेगा!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'हाँ, डिलीट करें!',
      cancelButtonText: 'रद्द करें'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`/api/cows/${cowId}`, config);
        Swal.fire('डिलीट किया गया!', 'पशु का रिकॉर्ड हटा दिया गया है।', 'success');
        fetchDashboardData();
      } catch (err) {
        Swal.fire('त्रुटि', 'रिकॉर्ड हटाने में समस्या हुई।', 'error');
      }
    }
  };

  const handleCowSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Validate required fields
      if (!cowForm.listing_id || !cowForm.name || !cowForm.type || !cowForm.date_of_birth) {
        Swal.fire('Error', 'Please fill in all required fields', 'error');
        return;
      }

      // Parse date manually to avoid timezone issues
      const dobParts = cowForm.date_of_birth.split('-');
      const dobYear = parseInt(dobParts[0]);
      const dobMonth = parseInt(dobParts[1]) - 1; // JavaScript months are 0-based
      const dobDay = parseInt(dobParts[2]);

      // Parse entry date if provided, otherwise use birth date
      let entryDate = new Date(dobYear, dobMonth, dobDay);
      if (cowForm.date_of_entry) {
        const entryParts = cowForm.date_of_entry.split('-');
        const entryYear = parseInt(entryParts[0]);
        const entryMonth = parseInt(entryParts[1]) - 1;
        const entryDay = parseInt(entryParts[2]);
        entryDate = new Date(entryYear, entryMonth, entryDay);
      }

      const cowData = {
        listing_id: cowForm.listing_id,
        name: cowForm.name,
        type: cowForm.type,
        date_of_birth: new Date(dobYear, dobMonth, dobDay),
        date_of_entry: entryDate,
        source: cowForm.source || '',
        health_summary: cowForm.health_summary || '',
        image: cowForm.image || '',
        status: editingCow ? undefined : 'active'
      };

      // Sending cattle data

      if (editingCow) {
        // Update existing livestock
        await axios.put(`/api/cows/${editingCow._id}`, cowData, config);
        Swal.fire('Success', 'Cattle updated successfully!', 'success');
      } else {
        // Create new livestock
        const response = await axios.post('/api/cows', cowData, config);
        // Livestock created
        Swal.fire('Success', 'Cattle added successfully!', 'success');
      }

      setShowCowForm(false);
      setEditingCow(null);
      resetCowForm();
      fetchDashboardData();
    } catch (err) {
      console.error('Cattle submission error:', err.response?.data || err.message);
      Swal.fire('Error', `Failed to ${editingCow ? 'update' : 'add'} cattle: ${err.response?.data?.message || err.message}`, 'error');
    }
  };



  const handleCrossingSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Parse date manually to avoid timezone issues
      const dateParts = crossingData.last_insemination_date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-based
      const day = parseInt(dateParts[2]);

      const updateData = {
        last_insemination_date: new Date(year, month, day),
        pregnancy_status: true,
        status: 'pregnant'
      };

      await axios.put(`/api/cows/${crossingCow._id}`, updateData, config);

      Swal.fire('Success', 'Crossing information updated successfully!', 'success');
      setShowCrossingForm(false);
      setCrossingCow(null);
      setCrossingData({
        last_insemination_date: ''
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Crossing update error:', err.response?.data || err.message);
      Swal.fire('Error', `Failed to update crossing information: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const handleOpenInsemination = async (cow) => {
    const hasRecords = cow.insemination_records && cow.insemination_records.length > 0;
    if (!hasRecords) {
      setSelectedCow(cow);
      setShowInseminationForm(true);
      return;
    }
    const lastRecord = cow.insemination_records[cow.insemination_records.length - 1];
    const lastDate = new Date(lastRecord.insemination_date).toLocaleDateString('hi-IN');
    const result = await Swal.fire({
      title: 'गर्भाधान रिकॉर्ड',
      html: `<p><strong>अंतिम सेमेन तिथि:</strong> ${lastDate}</p>`,
      input: 'checkbox',
      inputPlaceholder: 'पिछला सेमेन रिजेक्ट करें',
      inputValue: 0,
      showCancelButton: true,
      confirmButtonText: 'फॉर्म खोलें',
      cancelButtonText: 'रद्द करें',
      inputValidator: (value) => {
        if (!value) {
          return 'पिछला सेमेन रिजेक्ट करने के लिए चेकबॉक्स को चेक करें';
        }
      }
    });
    if (result.isConfirmed && result.value) {
      setSelectedCow(cow);
      setShowInseminationForm(true);
    }
  };

  const handleCalvingClick = (cow) => {
    setSelectedCow(cow);
    setShowCalvingForm(true);
  };

  const handleDewormingClick = (cow) => {
    setSelectedCow(cow);
    setShowDewormingForm(true);
  };

  const handleInseminationSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`/api/cows/${selectedCow._id}/insemination`, data, config);
      Swal.fire('सफलता', 'सेमेन रिकॉर्ड सफलतापूर्वक जोड़ा गया!', 'success');
      setShowInseminationForm(false);
      setSelectedCow(null);
      fetchDashboardData();
    } catch (err) {
      console.error('सेमेन रिकॉर्ड जोड़ने में त्रुटि:', err);
      const errorMessage = err.response?.data?.message || err.message || 'सेमेन रिकॉर्ड जोड़ने में त्रुटि';
      Swal.fire('त्रुटि', errorMessage, 'error');
    }
  };

  const handleCalvingSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`/api/cows/${selectedCow._id}/calving`, data, config);
      Swal.fire('सफलता', 'बच्चा देने का रिकॉर्ड सफलतापूर्वक जोड़ा गया!', 'success');
      fetchDashboardData();
    } catch (err) {
      Swal.fire('त्रुटि', 'बच्चा रिकॉर्ड जोड़ने में त्रुटि', 'error');
    }
  };

  const handleDewormingSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`/api/cows/${selectedCow._id}/deworming`, data, config);
      Swal.fire('सफलता', 'डीवॉर्मिंग रिकॉर्ड सफलतापूर्वक जोड़ा गया!', 'success');
      fetchDashboardData();
    } catch (err) {
      Swal.fire('त्रुटि', 'डीवॉर्मिंग रिकॉर्ड जोड़ने में त्रुटि', 'error');
    }
  };

  const renderOverview = () => (
    <div className="bg-primary-700 rounded-lg p-6 mb-5 border border-secondary-700">
      <div className="flex items-center justify-between mb-5">
        <h3 className="bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent mb-0 flex items-center gap-3">
          <FaChartLine className="text-accent-blue text-xl" />
          Business Overview
        </h3>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-primary-800 p-5 rounded-lg border border-secondary-700 flex items-center gap-4">
            <div className="text-accent-blue bg-accent-blue-light p-3 rounded-lg text-2xl">
              <FaUser />
            </div>
            <div className="flex flex-col">
              <h3 className="m-0 mb-2 text-white text-sm">Total Cattle</h3>
              <p className="text-2xl font-bold text-accent-green m-0 mb-1">{stats.totalCattle}</p>
              <p className="text-secondary-500 text-xs m-0">In herd</p>
            </div>
          </div>
          <div className="bg-primary-800 p-5 rounded-lg border border-secondary-700 flex items-center gap-4">
            <div className="text-accent-green bg-accent-green-light p-3 rounded-lg text-2xl">
              <FaUser />
            </div>
            <div className="flex flex-col">
              <h3 className="m-0 mb-2 text-white text-sm">Active Cattle</h3>
              <p className="text-2xl font-bold text-accent-green m-0 mb-1">{stats.activeCattle}</p>
              <p className="text-secondary-500 text-xs m-0">Healthy & active</p>
            </div>
          </div>
          <div className="bg-primary-800 p-5 rounded-lg border border-secondary-700 flex items-center gap-4">
            <div className="text-accent-blue bg-accent-blue-light p-3 rounded-lg text-2xl">
              <FaCalendarCheck />
            </div>
            <div className="flex flex-col">
              <h3 className="m-0 mb-2 text-white text-sm">Pregnant</h3>
              <p className="text-2xl font-bold text-accent-blue m-0 mb-1">{stats.pregnantCattle}</p>
              <p className="text-secondary-500 text-xs m-0">Expecting delivery</p>
            </div>
          </div>
          <div className="bg-primary-800 p-5 rounded-lg border border-secondary-700 flex items-center gap-4">
            <div className="text-yellow-500 bg-yellow-100 p-3 rounded-lg text-2xl">
              <FaTimesCircle />
            </div>
            <div className="flex flex-col">
              <h3 className="m-0 mb-2 text-white text-sm">Dry Cattle</h3>
              <p className="text-2xl font-bold text-yellow-500 m-0 mb-1">{stats.dryCattle}</p>
              <p className="text-secondary-500 text-xs m-0">Not producing milk</p>
            </div>
          </div>
        </div>

      {/* Reminders Section */}
      {(() => {
        const reminders = getUpcomingReminders();
        return reminders.length > 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="text-yellow-800 m-0 mb-3 flex items-center gap-2">
              <FaCalendarCheck className="text-yellow-600" />
              आगामी रिमाइंडर ({reminders.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {reminders.map((reminder, index) => (
                <div key={index} className={`flex items-center justify-between bg-white p-3 rounded border ${reminder.days < 0 ? 'border-red-300' : 'border-yellow-300'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      reminder.type === 'calving' ? 'bg-pink-100 text-pink-800' : 
                      reminder.type === 'vaccination' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {reminder.type === 'calving' ? 'बच्चा' : reminder.type === 'vaccination' ? 'टीकाकरण' : 'डीवॉर्मिंग'}
                    </span>
                    <span className={`text-sm ${reminder.days < 0 ? 'text-red-700 font-medium' : 'text-gray-800'}`}>{reminder.message}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    reminder.days < 0 ? 'bg-red-600 text-white' :
                    reminder.days === 0 ? 'bg-red-100 text-red-800' :
                    reminder.days <= 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {reminder.days < 0 ? 'ओवरड्यू' : reminder.days === 0 ? 'आज' : `${reminder.days} दिन`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      <div className="quick-actions">
        <h4 className="text-white m-0 mb-4">Quick Actions</h4>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowCowForm(true)} className="bg-accent-blue text-white border-none px-5 py-3 rounded-lg cursor-pointer flex items-center gap-2 text-sm transition-all duration-300 hover:bg-accent-blue-dark">
            <FaPlus /> Add Cattle
          </button>
          <button onClick={() => handleTabChange('cows', '/admin/livestock')} className="bg-secondary-600 text-white border-none px-5 py-3 rounded-lg cursor-pointer flex items-center gap-2 text-sm transition-all duration-300 hover:bg-secondary-500">
            <FaUser /> Manage Cattle
          </button>
          <button onClick={() => handleTabChange('records', '/admin/record-update')} className="bg-secondary-600 text-white border-none px-5 py-3 rounded-lg cursor-pointer flex items-center gap-2 text-sm transition-all duration-300 hover:bg-secondary-500">
            <FaEdit /> Record Management
          </button>
        </div>
      </div>
    </div>
  );

  const renderCowForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">{editingCow ? 'Edit Cattle' : 'Add New Cattle'}</h3>
          <button onClick={() => {
            setShowCowForm(false);
            setEditingCow(null);
            resetCowForm();
          }} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200">×</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <form onSubmit={handleCowSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-white mb-2 text-sm font-medium">Tag ID / Listing ID *</label>
                <input
                  type="text"
                  value={cowForm.listing_id}
                  onChange={(e) => setCowForm({...cowForm, listing_id: e.target.value})}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2 text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={cowForm.name}
                  onChange={(e) => setCowForm({...cowForm, name: e.target.value})}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2 text-sm font-medium">Type *</label>
                <select
                  value={cowForm.type}
                  onChange={(e) => setCowForm({...cowForm, type: e.target.value})}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  required
                >
                  <option value="cow">Cow</option>
                  <option value="buffalo">Buffalo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2 text-sm font-medium">Date of Birth *</label>
                <input
                  type="date"
                  value={cowForm.date_of_birth}
                  onChange={(e) => setCowForm({...cowForm, date_of_birth: e.target.value})}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2 text-sm font-medium">Date of Entry (Optional)</label>
                <input
                  type="date"
                  value={cowForm.date_of_entry}
                  onChange={(e) => setCowForm({...cowForm, date_of_entry: e.target.value})}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  placeholder="When did the cattle join the farm?"
                />
                <small className="text-secondary-400 text-xs mt-1 block">Leave empty to use birth date</small>
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 text-sm font-medium">Source (Optional)</label>
              <input
                type="text"
                value={cowForm.source}
                onChange={(e) => setCowForm({...cowForm, source: e.target.value})}
                placeholder="Where did this cattle come from? (e.g., purchased, born on farm)"
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-white mb-2 text-sm font-medium">Health Summary</label>
              <textarea
                value={cowForm.health_summary}
                onChange={(e) => setCowForm({...cowForm, health_summary: e.target.value})}
                rows="3"
                placeholder="Brief health summary (optional)"
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200 resize-vertical"
              />
            </div>

            <div>
              <label className="block text-white mb-2 text-sm font-medium">फोटो (Image)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setCowForm({...cowForm, image: reader.result});
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
              />
              {cowForm.image && (
                <div className="mt-3">
                  <img src={cowForm.image} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-secondary-500" />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-secondary-700">
              <button type="button" onClick={() => {
                setShowCowForm(false);
                setEditingCow(null);
                resetCowForm();
              }} className="w-full sm:w-48 h-12 bg-secondary-600 hover:bg-secondary-500 text-white font-semibold rounded-xl border border-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Cancel
              </button>
              <button type="submit" className="w-full sm:w-48 h-12 bg-gradient-to-r from-accent-blue to-accent-blue-dark hover:from-accent-blue-dark hover:to-accent-blue text-white font-semibold rounded-xl border border-accent-blue transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                {editingCow ? 'Update' : 'Add Cattle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderCrossingForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">Update Crossing Date - {crossingCow?.name}</h3>
          <button onClick={() => {
            setShowCrossingForm(false);
            setCrossingCow(null);
            setCrossingData({
              last_insemination_date: ''
            });
          }} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200">×</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <form onSubmit={handleCrossingSubmit} className="space-y-6">
            <div className="p-5 bg-primary-800 rounded-lg border border-secondary-700">
              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">Crossing Date (Insemination) *</label>
                <input
                  type="date"
                  value={crossingData.last_insemination_date}
                  onChange={(e) => setCrossingData({...crossingData, last_insemination_date: e.target.value})}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  required
                />
                {crossingData.last_insemination_date && (
                  <p className="text-secondary-400 text-xs mt-1">
                    Expected Delivery: {(() => {
                      const dateParts = crossingData.last_insemination_date.split('-');
                      const year = parseInt(dateParts[0]);
                      const month = parseInt(dateParts[1]) - 1;
                      const day = parseInt(dateParts[2]);
                      const inseminationDate = new Date(year, month, day);
                      const gestationPeriodDays = crossingCow?.type === 'buffalo' ? 310 : 283; // Buffalo: ~310 days, Cow: ~283 days
                      const expectedDate = new Date(inseminationDate.getTime() + gestationPeriodDays * 24 * 60 * 60 * 1000);
                      return expectedDate.toLocaleDateString('hi-IN');
                    })()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-secondary-700">
              <button type="button" onClick={() => {
                setShowCrossingForm(false);
                setCrossingCow(null);
                setCrossingData({
                  last_insemination_date: ''
                });
              }} className="w-full sm:w-48 h-12 bg-secondary-600 hover:bg-secondary-500 text-white font-semibold rounded-xl border border-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Cancel
              </button>
              <button type="submit" className="w-full sm:w-48 h-12 bg-gradient-to-r from-accent-blue to-accent-blue-dark hover:from-accent-blue-dark hover:to-accent-blue text-white font-semibold rounded-xl border border-accent-blue transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Update Crossing Date
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );







  const [sicknessData, setSicknessData] = useState({
    date: new Date().toISOString().split('T')[0],
    condition: '',
    treatment: '',
    cost: '',
    notes: '',
    cow_id: ''
  });
  const [showSicknessForm, setShowSicknessForm] = useState(false);
  const [pregnancyData, setPregnancyData] = useState({
    cow_id: '',
    expected_calving_date: '',
    notes: ''
  });
  const [showPregnancyForm, setShowPregnancyForm] = useState(false);
  const [dryCowData, setDryCowData] = useState({
    cow_id: '',
    reason: '',
    new_market_price: ''
  });
  const [vaccinationData, setVaccinationData] = useState({
    cow_id: '',
    date: new Date().toISOString().split('T')[0],
    vaccine_name: '',
    next_due_date: '',
    cost: '',
    notes: ''
  });
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [showDryCowForm, setShowDryCowForm] = useState(false);
  const [selectedBulkCows, setSelectedBulkCows] = useState([]);
  const [showBulkVaccinationForm, setShowBulkVaccinationForm] = useState(false);
  const [bulkVaccinationData, setBulkVaccinationData] = useState({
    date: new Date().toISOString().split('T')[0],
    vaccine_name: '',
    next_due_date: '',
    cost_per_cow: '',
    notes: ''
  });
  const [showBulkDewormingForm, setShowBulkDewormingForm] = useState(false);
  const [bulkDewormingData, setBulkDewormingData] = useState({
    date: new Date().toISOString().split('T')[0],
    medicine_name: '',
    dosage: '',
    next_due_date: '',
    cost_per_cow: '',
    notes: ''
  });
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
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
  const [reviews, setReviews] = useState([]);
  const [showDateWiseMilkReport, setShowDateWiseMilkReport] = useState(false);
  const [milkReportFilters, setMilkReportFilters] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    cowId: 'all'
  });

  const renderCows = () => {
    const filteredCows = cows.filter(cow => {
      const matchType = filterType === 'all' || cow.type === filterType;
      const matchStatus = filterStatus === 'all' || cow.status === filterStatus;
      return matchType && matchStatus;
    });

    return (
      <div className="bg-primary-700 rounded-lg p-6 mb-5 border border-secondary-700">
      <div className="flex items-center justify-between mb-5">
        <h3 className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent mb-0 flex items-center gap-3">
          <FaUser className="text-accent-blue text-xl" />
          Cattle Management
        </h3>
        <div className="flex items-center gap-3">
          <button onClick={exportCattleListToCSV} className="bg-green-600 text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-2 text-sm hover:bg-green-700 shadow-md">
            <FaDownload /> एक्सपोर्ट (CSV)
          </button>
          <button onClick={handlePrintCattleList} className="bg-blue-600 text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-2 text-sm hover:bg-blue-700 shadow-md">
            <FaPrint /> प्रिंट (Print)
          </button>
          {selectedBulkCows.length > 0 && (
            <>
              <button onClick={() => setShowBulkDewormingForm(true)} className="bg-yellow-600 text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-2 text-sm hover:bg-yellow-700 shadow-md">
                <FaPills /> सामूहिक डीवॉर्मिंग ({selectedBulkCows.length})
              </button>
              <button onClick={() => setShowBulkVaccinationForm(true)} className="bg-pink-600 text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-2 text-sm hover:bg-pink-700 shadow-md">
                <FaSyringe /> सामूहिक टीकाकरण ({selectedBulkCows.length})
              </button>
            </>
          )}
          <button onClick={() => setShowCowForm(true)} className="bg-accent-blue text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-2 text-sm hover:bg-accent-blue-dark shadow-md">
            <FaPlus /> Add Cattle
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-primary-800 border border-secondary-700 rounded-lg">
          <thead className="bg-primary-900">
            <tr>
              <th className="px-4 py-3 text-left text-white font-semibold border-b border-secondary-600 w-10">
                <input
                  type="checkbox"
                  checked={filteredCows.length > 0 && selectedBulkCows.length === filteredCows.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBulkCows(filteredCows.map(c => c._id));
                    } else {
                      setSelectedBulkCows([]);
                    }
                  }}
                  className="w-4 h-4 cursor-pointer accent-pink-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-white font-semibold border-b border-secondary-600">ID / नाम</th>
              <th className="px-4 py-3 text-left text-white font-semibold border-b border-secondary-600">स्थिति</th>
              <th className="px-4 py-3 text-left text-white font-semibold border-b border-secondary-600">प्रेग्नेंसी जानकारी</th>
              <th className="px-4 py-3 text-left text-white font-semibold border-b border-secondary-600">डीवॉर्मिंग जानकारी</th>
              <th className="px-4 py-3 text-left text-white font-semibold border-b border-secondary-600">दूध (ली/दिन)</th>
              <th className="px-4 py-3 text-center text-white font-semibold border-b border-secondary-600">क्रियाएं</th>
            </tr>
          </thead>
          <tbody>
            {filteredCows.map(cow => (
              <tr key={cow._id} className="border-b border-secondary-700 hover:bg-primary-750">
                <td className="px-4 py-3 border-b border-secondary-700">
                  <input
                    type="checkbox"
                    checked={selectedBulkCows.includes(cow._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBulkCows([...selectedBulkCows, cow._id]);
                      } else {
                        setSelectedBulkCows(selectedBulkCows.filter(id => id !== cow._id));
                      }
                    }}
                    className="w-4 h-4 cursor-pointer accent-pink-600"
                  />
                </td>
                <td className="px-4 py-3 text-white font-medium">
                  <div className="flex items-center gap-3">
                    {cow.image ? (
                      <img src={cow.image} alt={cow.name} className="w-10 h-10 rounded-full object-cover border border-secondary-600 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary-600 flex items-center justify-center flex-shrink-0">
                        <FaUser className="text-secondary-300" />
                      </div>
                    )}
                    <div>
                      <div>{cow.listing_id}</div>
                      <div className="text-secondary-300 text-sm">{cow.name} ({cow.type === 'cow' ? 'गाय' : 'भैंस'})</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    cow.status === 'active' ? 'bg-accent-green text-white' :
                    cow.status === 'pregnant' ? 'bg-accent-blue text-white' :
                    cow.status === 'dry' ? 'bg-yellow-500 text-black' :
                    cow.status === 'sick' ? 'bg-red-500 text-white' :
                    'bg-secondary-600 text-white'
                  }`}>{cow.status}</span>
                </td>
                <td className="px-4 py-3 text-secondary-300 text-sm">
                  {cow.insemination_records?.length > 0 ? (
                    <>
                      <div>सेमेन: {new Date(cow.insemination_records[cow.insemination_records.length - 1].insemination_date).toLocaleDateString('hi-IN')}</div>
                      {(cow.status === 'pregnant' || cow.pregnancy_status) && (
                        <div className="text-accent-blue font-semibold mt-1">
                          संभावित बच्चा: {(() => {
                            const lastInsem = new Date(cow.insemination_records[cow.insemination_records.length - 1].insemination_date);
                            const gestationMonths = cow.type === 'buffalo' ? 10 : 9;
                            lastInsem.setMonth(lastInsem.getMonth() + gestationMonths);
                            return lastInsem.toLocaleDateString('hi-IN');
                          })()}
                        </div>
                      )}
                    </>
                  ) : cow.expected_calving_date && (cow.status === 'pregnant' || cow.pregnancy_status) ? (
                    <div className="text-accent-blue font-semibold mt-1">
                      संभावित बच्चा: {new Date(cow.expected_calving_date).toLocaleDateString('hi-IN')}
                    </div>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-secondary-300 text-sm">
                  {cow.deworming_records?.length > 0 ? (
                    <>
                      <div>अंतिम: {new Date(cow.deworming_records[cow.deworming_records.length - 1].date).toLocaleDateString('hi-IN')}</div>
                      {cow.deworming_records[cow.deworming_records.length - 1].next_due_date && (
                        <div className={`font-semibold mt-1 ${
                          new Date(cow.deworming_records[cow.deworming_records.length - 1].next_due_date) < new Date() ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                          अगला: {new Date(cow.deworming_records[cow.deworming_records.length - 1].next_due_date).toLocaleDateString('hi-IN')}
                        </div>
                      )}
                    </>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-secondary-300">
                  {cow.current_daily_milk || 0} L
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-center flex-wrap">
                    <button
                      className="bg-secondary-600 text-white border-none px-2 py-1 rounded cursor-pointer flex items-center gap-1 text-xs hover:bg-secondary-500"
                      onClick={() => viewCowDetails(cow)}
                      title="विवरण देखें"
                    >
                      <FaEye />
                    </button>

                    <button
                      className="bg-purple-500 text-white border-none px-2 py-1 rounded cursor-pointer flex items-center gap-1 text-xs hover:bg-purple-600"
                      onClick={() => handleOpenInsemination(cow)}
                      title="सेमेन दें"
                    >
                      <FaSyringe />
                    </button>

                    {cow.status === 'pregnant' && (
                      <button
                        className="bg-pink-500 text-white border-none px-2 py-1 rounded cursor-pointer flex items-center gap-1 text-xs hover:bg-pink-600"
                        onClick={() => handleCalvingClick(cow)}
                        title="बच्चा रिकॉर्ड"
                      >
                        <FaBaby />
                      </button>
                    )}

                    <button
                      className="bg-green-500 text-white border-none px-2 py-1 rounded cursor-pointer flex items-center gap-1 text-xs hover:bg-green-600"
                      onClick={() => handleDewormingClick(cow)}
                      title="डीवॉर्मिंग"
                    >
                      <FaPills />
                    </button>

                    <button
                      className="bg-yellow-500 text-black border-none px-2 py-1 rounded cursor-pointer flex items-center gap-1 text-xs hover:bg-yellow-600"
                      onClick={() => handleEditCow(cow)}
                      title="संपादित करें"
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="bg-red-500 text-white border-none px-2 py-1 rounded cursor-pointer flex items-center gap-1 text-xs hover:bg-red-600"
                      onClick={() => handleDeleteCow(cow._id)}
                      title="डिलीट करें"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCows.length === 0 && (
        <div className="text-center py-12 bg-primary-800 border-2 border-dashed border-secondary-600 rounded-lg mt-6">
          <FaUser className="text-accent-blue text-6xl mx-auto mb-4" />
          <h4 className="text-white text-xl mb-2">कोई पशु नहीं मिला</h4>
          <p className="text-secondary-400">आपके फ़िल्टर से मेल खाने वाला कोई डेटा मौजूद नहीं है।</p>
        </div>
      )}
    </div>
  );
  };

  const viewCowDetails = (cow) => {
    const inseminationHistory = cow.insemination_records?.length > 0
      ? cow.insemination_records.map(record => `
          <div style="border-left: 3px solid #8b5cf6; padding-left: 10px; margin: 10px 0;">
            <p><strong>तारीख:</strong> ${new Date(record.insemination_date).toLocaleDateString('hi-IN')}</p>
            <p><strong>सेमेन प्रकार:</strong> ${record.semen_type}</p>
            <p><strong>बैच:</strong> ${record.semen_batch || 'N/A'}</p>
            <p><strong>तकनीशियन:</strong> ${record.technician_name || 'N/A'}</p>
            <p><strong>लागत:</strong> ₹${record.cost || 0}</p>
            <p><strong>नोट्स:</strong> ${record.notes || 'N/A'}</p>
          </div>
        `).join('')
      : '<p>कोई सेमेन रिकॉर्ड नहीं</p>';

    const calvingHistory = cow.calving_records?.length > 0
      ? cow.calving_records.map(record => `
          <div style="border-left: 3px solid #10b981; padding-left: 10px; margin: 10px 0;">
            <p><strong>तारीख:</strong> ${new Date(record.calving_date).toLocaleDateString('hi-IN')}</p>
            <p><strong>लिंग:</strong> ${record.calf_gender === 'male' ? 'नर' : 'मादा'}</p>
            <p><strong>नाम:</strong> ${record.calf_name || 'N/A'}</p>
            <p><strong>स्थिति:</strong> ${record.calf_status === 'alive' ? 'जीवित' : record.calf_status === 'dead' ? 'मृत' : 'बिक गया'}</p>
            <p><strong>वजन:</strong> ${record.calf_weight || 0} KG</p>
            <p><strong>नोट्स:</strong> ${record.notes || 'N/A'}</p>
          </div>
        `).join('')
      : '<p>कोई बच्चा देने का रिकॉर्ड नहीं</p>';

    const dewormingHistory = cow.deworming_records?.length > 0
      ? cow.deworming_records.map(record => `
          <div style="border-left: 3px solid #f59e0b; padding-left: 10px; margin: 10px 0;">
            <p><strong>तारीख:</strong> ${new Date(record.date).toLocaleDateString('hi-IN')}</p>
            <p><strong>दवा:</strong> ${record.medicine_name}</p>
            <p><strong>खुराक:</strong> ${record.dosage || 'N/A'}</p>
            <p><strong>लागत:</strong> ₹${record.cost || 0}</p>
            <p><strong>अगली तारीख:</strong> ${record.next_due_date ? new Date(record.next_due_date).toLocaleDateString('hi-IN') : 'N/A'}</p>
            <p><strong>नोट्स:</strong> ${record.notes || 'N/A'}</p>
          </div>
        `).join('')
      : '<p>कोई डीवॉर्मिंग रिकॉर्ड नहीं</p>';
      
    const vaccinationHistory = cow.vaccination_records?.length > 0
      ? cow.vaccination_records.map(record => `
          <div style="border-left: 3px solid #ec4899; padding-left: 10px; margin: 10px 0;">
            <p><strong>तारीख:</strong> ${new Date(record.date).toLocaleDateString('hi-IN')}</p>
            <p><strong>टीका:</strong> ${record.vaccine_name}</p>
            <p><strong>लागत:</strong> ₹${record.cost || 0}</p>
            <p><strong>अगली तारीख:</strong> ${record.next_due_date ? new Date(record.next_due_date).toLocaleDateString('hi-IN') : 'N/A'}</p>
            <p><strong>नोट्स:</strong> ${record.notes || 'N/A'}</p>
          </div>
        `).join('')
      : '<p>कोई टीकाकरण रिकॉर्ड नहीं</p>';

    const milkHistory = cow.milk_records?.length > 0
      ? cow.milk_records.slice(-5).reverse().map(record => `
          <div style="border-left: 3px solid #06b6d4; padding-left: 10px; margin: 10px 0;">
            <p><strong>तारीख:</strong> ${new Date(record.date).toLocaleDateString('hi-IN')}</p>
            <p><strong>सुबह:</strong> ${record.morning_milk || 0} L | <strong>शाम:</strong> ${record.evening_milk || 0} L</p>
            <p><strong>कुल:</strong> ${record.total_milk || 0} L</p>
          </div>
        `).join('')
      : '<p>कोई दूध रिकॉर्ड नहीं</p>';
      
    const expectedCalving = cow.insemination_records?.length > 0 && (cow.status === 'pregnant' || cow.pregnancy_status) ? (() => {
      const lastInsem = new Date(cow.insemination_records[cow.insemination_records.length - 1].insemination_date);
      lastInsem.setMonth(lastInsem.getMonth() + (cow.type === 'buffalo' ? 10 : 9));
      return lastInsem;
    })() : cow.expected_calving_date ? new Date(cow.expected_calving_date) : null;

    const recentMilk = cow.milk_records?.slice(-10) || [];
    const maxMilk = recentMilk.length > 0 ? Math.max(...recentMilk.map(r => r.total_milk || 0), 10) : 10;
    const milkChart = recentMilk.length > 0 ? `
      <div style="margin: 15px 0 25px 0; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 8px;">
        <p style="font-size: 13px; color: #9ca3af; margin-top: 0; margin-bottom: 15px; text-align: center; font-weight: 600;">पिछले 10 दिनों का उत्पादन ग्राफ (Bar Chart)</p>
        <div style="display: flex; align-items: flex-end; height: 120px; gap: 8px; padding-bottom: 25px; border-bottom: 1px solid #4b5563; position: relative;">
          ${recentMilk.map(r => {
            const heightPct = ((r.total_milk || 0) / maxMilk) * 100;
            const dateStr = new Date(r.date).toLocaleDateString('hi-IN', {day:'numeric', month:'short'});
            return `
              <div style="display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; justify-content: flex-end; position: relative;">
                <span style="font-size: 11px; color: #06b6d4; margin-bottom: 4px; font-weight: bold;">${r.total_milk || 0}</span>
                <div style="width: 100%; max-width: 25px; height: ${heightPct}%; background: linear-gradient(to top, #06b6d4, #3b82f6); border-radius: 4px 4px 0 0; min-height: 4px; box-shadow: 0 -2px 5px rgba(59,130,246,0.3);"></div>
                <span style="font-size: 10px; color: #9ca3af; position: absolute; bottom: -20px; white-space: nowrap;">${dateStr}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';

    Swal.fire({
      title: `${cow.name} (${cow.listing_id}) - पूरा इतिहास`,
      html: `
        <div style="text-align: left; max-height: 400px; overflow-y: auto;">
           <div style="margin-bottom: 20px; display: flex; gap: 15px; align-items: flex-start; flex-wrap: wrap;">
             ${cow.image ? `<img src="${cow.image}" alt="${cow.name}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 2px solid #3b82f6; flex-shrink: 0;" />` : `<div style="width: 120px; height: 120px; background: #374151; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #3b82f6; flex-shrink: 0;"><span style="color: #9ca3af;">No Image</span></div>`}
             <div style="flex: 1;">
               <h4 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-top: 0;">मौलिक जानकारी</h4>
               <p style="margin: 5px 0;"><strong>प्रकार:</strong> ${cow.type === 'cow' ? 'गाय' : 'भैंस'}</p>
               <p style="margin: 5px 0;"><strong>स्थिति:</strong> ${cow.status}</p>
               <p style="margin: 5px 0;"><strong>आयु:</strong> ${cow.age ? `${cow.age} साल` : 'अज्ञात'}</p>
               <p style="margin: 5px 0;"><strong>जन्म तारीख:</strong> ${cow.date_of_birth ? new Date(cow.date_of_birth).toLocaleDateString('hi-IN') : 'अज्ञात'}</p>
               <p style="margin: 5px 0;"><strong>प्रवेश तारीख:</strong> ${cow.date_of_entry ? new Date(cow.date_of_entry).toLocaleDateString('hi-IN') : 'अज्ञात'}</p>
               <p style="margin: 5px 0;"><strong>स्रोत:</strong> ${cow.source || 'अज्ञात'}</p>
               <p style="margin: 5px 0;"><strong>कुल बच्चे:</strong> ${cow.total_calvings || 0}</p>
               <p style="margin: 5px 0;"><strong>वर्तमान दूध उत्पादन:</strong> ${cow.current_daily_milk || 0} लीटर/दिन</p>
               <p style="margin: 5px 0;"><strong>कुल दूध उत्पादन:</strong> ${cow.total_milk_produced || 0} लीटर</p>
             </div>
           </div>

           <div style="margin-bottom: 20px;">
             <h4 style="color: #8b5cf6; border-bottom: 2px solid #8b5cf6; padding-bottom: 5px;">सेमेन इतिहास (${cow.insemination_records?.length || 0} बार)</h4>
             ${inseminationHistory}
           </div>

           <div style="margin-bottom: 20px;">
             <h4 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 5px;">बच्चा देने का इतिहास (${cow.calving_records?.length || 0} बार)</h4>
             ${calvingHistory}
           </div>

           <div style="margin-bottom: 20px;">
             <h4 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 5px;">डीवॉर्मिंग इतिहास (${cow.deworming_records?.length || 0} बार)</h4>
             ${dewormingHistory}
           </div>

           <div style="margin-bottom: 20px;">
             <h4 style="color: #ec4899; border-bottom: 2px solid #ec4899; padding-bottom: 5px;">टीकाकरण इतिहास (${cow.vaccination_records?.length || 0} बार)</h4>
             ${vaccinationHistory}
           </div>

           <div style="margin-bottom: 20px;">
             <h4 style="color: #06b6d4; border-bottom: 2px solid #06b6d4; padding-bottom: 5px;">दूध उत्पादन का इतिहास</h4>
             ${milkChart}
             ${milkHistory}
           </div>

           <div style="margin-bottom: 20px;">
             <h4 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 5px;">स्वास्थ्य जानकारी</h4>
             <p><strong>स्वास्थ्य सारांश:</strong> ${cow.health_summary || 'अच्छा'}</p>
             ${cow.last_deworming_date ? `<p><strong>अंतिम डीवॉर्मिंग:</strong> ${new Date(cow.last_deworming_date).toLocaleDateString('hi-IN')}</p>` : ''}
             ${expectedCalving ? `<p><strong>अपेक्षित बच्चा देने की तारीख:</strong> ${expectedCalving.toLocaleDateString('hi-IN')}</p>` : ''}
           </div>
         </div>
      `,
      width: 800,
      confirmButtonText: 'बंद करें'
    });
  };



















  const handleSicknessSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Add sickness record to cow
      await axios.put(`/api/cows/${sicknessData.cow_id}`, {
        $push: {
          sickness_records: {
            date: new Date(sicknessData.date),
            condition: sicknessData.condition,
            treatment: sicknessData.treatment,
            cost: parseFloat(sicknessData.cost),
            notes: sicknessData.notes
          }
        },
        status: 'sick' // Update cow status
      }, config);

      // Add expense record if there's a cost
      if (sicknessData.cost && parseFloat(sicknessData.cost) > 0) {
        await axios.post('/api/expenses', {
          date: sicknessData.date,
          category: 'medicine',
          amount: parseFloat(sicknessData.cost),
          description: `Treatment for ${sicknessData.condition}: ${sicknessData.treatment}`,
          cow_id: sicknessData.cow_id
        }, config);
      }

      Swal.fire('Success', 'Sickness record added and investor notified!', 'success');
      setShowSicknessForm(false);
      setSicknessData({
        date: new Date().toISOString().split('T')[0],
        condition: '',
        treatment: '',
        cost: '',
        notes: '',
        cow_id: ''
      });
      fetchDashboardData();
    } catch (err) {
      Swal.fire('Error', 'Failed to record sickness', 'error');
    }
  };







  const handlePregnancySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Parse date manually to avoid timezone issues
      const calvingParts = pregnancyData.expected_calving_date.split('-');
      const calvingYear = parseInt(calvingParts[0]);
      const calvingMonth = parseInt(calvingParts[1]) - 1; // JavaScript months are 0-based
      const calvingDay = parseInt(calvingParts[2]);

      await axios.put(`/api/cows/${pregnancyData.cow_id}`, {
        pregnancy_status: true,
        expected_calving_date: new Date(calvingYear, calvingMonth, calvingDay),
        status: 'pregnant',
        health_notes: pregnancyData.notes
      }, config);

      Swal.fire('Success', 'Pregnancy recorded and investor notified!', 'success');
      setShowPregnancyForm(false);
      setPregnancyData({
        cow_id: '',
        expected_calving_date: '',
        notes: ''
      });
      fetchDashboardData();
    } catch (err) {
      Swal.fire('Error', 'Failed to record pregnancy', 'error');
    }
  };

  const handleMilkSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const morning = parseFloat(milkData.morning_milk) || 0;
      const evening = parseFloat(milkData.evening_milk) || 0;
      const total = morning + evening;

      const selectedCow = cows.find(c => c._id === milkData.cow_id);
      const newTotalProduced = (selectedCow.total_milk_produced || 0) + total;

      await axios.put(`/api/cows/${milkData.cow_id}`, {
        $push: {
          milk_records: {
            date: new Date(milkData.date),
            morning_milk: morning,
            evening_milk: evening,
            total_milk: total
          }
        },
        current_daily_milk: total,
        total_milk_produced: newTotalProduced
      }, config);

      Swal.fire('Success', 'दूध उत्पादन रिकॉर्ड सफलतापूर्वक जोड़ा गया!', 'success');
      setShowMilkForm(false);
      setMilkData({
        cow_id: '',
        date: new Date().toISOString().split('T')[0],
        morning_milk: '',
        evening_milk: ''
      });
      fetchDashboardData();
    } catch (err) {
      Swal.fire('Error', 'दूध उत्पादन रिकॉर्ड जोड़ने में त्रुटि', 'error');
    }
  };

  const handleVaccinationSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`/api/cows/${vaccinationData.cow_id}`, {
        $push: {
          vaccination_records: {
            date: new Date(vaccinationData.date),
            vaccine_name: vaccinationData.vaccine_name,
            next_due_date: vaccinationData.next_due_date ? new Date(vaccinationData.next_due_date) : null,
            cost: parseFloat(vaccinationData.cost) || 0,
            notes: vaccinationData.notes
          }
        }
      }, config);

      if (vaccinationData.cost && parseFloat(vaccinationData.cost) > 0) {
        await axios.post('/api/expenses', {
          date: vaccinationData.date,
          category: 'vet',
          amount: parseFloat(vaccinationData.cost),
          description: `Vaccination: ${vaccinationData.vaccine_name}`,
          cow_id: vaccinationData.cow_id
        }, config);
      }

      Swal.fire('Success', 'टीकाकरण रिकॉर्ड सफलतापूर्वक जोड़ा गया!', 'success');
      setShowVaccinationForm(false);
      setVaccinationData({ cow_id: '', date: new Date().toISOString().split('T')[0], vaccine_name: '', next_due_date: '', cost: '', notes: '' });
      fetchDashboardData();
    } catch (err) {
      Swal.fire('Error', 'टीकाकरण रिकॉर्ड जोड़ने में त्रुटि', 'error');
    }
  };

  const handleBulkVaccinationSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      Swal.fire({
        title: 'अपडेट किया जा रहा है...',
        text: 'कृपया प्रतीक्षा करें',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const costPerCow = parseFloat(bulkVaccinationData.cost_per_cow) || 0;

      const promises = selectedBulkCows.map(async (cowId) => {
        await axios.put(`/api/cows/${cowId}`, {
          $push: {
            vaccination_records: {
              date: new Date(bulkVaccinationData.date),
              vaccine_name: bulkVaccinationData.vaccine_name,
              next_due_date: bulkVaccinationData.next_due_date ? new Date(bulkVaccinationData.next_due_date) : null,
              cost: costPerCow,
              notes: bulkVaccinationData.notes
            }
          }
        }, config);

        if (costPerCow > 0) {
          await axios.post('/api/expenses', {
            date: bulkVaccinationData.date,
            category: 'vet',
            amount: costPerCow,
            description: `Bulk Vaccination: ${bulkVaccinationData.vaccine_name}`,
            cow_id: cowId
          }, config);
        }
      });

      await Promise.all(promises);

      Swal.fire('सफलता', `${selectedBulkCows.length} पशुओं का टीकाकरण रिकॉर्ड सफलतापूर्वक जोड़ा गया!`, 'success');
      setShowBulkVaccinationForm(false);
      setSelectedBulkCows([]);
      setBulkVaccinationData({ date: new Date().toISOString().split('T')[0], vaccine_name: '', next_due_date: '', cost_per_cow: '', notes: '' });
      fetchDashboardData();
    } catch (err) {
      Swal.fire('त्रुटि', 'सामूहिक टीकाकरण रिकॉर्ड जोड़ने में त्रुटि', 'error');
    }
  };

  const exportCattleListToCSV = () => {
    if (!cows || cows.length === 0) {
      Swal.fire('त्रुटि', 'एक्सपोर्ट करने के लिए कोई डेटा नहीं है', 'error');
      return;
    }
    const headers = ['ID', 'नाम (Name)', 'प्रकार (Type)', 'स्थिति (Status)', 'उम्र (Age)', 'कुल बच्चे (Calvings)', 'दूध (Milk L/Day)', 'स्वास्थ्य (Health)'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    cows.forEach(cow => {
      const row = [
        cow.listing_id || '',
        cow.name || '',
        cow.type === 'cow' ? 'गाय' : 'भैंस',
        cow.status || '',
        cow.date_of_birth ? new Date().getFullYear() - new Date(cow.date_of_birth).getFullYear() : 'Unknown',
        cow.total_calvings || 0,
        cow.current_daily_milk || 0,
        (cow.health_summary || '').replace(/,/g, ' ') // Avoid CSV column breaking
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cattle_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintCattleList = () => {
    if (!cows || cows.length === 0) {
      Swal.fire('त्रुटि', 'प्रिंट करने के लिए कोई डेटा नहीं है', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString('hi-IN');

    const tableContent = cows.map((cow, index) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${cow.listing_id || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${cow.name || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${cow.type === 'cow' ? 'गाय' : 'भैंस'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${cow.status || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${cow.current_daily_milk || 0} L</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${cow.total_calvings || 0}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>पशुधन सूची - Hareram Dudhwale</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; color: #333; margin-bottom: 5px; }
            .date { text-align: right; margin-bottom: 20px; font-weight: bold; font-size: 14px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { padding: 10px; border: 1px solid #ccc; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>पशुधन सूची (Livestock List)</h2>
          <div class="date">तारीख: ${date}</div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 60px;">क्र.सं.</th>
                <th>आईडी (ID)</th>
                <th>नाम (Name)</th>
                <th>प्रकार (Type)</th>
                <th>स्थिति (Status)</th>
                <th style="text-align: center;">दूध (L/Day)</th>
                <th style="text-align: center;">कुल बच्चे</th>
              </tr>
            </thead>
            <tbody>
              ${tableContent}
            </tbody>
          </table>
          <div style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Print Now</button>
          </div>
          <script>
            window.onload = function() { setTimeout(function() { window.print(); }, 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleBulkDewormingSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      Swal.fire({
        title: 'अपडेट किया जा रहा है...',
        text: 'कृपया प्रतीक्षा करें',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const costPerCow = parseFloat(bulkDewormingData.cost_per_cow) || 0;

      const promises = selectedBulkCows.map(async (cowId) => {
        await axios.put(`/api/cows/${cowId}`, {
          $push: {
            deworming_records: {
              date: new Date(bulkDewormingData.date),
              medicine_name: bulkDewormingData.medicine_name,
              dosage: bulkDewormingData.dosage,
              next_due_date: bulkDewormingData.next_due_date ? new Date(bulkDewormingData.next_due_date) : null,
              cost: costPerCow,
              notes: bulkDewormingData.notes
            }
          }
        }, config);

        if (costPerCow > 0) {
          await axios.post('/api/expenses', {
            date: bulkDewormingData.date,
            category: 'vet',
            amount: costPerCow,
            description: `Bulk Deworming: ${bulkDewormingData.medicine_name}`,
            cow_id: cowId
          }, config);
        }
      });

      await Promise.all(promises);

      Swal.fire('सफलता', `${selectedBulkCows.length} पशुओं का डीवॉर्मिंग रिकॉर्ड सफलतापूर्वक जोड़ा गया!`, 'success');
      setShowBulkDewormingForm(false);
      setSelectedBulkCows([]);
      setBulkDewormingData({ date: new Date().toISOString().split('T')[0], medicine_name: '', dosage: '', next_due_date: '', cost_per_cow: '', notes: '' });
      fetchDashboardData();
    } catch (err) {
      Swal.fire('त्रुटि', 'सामूहिक डीवॉर्मिंग रिकॉर्ड जोड़ने में त्रुटि', 'error');
    }
  };

  const handleDryCowSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`/api/cows/${dryCowData.cow_id}`, {
        status: 'dry',
        dry_start_date: new Date(),
        health_notes: dryCowData.reason
      }, config);

      Swal.fire('Success', 'Cow marked as dry and investor notified about options!', 'success');
      setShowDryCowForm(false);
      setDryCowData({
        cow_id: '',
        reason: '',
        new_market_price: ''
      });
      fetchDashboardData();
    } catch (err) {
      Swal.fire('Error', 'Failed to mark cow as dry', 'error');
    }
  };

  const renderDryCowForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">Mark Cow as Dry</h3>
          <button onClick={() => setShowDryCowForm(false)} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200">×</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
          <form onSubmit={handleDryCowSubmit} className="space-y-6">
            <div className="p-5 bg-primary-800 rounded-lg border border-secondary-700">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="text-blue-800 m-0 mb-2 text-sm font-semibold">गर्भावस्था विवरण</h5>
                <div className="text-blue-700 space-y-1 text-sm">
                  {(() => {
                    const selectedCow = cows.find(c => c._id === dryCowData.cow_id);
                    const lastInsemination = selectedCow?.insemination_records?.length > 0
                      ? selectedCow.insemination_records[selectedCow.insemination_records.length - 1]
                      : null;
                    const lastCalving = selectedCow?.calving_records?.length > 0
                      ? selectedCow.calving_records[selectedCow.calving_records.length - 1]
                      : null;

                    let expectedCalvingStr = null;
                    if (lastInsemination && selectedCow?.status === 'pregnant') {
                      const lastInsem = new Date(lastInsemination.insemination_date);
                      lastInsem.setMonth(lastInsem.getMonth() + (selectedCow.type === 'buffalo' ? 10 : 9));
                      expectedCalvingStr = lastInsem.toLocaleDateString('hi-IN');
                    } else if (selectedCow?.expected_calving_date) {
                      expectedCalvingStr = new Date(selectedCow.expected_calving_date).toLocaleDateString('hi-IN');
                    }

                    return (
                      <>
                        {lastInsemination && (
                          <p className="m-0"><strong>अंतिम सेमेन:</strong> {new Date(lastInsemination.insemination_date).toLocaleDateString('hi-IN')}</p>
                        )}
                        {lastCalving && (
                          <p className="m-0"><strong>अंतिम बच्चा:</strong> {new Date(lastCalving.calving_date).toLocaleDateString('hi-IN')}</p>
                        )}
                        {expectedCalvingStr && (
                          <p className="m-0"><strong>अपेक्षित बच्चा:</strong> {expectedCalvingStr}</p>
                        )}
                        <p className="m-0"><strong>कुल बच्चे:</strong> {selectedCow?.total_calvings || 0}</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-secondary-700">
              <button type="button" onClick={() => setShowDryCowForm(false)} className="w-full sm:w-48 h-12 bg-secondary-600 hover:bg-secondary-500 text-white font-semibold rounded-xl border border-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Cancel
              </button>
              <button type="submit" className="w-full sm:w-48 h-12 bg-gradient-to-r from-accent-blue to-accent-blue-dark hover:from-accent-blue-dark hover:to-accent-blue text-white font-semibold rounded-xl border border-accent-blue transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Mark as Dry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderMilkForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">दैनिक दूध रिकॉर्ड (Daily Milk Record)</h3>
          <button onClick={() => setShowMilkForm(false)} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200">×</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <form onSubmit={handleMilkSubmit} className="space-y-6">
            <div className="p-5 bg-primary-800 rounded-lg border border-secondary-700">
              <h4 className="text-white m-0 mb-4 text-base font-semibold">दूध उत्पादन का विवरण</h4>
              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">तारीख *</label>
                <input
                  type="date"
                  value={milkData.date}
                  onChange={(e) => setMilkData({...milkData, date: e.target.value})}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">सुबह का दूध (लीटर)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={milkData.morning_milk}
                    onChange={(e) => setMilkData({...milkData, morning_milk: e.target.value})}
                    placeholder="Morning Milk"
                    className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">शाम का दूध (लीटर)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={milkData.evening_milk}
                    onChange={(e) => setMilkData({...milkData, evening_milk: e.target.value})}
                    placeholder="Evening Milk"
                    className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-secondary-700">
              <button type="button" onClick={() => setShowMilkForm(false)} className="w-full sm:w-48 h-12 bg-secondary-600 hover:bg-secondary-500 text-white font-semibold rounded-xl border border-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Cancel
              </button>
              <button type="submit" className="w-full sm:w-48 h-12 bg-gradient-to-r from-accent-blue to-accent-blue-dark hover:from-accent-blue-dark hover:to-accent-blue text-white font-semibold rounded-xl border border-accent-blue transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Save Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderPregnancyForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">Report Cow Pregnancy</h3>
          <button onClick={() => setShowPregnancyForm(false)} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200">×</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <form onSubmit={handlePregnancySubmit} className="space-y-6">
            <div className="p-5 bg-primary-800 rounded-lg border border-secondary-700">
              <h4 className="text-white m-0 mb-4 text-base font-semibold">Pregnancy Details</h4>
              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">Expected Calving Date *</label>
                <input
                  type="date"
                  value={pregnancyData.expected_calving_date}
                  onChange={(e) => setPregnancyData({...pregnancyData, expected_calving_date: e.target.value})}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2 text-sm font-medium">Notes</label>
                <textarea
                  value={pregnancyData.notes}
                  onChange={(e) => setPregnancyData({...pregnancyData, notes: e.target.value})}
                  rows="4"
                  placeholder="Additional notes about the pregnancy"
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200 resize-vertical"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-secondary-700">
              <button type="button" onClick={() => setShowPregnancyForm(false)} className="w-full sm:w-48 h-12 bg-secondary-600 hover:bg-secondary-500 text-white font-semibold rounded-xl border border-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Cancel
              </button>
              <button type="submit" className="w-full sm:w-48 h-12 bg-gradient-to-r from-accent-blue to-accent-blue-dark hover:from-accent-blue-dark hover:to-accent-blue text-white font-semibold rounded-xl border border-accent-blue transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Record Pregnancy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderRecords = () => (
    <div className="bg-primary-700 rounded-lg p-6 mb-5 border border-secondary-700">
      <div className="flex items-center justify-between mb-5">
        <h3 className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent mb-0 flex items-center gap-3">
          <FaEdit className="text-accent-blue text-xl" />
          रेकॉर्ड अपडेट प्रबंधन
        </h3>
      </div>

      {/* Cow Selection */}
      <div className="bg-primary-800 border border-secondary-700 rounded-lg p-6 mb-6">
        <h4 className="text-white text-lg font-semibold mb-4">गाय/भैंस चुनें</h4>
        <div className="max-w-md">
          <label className="block text-white mb-2 text-sm font-medium">गाय/भैंस *</label>
          <select
            value={selectedCowForRecords}
            onChange={(e) => setSelectedCowForRecords(e.target.value)}
            className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
          >
            <option value="">गाय/भैंस चुनें</option>
            {cows.map(cow => (
              <option key={cow._id} value={cow._id}>
                {cow.listing_id} - {cow.name} ({cow.type === 'cow' ? 'गाय' : 'भैंस'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      {selectedCowForRecords && (
        <div className="bg-primary-800 border border-secondary-700 rounded-lg p-6">
          <h4 className="text-white text-lg font-semibold mb-4">कार्रवाई चुनें (Select Action)</h4>

          <div className="space-y-8">
            {/* Daily Management Section */}
            <div>
              <h5 className="text-blue-400 mb-3 border-b border-secondary-600 pb-2 flex items-center gap-2">
                <GiMilkCarton /> दैनिक प्रबंधन (Daily Management)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Milk Record */}
                <button
                  onClick={() => {
                    setMilkData({
                      cow_id: selectedCowForRecords,
                      date: new Date().toISOString().split('T')[0],
                      morning_milk: '',
                      evening_milk: ''
                    });
                    setShowMilkForm(true);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <GiMilkCarton className="text-xl" />
                  <div className="text-left">
                    <div className="font-semibold">दूध रिकॉर्ड</div>
                    <div className="text-xs opacity-80">दैनिक दूध उत्पादन</div>
                  </div>
                </button>

                {/* Sickness Record */}
                <button
                  onClick={() => {
                    setSicknessData({
                      date: new Date().toISOString().split('T')[0],
                      condition: '', treatment: '', cost: '', notes: '',
                      cow_id: selectedCowForRecords
                    });
                    setShowSicknessForm(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FaUser className="text-xl" />
                  <div className="text-left">
                    <div className="font-semibold">बीमारी रिकॉर्ड</div>
                    <div className="text-xs opacity-80">स्वास्थ्य समस्याएं</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Health & Care Section */}
            <div>
              <h5 className="text-green-400 mb-3 border-b border-secondary-600 pb-2 flex items-center gap-2">
                <FaPills /> स्वास्थ्य सुरक्षा (Health & Care)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Deworming */}
                <button
                  onClick={() => {
                    const cow = cows.find(c => c._id === selectedCowForRecords);
                    setSelectedCow(cow);
                    setShowDewormingForm(true);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FaPills className="text-xl" />
                  <div className="text-left">
                    <div className="font-semibold">डीवॉर्मिंग</div>
                    <div className="text-xs opacity-80">कीटाणुनाशक दवा</div>
                  </div>
                </button>

                {/* Vaccination */}
                <button
                  onClick={() => {
                    setVaccinationData({
                      cow_id: selectedCowForRecords,
                      date: new Date().toISOString().split('T')[0],
                      vaccine_name: '', next_due_date: '', cost: '', notes: ''
                    });
                    setShowVaccinationForm(true);
                  }}
                  className="bg-pink-600 hover:bg-pink-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <FaSyringe className="text-xl" />
                  <div className="text-left">
                    <div className="font-semibold">टीकाकरण (Vaccination)</div>
                    <div className="text-xs opacity-80">वैक्सीन और रोकथाम</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Breeding Management Section */}
            <div>
              <h5 className="text-purple-400 mb-3 border-b border-secondary-600 pb-2 flex items-center gap-2">
                <FaBaby /> प्रजनन प्रबंधन (Breeding)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Insemination */}
          <button
            onClick={() => {
              const cow = cows.find(c => c._id === selectedCowForRecords);
              handleOpenInsemination(cow);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <FaSyringe className="text-xl" />
            <div className="text-left">
              <div className="font-semibold">सेमेन दें</div>
              <div className="text-xs opacity-80">गर्भाधान रिकॉर्ड</div>
            </div>
          </button>

          {/* Pregnancy Confirm */}
          <button
            onClick={async () => {
              const selectedCow = cows.find(c => c._id === selectedCowForRecords);
              const lastInsemination = selectedCow?.insemination_records?.length > 0
                ? selectedCow.insemination_records[selectedCow.insemination_records.length - 1]
                : null;

              let confirmText = 'क्या यह गाय/भैंस प्रेग्नेंट है?';
              if (lastInsemination) {
                const semenDate = new Date(lastInsemination.insemination_date).toLocaleDateString('hi-IN');
                confirmText = `अंतिम सेमेन दिया गया: ${semenDate}\nक्या यह गाय/भैंस प्रेग्नेंट है?`;
              } else {
                confirmText = 'इस गाय/भैंस को पहले सेमेन नहीं दिया गया है।\nक्या आप फिर भी प्रेग्नेंसी कन्फर्म करना चाहते हैं?';
              }

              const result = await Swal.fire({
                title: 'प्रेग्नेंसी कन्फर्म करें?',
                text: confirmText,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'हाँ, कन्फर्म करें',
                cancelButtonText: 'रद्द करें'
              });

              if (result.isConfirmed) {
                try {
                  const token = localStorage.getItem('token');
                  const config = { headers: { Authorization: `Bearer ${token}` } };

                  await axios.patch(`/api/cows/${selectedCowForRecords}/pregnancy-confirm`, {
                    confirmed_date: new Date().toISOString().split('T')[0]
                  }, config);

                  Swal.fire('सफलता', 'प्रेग्नेंसी कन्फर्म हो गई!', 'success');
                  fetchDashboardData();
                } catch (err) {
                  Swal.fire('त्रुटि', 'प्रेग्नेंसी कन्फर्म करने में त्रुटि', 'error');
                }
              }
            }}
            className="bg-pink-600 hover:bg-pink-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <FaBaby className="text-xl" />
            <div className="text-left">
              <div className="font-semibold">प्रेग्नेंसी कन्फर्म</div>
              <div className="text-xs opacity-80">गर्भावस्था पुष्टि</div>
            </div>
          </button>

          {/* Calving */}
          <button
            onClick={() => {
              const cow = cows.find(c => c._id === selectedCowForRecords);
              setSelectedCow(cow);
              setShowCalvingForm(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <FaBaby className="text-xl" />
            <div className="text-left">
              <div className="font-semibold">बच्चा रिकॉर्ड</div>
              <div className="text-xs opacity-80">बच्चा देने का रिकॉर्ड</div>
            </div>
          </button>

          {/* Pregnancy Record */}
          <button
            onClick={() => {
              setPregnancyData({
                cow_id: selectedCowForRecords,
                expected_calving_date: '',
                notes: ''
              });
              setShowPregnancyForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <FaCalendarCheck className="text-xl" />
            <div className="text-left">
              <div className="font-semibold">गर्भावस्था रिकॉर्ड</div>
              <div className="text-xs opacity-80">प्रेग्नेंसी ट्रैकिंग</div>
            </div>
          </button>

          {/* Dry Cow */}
          <button
            onClick={() => {
              const selectedCow = cows.find(c => c._id === selectedCowForRecords);
              setDryCowData({
                cow_id: selectedCowForRecords,
                reason: '',
                new_market_price: selectedCow ? (selectedCow.company_price * 0.7).toString() : ''
              });
              setShowDryCowForm(true);
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <FaTimesCircle className="text-xl" />
            <div className="text-left">
              <div className="font-semibold">ड्राई मार्क करें</div>
              <div className="text-xs opacity-80">दूध उत्पादन बंद</div>
            </div>
          </button>
        </div>
        </div>
        </div>
      </div>
      )}

      {!selectedCowForRecords && (
        <div className="text-center py-12 bg-primary-800 border-2 border-dashed border-secondary-600 rounded-lg">
          <FaUser className="text-accent-blue text-6xl mx-auto mb-4" />
          <h4 className="text-white text-xl mb-2">कोई गाय/भैंस नहीं चुनी गई</h4>
          <p className="text-secondary-400">ऊपर से गाय/भैंस चुनें और फिर कार्रवाई बटन पर क्लिक करें</p>
        </div>
      )}
    </div>
  );

  const fetchPaymentSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('/api/payments/settings', config);
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

      await axios.post('/api/payments/settings', paymentSettings, config);
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

      const response = await axios.get('/api/payments/pending', config);
      setPendingPayments(response.data);
    } catch (err) {
      console.log('Failed to fetch pending payments');
    }
  };

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('/api/reviews', config);
      setReviews(response.data);
    } catch (err) {
      console.log('Failed to fetch reviews');
    }
  };

  const handleReviewApproval = async (reviewId, isApproved, isFeatured = false) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`/api/reviews/${reviewId}/approve`, {
        is_approved: isApproved,
        is_featured: isFeatured
      }, config);

      Swal.fire('Success', `Review ${isApproved ? 'approved' : 'rejected'} successfully!`, 'success');
      fetchReviews();
    } catch (err) {
      Swal.fire('Error', `Failed to ${isApproved ? 'approve' : 'reject'} review`, 'error');
    }
  };

  const deleteReview = async (reviewId) => {
    const result = await Swal.fire({
      title: 'Delete Review?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        await axios.delete(`/api/reviews/${reviewId}`, config);
        Swal.fire('Success', 'Review deleted successfully!', 'success');
        fetchReviews();
      } catch (err) {
        Swal.fire('Error', 'Failed to delete review', 'error');
      }
    }
  };

  const handlePaymentApproval = async (paymentId, status, rejectionReason = '') => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Update payment status
      await axios.put(`/api/payments/${paymentId}/status`, {
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
            await axios.put(`/api/billing/customer/${payment.customer_id._id}/status`, {
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



  const renderPayments = () => (
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

      <div className="space-y-6">
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
                  <img src={paymentSettings.qr_code_image} alt="Payment QR Code" className="w-32 h-32 border border-secondary-600 rounded" />
                </div>
              )}
            </div>
          ) : (
            <p className="text-secondary-400">No payment settings configured yet.</p>
          )}
        </div>

        {/* Pending Payments */}
        <div className="bg-primary-800 border border-secondary-700 rounded-lg p-6">
          <h4 className="text-white text-lg font-semibold mb-4">Pending Payment Approvals</h4>
          {pendingPayments.length > 0 ? (
            <div className="space-y-4">
              {pendingPayments.map(payment => (
                <div key={payment._id} className="bg-primary-900 border border-secondary-600 rounded-lg p-4">
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
            <p className="text-secondary-400">No pending payments to review.</p>
          )}
        </div>
      </div>
    </div>
  );

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

  const renderReviews = () => (
    <div className="bg-primary-700 rounded-lg p-6 mb-5 border border-secondary-700">
      <div className="flex items-center justify-between mb-5">
        <h3 className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent mb-0 flex items-center gap-3">
          <FaStar className="text-accent-blue text-xl" />
          Customer Reviews Management
        </h3>
      </div>

      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review._id} className="bg-primary-800 border border-secondary-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-white font-semibold">{review.customer_name}</h4>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-400'}`}
                        />
                      ))}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      review.is_approved
                        ? 'bg-green-500 text-white'
                        : 'bg-yellow-500 text-black'
                    }`}>
                      {review.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    {review.is_featured && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500 text-white">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-secondary-300 mb-2">{review.review_text}</p>
                  <div className="flex items-center gap-4 text-sm text-secondary-400">
                    {review.location && <span>Location: {review.location}</span>}
                    <span>Submitted: {new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                {!review.is_approved ? (
                  <>
                    <button
                      onClick={() => handleReviewApproval(review._id, true)}
                      className="bg-accent-green text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-1 text-sm hover:bg-accent-green-dark"
                    >
                      <FaCheck /> Approve
                    </button>
                    <button
                      onClick={() => handleReviewApproval(review._id, false)}
                      className="bg-red-500 text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-1 text-sm hover:bg-red-600"
                    >
                      <FaTimesCircle /> Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleReviewApproval(review._id, true, !review.is_featured)}
                      className={`border-none px-4 py-2 rounded cursor-pointer flex items-center gap-1 text-sm ${
                        review.is_featured
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                    >
                      <FaStar />
                      {review.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => deleteReview(review._id)}
                      className="bg-red-500 text-white border-none px-4 py-2 rounded cursor-pointer flex items-center gap-1 text-sm hover:bg-red-600"
                    >
                      <FaTrash /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-primary-800 border-2 border-dashed border-secondary-600 rounded-lg">
            <FaStar className="text-accent-blue text-6xl mx-auto mb-4" />
            <h4 className="text-white text-xl mb-2">No reviews yet</h4>
            <p className="text-secondary-400">Customer reviews will appear here for approval.</p>
          </div>
        )}
      </div>
    </div>
  );


  const renderReports = () => {
    const showOverallReport = (reportType) => {
      const generateReport = (data, title, fields, showCowName = false) => {
        if (!data || data.length === 0) {
          return `<div style="text-align: center; padding: 20px; color: #9ca3af;">कोई रिकॉर्ड नहीं मिला</div>`;
        }

        const rows = data.map(record => `
          <tr style="border-bottom: 1px solid #374151;">
            ${showCowName ? `<td style="padding: 8px; color: #000000;">${record.cow_name || 'Unknown'}</td>` : ''}
            ${fields.map(field => `<td style="padding: 8px; color: #000000;">${formatFieldValue(record[field.key])}</td>`).join('')}
          </tr>
        `).join('');

        const headers = `${showCowName ? '<th style="padding: 8px; text-align: left; color: #f9fafb; background: #1f2937;">गाय/भैंस</th>' : ''}${fields.map(field => `<th style="padding: 8px; text-align: left; color: #f9fafb; background: #1f2937;">${field.label}</th>`).join('')}`;

        return `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>${headers}</thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      };

      const formatFieldValue = (value) => {
        if (value === null || value === undefined || value === '') return '-';
        if (value instanceof Date) return value.toLocaleDateString('hi-IN');
        return value;
      };

      const getReportData = () => {
        switch (reportType) {
          case 'farm-summary':
            // Calculate farm statistics
            const totalCows = cows.filter(cow => cow.type === 'cow').length;
            const totalBuffalos = cows.filter(cow => cow.type === 'buffalo').length;
            const totalInseminations = cows.reduce((sum, cow) => sum + (cow.insemination_records?.length || 0), 0);
            const totalCalvings = cows.reduce((sum, cow) => sum + (cow.calving_records?.length || 0), 0);
            const pregnantCows = cows.filter(cow => cow.status === 'pregnant').length;
            const sickCows = cows.filter(cow => cow.status === 'sick').length;
            const totalDewormings = cows.reduce((sum, cow) => sum + (cow.deworming_records?.length || 0), 0);

            return {
              title: 'फार्म सारांश रिपोर्ट',
              isSummary: true,
              summary: {
                totalCows,
                totalBuffalos,
                totalInseminations,
                totalCalvings,
                pregnantCows,
                sickCows,
                totalDewormings
              }
            };

          case 'all-insemination':
            const inseminationData = cows.flatMap(cow =>
              (cow.insemination_records || []).map(record => ({
                cow_name: `${cow.listing_id} - ${cow.name}`,
                insemination_date: record.insemination_date,
                semen_type: record.semen_type,
                semen_batch: record.semen_batch,
                technician_name: record.technician_name,
                cost: record.cost,
                notes: record.notes
              }))
            );
            return {
              title: 'सभी सेमेन रिकॉर्ड',
              data: inseminationData,
              fields: [
                { key: 'insemination_date', label: 'सेमेन तारीख' },
                { key: 'semen_type', label: 'सेमेन प्रकार' },
                { key: 'semen_batch', label: 'बैच नंबर' },
                { key: 'technician_name', label: 'तकनीशियन' },
                { key: 'cost', label: 'लागत (₹)' },
              ],
              showCowName: true
            };

          case 'all-calving':
            const calvingData = cows.flatMap(cow =>
              (cow.calving_records || []).map(record => ({
                cow_name: `${cow.listing_id} - ${cow.name}`,
                calving_date: record.calving_date,
                calf_gender: record.calf_gender,
                calf_name: record.calf_name,
                calf_status: record.calf_status,
                calf_weight: record.calf_weight,
                notes: record.notes
              }))
            );
            return {
              title: 'सभी बच्चा देने का रिकॉर्ड',
              data: calvingData,
              fields: [
                { key: 'calving_date', label: 'बच्चा देने की तारीख' },
                { key: 'calf_gender', label: 'बच्चे का लिंग' },
                { key: 'calf_name', label: 'बच्चे का नाम' },
                { key: 'calf_status', label: 'स्थिति' },
                { key: 'calf_weight', label: 'वजन (KG)' }
              ],
              showCowName: true
            };

          case 'health-summary':
            const healthData = cows.flatMap(cow => {
              const sicknessRecords = (cow.sickness_records || []).map(record => ({
                cow_name: `${cow.listing_id} - ${cow.name}`,
                type: 'बीमारी',
                date: record.date,
                condition: record.condition,
                treatment: record.treatment,
                cost: record.cost,
                notes: record.notes
              }));

              const dewormingRecords = (cow.deworming_records || []).map(record => ({
                cow_name: `${cow.listing_id} - ${cow.name}`,
                type: 'डीवॉर्मिंग',
                date: record.date,
                condition: record.medicine_name,
                treatment: record.dosage,
                cost: record.cost,
                notes: record.notes
              }));

              return [...sicknessRecords, ...dewormingRecords];
            });

            return {
              title: 'स्वास्थ्य एवं उपचार रिपोर्ट',
              data: healthData,
              fields: [
                { key: 'type', label: 'प्रकार' },
                { key: 'date', label: 'तारीख' },
                { key: 'condition', label: 'दवा/बीमारी' },
                { key: 'treatment', label: 'उपचार/खुराक' },
                { key: 'cost', label: 'लागत (₹)' }
              ],
              showCowName: true
            };

          case 'pregnant-cows':
            const pregnantCowData = cows.filter(cow => cow.status === 'pregnant').map(cow => {
              let expectedCalvingStr = 'Unknown';
              if (cow.insemination_records?.length > 0) {
                const lastInsem = new Date(cow.insemination_records[cow.insemination_records.length - 1].insemination_date);
                lastInsem.setMonth(lastInsem.getMonth() + (cow.type === 'buffalo' ? 10 : 9));
                expectedCalvingStr = lastInsem.toLocaleDateString('hi-IN');
              } else if (cow.expected_calving_date) {
                expectedCalvingStr = new Date(cow.expected_calving_date).toLocaleDateString('hi-IN');
              }
              
              return {
                listing_id: cow.listing_id,
                name: cow.name,
                type: cow.type,
                last_insemination: cow.insemination_records?.length > 0 ? new Date(cow.insemination_records[cow.insemination_records.length - 1].insemination_date).toLocaleDateString('hi-IN') : (cow.last_insemination_date ? new Date(cow.last_insemination_date).toLocaleDateString('hi-IN') : 'Unknown'),
                expected_calving: expectedCalvingStr,
                insemination_count: cow.insemination_records?.length || 0,
                total_calvings: cow.total_calvings || 0,
                current_status: cow.status
              };
            });

            return {
              title: 'गर्भवती गाय/भैंस रिपोर्ट',
              data: pregnantCowData,
              fields: [
                { key: 'listing_id', label: 'आईडी' },
                { key: 'name', label: 'नाम' },
                { key: 'type', label: 'प्रकार' },
                { key: 'last_insemination', label: 'अंतिम सेमेन' },
                { key: 'expected_calving', label: 'अपेक्षित बच्चा' },
                { key: 'insemination_count', label: 'सेमेन संख्या' },
                { key: 'total_calvings', label: 'कुल बच्चे' },
                { key: 'current_status', label: 'स्थिति' }
              ],
              showCowName: false
            };

          case 'milk-production':
            // This would typically come from a separate API endpoint
            // For now, showing current daily milk from cattle records
            const milkProductionData = cows.filter(cow => cow.current_daily_milk > 0).map(cow => ({
              listing_id: cow.listing_id,
              name: cow.name,
              type: cow.type,
              current_daily_milk: cow.current_daily_milk,
              production_status: cow.status === 'active' ? 'सक्रिय' : cow.status === 'dry' ? 'ड्राई' : 'अन्य'
            }));

            return {
              title: 'दूध उत्पादन रिपोर्ट',
              data: milkProductionData,
              fields: [
                { key: 'listing_id', label: 'आईडी' },
                { key: 'name', label: 'नाम' },
                { key: 'type', label: 'प्रकार' },
                { key: 'current_daily_milk', label: 'दैनिक दूध (लीटर)' },
                { key: 'production_status', label: 'उत्पादन स्थिति' }
              ],
              showCowName: false
            };

          case 'monthly-milk':
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const monthlyMilkData = cows.filter(cow => cow.milk_records?.length > 0).map(cow => {
              const currentMonthRecords = cow.milk_records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
              });

              const totalMonthlyMilk = currentMonthRecords.reduce((sum, record) => sum + (record.total_milk || 0), 0);
              
              if (totalMonthlyMilk > 0) {
                 return {
                   listing_id: cow.listing_id,
                   name: cow.name,
                   type: cow.type === 'cow' ? 'गाय' : 'भैंस',
                   total_monthly_milk: totalMonthlyMilk,
                   record_days: currentMonthRecords.length,
                   average_milk: (totalMonthlyMilk / currentMonthRecords.length).toFixed(1)
                 };
              }
              return null;
            }).filter(Boolean);

            return {
              title: `मासिक दूध उत्पादन रिपोर्ट (${new Date().toLocaleString('hi-IN', { month: 'long', year: 'numeric' })})`,
              data: monthlyMilkData,
              fields: [
                { key: 'listing_id', label: 'आईडी' },
                { key: 'name', label: 'नाम' },
                { key: 'type', label: 'प्रकार' },
                { key: 'total_monthly_milk', label: 'कुल मासिक दूध (लीटर)' },
                { key: 'record_days', label: 'रिकॉर्ड के दिन' },
                { key: 'average_milk', label: 'औसत (लीटर/दिन)' }
              ],
              showCowName: false
            };

          case 'expense-summary':
            // Expense data would come from a separate API
            // But we can show expense records from cattle
            const expenseDataReport = cows.flatMap(cow => [
              ...(cow.sickness_records || []).map(record => ({
                cow_name: `${cow.listing_id} - ${cow.name}`,
                expense_type: 'बीमारी उपचार',
                date: record.date,
                description: record.condition,
                amount: record.cost,
                notes: record.treatment
              })),
              ...(cow.deworming_records || []).map(record => ({
                cow_name: `${cow.listing_id} - ${cow.name}`,
                expense_type: 'डीवॉर्मिंग',
                date: record.date,
                description: record.medicine_name,
                amount: record.cost,
                notes: record.dosage
              })),
              ...(cow.insemination_records || []).map(record => ({
                cow_name: `${cow.listing_id} - ${cow.name}`,
                expense_type: 'सेमेन खर्च',
                date: record.insemination_date,
                description: record.semen_type,
                amount: record.cost,
                notes: record.technician_name
              }))
            ]);

            return {
              title: 'खर्च सारांश रिपोर्ट',
              data: expenseDataReport,
              fields: [
                { key: 'expense_type', label: 'खर्च प्रकार' },
                { key: 'date', label: 'तारीख' },
                { key: 'description', label: 'विवरण' },
                { key: 'amount', label: 'राशि (₹)' },
                { key: 'notes', label: 'नोट्स' }
              ],
              showCowName: true
            };

          case 'cattle-list':
            const cattleData = cows.map(cow => ({
              listing_id: cow.listing_id,
              name: cow.name,
              type: cow.type,
              status: cow.status,
              age: cow.date_of_birth ? new Date().getFullYear() - new Date(cow.date_of_birth).getFullYear() : 'Unknown',
              total_calvings: cow.total_calvings || 0,
              current_daily_milk: cow.current_daily_milk || 0,
              insemination_count: cow.insemination_records?.length || 0,
              health_summary: cow.health_summary || 'Good'
            }));

            return {
              title: 'पशुधन सूची',
              data: cattleData,
              fields: [
                { key: 'listing_id', label: 'आईडी' },
                { key: 'name', label: 'नाम' },
                { key: 'type', label: 'प्रकार' },
                { key: 'status', label: 'स्थिति' },
                { key: 'age', label: 'आयु (साल)' },
                { key: 'total_calvings', label: 'कुल बच्चे' },
                { key: 'current_daily_milk', label: 'दूध (लीटर/दिन)' },
                { key: 'insemination_count', label: 'सेमेन संख्या' },
                { key: 'health_summary', label: 'स्वास्थ्य' }
              ],
              showCowName: false
            };

          default:
            return { title: 'अज्ञात रिपोर्ट' };
        }
      };

      const reportInfo = getReportData();
      const { title, data, fields, isSummary, summary, showCowName } = reportInfo;

      if (isSummary) {
        // Farm summary report
        Swal.fire({
          title: title,
          html: `
            <div style="text-align: left; max-height: 600px; overflow-y: auto;">
              <div style="margin: 15px 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
                <h2 style="margin: 0 0 15px 0; color: white; text-align: center; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px;">फार्म इंडिकेटर्स</h2>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                  <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <h3 style="margin: 0 0 5px 0; color: #ffd700; font-size: 2em;">${summary.totalCows}</h3>
                    <p style="margin: 0; opacity: 0.9;">कुल गायें</p>
                  </div>
                  <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <h3 style="margin: 0 0 5px 0; color: #ffd700; font-size: 2em;">${summary.totalBuffalos}</h3>
                    <p style="margin: 0; opacity: 0.9;">कुल भैंसें</p>
                  </div>
                  <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <h3 style="margin: 0 0 5px 0; color: #ffd700; font-size: 1.5em;">${summary.totalInseminations}</h3>
                    <p style="margin: 0; opacity: 0.9;">कुल सेमेन</p>
                  </div>
                  <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <h3 style="margin: 0 0 5px 0; color: #ffd700; font-size: 1.5em;">${summary.totalCalvings}</h3>
                    <p style="margin: 0; opacity: 0.9;">कुल बच्चे</p>
                  </div>
                  <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <h3 style="margin: 0 0 5px 0; color: #30d16c; font-size: 1.5em;">${summary.pregnantCows}</h3>
                    <p style="margin: 0; opacity: 0.9;">गर्भवती</p>
                  </div>
                  <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <h3 style="margin: 0 0 5px 0; color: #ff6b6b; font-size: 1.5em;">${summary.sickCows}</h3>
                    <p style="margin: 0; opacity: 0.9;">बीमार</p>
                  </div>
                </div>
              </div>

              <div style="margin: 15px 0; padding: 15px; background: #1f2937; border-radius: 8px; border: 1px solid #374151;">
                <h3 style="color: #10b981; margin: 0 0 10px 0; border-bottom: 2px solid #10b981; padding-bottom: 5px;">प्रोडक्शन विवरण</h3>
                <p style="color: #e5e7eb; margin: 5px 0;"><strong>कुल डीवॉर्मिंग:</strong> ${summary.totalDewormings} बार</p>
                <p style="color: #e5e7eb; margin: 5px 0;"><strong>प्रेग्नेंसी रेट:</strong> ${((summary.pregnantCows / (summary.totalCows + summary.totalBuffalos)) * 100).toFixed(1)}%</p>
                <p style="color: #e5e7eb; margin: 5px 0;"><strong>हेल्दी पशु:</strong> ${(summary.totalCows + summary.totalBuffalos) - summary.sickCows} / ${summary.totalCows + summary.totalBuffalos}</p>
              </div>

              <div style="margin: 15px 0; padding: 15px; background: #1f2937; border-radius: 8px; border: 1px solid #374151;">
                <h3 style="color: #3b82f6; margin: 0 0 10px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">फार्म प्रोफाइल</h3>
                <p style="color: #e5e7eb; margin: 5px 0;"><strong> कुल पशु:</strong> ${summary.totalCows + summary.totalBuffalos}</p>
                <p style="color: #e5e7eb; margin: 5px 0;"><strong>औसत सेमेन प्रति पशु:</strong> ${(summary.totalInseminations / (summary.totalCows + summary.totalBuffalos)).toFixed(1)}</p>
                <p style="color: #e5e7eb; margin: 5px 0;"><strong>औसत बच्चे प्रति पशु:</strong> ${(summary.totalCalvings / (summary.totalCows + summary.totalBuffalos)).toFixed(1)}</p>
              </div>
            </div>
          `,
          width: 800,
          confirmButtonText: 'बंद करें'
        });
      } else {
        // Data report
        const reportHtml = generateReport(data, title, fields, showCowName);
        const totalRecords = data?.length || 0;

        Swal.fire({
          title: title,
          html: `
            <div style="text-align: left;">
              <p style="color: #6b7280; margin-bottom: 15px;">कुल रिकॉर्ड: ${totalRecords}</p>
              ${reportHtml}
            </div>
          `,
          width: 1200,
          confirmButtonText: 'बंद करें'
        });
      }
    };

    return (
      <div className="bg-primary-700 rounded-lg p-6 mb-5 border border-secondary-700">
        <div className="flex items-center justify-between mb-5">
          <h3 className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent mb-0 flex items-center gap-3">
            <FaChartLine className="text-accent-blue text-xl" />
            फार्म रिपोर्ट्स
          </h3>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-primary-800 p-5 rounded-lg border border-secondary-700 flex items-center gap-4">
            <div className="text-accent-blue bg-accent-blue-light p-3 rounded-lg text-2xl">
              <FaUser />
            </div>
            <div className="flex flex-col">
              <h3 className="m-0 mb-2 text-white text-sm">कुल पशुधन</h3>
              <p className="text-2xl font-bold text-accent-green m-0 mb-1">{stats.totalCattle}</p>
              <p className="text-secondary-500 text-xs m-0">Farm Inventory</p>
            </div>
          </div>
          <div className="bg-primary-800 p-5 rounded-lg border border-secondary-700 flex items-center gap-4">
            <div className="text-accent-green bg-accent-green-light p-3 rounded-lg text-2xl">
              <FaSyringe />
            </div>
            <div className="flex flex-col">
              <h3 className="m-0 mb-2 text-white text-sm">कुल सेमेन</h3>
              <p className="text-2xl font-bold text-accent-green m-0 mb-1">{cows.reduce((sum, cow) => sum + (cow.insemination_records?.length || 0), 0)}</p>
              <p className="text-secondary-500 text-xs m-0">Total Inseminations</p>
            </div>
          </div>
          <div className="bg-primary-800 p-5 rounded-lg border border-secondary-700 flex items-center gap-4">
            <div className="text-pink-500 bg-pink-100 p-3 rounded-lg text-2xl">
              <FaBaby />
            </div>
            <div className="flex flex-col">
              <h3 className="m-0 mb-2 text-white text-sm">कुल बच्चे</h3>
              <p className="text-2xl font-bold text-pink-500 m-0 mb-1">{cows.reduce((sum, cow) => sum + (cow.calving_records?.length || 0), 0)}</p>
              <p className="text-secondary-500 text-xs m-0">Total Calvings</p>
            </div>
          </div>
          <div className="bg-primary-800 p-5 rounded-lg border border-secondary-700 flex items-center gap-4">
            <div className="text-yellow-500 bg-yellow-100 p-3 rounded-lg text-2xl">
              <FaPills />
            </div>
            <div className="flex flex-col">
              <h3 className="m-0 mb-2 text-white text-sm">कुल उपचार</h3>
              <p className="text-2xl font-bold text-yellow-500 m-0 mb-1">{cows.reduce((sum, cow) => sum + ((cow.deworming_records?.length || 0) + (cow.sickness_records?.length || 0)), 0)}</p>
              <p className="text-secondary-500 text-xs m-0">Health Treatments</p>
            </div>
          </div>
        </div>

        {/* Report Generation Buttons */}
        <div className="bg-primary-800 border border-secondary-700 rounded-lg p-6">
          <h4 className="text-white text-lg font-semibold mb-6">रिपोर्ट जनरेशन</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => showOverallReport('farm-summary')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <FaChartLine className="text-xl" />
              <div className="text-left">
                <div className="font-semibold">फार्म सारांश</div>
                <div className="text-xs opacity-80">कंप्लीटन स्टेटिस्टिक्स</div>
              </div>
            </button>

            <button
              onClick={() => showOverallReport('pregnant-cows')}
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <FaBaby className="text-xl" />
              <div className="text-left">
                <div className="font-semibold">गर्भवती पशु रिपोर्ट</div>
                <div className="text-xs opacity-80">प्रेग्नेंट गाय/भैंस</div>
              </div>
            </button>

            <button
              onClick={() => showOverallReport('milk-production')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <GiMilkCarton className="text-xl" />
              <div className="text-left">
                <div className="font-semibold">दूध उत्पादन रिपोर्ट</div>
                <div className="text-xs opacity-80">मिल्क प्रोडक्शन डेटा</div>
              </div>
            </button>

            <button
              onClick={() => showOverallReport('monthly-milk')}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <GiMilkCarton className="text-xl" />
              <div className="text-left">
                <div className="font-semibold">मासिक दूध रिपोर्ट</div>
                <div className="text-xs opacity-80">मासिक उत्पादन डेटा</div>
              </div>
            </button>

            <button
              onClick={() => setShowDateWiseMilkReport(true)}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <GiMilkCarton className="text-xl" />
              <div className="text-left">
                <div className="font-semibold">दिनांक वार दूध रिपोर्ट</div>
                <div className="text-xs opacity-80">कस्टम डेट फिल्टर</div>
              </div>
            </button>

            <button
              onClick={() => showOverallReport('cattle-list')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <FaUser className="text-xl" />
              <div className="text-left">
                <div className="font-semibold">पशुधन सूची</div>
                <div className="text-xs opacity-80">सभी पशु का विवरण</div>
              </div>
            </button>

            <button
              onClick={() => showOverallReport('all-insemination')}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <FaSyringe className="text-xl" />
              <div className="text-left">
                <div className="font-semibold">सेमेन इतिहास</div>
                <div className="text-xs opacity-80">सभी सेमेन रिकॉर्ड</div>
              </div>
            </button>

            <button
              onClick={() => showOverallReport('all-calving')}
              className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <FaBaby className="text-xl" />
              <div className="text-left">
                <div className="font-semibold">बच्चा इतिहास</div>
                <div className="text-xs opacity-80">सभी बच्चा रिकॉर्ड</div>
              </div>
            </button>

            <button
              onClick={() => showOverallReport('expense-summary')}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <FaRupeeSign className="text-xl" />
              <div className="text-left">
                <div className="font-semibold">खर्च रिपोर्ट</div>
                <div className="text-xs opacity-80">एक्सपेंस समरी</div>
              </div>
            </button>

            <button
              onClick={() => showOverallReport('health-summary')}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white border-none px-6 py-4 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <FaPills className="text-xl" />
              <div className="text-left">
                <div className="font-semibold">स्वास्थ्य रिपोर्ट</div>
                <div className="text-xs opacity-80">दवा एवं उपचार</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBulkDewormingForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">सामूहिक डीवॉर्मिंग (Bulk Deworming)</h3>
          <button onClick={() => setShowBulkDewormingForm(false)} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200">×</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <div className="mb-4 bg-yellow-900/30 border border-yellow-500/50 p-4 rounded-lg">
            <p className="text-white m-0 text-sm">आप <strong>{selectedBulkCows.length}</strong> पशुओं की डीवॉर्मिंग कर रहे हैं।</p>
          </div>
          <form onSubmit={handleBulkDewormingSubmit} className="space-y-6">
            <div className="p-5 bg-primary-800 rounded-lg border border-secondary-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">तारीख (Date) *</label>
                  <input type="date" value={bulkDewormingData.date} onChange={(e) => setBulkDewormingData({...bulkDewormingData, date: e.target.value})} className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" required />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">दवा का नाम (Medicine) *</label>
                  <input type="text" value={bulkDewormingData.medicine_name} onChange={(e) => setBulkDewormingData({...bulkDewormingData, medicine_name: e.target.value})} placeholder="e.g., Albendazole" className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">खुराक (Dosage)</label>
                  <input type="text" value={bulkDewormingData.dosage} onChange={(e) => setBulkDewormingData({...bulkDewormingData, dosage: e.target.value})} placeholder="e.g., 90ml" className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">लागत प्रति पशु (Cost/Cow ₹)</label>
                  <input type="number" step="0.01" value={bulkDewormingData.cost_per_cow} onChange={(e) => setBulkDewormingData({...bulkDewormingData, cost_per_cow: e.target.value})} placeholder="0.00" className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" />
                </div>
              </div>

              <div>
                <label className="block text-white mb-2 text-sm font-medium">अगली तारीख (Next Due Date)</label>
                <input type="date" value={bulkDewormingData.next_due_date} onChange={(e) => setBulkDewormingData({...bulkDewormingData, next_due_date: e.target.value})} className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue mb-4" />
              </div>

              <div>
                <label className="block text-white mb-2 text-sm font-medium">अतिरिक्त जानकारी (Notes)</label>
                <textarea value={bulkDewormingData.notes} onChange={(e) => setBulkDewormingData({...bulkDewormingData, notes: e.target.value})} rows="3" placeholder="Any additional details" className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue resize-vertical" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-secondary-700">
              <button type="button" onClick={() => setShowBulkDewormingForm(false)} className="w-full sm:w-48 h-12 bg-secondary-600 hover:bg-secondary-500 text-white font-semibold rounded-xl border border-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Cancel</button>
              <button type="submit" className="w-full sm:w-48 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold rounded-xl border border-yellow-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Save Records</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderSicknessForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">Report Cow Sickness</h3>
          <button onClick={() => setShowSicknessForm(false)} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200">×</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <form onSubmit={handleSicknessSubmit} className="space-y-6">
            <div className="p-5 bg-primary-800 rounded-lg border border-secondary-700">
              <h4 className="text-white m-0 mb-4 text-base font-semibold">Sickness Details</h4>
              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">Date *</label>
                <input
                  type="date"
                  value={sicknessData.date}
                  onChange={(e) => setSicknessData({...sicknessData, date: e.target.value})}
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">Condition *</label>
                  <input
                    type="text"
                    value={sicknessData.condition}
                    onChange={(e) => setSicknessData({...sicknessData, condition: e.target.value})}
                    placeholder="e.g., Mastitis, Fever, Injury"
                    className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">Treatment Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sicknessData.cost}
                    onChange={(e) => setSicknessData({...sicknessData, cost: e.target.value})}
                    placeholder="0.00"
                    className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">Treatment Provided</label>
                <textarea
                  value={sicknessData.treatment}
                  onChange={(e) => setSicknessData({...sicknessData, treatment: e.target.value})}
                  rows="4"
                  placeholder="Describe the treatment given"
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200 resize-vertical"
                />
              </div>

              <div>
                <label className="block text-white mb-2 text-sm font-medium">Additional Notes</label>
                <textarea
                  value={sicknessData.notes}
                  onChange={(e) => setSicknessData({...sicknessData, notes: e.target.value})}
                  rows="3"
                  placeholder="Any additional observations"
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-200 resize-vertical"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-secondary-700">
              <button type="button" onClick={() => setShowSicknessForm(false)} className="w-full sm:w-48 h-12 bg-secondary-600 hover:bg-secondary-500 text-white font-semibold rounded-xl border border-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Cancel
              </button>
              <button type="submit" className="w-full sm:w-48 h-12 bg-gradient-to-r from-accent-blue to-accent-blue-dark hover:from-accent-blue-dark hover:to-accent-blue text-white font-semibold rounded-xl border border-accent-blue transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Report Sickness
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderVaccinationForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">टीकाकरण रिकॉर्ड (Vaccination Record)</h3>
          <button onClick={() => setShowVaccinationForm(false)} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200">×</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <form onSubmit={handleVaccinationSubmit} className="space-y-6">
            <div className="p-5 bg-primary-800 rounded-lg border border-secondary-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">तारीख (Date) *</label>
                  <input type="date" value={vaccinationData.date} onChange={(e) => setVaccinationData({...vaccinationData, date: e.target.value})} className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" required />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">टीके का नाम (Vaccine Name) *</label>
                  <input type="text" value={vaccinationData.vaccine_name} onChange={(e) => setVaccinationData({...vaccinationData, vaccine_name: e.target.value})} placeholder="e.g., FMD, Lumpy" className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">अगले टीके की तारीख (Next Due)</label>
                  <input type="date" value={vaccinationData.next_due_date} onChange={(e) => setVaccinationData({...vaccinationData, next_due_date: e.target.value})} className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">लागत (Cost ₹)</label>
                  <input type="number" step="0.01" value={vaccinationData.cost} onChange={(e) => setVaccinationData({...vaccinationData, cost: e.target.value})} placeholder="0.00" className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" />
                </div>
              </div>

              <div>
                <label className="block text-white mb-2 text-sm font-medium">अतिरिक्त जानकारी (Notes)</label>
                <textarea
                  value={vaccinationData.notes}
                  onChange={(e) => setVaccinationData({...vaccinationData, notes: e.target.value})}
                  rows="3"
                  placeholder="Any additional details"
                  className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue resize-vertical"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-secondary-700">
              <button type="button" onClick={() => setShowVaccinationForm(false)} className="w-full sm:w-48 h-12 bg-secondary-600 hover:bg-secondary-500 text-white font-semibold rounded-xl border border-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Cancel
              </button>
              <button type="submit" className="w-full sm:w-48 h-12 bg-gradient-to-r from-accent-blue to-accent-blue-dark hover:from-accent-blue-dark hover:to-accent-blue text-white font-semibold rounded-xl border border-accent-blue transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Save Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderBulkVaccinationForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-secondary-700">
          <h3 className="text-white m-0 text-lg font-semibold">सामूहिक टीकाकरण (Bulk Vaccination)</h3>
          <button onClick={() => setShowBulkVaccinationForm(false)} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200">×</button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <div className="mb-4 bg-pink-900/30 border border-pink-500/50 p-4 rounded-lg">
            <p className="text-white m-0 text-sm">आप <strong>{selectedBulkCows.length}</strong> पशुओं का टीकाकरण कर रहे हैं。</p>
          </div>
          <form onSubmit={handleBulkVaccinationSubmit} className="space-y-6">
            <div className="p-5 bg-primary-800 rounded-lg border border-secondary-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">तारीख (Date) *</label>
                  <input type="date" value={bulkVaccinationData.date} onChange={(e) => setBulkVaccinationData({...bulkVaccinationData, date: e.target.value})} className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" required />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">टीके का नाम (Vaccine) *</label>
                  <input type="text" value={bulkVaccinationData.vaccine_name} onChange={(e) => setBulkVaccinationData({...bulkVaccinationData, vaccine_name: e.target.value})} placeholder="e.g., FMD, Lumpy" className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">अगले टीके की तारीख (Next Due)</label>
                  <input type="date" value={bulkVaccinationData.next_due_date} onChange={(e) => setBulkVaccinationData({...bulkVaccinationData, next_due_date: e.target.value})} className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm font-medium">लागत प्रति पशु (Cost/Cow ₹)</label>
                  <input type="number" step="0.01" value={bulkVaccinationData.cost_per_cow} onChange={(e) => setBulkVaccinationData({...bulkVaccinationData, cost_per_cow: e.target.value})} placeholder="0.00" className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue" />
                </div>
              </div>

              <div>
                <label className="block text-white mb-2 text-sm font-medium">अतिरिक्त जानकारी (Notes)</label>
                <textarea value={bulkVaccinationData.notes} onChange={(e) => setBulkVaccinationData({...bulkVaccinationData, notes: e.target.value})} rows="3" placeholder="Any additional details" className="w-full p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue resize-vertical" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-secondary-700">
              <button type="button" onClick={() => setShowBulkVaccinationForm(false)} className="w-full sm:w-48 h-12 bg-secondary-600 hover:bg-secondary-500 text-white font-semibold rounded-xl border border-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Cancel</button>
              <button type="submit" className="w-full sm:w-48 h-12 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white font-semibold rounded-xl border border-pink-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Save Records</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderDateWiseMilkReportModal = () => {
    let filteredRecords = [];
    let totalMilk = 0;

    cows.forEach(cow => {
      if (milkReportFilters.cowId === 'all' || milkReportFilters.cowId === cow._id) {
        if (cow.milk_records && cow.milk_records.length > 0) {
          cow.milk_records.forEach(record => {
            const recordDate = new Date(record.date).toISOString().split('T')[0];
            if (recordDate >= milkReportFilters.fromDate && recordDate <= milkReportFilters.toDate) {
              filteredRecords.push({
                cow_name: `${cow.listing_id} - ${cow.name}`,
                date: recordDate,
                morning_milk: record.morning_milk || 0,
                evening_milk: record.evening_milk || 0,
                total_milk: record.total_milk || 0
              });
              totalMilk += (record.total_milk || 0);
            }
          });
        }
      }
    });

    filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-primary-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-secondary-700 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-secondary-700 shrink-0">
            <h3 className="text-white m-0 text-lg font-semibold flex items-center gap-2">
              <GiMilkCarton className="text-accent-blue" /> दिनांक वार दूध उत्पादन रिपोर्ट
            </h3>
            <button onClick={() => setShowDateWiseMilkReport(false)} className="bg-secondary-600 hover:bg-secondary-500 text-white text-xl cursor-pointer p-2 w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200">×</button>
          </div>
          
          <div className="p-6 border-b border-secondary-700 shrink-0 bg-primary-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-white mb-2 text-sm font-medium">से (From Date)</label>
                <input
                  type="date"
                  value={milkReportFilters.fromDate}
                  onChange={(e) => setMilkReportFilters({...milkReportFilters, fromDate: e.target.value})}
                  className="w-full p-3 bg-primary-900 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div>
                <label className="block text-white mb-2 text-sm font-medium">तक (To Date)</label>
                <input
                  type="date"
                  value={milkReportFilters.toDate}
                  onChange={(e) => setMilkReportFilters({...milkReportFilters, toDate: e.target.value})}
                  className="w-full p-3 bg-primary-900 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div>
                <label className="block text-white mb-2 text-sm font-medium">गाय/भैंस (Cattle)</label>
                <select
                  value={milkReportFilters.cowId}
                  onChange={(e) => setMilkReportFilters({...milkReportFilters, cowId: e.target.value})}
                  className="w-full p-3 bg-primary-900 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue"
                >
                  <option value="all">सभी (All)</option>
                  {cows.map(cow => (
                    <option key={cow._id} value={cow._id}>
                      {cow.listing_id} - {cow.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center bg-blue-900/30 border border-blue-500/50 p-4 rounded-lg">
              <span className="text-white font-medium">कुल उत्पादन (इस अवधि में):</span>
              <span className="text-2xl font-bold text-accent-blue">{totalMilk.toFixed(1)} लीटर</span>
            </div>
          </div>

          <div className="overflow-y-auto p-6 flex-1">
            {filteredRecords.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left border-b border-secondary-600 text-white font-semibold">तारीख</th>
                    {milkReportFilters.cowId === 'all' && <th className="p-3 text-left border-b border-secondary-600 text-white font-semibold">पशु का नाम</th>}
                    <th className="p-3 text-right border-b border-secondary-600 text-white font-semibold">सुबह (L)</th>
                    <th className="p-3 text-right border-b border-secondary-600 text-white font-semibold">शाम (L)</th>
                    <th className="p-3 text-right border-b border-secondary-600 text-white font-semibold">कुल (L)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-primary-600 border-b border-secondary-700">
                      <td className="p-3 text-secondary-300">{new Date(record.date).toLocaleDateString('hi-IN')}</td>
                      {milkReportFilters.cowId === 'all' && <td className="p-3 text-secondary-300">{record.cow_name}</td>}
                      <td className="p-3 text-right text-secondary-300">{record.morning_milk}</td>
                      <td className="p-3 text-right text-secondary-300">{record.evening_milk}</td>
                      <td className="p-3 text-right text-accent-blue font-bold">{record.total_milk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-secondary-400">
                इस अवधि के लिए कोई दूध रिकॉर्ड नहीं मिला।
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary-700 rounded-lg p-6 border border-secondary-700">
        <h2 className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent mb-1 text-3xl">Hareram DudhWale - Admin Panel</h2>
        <p className="text-secondary-300 mb-0 text-base">Milk Business Management System</p>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'cows' && renderCows()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'records' && renderRecords()}
        {activeTab === 'reports' && renderReports()}
      </div>

      {/* Modals remain the same */}
      {showCowForm && renderCowForm()}
      {showCrossingForm && renderCrossingForm()}
      {showInseminationForm && <InseminationForm cow={selectedCow} onClose={() => setShowInseminationForm(false)} onSubmit={handleInseminationSubmit} />}
      {showCalvingForm && <CalvingForm cow={selectedCow} onClose={() => setShowCalvingForm(false)} onSubmit={handleCalvingSubmit} />}
      {showDewormingForm && <DewormingForm cow={selectedCow} onClose={() => setShowDewormingForm(false)} onSubmit={handleDewormingSubmit} />}

      {showSicknessForm && renderSicknessForm()}
      {showPregnancyForm && renderPregnancyForm()}
      {showDryCowForm && renderDryCowForm()}
      {showPaymentSettingsForm && renderPaymentSettingsForm()}
      {showVaccinationForm && renderVaccinationForm()}
      {showBulkVaccinationForm && renderBulkVaccinationForm()}
      {showBulkDewormingForm && renderBulkDewormingForm()}
      {showMilkForm && renderMilkForm()}
      {showDateWiseMilkReport && renderDateWiseMilkReportModal()}
    </div>
  );
};

export default AdminDashboard;