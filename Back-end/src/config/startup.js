import { initializeMQTT, disconnectMQTT, getMQTTStatus } from '../iot/mqttClient.js';
import { initializeDailyResetScheduler } from '../services/sprayMachineService.js'; 

/**
 * ========================================
 * STARTUP MANAGER
 * ========================================
 * Quản lý việc khởi động các service: MQTT, Scheduler, etc.
 */

let mqttClient = null;
let cronJob = null;

/**
 * Khởi tạo tất cả services
 */
export const initializeServices = () => {
    setTimeout(() => {
        console.log('🔌 Starting MQTT Client...');
        mqttClient = initializeMQTT();
        
        // Log MQTT status sau 5s
        setTimeout(() => {
            const status = getMQTTStatus();
            console.log('📊 MQTT Status:', {
                connected: status.connected,
                broker: status.broker,
                topic: status.topic
            });
        }, 5000);
    }, 2000);

    // 2. Initialize Daily Reset Scheduler
    setTimeout(() => {
        console.log('⏰ Starting Daily Reset Scheduler...');
        cronJob = initializeDailyResetScheduler();
    }, 3000);
    
    console.log('✅ All services initialization started\n');
};

/**
 * Shutdown tất cả services
 */
export const shutdownServices = () => {
    console.log('\n🛑 Shutting down services...');
    
    // Stop cron job
    if (cronJob) {
        console.log('⏰ Stopping cron scheduler...');
        cronJob.stop();
        cronJob = null;
    }
    
    // Disconnect MQTT
    if (mqttClient) {
        console.log('🔌 Disconnecting MQTT...');
        disconnectMQTT();
        mqttClient = null;
    }
    
    console.log('✅ All services stopped');
};

/**
 * Graceful shutdown handler
 */
export const handleGracefulShutdown = (server, signal) => {
    console.log(`\n⚠️  ${signal} received: initiating graceful shutdown...`);
    
    // 1. Shutdown services
    shutdownServices();
    
    // 2. Close HTTP server
    server.close(() => {
        console.log('✅ HTTP server closed');
        console.log('👋 Goodbye!\n');
        process.exit(0);
    });

    // Force exit after 10s if server doesn't close
    setTimeout(() => {
        process.exit(1);
    }, 10000);
};

/**
 * Handle uncaught errors
 */
export const setupErrorHandlers = (server) => {
    process.on('SIGTERM', () => handleGracefulShutdown(server, 'SIGTERM'));
    process.on('SIGINT', () => handleGracefulShutdown(server, 'SIGINT'));
    
    process.on('uncaughtException', (error) => {
        console.error('💥 Uncaught Exception:', error);
        handleGracefulShutdown(server, 'UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
        handleGracefulShutdown(server, 'UNHANDLED_REJECTION');
    });
};

export default {
    initializeServices,
    shutdownServices,
    handleGracefulShutdown,
    setupErrorHandlers
};