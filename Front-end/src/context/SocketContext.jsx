import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

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
        if (!user) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        console.log('🔌 [SocketContext] Connecting to:', API_URL);

        const newSocket = io(API_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,           // ← Enable auto reconnect
            reconnectionAttempts: 5,      // ← Max 5 attempts
            reconnectionDelay: 1000,      // ← Wait 1s between attempts
            reconnectionDelayMax: 5000,   // ← Max 5s delay
            timeout: 20000
        });

        // Connection events
        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            setIsConnected(false);

            if (reason === 'io server disconnect') {
                // Server manually disconnected, reconnect manually
                newSocket.connect();
            }
            // Other reasons will auto-reconnect
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
            setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
            setIsConnected(true);
        });

        newSocket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
        });

        newSocket.on('reconnect_error', (error) => {
            console.error('❌ Socket reconnection error:', error.message);
        });

        newSocket.on('reconnect_failed', () => {
            console.error('❌ Socket reconnection failed after all attempts');
        });

        setSocket(newSocket);

        return () => {
            console.log('🛑 [SocketContext] Cleaning up socket connection');
            newSocket.close();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};