import axios from 'axios';
import { API_URL } from '../config/apiConfig.js';

axios.defaults.withCredentials = true;

class NotificationAPI {
    async getNotifications() {
        try {
            console.log('📡 [API] Fetching notifications from:', `${API_URL}/api/notifications`);
            
            const response = await axios.get(
                `${API_URL}/api/notifications`,
                { withCredentials: true }
            );
            
            console.log('📨 [API] Response:', response.data);
            
            return response.data.data || { notifications: [], unreadCount: 0 };
        } catch (error) {
            console.error('❌ [API] Error fetching notifications:', error);
            console.error('   Status:', error.response?.status);
            console.error('   Message:', error.response?.data?.message);
            throw error;
        }
    }

    async markAsRead(notificationId) {
        try {
            const response = await axios.patch(
                `${API_URL}/api/notifications/${notificationId}/read`,
                {},
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            console.error('❌ [API] Error marking as read:', error);
            throw error;
        }
    }

    async markAllAsRead() {
        try {
            const response = await axios.patch(
                `${API_URL}/api/notifications/mark-all-read`,
                {},
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            console.error('❌ [API] Error marking all as read:', error);
            throw error;
        }
    }
}

export const notificationAPI = new NotificationAPI();