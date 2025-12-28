import http from 'http';
import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import { initializeSocket } from './src/config/socket.js';
import { initializeServices, setupErrorHandlers } from './src/config/startup.js';

// Load env only for local
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const PORT = process.env.PORT || 5000;

/**
 * SERVER INITIALIZATION
 */

// Create HTTP server
const server = http.createServer(app);

// Init socket
initializeSocket(server);

// Connect DB
connectDB();

// Start server (ONE WAY for all envs)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);

  // ALWAYS init services (both local & production)
  initializeServices();
});

// Error handlers
setupErrorHandlers(server);

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
