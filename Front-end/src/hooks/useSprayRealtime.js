import { useState, useEffect, useCallback } from 'react';
import { 
    getSprayRealtimeData, 
    getSprayDailyData, 
    getSprayStatistics, 
    getSpray30DaysHistory,
    getSprayPieChartData,
    getSprayWeeklyData
} from '../api/sprayMachineAPI';

/**
 * ========================================
 * IMPROVED: Socket-driven realtime hook
 * ========================================
 * - Fetch data lần đầu từ API
 * - Update data từ socket events (không polling)
 * - Expose update functions để SprayMachinePage gọi
 */
export const useSprayRealtime = (machineId) => {
    const [realtimeData, setRealtimeData] = useState(null);
    const [dailyData, setDailyData] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [pieChartData, setPieChartData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // ==================== FETCH FUNCTIONS (API calls) ====================
    
    const fetchWeeklyData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayWeeklyData(machineId);
            
            if (result.success && result.data) {
                console.log('✅ [useSprayRealtime] Weekly data from API:', result.data);
                setWeeklyData(result.data);
                setError(null);
            } else {
                console.error('❌ [useSprayRealtime] Weekly data failed:', result.message);
            }
        } catch (err) {
            console.error('❌ [useSprayRealtime] Weekly data error:', err);
        }
    }, [machineId]);

    const fetchRealtimeData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayRealtimeData(machineId);
            
            if (result.success && result.data) {
                console.log('✅ [useSprayRealtime] Realtime data from API:', result.data);
                setRealtimeData(result.data);
                setIsConnected(result.data.isConnected || false);
                setError(null);
            } else {
                console.error('❌ [useSprayRealtime] Realtime failed:', result.message);
                setError(result.message);
            }
        } catch (err) {
            console.error('❌ [useSprayRealtime] Realtime error:', err);
            setError(err.message || 'Lỗi tải dữ liệu realtime');
            setIsConnected(false);
        }
    }, [machineId]);

    const fetchDailyData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayDailyData(machineId);
            
            if (result.success && result.data) {
                console.log('✅ [useSprayRealtime] Daily data from API:', result.data);
                setDailyData(result.data);
                setError(null);
            } else {
                console.error('❌ [useSprayRealtime] Daily failed:', result.message);
                setError(result.message);
            }
        } catch (err) {
            console.error('❌ [useSprayRealtime] Daily error:', err);
            setError(err.message || 'Lỗi tải dữ liệu hôm nay');
        }
    }, [machineId]);

    const fetchPieChartData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayPieChartData(machineId);
            
            if (result.success && result.data) {
                console.log('✅ [useSprayRealtime] Pie chart data from API:', result.data);
                setPieChartData(result.data);
                setError(null);
            } else {
                console.error('❌ [useSprayRealtime] Pie chart failed:', result.message);
                setError(result.message);
            }
        } catch (err) {
            console.error('❌ [useSprayRealtime] Pie chart error:', err);
            setError(err.message || 'Lỗi tải biểu đồ tròn');
        }
    }, [machineId]);

    const fetchStatistics = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayStatistics(machineId);
            
            if (result.success && result.data) {
                console.log('✅ [useSprayRealtime] Statistics from API:', result.data);
                setStatistics(result.data);
                setError(null);
            } else {
                console.error('❌ [useSprayRealtime] Statistics failed:', result.message);
                setError(result.message);
            }
        } catch (err) {
            console.error('❌ [useSprayRealtime] Statistics error:', err);
            setError(err.message || 'Lỗi tải thống kê');
        }
    }, [machineId]);

    const fetchHistoryData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSpray30DaysHistory(machineId);
            
            if (result.success && result.data) {
                console.log('✅ [useSprayRealtime] History data from API:', result.data);
                setHistoryData(result.data);
                setError(null);
            } else {
                console.error('❌ [useSprayRealtime] History failed:', result.message);
                setError(result.message);
            }
        } catch (err) {
            console.error('❌ [useSprayRealtime] History error:', err);
            setError(err.message || 'Lỗi tải lịch sử');
        }
    }, [machineId]);

    // ==================== FETCH ALL DATA (Initial load) ====================
    
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log(`🔄 [useSprayRealtime] Initial fetch all data for: ${machineId}`);
            
            await Promise.all([
                fetchRealtimeData(),
                fetchDailyData(),
                fetchPieChartData(),
                fetchStatistics(),
                fetchHistoryData(),
                fetchWeeklyData()
            ]);
            
            console.log('✅ [useSprayRealtime] All data loaded successfully');
        } catch (err) {
            console.error('❌ [useSprayRealtime] Error fetching all data:', err);
            setError(err.message || 'Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [machineId, fetchRealtimeData, fetchDailyData, fetchPieChartData, fetchStatistics, fetchHistoryData, fetchWeeklyData]);
    
    /**
     * Update realtime data from socket event
     * Called by SprayMachinePage when socket emits 'spray:data-update'
     */
    const updateRealtimeFromSocket = useCallback((socketData) => {
        console.log('📡 [useSprayRealtime] Update from socket:', socketData);
        
        if (!socketData) return;
        
        // Update realtime data
        setRealtimeData(prev => ({
            ...prev,
            activeTime: socketData.activeTime ?? prev?.activeTime,
            stopTime: socketData.stopTime ?? prev?.stopTime,
            energyConsumption: socketData.totalEnergyConsumed ?? prev?.energyConsumption,
            sprayStatus: socketData.status ?? prev?.sprayStatus,
            powerConsumption: socketData.powerConsumption ?? prev?.powerConsumption,
            lastUpdate: socketData.lastUpdate ?? new Date().toISOString(),
            isConnected: true
        }));
        
        // Update daily data
        setDailyData(prev => {
            if (!prev) return prev;
            
            const updatedActiveTime = socketData.activeTime ?? prev.operatingTime;
            const updatedStopTime = socketData.stopTime ?? prev.pausedTime;
            const totalTime = updatedActiveTime + updatedStopTime;
            const efficiency = totalTime > 0 ? ((updatedActiveTime / totalTime) * 100).toFixed(1) : 0;
            
            return {
                ...prev,
                operatingTime: updatedActiveTime,
                pausedTime: updatedStopTime,
                energyConsumption: socketData.totalEnergyConsumed ?? prev.energyConsumption,
                efficiency: parseFloat(efficiency)
            };
        });
        
        // Update pie chart data
        setPieChartData(prev => ({
            ...prev,
            operatingTime: socketData.activeTime ?? prev?.operatingTime,
            pausedTime: socketData.stopTime ?? prev?.pausedTime
        }));

        setWeeklyData(prev => {
        if (!prev || prev.length === 0) return prev;
        
        const today = socketData.date; // Format: "2026-01-05"
        
        return prev.map(day => {
            if (day.date === today) {
                console.log(`📊 [useSprayRealtime] Updating weekly data for ${today}:`, {
                    oldOperatingTime: day.operatingTime,
                    newOperatingTime: socketData.activeTime,
                    oldPausedTime: day.pausedTime,
                    newPausedTime: socketData.stopTime
                });
                
                return {
                    ...day,
                    operatingTime: socketData.activeTime ?? day.operatingTime,
                    pausedTime: socketData.stopTime ?? day.pausedTime,
                    energyConsumption: socketData.totalEnergyConsumed ?? day.energyConsumption
                };
            }
            return day;
        });
    });
        
        // Update connection status
        setIsConnected(true);
        setError(null);
        
        console.log('✅ [useSprayRealtime] State updated from socket');
    }, []);

    /**
     * Update machine connection status from socket
     */
    const updateConnectionStatus = useCallback((status) => {
        console.log('📡 [useSprayRealtime] Connection status:', status);
        setIsConnected(status);
        
        if (!status) {
            setError('Máy mất kết nối');
        }
    }, []);

    // ==================== REFRESH FUNCTIONS (Manual) ====================
    
    const refreshAllData = useCallback(() => {
        console.log('🔄 [useSprayRealtime] Manual refresh all data');
        fetchAllData();
    }, [fetchAllData]);

    const refreshHistoricalData = useCallback(() => {
        console.log('🔄 [useSprayRealtime] Manual refresh historical data');
        fetchStatistics();
        fetchHistoryData();
        fetchWeeklyData(); 
    }, [fetchStatistics, fetchHistoryData, fetchWeeklyData]);

    // ==================== INITIAL LOAD (Only once) ====================
    
    useEffect(() => {
        if (machineId) {
            console.log(`🚀 [useSprayRealtime] Initial load for: ${machineId}`);
            fetchAllData();
        } else {
            console.warn('⚠️ [useSprayRealtime] No machineId provided');
            setError('Machine ID không hợp lệ');
            setLoading(false);
        }
    }, [machineId, fetchAllData]);

    // ==================== CALCULATE TODAY EFFICIENCY ====================
    
    const todayEfficiency = dailyData ? dailyData.efficiency || 0 : 0;

    // ==================== RETURN ====================
    
    return {
        // Data
        realtimeData,
        dailyData,
        statistics,
        pieChartData,
        historyData,
        weeklyData,
        
        // Status
        loading,
        error,
        isConnected,
        todayEfficiency,
        
        // Manual refresh functions
        refreshAllData,
        refreshHistoricalData,
        
        updateRealtimeFromSocket,
        updateConnectionStatus
    };
};