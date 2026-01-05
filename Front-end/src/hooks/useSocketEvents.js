import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * ========================================
 * CUSTOM HOOK: useMachineSocketEvents
 * ========================================
 * Lắng nghe socket events cho một máy cụ thể
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.machineId - ID của máy
 * @param {Function} config.onMachineUpdate - Callback khi machine status update
 * @param {Function} config.onRealtimeUpdate - Callback khi realtime data update
 * @param {Function} config.onDailyReset - Callback khi daily data reset (6AM)
 * @returns {void}
 */
export const useMachineSocketEvents = ({ 
    machineId, 
    onMachineUpdate, 
    onRealtimeUpdate,
    onDailyReset 
}) => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket || !machineId) return;

        console.log(`🔌 [Socket] Setting up listeners for machine: ${machineId}`);

        // ==================== MACHINE STATUS EVENTS ====================
        
        /**
         * Listen for general machine status updates
         * Event: 'machine:status-update'
         */
        const handleMachineStatusUpdate = (update) => {
            if (update.machineId === machineId) {
                console.log(`📡 [${machineId}] Machine status update:`, update);
                if (onMachineUpdate) {
                    onMachineUpdate(update);
                }
            }
        }
        // ==================== SPRAY MACHINE EVENTS ====================
        
        /**
         * Listen for Spray realtime data
         * Event: 'spray:realtime'
         */
        const handleSprayRealtime = (data) => {
            if (data.machineId === machineId) {
                console.log(`🎨 [${machineId}] Spray realtime data:`, data);
                if (onRealtimeUpdate) {
                    onRealtimeUpdate(data);
                }
            }
        };

        /**
         * Listen for Spray daily data reset (6AM)
         * Event: 'spray:daily-reset'
         */
        const handleSprayDailyReset = (data) => {
            if (data.machineId === machineId) {
                console.log(`🌅 [${machineId}] Daily data reset at 6AM:`, data);
                if (onDailyReset) {
                    onDailyReset(data);
                }
            }
        };

        /**
         * Listen for Spray daily data updates
         * Event: 'spray:daily-update'
         */
        const handleSprayDailyUpdate = (data) => {
            if (data.machineId === machineId) {
                console.log(`📈 [${machineId}] Daily data update:`, data);
                if (onRealtimeUpdate) {
                    onRealtimeUpdate(data);
                }
            }
        };


        // ==================== REGISTER LISTENERS ====================
        
        socket.on('machine:status-update', handleMachineStatusUpdate);
        socket.on('spray:realtime', handleSprayRealtime);
        socket.on('spray:daily-reset', handleSprayDailyReset);
        socket.on('spray:daily-update', handleSprayDailyUpdate);

        console.log(`✅ [Socket] Listeners registered for machine: ${machineId}`);

        // ==================== CLEANUP ====================
        
        return () => {
            console.log(`🔌 [Socket] Cleaning up listeners for machine: ${machineId}`);
            
            socket.off('machine:status-update', handleMachineStatusUpdate);
            socket.off('spray:realtime', handleSprayRealtime);
            socket.off('spray:daily-reset', handleSprayDailyReset);
            socket.off('spray:daily-update', handleSprayDailyUpdate);
        };
    }, [socket, machineId, onMachineUpdate, onRealtimeUpdate, onDailyReset]);
};

/**
 * ========================================
 * CUSTOM HOOK: useAllMachinesStatusUpdates
 * ========================================
 * Lắng nghe socket events cho TẤT CẢ máy (StatusPage)
 * 
 * @param {Function} onMachineUpdate - Callback khi có machine update
 * @returns {void}
 */
export const useAllMachinesStatusUpdates = (onMachineUpdate) => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        console.log('🔌 [Socket] Setting up global machine status listener');

        /**
         * Listen for all machine status updates
         */
        const handleAllMachinesUpdate = (update) => {
            console.log('📡 [Global] Machine status update:', update);
            if (onMachineUpdate) {
                onMachineUpdate(update);
            }
        };

        socket.on('machine:status-update', handleAllMachinesUpdate);

        console.log('✅ [Socket] Global listener registered');

        return () => {
            console.log('🔌 [Socket] Cleaning up global listener');
            socket.off('machine:status-update', handleAllMachinesUpdate);
        };
    }, [socket, onMachineUpdate]);
};

/**
 * ========================================
 * CUSTOM HOOK: useNotificationUpdates
 * ========================================
 * Lắng nghe socket events cho NOTIFICATIONS
 * Dùng trong NotificationBell component
 * 
 * @param {Function} onNewNotification - Callback khi có notification mới
 * @returns {void}
 */
export const useNotificationUpdates = (onNewNotification) => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) {
            console.log('⚠️ [Notification] Socket not available');
            return;
        }

        console.log('🔔 [Notification] Setting up notification listener');

        /**
         * Listen for new notifications
         * Event: 'notification:new'
         */
        const handleNewNotification = (notification) => {
            console.log('🔔 [Notification] New notification received:', notification);
            if (onNewNotification) {
                onNewNotification(notification);
            }
        };

        /**
         * Listen for notification updates (read, delete, etc.)
         * Event: 'notification:update'
         */
        const handleNotificationUpdate = (update) => {
            console.log('🔔 [Notification] Notification updated:', update);
        };

        // Register listeners
        socket.on('notification:new', handleNewNotification);
        socket.on('notification:update', handleNotificationUpdate);

        console.log('✅ [Notification] Listeners registered');

        // Cleanup
        return () => {
            console.log('🔌 [Notification] Cleaning up listeners');
            socket.off('notification:new', handleNewNotification);
            socket.off('notification:update', handleNotificationUpdate);
        };
    }, [socket, onNewNotification]);
};

/**
 * ========================================
 * EXPORT DEFAULT
 * ========================================
 */
export default {
    useMachineSocketEvents,
    useAllMachinesStatusUpdates,
    useNotificationUpdates  
};