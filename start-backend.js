#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Hareram Dudhwale Backend Server...');
console.log('Current directory:', __dirname);

// Start the backend server
const serverProcess = spawn('node', ['server/server.js'], {
  cwd: __dirname,
  env: { ...process.env },
  stdio: 'inherit'
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
});

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});