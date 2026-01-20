import { Server } from 'socket.io';

let io = null;

export const initializeSocket = (server) => {
    const corsOrigins = process.env.CORS_ORIGINS 
        ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
        : ['http://localhost:5173'];

    io = new Server(server, {
        cors: {
            origin: corsOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        console.log(`✅ Socket.IO: Client connected - ${socket.id}`);

        socket.on('join-user-room', (userId) => {
            // ⭐ VALIDATE
            if (!userId) {
                console.error(`❌ join-user-room with empty userId from ${socket.id}`);
                socket.emit('room-join-error', { message: 'userId is required' });
                return;
            }

            const roomName = `user:${userId}`;
            socket.join(roomName);
            
            console.log(`📡 Client ${socket.id} joined room: ${roomName}`);
            console.log(`   UserID: ${userId}`);
            
            const rooms = Array.from(socket.rooms);
            console.log(`   Socket ${socket.id} is now in rooms:`, rooms);
            
            const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
            socket.emit('room-joined', {
                success: true,
                room: roomName,
                userId: userId,
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });
            
        });

        socket.on('join-machine-room', (machineId) => {
            const roomName = `machine-${machineId}`;
            socket.join(roomName);
        });
        
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

        socket.on('error', (error) => {
            console.error(`❌ Socket.IO Error - ${socket.id}:`, error);
        });

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

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};