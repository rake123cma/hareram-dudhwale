import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  test('renders login form with customer login by default', () => {
    renderLogin();

    expect(screen.getByText('Hareram DudhWale')).toBeInTheDocument();
    expect(screen.getByText('🥛 Customer Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter 10-digit mobile number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🚀 Login/ })).toBeInTheDocument();
  });

  test('switches to investor login when investor button is clicked', () => {
    renderLogin();

    const investorButton = screen.getByText('💰 Investor');
    fireEvent.click(investorButton);

    expect(screen.getByText('💰 Investor Login')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🚀 Login as Investor/ })).toBeInTheDocument();
  });

  test('switches to admin login when admin button is clicked', () => {
    renderLogin();

    const adminButton = screen.getByText('🛡️ Admin');
    fireEvent.click(adminButton);

    expect(screen.getByText('🛡️ Admin Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter admin username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter admin password')).toBeInTheDocument();
  });

  test('shows alert and redirects to register for unregistered mobile number', async () => {
    renderLogin();

    // Mock alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    const mobileInput = screen.getByPlaceholderText('Enter 10-digit mobile number');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /🚀 Login/ });

    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('This mobile number is not registered. Redirecting to registration page.');
      expect(mockNavigate).toHaveBeenCalledWith('/register', { state: { mobile: '1234567890' } });
    });

    alertMock.mockRestore();
  });

  test('successful customer login with API call', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ phone: '1234567890' }));

    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'test-token' }
    });

    renderLogin();

    const mobileInput = screen.getByPlaceholderText('Enter 10-digit mobile number');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /🚀 Login/ });

    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', {
        mobile: '1234567890',
        password: 'password123'
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(mockNavigate).toHaveBeenCalledWith('/customer');
    });
  });

  test('fallback login when API fails but user is registered', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ phone: '1234567890' }));

    mockedAxios.post.mockRejectedValueOnce(new Error('API error'));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    renderLogin();

    const mobileInput = screen.getByPlaceholderText('Enter 10-digit mobile number');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /🚀 Login/ });

    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('API not available, accepting login for testing');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'registered-customer-token');
      expect(mockNavigate).toHaveBeenCalledWith('/customer');
    });

    consoleSpy.mockRestore();
  });

  test('admin login with API success', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'admin-token', user: { role: 'admin' } }
    });

    renderLogin();

    // Switch to admin
    const adminButton = screen.getByText('🛡️ Admin');
    fireEvent.click(adminButton);

    const usernameInput = screen.getByPlaceholderText('Enter admin username');
    const passwordInput = screen.getByPlaceholderText('Enter admin password');
    const submitButton = screen.getByRole('button', { name: /🚀 Login as Admin/ });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'adminpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', {
        username: 'admin',
        password: 'adminpass'
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'admin-token');
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('admin fallback login when API fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('API error'));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    renderLogin();

    // Switch to admin
    const adminButton = screen.getByText('🛡️ Admin');
    fireEvent.click(adminButton);

    const usernameInput = screen.getByPlaceholderText('Enter admin username');
    const passwordInput = screen.getByPlaceholderText('Enter admin password');
    const submitButton = screen.getByRole('button', { name: /🚀 Login as Admin/ });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'adminpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('API not available, accepting admin login for testing');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token-admin');
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });

    consoleSpy.mockRestore();
  });

  test('shows loading state during submission', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ phone: '1234567890' }));

    mockedAxios.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { token: 'test' } }), 100)));

    renderLogin();

    const mobileInput = screen.getByPlaceholderText('Enter 10-digit mobile number');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /🚀 Login/ });

    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('🔐 Logging in...')).toBeInTheDocument();
    expect(mobileInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /🚀 Login/ })).toBeInTheDocument();
    });
  });

  test('resets form when switching login types', () => {
    renderLogin();

    const mobileInput = screen.getByPlaceholderText('Enter 10-digit mobile number');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Switch to admin
    const adminButton = screen.getByText('🛡️ Admin');
    fireEvent.click(adminButton);

    const usernameInput = screen.getByPlaceholderText('Enter admin username');
    const adminPasswordInput = screen.getByPlaceholderText('Enter admin password');

    expect(usernameInput.value).toBe('');
    expect(adminPasswordInput.value).toBe('');
  });
});