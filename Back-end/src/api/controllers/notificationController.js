import Notification from '../../models/Notification.model.js';

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        
        const unreadCount = await Notification.countDocuments({ 
            userId, 
            isRead: false 
        });
        
        console.log(`📬 [API] Get notifications for ${userId}:`, {
            total: notifications.length,
            unread: unreadCount
        });
        
        res.json({
            success: true,
            data: { notifications, unreadCount }
        });
    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        
        const notification = await Notification.findOne({ _id: id, userId });
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        await notification.markAsRead();
        
        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notification'
        });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        await Notification.markAllAsRead(userId);
        
        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('❌ Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notifications'
        });
    }
};