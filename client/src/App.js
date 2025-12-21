import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import ProductsPage from './components/ProductsPage';
import Login from './components/Login';
import Register from './components/Register';
import AdminRegister from './components/AdminRegister';
import ForgotPassword from './components/ForgotPassword';
import AdminChangePassword from './components/AdminChangePassword';
import OAuthSuccess from './components/OAuthSuccess';
import OAuthHandler from './components/OAuthHandler';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminSettings from './components/AdminSettings';
import OrdersManagement from './components/OrdersManagement';
import CategoriesList from './components/CategoriesList';
import ProductsList from './components/ProductsList';
import PendingCustomers from './components/PendingCustomers';
import CustomersList from './components/CustomersList';
import DailyAttendance from './components/DailyAttendance';
import BillingManagement from './components/BillingManagement';
import ExpensesManagement from './components/ExpensesManagement';
import FinancialManagement from './components/FinancialManagement';
import ReportsPage from './components/ReportsPage';
import CustomerDashboard from './components/CustomerDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth-handler" element={<OAuthHandler />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin-change-password" element={<AdminChangePassword />} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="overview" element={<AdminDashboard />} />
          <Route path="livestock" element={<AdminDashboard />} />
          <Route path="payments" element={<AdminDashboard />} />
          <Route path="reviews" element={<AdminDashboard />} />
          <Route path="record-update" element={<AdminDashboard />} />
          <Route path="cattle-reports" element={<AdminDashboard />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="categories" element={<CategoriesList />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="pending-customers" element={<PendingCustomers />} />
          <Route path="customers" element={<CustomersList />} />
          <Route path="sales" element={<DailyAttendance />} />
          <Route path="billing" element={<BillingManagement />} />
          <Route path="expenses" element={<ExpensesManagement />} />
          <Route path="financial" element={<FinancialManagement />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="/customer" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;
