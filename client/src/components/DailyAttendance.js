import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaSearch, FaPlus, FaSave, FaCheck, FaTimes, FaUserCheck, FaUserTimes, FaGlassWhiskey, FaSync } from 'react-icons/fa';

const DailyAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [customers, setCustomers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('all');

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Monitor data changes for debugging (can be removed in production)

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get('/api/customers', config);
      // Only show customers who are currently daily milk customers
      const milkCustomers = response.data.filter(customer =>
        customer.is_active && customer.customer_type === 'daily milk customer'
      );
      setCustomers(milkCustomers);
    } catch (err) {
      // API not available - no temporary storage allowed
      setCustomers([]);
      setError('Failed to fetch customers');
    }
  };

  const refreshCustomers = () => {
    fetchCustomers();
    // Also refresh attendance data for the current date
    if (selectedDate && customers.length >= 0) {
      fetchAttendanceForDate();
    }
  };

  const fetchAttendanceForDate = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`/api/daily-attendance/date/${selectedDate}`, config);
      const attendanceData = response.data;

      // If no attendance records exist, initialize with all customers as absent
      if (attendanceData.length === 0) {
        console.log('Initializing attendance for new date:', selectedDate);
        console.log('Customers data:', customers.map(c => ({ name: c.name, last_milk_quantity: c.last_milk_quantity, delivery_time: c.delivery_time })));
        
        const initialAttendance = customers.map(customer => {
          const defaultMilkQuantity = customer.delivery_time === 'both' ? 2 : customer.last_milk_quantity || 1;
          console.log(`Customer ${customer.name}: delivery_time=${customer.delivery_time}, last_milk_quantity=${customer.last_milk_quantity}, default=${defaultMilkQuantity}`);
          
          return {
            customer_id: customer._id,
            customer: customer,
            status: 'unmarked', // Changed from 'absent' to 'unmarked'
            milk_quantity: defaultMilkQuantity, // Use last milk quantity as default
            additional_products: [],
            notes: '',
            _id: null // New record
          };
        });
        setAttendance(initialAttendance);
      } else {
        // Merge existing attendance with customer data
        const mergedAttendance = attendanceData.map(attendance => ({
          ...attendance,
          customer: customers.find(c => c._id === attendance.customer_id) || attendance.customer_id
        }));
        setAttendance(mergedAttendance);
      }
    } catch (err) {
      setError('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, customers]);

  useEffect(() => {
    if (selectedDate && customers.length > 0) {
      fetchAttendanceForDate();
    }
  }, [selectedDate, customers, fetchAttendanceForDate]);

  const updateAttendance = (customerId, field, value) => {
    if (!customerId) return; // Don't update if customerId is null/undefined

    setAttendance(prev => prev.map(item => {
      const itemCustomerId = item.customer_id?._id || item.customer_id;
      return itemCustomerId === customerId
        ? { ...item, [field]: value }
        : item;
    }));
  };

  const addProduct = (customerId) => {
    setAttendance(prev => prev.map(item => {
      const itemCustomerId = item.customer_id?._id || item.customer_id;
      if (itemCustomerId === customerId) {
        const newProduct = {
          product_type: 'eggs',
          quantity: 1,
          unit_price: 10,
          total_amount: 10
        };
        return {
          ...item,
          additional_products: [...(item.additional_products || []), newProduct]
        };
      }
      return item;
    }));
  };

  const removeProduct = (customerId, index) => {
    setAttendance(prev => prev.map(item => {
      const itemCustomerId = item.customer_id?._id || item.customer_id;
      if (itemCustomerId === customerId) {
        const updatedProducts = (item.additional_products || []).filter((_, idx) => idx !== index);
        return {
          ...item,
          additional_products: updatedProducts
        };
      }
      return item;
    }));
  };

  const updateProduct = (customerId, index, field, value) => {
    setAttendance(prev => prev.map(item => {
      const itemCustomerId = item.customer_id?._id || item.customer_id;
      if (itemCustomerId === customerId) {
        const updatedProducts = (item.additional_products || []).map((product, idx) => {
          if (idx === index) {
            const updatedProduct = { ...product, [field]: value };
            if (field === 'quantity' || field === 'unit_price') {
              updatedProduct.total_amount = (updatedProduct.quantity || 0) * (updatedProduct.unit_price || 0);
            }
            return updatedProduct;
          }
          return product;
        });
        return {
          ...item,
          additional_products: updatedProducts
        };
      }
      return item;
    }));
  };

  const markAllPresent = () => {
    setAttendance(prev => prev.map(item => ({
      ...item,
      status: 'present'
    })));
  };


  const saveAttendance = async () => {
    // Validation: Check for present customers with 0 liters
    const presentWithZeroLiters = attendance.filter(item =>
      item.status === 'present' && (item.milk_quantity === 0 || item.milk_quantity === null || item.milk_quantity === undefined)
    );

    if (presentWithZeroLiters.length > 0) {
      const customerNames = presentWithZeroLiters.map(item => {
        const customer = item.customer || item.customer_id;
        return customer?.name || 'Unknown Customer';
      }).join(', ');

      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: `The following customers are marked as present but have 0 liters: ${customerNames}. Please enter the correct milk quantity or mark them as absent.`,
        confirmButtonText: 'OK'
      });
      return;
    }

    setSaving(true);
    try {
      const attendanceData = attendance.map(item => {
        const customerId = item.customer_id?._id || item.customer_id;
        if (!customerId) return null; // Skip items without valid customer ID

        // Only save marked attendance (present or absent), skip unmarked
        if (item.status === 'unmarked') return null;

        return {
          customer_id: customerId,
          status: item.status,
          milk_quantity: item.status === 'present' ? item.milk_quantity : 0,
          additional_products: item.additional_products || [],
          notes: item.notes
        };
      }).filter(item => item !== null); // Remove null items and unmarked items

      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post('/api/daily-attendance/bulk', {
        date: selectedDate,
        attendanceData
      }, config);

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Attendance saved successfully!',
        timer: 2000,
        showConfirmButton: false
      });
      fetchAttendanceForDate(); // Refresh data
    } catch (err) {
      setError('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getTotalMilk = () => {
    return attendance
      .filter(item => item.status === 'present')
      .reduce((total, item) => total + (item.milk_quantity || 0), 0);
  };

  const getTotalMilkRevenue = () => {
    return attendance
      .filter(item => item.status === 'present')
      .reduce((total, item) => {
        const customer = item.customer || item.customer_id;
        const milkPrice = (item.milk_quantity || 0) * (customer?.price_per_liter || 0);
        const productPrice = (item.additional_products || []).reduce((sum, product) => sum + (product.total_amount || 0), 0);
        return total + milkPrice + productPrice;
      }, 0);
  };

  const getPresentCount = () => {
    return attendance.filter(item => item.status === 'present').length;
  };

  const getAbsentCount = () => {
    return attendance.filter(item => item.status === 'absent').length;
  };

  const getUnmarkedCount = () => {
    return attendance.filter(item => item.status === 'unmarked').length;
  };

  const getFilteredAttendance = () => {
    return attendance.filter(item => {
      const customer = item.customer || item.customer_id;
      const customerName = customer?.name || '';
      const customerPhone = customer?.phone || '';
      const deliveryTime = customer?.delivery_time || 'morning';

      // Search filter
      const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customerPhone.includes(searchTerm);

      // Delivery time filter
      const matchesDelivery = deliveryFilter === 'all' || deliveryTime === deliveryFilter;

      return matchesSearch && matchesDelivery;
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen text-white text-xl">
      <div className="animate-pulse">Loading attendance...</div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-inter">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 gap-4">
        <h2 className="m-0 text-3xl font-bold text-gray-800">Daily Milk Attendance & Sales</h2>
        <div className="flex items-center gap-3">
          <label className="font-semibold text-gray-700 text-sm">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-3 px-4 bg-white border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      {error && <div className="bg-red-500 text-white p-4 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300">
          <h3 className="text-gray-700 text-lg font-semibold mb-2">Total Customers</h3>
          <p className="text-3xl font-bold text-gray-800">{customers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg text-center border-l-4 border-green-500 hover:shadow-xl transition-all duration-300">
          <h3 className="text-gray-700 text-lg font-semibold mb-2">Present Today</h3>
          <p className="text-3xl font-bold text-gray-800">{getPresentCount()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg text-center border-l-4 border-red-500 hover:shadow-xl transition-all duration-300">
          <h3 className="text-gray-700 text-lg font-semibold mb-2">Absent Today</h3>
          <p className="text-3xl font-bold text-gray-800">{getAbsentCount()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg text-center border-l-4 border-gray-500 hover:shadow-xl transition-all duration-300">
          <h3 className="text-gray-700 text-lg font-semibold mb-2">Unmarked</h3>
          <p className="text-3xl font-bold text-gray-800">{getUnmarkedCount()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg text-center border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-300">
          <h3 className="text-gray-700 text-lg font-semibold mb-2">Total Milk (L)</h3>
          <p className="text-3xl font-bold text-gray-800">{getTotalMilk()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg text-center border-l-4 border-green-600 hover:shadow-xl transition-all duration-300">
          <h3 className="text-gray-700 text-lg font-semibold mb-2">Milk Revenue (₹)</h3>
          <p className="text-3xl font-bold text-gray-800">₹{getTotalMilkRevenue().toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex gap-3 flex-wrap">
            <button onClick={refreshCustomers} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors duration-300 flex items-center gap-2">
              <FaSync />
              Refresh Customers
            </button>
            <button onClick={markAllPresent} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-300 flex items-center gap-2">
              <FaUserCheck />
              Mark All Present
            </button>
            <button onClick={saveAttendance} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center gap-2" disabled={saving}>
              <FaSave />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-800 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium text-gray-700 text-sm whitespace-nowrap">Filter by Delivery:</label>
              <select
                value={deliveryFilter}
                onChange={(e) => setDeliveryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Times</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto overflow-y-scroll border border-gray-200" style={{ maxHeight: '55vh' }}>
        <table className="w-full border-collapse min-w-[400px] sm:min-w-[600px] md:min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left border-b border-gray-200 font-bold text-gray-800 text-sm uppercase tracking-wider">Customer Name</th>
              <th className="p-4 text-left border-b border-gray-200 font-bold text-gray-800 text-sm uppercase tracking-wider hidden sm:table-cell">Phone</th>
              <th className="p-4 text-left border-b border-gray-200 font-bold text-gray-800 text-sm uppercase tracking-wider">Delivery Time</th>
              <th className="p-4 text-left border-b border-gray-200 font-bold text-gray-800 text-sm uppercase tracking-wider">Status</th>
              <th className="p-4 text-left border-b border-gray-200 font-bold text-gray-800 text-sm uppercase tracking-wider">Milk (L)</th>
              <th className="p-4 text-left border-b border-gray-200 font-bold text-gray-800 text-sm uppercase tracking-wider hidden md:table-cell">Products</th>
              <th className="p-4 text-left border-b border-gray-200 font-bold text-gray-800 text-sm uppercase tracking-wider hidden lg:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAttendance().map((item, index) => {
              const customer = item.customer || item.customer_id;
              const customerName = customer?.name || 'Unknown Customer';
              const customerPhone = customer?.phone || 'N/A';
              const deliveryTime = customer?.delivery_time || 'morning';

              return (
                <tr key={customer?._id || `temp-${index}`} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200`}>
                  <td className="p-4 text-left border-b border-gray-200 text-gray-800 text-sm font-medium">{customerName}</td>
                  <td className="p-4 text-left border-b border-gray-200 text-gray-600 text-sm hidden sm:table-cell">{customerPhone}</td>
                  <td className="p-4 text-left border-b border-gray-200">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${deliveryTime === 'morning' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : deliveryTime === 'evening' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                      {deliveryTime === 'both' ? 'Both' : deliveryTime === 'morning' ? 'Morning' : 'Evening'}
                    </span>
                  </td>
                  <td className="p-4 text-left border-b border-gray-200">
                    <select
                      value={item.status}
                      onChange={(e) => updateAttendance(customer?._id, 'status', e.target.value)}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        item.status === 'present' ? 'bg-green-100 text-green-800 border-green-300' :
                        item.status === 'absent' ? 'bg-red-100 text-red-800 border-red-300' :
                        'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      <option value="unmarked">Unmarked</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                    </select>
                  </td>
                  <td className="p-4 text-left border-b border-gray-200">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.milk_quantity || 0}
                      onChange={(e) => updateAttendance(customer?._id, 'milk_quantity', parseFloat(e.target.value) || 0)}
                      disabled={item.status === 'absent' || item.status === 'unmarked'}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-20 disabled:bg-gray-100 disabled:text-gray-400"
                      placeholder="0"
                    />
                  </td>
                  <td className="p-4 text-left border-b border-gray-200 hidden md:table-cell">
                    <div className="max-w-[200px]">
                      {item.additional_products && item.additional_products.length > 0 ? (
                        <div className="space-y-2">
                          {item.additional_products.map((product, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <select
                                value={product.product_type}
                                onChange={(e) => updateProduct(customer?._id, idx, 'product_type', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="eggs">Eggs</option>
                                <option value="paneer">Paneer</option>
                                <option value="ghee">Ghee</option>
                                <option value="mithai">Mithai</option>
                              </select>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={product.quantity}
                                onChange={(e) => updateProduct(customer?._id, idx, 'quantity', parseFloat(e.target.value) || 0)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-12"
                                placeholder="Qty"
                              />
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={product.unit_price}
                                onChange={(e) => updateProduct(customer?._id, idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-14"
                                placeholder="Price"
                              />
                              <span className="text-blue-600 text-xs font-bold">= ₹{product.total_amount}</span>
                              <button onClick={() => removeProduct(customer?._id, idx)} className="bg-red-500 hover:bg-red-600 text-white border-none rounded-full w-5 h-5 text-xs cursor-pointer transition-colors duration-200">×</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs italic">No products</span>
                      )}
                      <button onClick={() => addProduct(customer?._id)} className="mt-2 bg-green-600 hover:bg-green-700 text-white border-none rounded-lg px-3 py-2 text-xs cursor-pointer transition-all duration-300 flex items-center gap-1">
                        <FaPlus className="text-xs" />
                        Add Product
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-left border-b border-gray-200 hidden lg:table-cell">
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => updateAttendance(customer?._id, 'notes', e.target.value)}
                      placeholder="Add notes..."
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {getFilteredAttendance().length === 0 && (
          <div className="text-center py-16 text-gray-500 text-lg italic">No customers found for the selected filters.</div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 mt-8 shadow-lg">
        <h3 className="mb-6 text-gray-800 text-xl font-bold">Instructions:</h3>
        <ul className="space-y-3">
          <li className="text-gray-700 flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            Select the date for which you want to mark attendance
          </li>
          <li className="text-gray-700 flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            Use "Refresh Customers" if you made changes to customer types in other menus
          </li>
          <li className="text-gray-700 flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            Use "Mark All Present/Absent" buttons for bulk operations
          </li>
          <li className="text-gray-700 flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            Unmarked customers won't be saved - mark them as Present or Absent
          </li>
          <li className="text-gray-700 flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            For present customers, enter the milk quantity they took (default from last time)
          </li>
          <li className="text-gray-700 flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            Absent customers automatically get 0 milk quantity
          </li>
          <li className="text-gray-700 flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            Add notes for special cases (extra milk, changes, etc.)
          </li>
          <li className="text-gray-700 flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            Click "Save Attendance" to record the daily data
          </li>
        </ul>
      </div>
    </div>
    
  );
};

export default DailyAttendance;
