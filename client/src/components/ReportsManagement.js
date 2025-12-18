import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaFileAlt, FaCalendarAlt } from 'react-icons/fa';

const ReportsManagement = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const renderAttendanceTable = () => {
    if (!attendanceData || !attendanceData.customers) return null;

    const daysInMonth = getDaysInMonth(attendanceData.year, attendanceData.month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="bg-primary-800 border border-secondary-700 rounded-lg p-6 overflow-x-auto">
        <h3 className="text-white text-xl font-semibold mb-4">
          Milk Customer Attendance Sheet - {attendanceData.month_name} {attendanceData.year}
        </h3>

        <table className="w-full text-white">
          <thead>
            <tr className="border-b border-secondary-600">
              <th className="text-left py-3 px-4 font-semibold">Customer Name</th>
              {days.map(day => (
                <th key={day} className="text-center py-3 px-2 font-semibold text-sm min-w-[60px]">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attendanceData.customers.map((customer, index) => (
              <tr key={index} className="border-b border-secondary-700 hover:bg-primary-700">
                <td className="py-3 px-4 font-medium">{customer.name}</td>
                {days.map(day => (
                  <td key={day} className="text-center py-3 px-2">
                    {customer.attendance[day] !== undefined ? (
                      <span className="bg-accent-green text-black px-2 py-1 rounded text-sm font-semibold">
                        {customer.attendance[day]}L
                      </span>
                    ) : (
                      <span className="text-secondary-500">-</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-primary-700 rounded-lg p-6 mb-5 border border-secondary-700">
      <div className="flex items-center justify-between mb-5">
        <h3 className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent mb-0 flex items-center gap-3">
          <FaFileAlt className="text-accent-blue text-xl" />
          Reports Management
        </h3>
      </div>

      <div className="mb-6">
        <div className="flex gap-4 items-end mb-4">
          <div>
            <label className="block text-white mb-2 text-sm font-medium">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white mb-2 text-sm font-medium">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="p-3 bg-primary-800 border border-secondary-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20"
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
            className="bg-accent-blue text-white border-none px-6 py-3 rounded-lg cursor-pointer flex items-center gap-2 text-sm hover:bg-accent-blue-dark disabled:opacity-50"
          >
            <FaCalendarAlt />
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-accent-blue text-6xl mb-4">⟳</div>
          <h4 className="text-white text-xl mb-2">Loading Report...</h4>
          <p className="text-secondary-400">Please wait while we fetch the attendance data.</p>
        </div>
      ) : attendanceData && attendanceData.customers.length > 0 ? (
        renderAttendanceTable()
      ) : (
        <div className="text-center py-12 bg-primary-800 border-2 border-dashed border-secondary-600 rounded-lg">
          <FaFileAlt className="text-accent-blue text-6xl mx-auto mb-4" />
          <h4 className="text-white text-xl mb-2">No Attendance Data</h4>
          <p className="text-secondary-400">No attendance records found for the selected month.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;
