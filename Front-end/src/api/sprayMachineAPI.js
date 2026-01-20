import axios from "axios";
import { API_URL } from '../config/apiConfig.js';

axios.defaults.withCredentials = true;


/**
 * ========================================
 * SPRAY MACHINE API
 * ========================================
 */

/**
 * Lấy dữ liệu realtime của Spray Machine
 * @param {string} machineId - ID của máy
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
export const getSprayRealtimeData = async (machineId) => {
    try {
        const response = await axios.get(
            `${API_URL}/api/spray-machine/realtime/${machineId}`, 
        );
        return { success: true, data: response.data };
    } catch (err) {
        console.error('❌ Error fetching spray realtime data:', err);
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy dữ liệu realtime Spray Machine" 
        };
    }
};

/**
 * Lấy dữ liệu hàng ngày (Daily Data) - Realtime update trong cùng 1 ngày
 * Data này được reset mỗi ngày lúc 6h sáng
 * @param {string} machineId - ID của máy
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
export const getSprayDailyData = async (machineId) => {
    try {
        const response = await axios.get(
            `${API_URL}/api/spray-machine/daily/${machineId}`, 
        );
        return { success: true, data: response.data };
    } catch (err) {
        console.error('❌ Error fetching spray daily data:', err);
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy dữ liệu hàng ngày Spray Machine" 
        };
    }
};

/**
 * Lấy dữ liệu lịch sử 30 ngày gần nhất
 * Bao gồm:
 * - Năng lượng tiêu thụ theo ngày
 * - % thời gian chạy theo ngày
 * - Số sản phẩm phun theo ngày
 * @param {string} machineId - ID của máy
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Số ngày lấy (default: 30)
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
export const getSpray30DaysHistory = async (machineId, params = {}) => {
    try {
        const queryParams = new URLSearchParams({
            limit: params.limit || 30,
            ...params
        });

        const response = await axios.get(
            `${API_URL}/api/spray-machine/history/${machineId}?${queryParams}`, 
        );
        return { success: true, data: response.data };
    } catch (err) {
        console.error('❌ Error fetching spray 30 days history:', err);
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy dữ liệu 30 ngày Spray Machine" 
        };
    }
};

/**
 * Lấy thống kê tổng hợp của Spray Machine
 * Bao gồm:
 * - Tổng thời gian chạy 30 ngày
 * - Tổng năng lượng tiêu thụ 30 ngày
 * - Trung bình % chạy 30 ngày
 * - Tổng sản phẩm đã phun 30 ngày
 * @param {string} machineId - ID của máy
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
export const getSprayStatistics = async (machineId) => {
    try {
        const response = await axios.get(
            `${API_URL}/api/spray-machine/statistics/${machineId}`, 
        );
        return { success: true, data: response.data };
    } catch (err) {
        console.error('❌ Error fetching spray statistics:', err);
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy thống kê Spray Machine" 
        };
    }
};

/**
 * Lấy dữ liệu biểu đồ tròn (Pie Chart) thời gian chạy/dừng hôm nay
 * @param {string} machineId - ID của máy
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
export const getSprayPieChartData = async (machineId) => {
    try {
        const response = await axios.get(
            `${API_URL}/api/spray-machine/pie-chart/${machineId}`, 
        );
        return { success: true, data: response.data };
    } catch (err) {
        console.error('❌ Error fetching spray pie chart data:', err);
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy dữ liệu biểu đồ tròn" 
        };
    }
};

/**
 * Lấy dữ liệu tuần hiện tại (T2-CN)
 * @param {string} machineId - ID của máy
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
export const getSprayWeeklyData = async (machineId) => {
    try {
        const response = await axios.get(
            `${API_URL}/api/spray-machine/weekly/${machineId}`, 
            { withCredentials: true }
        );
        return { success: true, data: response.data };
    } catch (err) {
        console.error('❌ Error fetching spray weekly data:', err);
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy dữ liệu tuần Spray Machine" 
        };
    }
};

/**
 * Lấy dữ liệu tháng hiện tại (all days in month)
 * @param {string} machineId - ID của máy
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
export const getSprayMonthlyData = async (machineId) => {
    try {
        const response = await axios.get(
            `${API_URL}/api/spray-machine/monthly/${machineId}`, 
            { withCredentials: true }
        );
        return { success: true, data: response.data };
    } catch (err) {
        console.error('❌ Error fetching spray monthly data:', err);
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy dữ liệu tháng Spray Machine" 
        };
    }
};


/**
 * ========================================
 * EXPORT ALL FUNCTIONS
 * ========================================
 */
export default {
    getSprayRealtimeData,
    getSprayDailyData,
    getSpray30DaysHistory,
    getSprayStatistics,
    getSprayWeeklyData,
    getSprayMonthlyData, 
    getSprayPieChartData,
};