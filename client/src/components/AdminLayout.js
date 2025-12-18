import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

const AdminLayout = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin' },
    { id: 'orders', label: 'Customer Orders', path: '/admin/orders' },
    { id: 'categories', label: 'Categories', path: '/admin/categories' },
    { id: 'products', label: 'Products & Inventory', path: '/admin/products' },
    { id: 'pending-customers', label: 'New Registrations', path: '/admin/pending-customers' },
    { id: 'customers', label: 'Milk Customers', path: '/admin/customers' },
    { id: 'sales', label: 'Daily Sales', path: '/admin/sales' },
    { id: 'billing', label: 'Monthly Billing', path: '/admin/billing' },
    { id: 'payments', label: 'Payment Settings', path: '/admin/payments' },
    { id: 'expenses', label: 'Expenses', path: '/admin/expenses' },
    { id: 'financial', label: 'Financial Management', path: '/admin/financial' },
    { id: 'reports', label: 'Reports', path: '/admin/reports' },
    { id: 'settings', label: 'Settings', path: '/admin/settings' }
  ];

  return (
    <div className="flex min-h-screen bg-secondary-200">
      {/* Sidebar */}
      <div className={`bg-primary-600 text-white py-5 fixed h-screen overflow-y-auto z-10 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}>
        <div className="px-5 pb-8 border-b border-primary-500 mb-5">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <>
                <h2 className="m-0 mb-1 text-xl text-primary-50">Hareram Dudhwale</h2>
                <button
                  onClick={toggleSidebar}
                  className="text-primary-100 hover:text-white transition-colors duration-300 p-1"
                >
                  <FaBars className="text-lg" />
                </button>
              </>
            )}
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="text-primary-100 hover:text-white transition-colors duration-300 p-1"
              >
                <FaBars className="text-lg" />
              </button>
            )}
          </div>
          {sidebarOpen && <p className="m-0 text-sm text-primary-100">Admin Panel</p>}
        </div>
        <nav className="flex-1">
          {menuItems.map(item => (
            <Link
              key={item.id}
              to={item.path}
              className={`block px-5 py-3 text-primary-100 no-underline transition-all duration-300 border-l-4 border-transparent hover:bg-primary-500 hover:text-primary-50 hover:border-accent-blue ${
                activeItem === item.id ? 'bg-accent-blue text-white border-accent-blue-dark' : ''
              } ${!sidebarOpen ? 'px-3 text-center' : ''}`}
              onClick={() => setActiveItem(item.id)}
              title={!sidebarOpen ? item.label : ''}
            >
              {sidebarOpen ? item.label : item.label.charAt(0)}
            </Link>
          ))}
        </nav>
        <div className="px-5 border-t border-primary-500 mt-5">
          <button onClick={handleLogout} className={`bg-accent-red text-white border-none rounded cursor-pointer transition-colors duration-300 hover:bg-accent-red-dark ${
            sidebarOpen ? 'w-full py-2.5' : 'w-10 h-10 flex items-center justify-center mx-auto'
          }`}>
            {sidebarOpen ? 'Logout' : '↪'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-16'
      } p-5 bg-secondary-200`}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
