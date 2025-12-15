import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Register from './Register';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
  };

  test('renders registration form', () => {
    renderRegister();

    expect(screen.getByText('Hareram DudhWale')).toBeInTheDocument();
    expect(screen.getByText('Create your customer account')).toBeInTheDocument();
    expect(screen.getByText('Customer Registration')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('10-digit mobile number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter pincode')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your complete delivery address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  test('pre-fills mobile number from location state', () => {
    // Mock useLocation with mobile
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useLocation: () => ({ state: { mobile: '1234567890' } }),
    }));

    renderRegister();

    const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
    expect(mobileInput.value).toBe('1234567890');
  });

  test('handles input changes', () => {
    renderRegister();

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create password');
    const pincodeInput = screen.getByPlaceholderText('Enter pincode');
    const addressTextarea = screen.getByPlaceholderText('Enter your complete delivery address');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(pincodeInput, { target: { value: '834001' } });
    fireEvent.change(addressTextarea, { target: { value: '123 Main St' } });

    expect(nameInput.value).toBe('John Doe');
    expect(mobileInput.value).toBe('1234567890');
    expect(emailInput.value).toBe('john@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(pincodeInput.value).toBe('834001');
    expect(addressTextarea.value).toBe('123 Main St');
  });

  test('successful registration with API call', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] }); // No existing customer
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Registration successful' } });

    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    renderRegister();

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create password');
    const pincodeInput = screen.getByPlaceholderText('Enter pincode');
    const addressTextarea = screen.getByPlaceholderText('Enter your complete delivery address');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(pincodeInput, { target: { value: '834001' } });
    fireEvent.change(addressTextarea, { target: { value: '123 Main St' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/customers?phone=1234567890');
      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/register', {
        name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        password: 'password123',
        pincode: '834001',
        address: '123 Main St'
      });
      expect(alertMock).toHaveBeenCalledWith('Registration successful! You can now login with your mobile number and password.');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    alertMock.mockRestore();
  });

  test('prevents registration if phone number already exists in database', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [{ phone: '1234567890' }] }); // Existing customer

    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    renderRegister();

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
    const passwordInput = screen.getByPlaceholderText('Create password');
    const addressTextarea = screen.getByPlaceholderText('Enter your complete delivery address');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(addressTextarea, { target: { value: '123 Main St' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/customers?phone=1234567890');
      expect(alertMock).toHaveBeenCalledWith('This mobile number is already registered. Please login instead.');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    alertMock.mockRestore();
  });

  test('prevents registration if phone number exists in localStorage', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ phone: '1234567890' }));

    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    renderRegister();

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
    const passwordInput = screen.getByPlaceholderText('Create password');
    const addressTextarea = screen.getByPlaceholderText('Enter your complete delivery address');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(addressTextarea, { target: { value: '123 Main St' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('This mobile number is already registered (local testing data). Please login instead.');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    alertMock.mockRestore();
  });

  test('handles registration failure', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.post.mockRejectedValueOnce(new Error('Registration failed'));

    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    renderRegister();

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
    const passwordInput = screen.getByPlaceholderText('Create password');
    const addressTextarea = screen.getByPlaceholderText('Enter your complete delivery address');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(addressTextarea, { target: { value: '123 Main St' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Registration failed:', expect.any(Error));
      expect(alertMock).toHaveBeenCalledWith('Registration failed. Please try again later or contact support.');
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });

    alertMock.mockRestore();
    consoleSpy.mockRestore();
  });

  test('reset form functionality', () => {
    renderRegister();

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create password');
    const pincodeInput = screen.getByPlaceholderText('Enter pincode');
    const addressTextarea = screen.getByPlaceholderText('Enter your complete delivery address');
    const resetButton = screen.getByRole('button', { name: 'Reset Form' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(pincodeInput, { target: { value: '834001' } });
    fireEvent.change(addressTextarea, { target: { value: '123 Main St' } });

    fireEvent.click(resetButton);

    expect(nameInput.value).toBe('');
    expect(mobileInput.value).toBe('');
    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
    expect(pincodeInput.value).toBe('');
    expect(addressTextarea.value).toBe('');
  });

  test('shows loading state during submission', async () => {
    mockedAxios.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100)));
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Success' } });

    renderRegister();

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
    const passwordInput = screen.getByPlaceholderText('Create password');
    const addressTextarea = screen.getByPlaceholderText('Enter your complete delivery address');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(addressTextarea, { target: { value: '123 Main St' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Creating Account...')).toBeInTheDocument();
    expect(nameInput).toBeDisabled();
    expect(mobileInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(addressTextarea).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });
  });

  test('validates required fields', () => {
    renderRegister();

    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    // Try to submit without filling required fields
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission, but we can check if form is invalid
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const mobileInput = screen.getByPlaceholderText('10-digit mobile number');
    const passwordInput = screen.getByPlaceholderText('Create password');
    const addressTextarea = screen.getByPlaceholderText('Enter your complete delivery address');

    expect(nameInput).toBeRequired();
    expect(mobileInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(addressTextarea).toBeRequired();
  });
});