import { useState, useEffect, useCallback } from 'react';
import { 
    getSprayRealtimeData, 
    getSprayDailyData, 
    getSprayStatistics, 
    getSprayPieChartData,
    getSprayWeeklyData,
    getSprayMonthlyData
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
    const [weeklyData, setWeeklyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // ==================== FETCH FUNCTIONS (API calls) ====================
    
    const fetchWeeklyData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayWeeklyData(machineId);
            
            if (result.success && result.data) {
                setWeeklyData(result.data);
                setError(null);
            } else {
                console.error('❌ [useSprayRealtime] Weekly data failed:', result.message);
            }
        } catch (err) {
            console.error('❌ [useSprayRealtime] Weekly data error:', err);
        }
    }, [machineId]);

    const fetchMonthlyData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayMonthlyData(machineId);
            
            if (result.success && result.data) {
                setMonthlyData(result.data);
                setError(null);
            } else {
                console.error('❌ [useSprayRealtime] Monthly data failed:', result.message);
            }
        } catch (err) {
            console.error('❌ [useSprayRealtime] Monthly data error:', err);
        }
    }, [machineId]);

    const fetchRealtimeData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayRealtimeData(machineId);
            
            if (result.success && result.data) {
                setRealtimeData(result.data);
                setIsConnected(result.data.isConnected || false);
            } else {
                console.error('❌ [useSprayRealtime] Realtime failed:', result.message);
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

    // ==================== FETCH ALL DATA (Initial load) ====================
    
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            await Promise.all([
                fetchRealtimeData(),
                fetchDailyData(),
                fetchPieChartData(),
                fetchStatistics(),
                fetchWeeklyData(),
                fetchMonthlyData()
            ]);
            
        } catch (err) {
            console.error('❌ [useSprayRealtime] Error fetching all data:', err);
            setError(err.message || 'Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [fetchRealtimeData, fetchDailyData, fetchPieChartData, fetchStatistics, fetchWeeklyData, fetchMonthlyData]);
    
    /**
     * Update realtime data from socket event
     * Called by SprayMachinePage when socket emits 'spray:data-update'
     */
    const updateRealtimeFromSocket = useCallback((socketData) => {
        
        if (!socketData) return;
        
        // Update realtime data
        setRealtimeData(prev => ({
            ...prev,
            activeTime: socketData.activeTime ?? prev?.activeTime,
            stopTime: socketData.stopTime ?? prev?.stopTime,
            errorTime:socketData.errorTime ?? prev?.errorTime,
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
            const updatedErrorTime = socketData.errorTime ?? prev.errorTime;  
            const totalTime = updatedActiveTime + updatedStopTime;
            const efficiency = totalTime > 0 ? ((updatedActiveTime / totalTime) * 100).toFixed(1) : 0;
            
            return {
                ...prev,
                operatingTime: updatedActiveTime,
                pausedTime: updatedStopTime,
                errorTime: updatedErrorTime,
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
            
            const today = socketData.date;  
            
            return prev.map(day => {
                if (day.date === today) {
                    console.log(`📊 [useSprayRealtime] Updating weekly data for ${today}:`, {
                        oldOperatingTime: day.operatingTime,
                        newOperatingTime: socketData.activeTime,
                        oldPausedTime: day.pausedTime,
                        newPausedTime: socketData.stopTime,
                        oldErrorTime: day.errorTime,  
                        newErrorTime: socketData.errorTime
                    });
                    
                    return {
                        ...day,
                        operatingTime: socketData.activeTime ?? day.operatingTime,
                        pausedTime: socketData.stopTime ?? day.pausedTime,
                        errorTime: socketData.errorTime ?? day.errorTime,  
                        energyConsumption: socketData.totalEnergyConsumed ?? day.energyConsumption
                    };
                }
                return day;
            });
        });

        setMonthlyData(prev => {
            if (!prev || prev.length === 0) return prev;
            
            const today = socketData.date;
            
            return prev.map(day => {
                if (day.date === today) {
                    return {
                        ...day,
                        operatingTime: socketData.activeTime ?? day.operatingTime,
                        pausedTime: socketData.stopTime ?? day.pausedTime,
                        errorTime: socketData.errorTime ?? day.errorTime,  
                        energyConsumption: socketData.totalEnergyConsumed ?? day.energyConsumption
                    };
                }
                return day;
            });
        });
        
        setIsConnected(true);
        setError(null);
        fetchStatistics();
        
        console.log('✅ [useSprayRealtime] State updated from socket');
    }, [fetchStatistics]); 
    /**
     * Update machine connection status from socket
     */
    const updateConnectionStatus = useCallback((status) => {
        console.log('📡 [useSprayRealtime] Connection status:', status);
        setIsConnected(status);
    }, []);

    // ==================== REFRESH FUNCTIONS (Manual) ====================
    
    const refreshAllData = useCallback(() => {
        console.log('🔄 [useSprayRealtime] Manual refresh all data');
        fetchAllData();
    }, [fetchAllData]);

    const refreshHistoricalData = useCallback(() => {
        console.log('🔄 [useSprayRealtime] Manual refresh historical data');
        fetchStatistics();
        fetchWeeklyData(); 
    }, [fetchStatistics, fetchWeeklyData]);

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
        weeklyData,
        monthlyData,
        
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