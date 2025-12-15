/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecf0f1',
          100: '#bdc3c7',
          200: '#95a5a6',
          300: '#7f8c8d',
          400: '#6c757d',
          500: '#34495e',
          600: '#2c3e50',
          700: '#1F1D1F',
          800: '#111827',
          900: '#000000',
        },
        secondary: {
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#f5f5f5',
          300: '#fef3c7',
          400: '#e8f4f8',
          500: '#9ca3af',
          600: '#6b7280',
          700: '#4b5563',
          800: '#374151',
          900: '#1e293b',
        },
        accent: {
          blue: '#3498db',
          'blue-dark': '#2980b9',
          'blue-light': '#1e3a8a',
          green: '#10b981',
          'green-dark': '#059669',
          'green-light': '#27ae60',
          'green-darker': '#229954',
          orange: '#f97316',
          yellow: '#f59e0b',
          red: '#e74c3c',
          'red-dark': '#c0392b',
          'red-darker': '#dc3545',
          teal: '#17a2b8',
          'teal-light': '#28a745',
          amber: '#92400e',
        },
      },
    },
  },
  plugins: [],
}