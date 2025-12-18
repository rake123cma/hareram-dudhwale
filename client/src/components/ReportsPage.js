import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaFileAlt, FaCalendarAlt, FaUsers, FaChartLine, FaSearch, FaDownload, FaFileCsv } from 'react-icons/fa';

const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState(null); // null = menu, 'attendance' = attendance report
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAttendanceReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get(`/api/reports/monthly-attendance?year=${selectedYear}&month=${selectedMonth}`, config);
      setAttendanceData(response.data);
    } catch (err) {
      Swal.fire('Error', 'Failed to fetch attendance report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceReport();
  }, [selectedMonth, selectedYear]);

  // Search functionality
  useEffect(() => {
    if (attendanceData && attendanceData.customers) {
      if (searchTerm.trim() === '') {
        setFilteredData(attendanceData);
      } else {
        const filtered = {
          ...attendanceData,
          customers: attendanceData.customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        };
        setFilteredData(filtered);
      }
    }
  }, [attendanceData, searchTerm]);

  // CSV Download function
  const downloadCSV = () => {
    if (!filteredData || !filteredData.customers) return;

    // Create CSV headers
    const headers = ['Customer Name'];
    const daysInMonth = new Date(filteredData.year, filteredData.month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      headers.push(`${day}`);
    }
    headers.push('Total Milk', 'Rate (₹)', 'Total Amount (₹)', 'Paid Amount (₹)', 'Dues Amount (₹)', 'Advance Amount (₹)');

    // Create CSV rows
    const csvRows = [];

    // Add title
    csvRows.push([`${filteredData.month_name} ${filteredData.year} - Attendance Report`]);
    csvRows.push([]); // Empty row
    csvRows.push(headers);

    // Add customer data
    filteredData.customers.forEach(customer => {
      const row = [customer.name];

      // Add attendance data
      for (let day = 1; day <= daysInMonth; day++) {
        row.push(customer.attendance[day] || '-');
      }

      // Add financial data
      row.push(customer.total_milk || 0);
      row.push(customer.rate || 0);
      row.push(customer.total_amount || 0);
      row.push(customer.paid_amount || 0);
      row.push(customer.dues_amount || 0);
      row.push(customer.advance_amount || 0);

      csvRows.push(row);
    });

    // Add grand total
    if (filteredData.grand_total) {
      csvRows.push([]); // Empty row
      const totalRow = ['GRAND TOTAL'];
      for (let i = 0; i < daysInMonth; i++) {
        totalRow.push('');
      }
      totalRow.push(filteredData.grand_total.total_milk || 0);
      totalRow.push('-');
      totalRow.push(filteredData.grand_total.total_amount || 0);
      totalRow.push(filteredData.grand_total.paid_amount || 0);
      totalRow.push(filteredData.grand_total.dues_amount || 0);
      totalRow.push(filteredData.grand_total.advance_amount || 0);
      csvRows.push(totalRow);
    }

    // Convert to CSV string
    const csvContent = csvRows.map(row =>
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-report-${filteredData.month_name}-${filteredData.year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  // Reports Menu Component
  const renderReportsMenu = () => (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reports Dashboard</h2>
          <p className="text-gray-600">Select a report to view detailed analytics and data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Milk Customer Attendance Report */}
          <div
            onClick={() => setActiveReport('attendance')}
            className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
              <FaCalendarAlt className="text-blue-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Milk Customer Attendance</h3>
            <p className="text-gray-600 text-sm mb-4">Monthly attendance sheet with milk delivery records, billing summary, and customer-wise totals</p>
            <div className="flex items-center text-blue-600 text-sm font-medium">
              View Report <FaFileAlt className="ml-2" />
            </div>
          </div>

          {/* Placeholder for future reports */}
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center">
            <div className="text-center">
              <FaChartLine className="text-gray-400 text-2xl mb-2 mx-auto" />
              <p className="text-gray-500 text-sm">More reports coming soon</p>
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center">
            <div className="text-center">
              <FaUsers className="text-gray-400 text-2xl mb-2 mx-auto" />
              <p className="text-gray-500 text-sm">Customer analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendanceTable = () => {
    const dataToUse = filteredData || attendanceData;
    if (!dataToUse || !dataToUse.customers) return null;

    const daysInMonth = getDaysInMonth(dataToUse.year, dataToUse.month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Get day names for the month
    const getDayName = (year, month, day) => {
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    };

    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-800 text-lg font-semibold">
              {dataToUse.month_name} {dataToUse.year} - Attendance Sheet
            </h3>
            <div className="text-gray-600 text-sm">
              {dataToUse.customers.length} Customers
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm min-w-max">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800" rowSpan="2">Customer Name</th>
                {days.map(day => (
                  <th key={day} className="border border-gray-300 px-2 py-2 text-center font-semibold text-gray-800 min-w-[60px]">
                    <div className="text-sm">{day}</div>
                    <div className="text-xs text-gray-600">{getDayName(dataToUse.year, dataToUse.month, day)}</div>
                  </th>
                ))}
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800" rowSpan="2">Total Milk</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800" rowSpan="2">Rate</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800" rowSpan="2">Total Rs</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800" rowSpan="2">Paid Rs</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800" rowSpan="2">Dues Amount</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800" rowSpan="2">Advance Rs</th>
              </tr>
              <tr className="bg-gray-100">
                {days.map(day => (
                  <th key={`milk-${day}`} className="border border-gray-300 px-2 py-1 text-center text-xs text-gray-600">
                    Milk (L)
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataToUse.customers.map((customer, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800 bg-gray-50">{customer.name}</td>
                  {days.map(day => (
                    <td key={day} className="border border-gray-300 px-2 py-3 text-center">
                      {customer.attendance[day] !== undefined ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold border border-green-200">
                          {customer.attendance[day]}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-4 py-3 text-center font-bold text-green-600 bg-gray-50">
                    {customer.total_milk}L
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-gray-800 bg-gray-50">
                    ₹{customer.rate}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-blue-600 bg-gray-50">
                    ₹{customer.total_amount?.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-green-600 bg-gray-50">
                    ₹{customer.paid_amount?.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-red-600 bg-gray-50">
                    ₹{customer.dues_amount?.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-purple-600 bg-gray-50">
                    ₹{customer.advance_amount?.toFixed(2)}
                  </td>
                </tr>
              ))}
              {/* Grand Total Row */}
              {dataToUse.grand_total && (
                <tr className="bg-blue-50 border-t-2 border-blue-300">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-blue-800 bg-blue-100" colSpan={days.length + 1}>
                    GRAND TOTAL
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-800 bg-blue-100">
                    {attendanceData.grand_total.total_milk}L
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center bg-blue-100">
                    -
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-800 bg-blue-100">
                    ₹{attendanceData.grand_total.total_amount?.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-800 bg-blue-100">
                    ₹{attendanceData.grand_total.paid_amount?.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-800 bg-blue-100">
                    ₹{attendanceData.grand_total.dues_amount?.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-800 bg-blue-100">
                    ₹{attendanceData.grand_total.advance_amount?.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <div className="mt-4 text-gray-600 text-sm border-t border-gray-200 pt-4">
            <p><strong>Note:</strong> "-" indicates no milk delivery for that day. Green boxes show liters delivered.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {activeReport && (
                <button
                  onClick={() => setActiveReport(null)}
                  className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                >
                  ← Back
                </button>
              )}
              <FaFileAlt className="text-blue-600 text-lg flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-gray-800 text-base font-bold truncate">
                  {activeReport === 'attendance' ? 'Milk Customer Attendance Report' : 'Reports Dashboard'}
                </h1>
                <p className="text-gray-600 text-xs truncate">
                  {activeReport === 'attendance' ? 'Monthly attendance and billing summary' : 'Select a report to view'}
                </p>
              </div>
            </div>

            {/* Controls - Only show for attendance report */}
            {activeReport === 'attendance' && (
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Month/Year Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <label className="text-gray-700 text-xs font-medium">Month:</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-800 text-xs focus:outline-none focus:border-blue-500 w-24"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString('default', { month: 'short' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-gray-700 text-xs font-medium">Year:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-800 text-xs focus:outline-none focus:border-blue-500 w-20"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                  <button
                    onClick={fetchAttendanceReport}
                    disabled={loading}
                    className="bg-blue-600 text-white border-none px-2 py-1 rounded cursor-pointer text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '...' : 'Go'}
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-6 pr-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 w-48"
                  />
                </div>

                {/* Download Button */}
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-1 bg-green-600 text-white border-none px-2 py-1 rounded cursor-pointer text-xs hover:bg-green-700 disabled:opacity-50"
                  disabled={!filteredData || !filteredData.customers}
                >
                  <FaFileCsv className="text-xs" />
                  CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeReport === 'attendance' ? (
          <div className="h-full p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-blue-600 text-6xl mb-4">⟳</div>
                  <h4 className="text-gray-800 text-xl mb-2">Loading Report...</h4>
                  <p className="text-gray-600">Please wait while we fetch the attendance data.</p>
                </div>
              </div>
            ) : attendanceData && attendanceData.customers.length > 0 ? (
              renderAttendanceTable()
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FaFileAlt className="text-blue-600 text-6xl mx-auto mb-4" />
                  <h4 className="text-gray-800 text-xl mb-2">No Attendance Data</h4>
                  <p className="text-gray-600">No attendance records found for the selected month.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          renderReportsMenu()
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
