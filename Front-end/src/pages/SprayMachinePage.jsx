import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Grid, 
    CircularProgress, 
    Alert, 
    Button, 
    Typography, 
    Box 
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useMachine } from '../hooks/useMachine';
import { useSprayRealtime } from '../hooks/useSprayRealtime';
import { useMachineSocketEvents } from '../hooks/useSocketEvents';
import MachineHeader from '../components/machine/MachineHeader';
import SprayMachinePanel from '../components/sprayMachine/SprayMachinePanel';
import SprayMachineDataDisplay from '../components/sprayMachine/SprayMachineDataDisplay';

/**
 * ========================================
 * SPRAY MACHINE PAGE COMPONENT
 * ========================================
 * Page chính hiển thị thông tin chi tiết Spray Machine
 * Bao gồm:
 * - Header với back button
 * - Panel trái: Kết nối, trạng thái realtime
 * - Panel phải: Charts, daily data, statistics
 */
const SprayMachinePage = () => {
    const { machineId } = useParams();
    const navigate = useNavigate();
    const [machineRealtime, setMachineRealtime] = useState(null);

    // ==================== FETCH MACHINE INFO ====================
    const {
        machine,
        loading: machineLoading,
        error: machineError
    } = useMachine(machineId);

    // ==================== FETCH SPRAY DATA ====================
    const {
        realtimeData,
        dailyData,
        statistics,
        loading: sprayLoading,
        error: sprayError,
        isConnected,
        todayEfficiency,
        refreshAllData,
        refreshHistoricalData
    } = useSprayRealtime(machineId);

    // ==================== SOCKET EVENT CALLBACKS ====================

    /**
     * Xử lý khi nhận update machine status từ socket
     */
    const handleMachineUpdate = useCallback((update) => {
        console.log(`[${machine?.name}] Machine status updated:`, update);
        setMachineRealtime(prevMachine => ({
            ...prevMachine,
            ...update,
            lastUpdate: update.lastUpdate,
            lastHeartbeat: update.lastHeartbeat
        }));
    }, [machine]);

    /**
     * Xử lý khi nhận realtime data từ socket (nếu có)
     */
    const handleRealtimeUpdate = useCallback((data) => {
        console.log(`[${machine?.name}] Realtime data update:`, data);
        // Socket data sẽ trigger re-fetch trong useSprayRealtime hook
        // Hoặc có thể xử lý trực tiếp ở đây nếu cần
    }, [machine]);

    /**
     * Xử lý khi daily data reset (6h sáng)
     */
    const handleDailyReset = useCallback(() => {
        console.log(`[${machine?.name}] Daily data reset at 6AM`);
        refreshAllData();
    }, [machine, refreshAllData]);

    // ==================== SETUP SOCKET LISTENERS ====================
    
    // Use custom hook for socket events
    useMachineSocketEvents({
        machineId,
        onMachineUpdate: handleMachineUpdate,
        onRealtimeUpdate: handleRealtimeUpdate,
        onDailyReset: handleDailyReset
    });

    // ==================== EFFECTS ====================

    /**
     * Set initial machine realtime state
     */
    useEffect(() => {
        if (machine) {
            setMachineRealtime(machine);
            console.log('📊 [SprayMachinePage] Machine loaded:', machine.name);
        }
    }, [machine]);

    /**
     * Log spray data updates
     */
    useEffect(() => {
        if (realtimeData) {
            console.log('🔄 [SprayMachinePage] Realtime data updated:', {
                status: realtimeData.sprayStatus,
                pressure: realtimeData.pressure,
                temperature: realtimeData.temperature
            });
        }
    }, [realtimeData]);

    // ==================== RENDER LOADING STATE ====================

    if (machineLoading || sprayLoading) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '60vh',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    <CircularProgress size={60} />
                    <Typography variant="h6" color="text.secondary">
                        Đang tải dữ liệu Spray Machine...
                    </Typography>
                </Box>
            </Container>
        );
    }

    // ==================== RENDER ERROR STATE ====================

    if (machineError || sprayError) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Box sx={{ mb: 3 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/status')}
                    >
                        Quay lại
                    </Button>
                </Box>
                <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                        ❌ Lỗi tải dữ liệu
                    </Typography>
                    <Typography variant="body2">
                        {machineError || sprayError}
                    </Typography>
                </Alert>
                <Button 
                    variant="contained" 
                    onClick={() => window.location.reload()}
                    sx={{ mt: 2 }}
                >
                    Tải lại trang
                </Button>
            </Container>
        );
    }

    // ==================== RENDER NO MACHINE STATE ====================

    if (!machine) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Alert severity="warning">
                    <Typography variant="body1">
                        ⚠️ Không tìm thấy máy với ID: {machineId}
                    </Typography>
                </Alert>
                <Button 
                    variant="contained" 
                    onClick={() => navigate('/status')}
                    sx={{ mt: 2 }}
                    startIcon={<ArrowBack />}
                >
                    Quay về trang chủ
                </Button>
            </Container>
        );
    }

    // ==================== RENDER MAIN CONTENT ====================

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header with back button */}
            <MachineHeader machine={machine} />

            {/* Main Grid Layout */}
            <Grid container spacing={3}>
                {/* Left Column - Machine Info & Panel */}
                <Grid item xs={12} md={4}>
                    {/* Basic Info */}
    

                    {/* Spray Machine Panel */}
                    <SprayMachinePanel
                        machine={machineRealtime || machine}
                        isConnected={isConnected}
                    />
                </Grid>

                {/* Right Column - Data Display */}
                <Grid item xs={12} md={8}>
                    <SprayMachineDataDisplay
                        dailyData={dailyData}
                        statistics={statistics}
                        loading={sprayLoading}
                        error={sprayError}
                    />
                </Grid>
            </Grid>

            {/* Footer Info */}
            <Box sx={{ mt: 4, textAlign: 'center', py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    📊 Hiệu suất hôm nay: {todayEfficiency}%
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    🔄 Dữ liệu được cập nhật tự động mỗi 5 giây
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                    🕐 Cập nhật lần cuối: {(machineRealtime || machine)?.lastUpdate ? 
                        new Date((machineRealtime || machine).lastUpdate).toLocaleString('vi-VN') : 
                        'Chưa có dữ liệu'}
                </Typography>
            </Box>

            {/* Quick Actions (Optional) */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button 
                    variant="outlined" 
                    onClick={refreshAllData}
                    disabled={sprayLoading}
                >
                    Làm mới tất cả
                </Button>
                <Button 
                    variant="outlined" 
                    onClick={refreshHistoricalData}
                    disabled={sprayLoading}
                >
                    Làm mới lịch sử
                </Button>
            </Box>
        </Container>
    );
};

export default SprayMachinePage;