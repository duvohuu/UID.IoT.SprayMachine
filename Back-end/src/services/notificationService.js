import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import { getIO } from '../config/socket.js';

/**
 * Create a new notification
 */
export const createNotification = async (data) => {
    try {
        const notification = new Notification({
            userId: data.userId,
            machineId: data.machineId,
            machineName: data.machineName,
            type: data.type,
            severity: data.severity || 'info',
            title: data.title,
            message: data.message,
            source: data.source || 'System',
            isRead: false,
        });

        await notification.save();

        return notification;
    } catch (error) {
        console.error('[Notification] Error creating notification:', error);
        throw error;
    }
};

/**
 * Tạo và broadcast notification cho owner + tất cả admins
 */
export const createAndBroadcastNotification = async (data) => {
    try {
        const io = getIO();
        const notifications = [];
        
        // 1. Tạo notification cho owner
        const ownerNotification = await createNotification({
            userId: data.userId,
            machineId: data.machineId,
            machineName: data.machineName,
            type: data.type,
            severity: data.severity || 'info',
            title: data.title,
            message: data.message,
            source: data.source || 'System'
        });
        
        notifications.push(ownerNotification);
        
        // Emit cho owner
        const ownerRoom = `user:${data.userId}`;
        
        const ownerSockets = io.sockets.adapter.rooms.get(ownerRoom)
        io.to(ownerRoom).emit('notification:new', ownerNotification);
        
        // 2. Tìm tất cả admin
        const admins = await User.find({ role: 'admin' });
        
        // 3. Tạo notification riêng cho mỗi admin (nếu không phải owner)
        for (const admin of admins) {
            if (admin.userId !== data.userId) {
                const adminNotification = await createNotification({
                    userId: admin.userId,
                    machineId: data.machineId,
                    machineName: data.machineName,
                    type: data.type,
                    severity: data.severity || 'info',
                    title: data.title,
                    message: `[Admin] ${data.message}`,
                    source: data.source || 'System'
                });
                
                notifications.push(adminNotification);
                
                // Emit cho admin
                const adminRoom = `user:${admin.userId}`;
                
                const adminSockets = io.sockets.adapter.rooms.get(adminRoom);
                
                io.to(adminRoom).emit('notification:new', adminNotification);
            }
        }
        
        return notifications;
        
    } catch (error) {
        console.error('[Notification] Error broadcasting notification:', error);
        throw error;
    }
};