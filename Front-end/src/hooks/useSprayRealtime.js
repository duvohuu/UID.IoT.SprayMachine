import { useState, useEffect, useCallback } from 'react';
import { 
    getSprayRealtimeData, 
    getSprayDailyData, 
    getSprayStatistics, 
    getSpray30DaysHistory,
    getSprayPieChartData 
} from '../api/sprayMachineAPI';

export const useSprayRealtime = (machineId) => {
    const [realtimeData, setRealtimeData] = useState(null);
    const [dailyData, setDailyData] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [pieChartData, setPieChartData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // ==================== FETCH REALTIME DATA ====================
    const fetchRealtimeData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayRealtimeData(machineId);
            
            if (result.success && result.data) {
                console.log('✅ [useSprayRealtime] Realtime data:', result.data);
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

    // ==================== FETCH DAILY DATA ====================
    const fetchDailyData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayDailyData(machineId);
            
            if (result.success && result.data) {
                console.log('✅ [useSprayRealtime] Daily data:', result.data);
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

    // ==================== FETCH PIE CHART DATA ====================
    const fetchPieChartData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayPieChartData(machineId);
            
            if (result.success && result.data) {
                console.log('✅ [useSprayRealtime] Pie chart data:', result.data);
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

    // ==================== FETCH STATISTICS ====================
    const fetchStatistics = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSprayStatistics(machineId);
            
            if (result.success && result.data) {
                console.log('✅ [useSprayRealtime] Statistics:', result.data);
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

    // ==================== FETCH HISTORY DATA ====================
    const fetchHistoryData = useCallback(async () => {
        if (!machineId) return;
        
        try {
            const result = await getSpray30DaysHistory(machineId);
            
            if (result.success && result.data) {
                console.log('✅ [useSprayRealtime] History data:', result.data);
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

    // ==================== FETCH ALL DATA ====================
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log(`🔄 [useSprayRealtime] Fetching all data for: ${machineId}`);
            
            await Promise.all([
                fetchRealtimeData(),
                fetchDailyData(),
                fetchPieChartData(),
                fetchStatistics(),
                fetchHistoryData()
            ]);
            
            console.log('✅ [useSprayRealtime] All data loaded successfully');
        } catch (err) {
            console.error('❌ [useSprayRealtime] Error fetching all data:', err);
            setError(err.message || 'Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [machineId, fetchRealtimeData, fetchDailyData, fetchPieChartData, fetchStatistics, fetchHistoryData]);

    // ==================== REFRESH FUNCTIONS ====================
    const refreshAllData = useCallback(() => {
        console.log('🔄 [useSprayRealtime] Manual refresh all data');
        fetchAllData();
    }, [fetchAllData]);

    const refreshHistoricalData = useCallback(() => {
        console.log('🔄 [useSprayRealtime] Manual refresh historical data');
        fetchStatistics();
        fetchHistoryData();
    }, [fetchStatistics, fetchHistoryData]);

    // ==================== INITIAL LOAD ====================
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

    // ==================== AUTO REFRESH REALTIME ====================
    useEffect(() => {
        if (!machineId) return;

        console.log('⏰ [useSprayRealtime] Setting up auto-refresh (5s interval)');
        const interval = setInterval(() => {
            fetchRealtimeData();
            fetchDailyData();
            fetchPieChartData();
        }, 5000);

        return () => {
            console.log('🛑 [useSprayRealtime] Cleaning up auto-refresh');
            clearInterval(interval);
        };
    }, [machineId, fetchRealtimeData, fetchDailyData, fetchPieChartData]);

    // ==================== CALCULATE TODAY EFFICIENCY ====================
    const todayEfficiency = dailyData ? dailyData.efficiency || 0 : 0;

    return {
        realtimeData,
        dailyData,
        statistics,
        pieChartData,
        historyData,
        loading,
        error,
        isConnected,
        todayEfficiency,
        refreshAllData,
        refreshHistoricalData
    };
};