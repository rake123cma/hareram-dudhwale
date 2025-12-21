/**
 * Format currency amount to show only 2 decimal places
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted amount with ₹ symbol
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0.00';
  }
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return '₹0.00';
  }
  
  return `₹${numAmount.toFixed(2)}`;
};

/**
 * Format number to show only 2 decimal places without currency symbol
 * @param {number|string} value - The value to format
 * @returns {string} Formatted number with 2 decimal places
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return '0.00';
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return '0.00';
  }
  
  return numValue.toFixed(2);
};