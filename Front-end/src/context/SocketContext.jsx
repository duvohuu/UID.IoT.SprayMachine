import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { API_URL } from '../config/apiConfig';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children, user }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        console.log('🔍 [SocketContext] useEffect triggered');
        console.log('   User:', user);
        console.log('   User.userId:', user?.userId);
        
        if (!user) {
            if (socket) {
                console.log('🔌 User logged out, disconnecting socket...');
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        if (!user.userId) {
            console.error('❌ [SocketContext] User exists but NO userId!');
            console.error('   Full user object:', JSON.stringify(user, null, 2));
            return;
        }

        console.log('🔌 Initializing socket connection...');
        console.log('   User ID:', user.userId);
        console.log('   API URL:', API_URL);

        const newSocket = io(API_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            setIsConnected(true);
            
            if (user?.userId) {
                const userRoom = `user:${user.userId}`;
                console.log(`📡 [Socket] Emitting join-user-room`);
                console.log(`   User ID: ${user.userId}`);
                console.log(`   Expected room: ${userRoom}`);
                
                newSocket.emit('join-user-room', user.userId);
            } else {
                console.warn('⚠️ [Socket] No userId found after connect');
            }
        });

        newSocket.on('room-joined', (data) => {
            console.log('✅ [Socket] Room join CONFIRMED by server!');
            console.log('   Room:', data.room);
            console.log('   User ID:', data.userId);
            console.log('   Socket ID:', data.socketId);
            console.log('   Timestamp:', data.timestamp);
        });

        newSocket.on('room-join-error', (error) => {
            console.error('❌ [Socket] Room join FAILED:', error);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
            setIsConnected(true);
            
            if (user?.userId) {
                const userRoom = `user:${user.userId}`;
                console.log(`📡 [Socket] Rejoining room: ${userRoom} after reconnect`);
                newSocket.emit('join-user-room', user.userId);
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                console.log('🔌 Cleaning up socket connection...');
                newSocket.disconnect();
            }
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};