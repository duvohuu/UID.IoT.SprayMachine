import http from 'http';
import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import { initializeSocket } from './src/config/socket.js';
import { initializeServices, setupErrorHandlers } from './src/config/startup.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

/**
 * ========================================
 * SERVER INITIALIZATION
 * ========================================
 */

// 1. Create HTTP server
const server = http.createServer(app);

// 2. Initialize Socket.IO
initializeSocket(server);

// 3. Connect to database
connectDB();

// 4. Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    
    // 5. Initialize all services (MQTT, Scheduler, etc.)
    initializeServices();
});

// 6. Setup error handlers and graceful shutdown
setupErrorHandlers(server);

// 7. Handle port already in use error
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.log('\n💡 Solutions:');
        console.log(`   1. Kill the process: lsof -ti:${PORT} | xargs kill -9`);
        console.log(`   2. Change PORT in .env file`);
        console.log(`   3. Wait a moment and try again\n`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', error);
        process.exit(1);
    }
});