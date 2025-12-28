import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (server) => {
    // Parse CORS origins from .env
    const corsOrigins = process.env.CORS_ORIGINS 
        ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
        : ['http://localhost:5173'];

    io = new Server(server, {
        cors: {
            origin: corsOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,      // ← Tăng timeout
        pingInterval: 25000,     // ← Heartbeat interval
        transports: ['websocket', 'polling']  // ← Support cả 2
    });

    io.on('connection', (socket) => {
        console.log(`✅ Socket.IO: Client connected - ${socket.id}`);
        
        // Handle disconnect with better logging
        socket.on('disconnect', (reason) => {
            if (reason === 'transport close') {
                console.log(`🔌 Socket.IO: Client disconnected normally - ${socket.id}`);
            } else if (reason === 'ping timeout') {
                console.log(`⏱️ Socket.IO: Client ping timeout - ${socket.id}`);
            } else if (reason === 'client namespace disconnect') {
                console.log(`👋 Socket.IO: Client manually disconnected - ${socket.id}`);
            } else {
                console.log(`❌ Socket.IO: Client disconnected - ${socket.id} Reason: ${reason}`);
            }
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`❌ Socket.IO Error - ${socket.id}:`, error);
        });

        // Handle machine subscription
        socket.on('subscribe', (machineId) => {
            socket.join(`machine:${machineId}`);
            console.log(`📡 Client ${socket.id} subscribed to machine:${machineId}`);
        });

        socket.on('unsubscribe', (machineId) => {
            socket.leave(`machine:${machineId}`);
            console.log(`📡 Client ${socket.id} unsubscribed from machine:${machineId}`);
        });
    });

    console.log('✅ Socket.IO initialized');
    return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};