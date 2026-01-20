import mongoose from 'mongoose';

/**
 * ========================================
 * NOTIFICATION SCHEMA
 * ========================================
 * Schema cho hệ thống thông báo
 */
const NotificationSchema = new mongoose.Schema({
    // User nhận notification
    userId: {
        type: String,
        required: true,
        index: true
    },
    
    // Machine liên quan (nếu có)
    machineId: {
        type: String,
        default: null,
        index: true
    },
    
    // Tên máy (để hiển thị)
    machineName: {
        type: String,
        default: null
    },
    
    // Loại notification
    type: {
        type: String,
        enum: [
            'machine_error',      
            'incomplete_shift',   
            'maintenance',       
            'mqtt_disconnected', 
            'system'             
        ],
        default: 'system',
        required: true
    },
    
    // Mức độ nghiêm trọng
    severity: {
        type: String,
        enum: ['info', 'warning', 'error', 'success'],
        default: 'info',
        required: true
    },
    
    // Tiêu đề notification
    title: {
        type: String,
        required: true
    },
    
    // Nội dung chi tiết
    message: {
        type: String,
        required: true
    },
    
    // Nguồn tạo notification
    source: {
        type: String,
        default: 'System'
    },
    
    // Trạng thái đọc
    isRead: {
        type: Boolean,
        default: false
    },
    
    // Thời gian đọc
    readAt: {
        type: Date,
        default: null
    }
    
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

// ==================== INDEXES ====================

// Index để query nhanh notifications của user
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Index để query notifications chưa đọc
NotificationSchema.index({ userId: 1, isRead: 1 });

// Index để query notifications theo machine
NotificationSchema.index({ machineId: 1, createdAt: -1 });

// ==================== METHODS ====================

/**
 * Mark notification as read
 */
NotificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

// ==================== STATIC METHODS ====================

/**
 * Get unread count for user
 */
NotificationSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({ userId, isRead: false });
};

/**
 * Mark all notifications as read for user
 */
NotificationSchema.statics.markAllAsRead = async function(userId) {
    return await this.updateMany(
        { userId, isRead: false },
        { 
            $set: { 
                isRead: true, 
                readAt: new Date() 
            } 
        }
    );
};

/**
 * Delete old read notifications (older than 30 days)
 */
NotificationSchema.statics.cleanupOldNotifications = async function() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return await this.deleteMany({
        isRead: true,
        readAt: { $lt: thirtyDaysAgo }
    });
};

export default mongoose.model('Notification', NotificationSchema);