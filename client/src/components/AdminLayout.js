import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaChartLine, FaUser, FaWallet, FaStar, FaEdit } from 'react-icons/fa';

const AdminLayout = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cattleMenuOpen, setCattleMenuOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Detect screen size for mobile/desktop behavior
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const menuItems = [
    // Cattle Management Section
    { 
      id: 'cattle-management', 
      label: 'Cattle Management', 
      hasSubmenu: true,
      submenu: [
        { id: 'overview', label: 'अवलोकन', path: '/admin/overview', icon: FaChartLine },
        { id: 'livestock', label: 'पशुधन', path: '/admin/livestock', icon: FaUser },
        { id: 'payments', label: 'पेमेंट', path: '/admin/payments', icon: FaWallet },
        { id: 'reviews', label: 'रिव्यू', path: '/admin/reviews', icon: FaStar },
        { id: 'record-update', label: 'रेकॉर्ड अपडेट', path: '/admin/record-update', icon: FaEdit },
        { id: 'reports', label: 'रिपोर्ट', path: '/admin/cattle-reports', icon: FaChartLine }
      ]
    },
    // Other Admin Items
    { id: 'dashboard', label: 'Dashboard', path: '/admin' },
    { id: 'orders', label: 'Customer Orders', path: '/admin/orders' },
    { id: 'categories', label: 'Categories', path: '/admin/categories' },
    { id: 'products', label: 'Products & Inventory', path: '/admin/products' },
    { id: 'pending-customers', label: 'New Registrations', path: '/admin/pending-customers' },
    { id: 'customers', label: 'Milk Customers', path: '/admin/customers' },
    { id: 'sales', label: 'Daily Sales', path: '/admin/sales' },
    { id: 'billing', label: 'Monthly Billing', path: '/admin/billing' },
    { id: 'reports', label: 'Reports', path: '/admin/reports' },
    { id: 'financial', label: 'Financial Management', path: '/admin/financial' },
    { id: 'settings', label: 'Settings', path: '/admin/settings' }
  ];

  return (
    <div className="flex min-h-screen bg-secondary-200">
      {/* Mobile Menu Button - only visible on mobile */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary-600 text-white p-4 flex items-center justify-between shadow-md">
          <h2 className="text-lg font-semibold">Hareram Dudhwale</h2>
          <button
            onClick={toggleSidebar}
            className="text-white hover:text-primary-100 transition-colors duration-300 p-2"
          >
            <FaBars className="text-xl" />
          </button>
        </div>
      )}

      {/* Mobile Overlay - only visible when sidebar is open on mobile */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-primary-600 text-white py-5 h-screen overflow-y-auto transition-all duration-300
        ${isMobile ? 'fixed z-40 w-64 transform' : 'relative z-auto w-64'}
        ${sidebarOpen ? (isMobile ? 'translate-x-0' : '') : (isMobile ? '-translate-x-full' : '')}
      `}>
        <div className="px-5 pb-8 border-b border-primary-500 mb-5 mt-0">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <>
                <h2 className="m-0 mb-1 text-xl text-primary-50">Hareram Dudhwale</h2>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <FaUser className="text-lg text-primary-100" />
              </div>
            )}
          </div>
          {sidebarOpen && <p className="m-0 text-sm text-primary-100">Admin Panel</p>}
        </div>
        <nav className="flex-1">
          {menuItems.map(item => (
            <div key={item.id}>
              {item.hasSubmenu ? (
                // Cattle Management Section with Submenu
                <>
                  <div
                    className={`block px-5 py-3 text-primary-100 no-underline transition-all duration-300 border-l-4 border-transparent hover:bg-primary-500 hover:text-primary-50 hover:border-accent-blue ${
                      cattleMenuOpen ? 'bg-primary-500 text-primary-50 border-accent-blue' : ''
                    } ${!sidebarOpen ? 'px-3 text-center' : ''}`}
                    onClick={() => item.id === 'cattle-management' && setCattleMenuOpen(!cattleMenuOpen)}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <div className="flex items-center">
                      <FaUser className="text-lg" />
                      {sidebarOpen && (
                        <>
                          <span className="ml-3">{item.label}</span>
                          <span className="ml-auto">
                            {cattleMenuOpen ? '▼' : '▶'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Submenu Items */}
                  {sidebarOpen && cattleMenuOpen && (
                    <div className="ml-4 space-y-1">
                      {item.submenu.map(subItem => (
                        <Link
                          key={subItem.id}
                          to={subItem.path}
                          className={`block px-5 py-2 text-sm text-primary-100 no-underline transition-all duration-300 border-l-2 border-transparent hover:bg-primary-600 hover:text-primary-50 hover:border-accent-green ${
                            activeItem === subItem.id ? 'bg-accent-green/20 text-accent-green border-accent-green' : ''
                          }`}
                          onClick={() => {
                            setActiveItem(subItem.id);
                            // Only close sidebar on mobile after navigation
                            if (isMobile) {
                              setSidebarOpen(false);
                            }
                          }}
                        >
                          <div className="flex items-center">
                            {subItem.icon && <subItem.icon className="text-sm" />}
                            <span className="ml-2">{subItem.label}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Regular Menu Items
                <Link
                  to={item.path}
                  className={`block px-5 py-3 text-primary-100 no-underline transition-all duration-300 border-l-4 border-transparent hover:bg-primary-500 hover:text-primary-50 hover:border-accent-blue ${
                    activeItem === item.id ? 'bg-accent-blue text-white border-accent-blue-dark' : ''
                  } ${!sidebarOpen ? 'px-3 text-center' : ''}`}
                  onClick={() => {
                    setActiveItem(item.id);
                    // Only close sidebar on mobile after navigation
                    if (isMobile) {
                      setSidebarOpen(false);
                    }
                  }}
                  title={!sidebarOpen ? item.label : ''}
                >
                  {sidebarOpen ? item.label : item.label.charAt(0)}
                </Link>
              )}
            </div>
          ))}
        </nav>
        <div className="px-5 border-t border-primary-500 mt-5">
          <button onClick={() => {
            handleLogout();
            // Only close sidebar on mobile after logout
            if (isMobile) {
              setSidebarOpen(false);
            }
          }} className={`bg-accent-red text-white border-none rounded cursor-pointer transition-colors duration-300 hover:bg-accent-red-dark ${
            sidebarOpen ? 'w-full py-2.5' : 'w-10 h-10 flex items-center justify-center mx-auto'
          }`}>
            {sidebarOpen ? 'Logout' : '↪'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`
        flex-1 transition-all duration-300 p-5 bg-secondary-200
        ${isMobile ? 'mt-16 ml-0' : 'mt-0 ml-0'}
      `}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
