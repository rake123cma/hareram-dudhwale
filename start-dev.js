#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Hareram Dudhwale Development Environment...');
console.log('This will start both backend (port 5000) and frontend (port 3000)');

// Start the backend server
console.log('\n🚀 Starting Backend Server (Port 5000)...');
const backendProcess = spawn('node', ['server/server.js'], {
  cwd: __dirname,
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: 'pipe'
});

// Pipe backend output
backendProcess.stdout.on('data', (data) => {
  console.log(`[Backend] ${data.toString().trim()}`);
});

backendProcess.stderr.on('data', (data) => {
  console.error(`[Backend Error] ${data.toString().trim()}`);
});

// Wait a bit for backend to start, then start frontend
setTimeout(() => {
  console.log('\n🌐 Starting Frontend Server (Port 3000)...');
  const frontendProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'client'),
    env: { ...process.env },
    stdio: 'pipe'
  });

  // Pipe frontend output
  frontendProcess.stdout.on('data', (data) => {
    console.log(`[Frontend] ${data.toString().trim()}`);
  });

  frontendProcess.stderr.on('data', (data) => {
    console.error(`[Frontend Error] ${data.toString().trim()}`);
  });

  frontendProcess.on('exit', (code) => {
    console.log(`Frontend process exited with code ${code}`);
    backendProcess.kill();
    process.exit(code);
  });

}, 3000); // Wait 3 seconds for backend to start

backendProcess.on('error', (error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});

backendProcess.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code);
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backendProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down servers...');
  backendProcess.kill('SIGTERM');
  process.exit(0);
});

console.log('\n📋 Instructions:');
console.log('1. Backend will start on http://localhost:5000');
console.log('2. Frontend will start on http://localhost:3000');
console.log('3. Press Ctrl+C to stop both servers');
console.log('\n⏳ Waiting for servers to start...');