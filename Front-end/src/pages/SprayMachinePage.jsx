import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Grid, 
    CircularProgress, 
    Alert, 
    Button, 
    Typography, 
    Box,
    useMediaQuery,
    useTheme,
    IconButton,
    Collapse
} from '@mui/material';
import { 
    ArrowBack, 
    ExpandMore as ExpandMoreIcon, 
    ExpandLess as ExpandLessIcon 
} from '@mui/icons-material';

// Import hooks
import { useMachine } from '../hooks/useMachine';
import { useSprayRealtime } from '../hooks/useSprayRealtime';
import { useMachineSocketEvents } from '../hooks/useSocketEvents';

// Import components
import MachineHeader from '../components/machine/MachineHeader';
import SprayMachinePanel from '../components/sprayMachine/SprayMachinePanel';
import SprayMachineDataDisplay from '../components/sprayMachine/SprayMachineDataDisplay';

const SprayMachinePage = () => {
    const { machineId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [machineRealtime, setMachineRealtime] = useState(null);
    const [panelExpanded, setPanelExpanded] = useState(!isMobile);

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
        pieChartData,
        historyData,
        loading: sprayLoading,
        error: sprayError,
        isConnected,
        refreshAllData,
        refreshHistoricalData,
        updateRealtimeFromSocket,
        updateConnectionStatus
    } = useSprayRealtime(machineId);

    
    /**
     * Handle machine status update (connection, online/offline)
     */
    const handleMachineUpdate = useCallback((update) => {
        console.log(`📡 [${machine?.name}] Machine status update:`, update);
        
        setMachineRealtime(prevMachine => ({
            ...prevMachine,
            ...update,
            lastUpdate: update.lastUpdate,
            lastHeartbeat: update.lastHeartbeat
        }));
        
        // ✅ Update connection status in useSprayRealtime
        updateConnectionStatus(update.isConnected);
    }, [machine, updateConnectionStatus]);

    /**
     * Gọi updateRealtimeFromSocket thay vì fetch API
     */
    const handleRealtimeUpdate = useCallback((socketData) => {
        console.log(`📡 [${machine?.name}] Realtime data update:`, socketData);
        updateRealtimeFromSocket(socketData);
    }, [machine, updateRealtimeFromSocket]);

    /**
     * Handle daily reset at 6AM
     */
    const handleDailyReset = useCallback(() => {
        console.log(`🌅 [${machine?.name}] Daily data reset at 6AM`);
        
        // Fetch lại toàn bộ data vì đã reset
        refreshAllData();
    }, [machine, refreshAllData]);

    // ==================== SETUP SOCKET LISTENERS ====================
    
    useMachineSocketEvents({
        machineId,
        onMachineUpdate: handleMachineUpdate,
        onRealtimeUpdate: handleRealtimeUpdate,
        onDailyReset: handleDailyReset
    });

    // ==================== EFFECTS ====================

    useEffect(() => {
        if (machine) {
            setMachineRealtime(machine);
            console.log('📊 [SprayMachinePage] Machine loaded:', machine.name);
        }
    }, [machine]);

    useEffect(() => {
        if (realtimeData) {
            console.log('🔄 [SprayMachinePage] Realtime data updated:', {
                status: realtimeData.sprayStatus,
                activeTime: realtimeData.activeTime,
                stopTime: realtimeData.stopTime,
                source: 'socket' 
            });
        }
    }, [realtimeData]);

    useEffect(() => {
        setPanelExpanded(!isMobile);
    }, [isMobile]);

    // ==================== LOADING & ERROR STATES ====================

    if (machineLoading || sprayLoading) {
        return (
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="100vh"
                flexDirection="column"
                gap={2}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                    Đang tải dữ liệu máy...
                </Typography>
            </Box>
        );
    }

    if (machineError || sprayError) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert 
                    severity="error" 
                    action={
                        <Button 
                            color="inherit" 
                            size="small" 
                            onClick={() => navigate('/status')}
                        >
                            Quay lại
                        </Button>
                    }
                >
                    {machineError || sprayError}
                </Alert>
            </Container>
        );
    }

    if (!machine) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="warning">
                    Không tìm thấy máy với ID: {machineId}
                </Alert>
            </Container>
        );
    }

    // ==================== RENDER ====================

    return (
        <Container 
            maxWidth="xl" 
            sx={{ 
                mt: { xs: 2, sm: 3, md: 4 }, 
                mb: { xs: 2, sm: 3, md: 4 },
                px: { xs: 1, sm: 2, md: 3 }
            }}
        >
            {/* Machine Header */}
            <MachineHeader machine={machine} />

            {/* Main Content Grid */}
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
                {isMobile ? (
                    // Mobile Layout: Collapsible panel
                    <>
                        <Grid size={12}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 1.5,
                                    bgcolor: 'background.paper',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setPanelExpanded(!panelExpanded)}
                            >
                                <Typography variant="subtitle1" fontWeight={600}>
                                    📊 Thông tin máy & Trạng thái
                                </Typography>
                                <IconButton size="small">
                                    {panelExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                        </Grid>

                        <Grid size={12}>
                            <Collapse in={panelExpanded} timeout="auto">
                                <SprayMachinePanel 
                                    machine={machineRealtime || machine}
                                    isConnected={isConnected}
                                />
                            </Collapse>
                        </Grid>

                        <Grid size={12}>
                            <SprayMachineDataDisplay
                                dailyData={dailyData}
                                statistics={statistics}
                                pieChartData={pieChartData}
                                historyData={historyData}
                                loading={sprayLoading}
                                error={sprayError}
                            />
                        </Grid>
                    </>
                ) : (
                    // Desktop Layout: Side-by-side
                    <>
                        <Grid size={{ xs: 12, md: 4, lg: 2.5 }}>
                            <SprayMachinePanel 
                                machine={machineRealtime || machine}
                                isConnected={isConnected}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 8, lg: 9.5 }}>
                            <SprayMachineDataDisplay
                                dailyData={dailyData}
                                statistics={statistics}
                                pieChartData={pieChartData}
                                historyData={historyData}
                                loading={sprayLoading}
                                error={sprayError}
                            />
                        </Grid>
                    </>
                )}
            </Grid>

            {/* Footer Info */}
            <Box sx={{ mt: { xs: 2, md: 3 }, textAlign: 'center' }}>
                {/* ✅ Socket Status Indicator */}
                {isConnected ? (
                    <Typography 
                        variant="caption" 
                        color="success.main" 
                        display="block" 
                        sx={{ mb: 1, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                        🟢 Dữ liệu được cập nhật tự động qua Socket.IO
                    </Typography>
                ) : (
                    <Typography 
                        variant="caption" 
                        color="error.main" 
                        display="block" 
                        sx={{ mb: 1, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                        🔴 Máy mất kết nối - Không nhận được dữ liệu realtime
                    </Typography>
                )}
                
                <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    display="block"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, wordBreak: 'break-word' }}
                >
                    🕐 Cập nhật lần cuối: {
                        (machineRealtime || machine)?.lastUpdate ? 
                        new Date((machineRealtime || machine).lastUpdate).toLocaleString('vi-VN', {
                            dateStyle: isSmallMobile ? 'short' : 'medium',
                            timeStyle: 'short'
                        }) : 
                        'Chưa có dữ liệu'
                    }
                </Typography>
            </Box>

            {/* Action Buttons */}
            <Box 
                sx={{ 
                    mt: { xs: 2, md: 3 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'center',
                    gap: { xs: 1.5, sm: 2 },
                    px: { xs: 1, sm: 0 }
                }}
            >
                <Button
                    variant="outlined"
                    onClick={refreshAllData}
                    disabled={sprayLoading}
                    fullWidth={isSmallMobile}
                    size={isSmallMobile ? "small" : "medium"}
                    sx={{ minWidth: { sm: 150 } }}
                >
                    {isSmallMobile ? "Làm mới" : "Làm mới tất cả"}
                </Button>

                <Button
                    variant="outlined"
                    onClick={refreshHistoricalData}
                    disabled={sprayLoading}
                    fullWidth={isSmallMobile}
                    size={isSmallMobile ? "small" : "medium"}
                    sx={{ minWidth: { sm: 150 } }}
                >
                    {isSmallMobile ? "Lịch sử" : "Làm mới lịch sử"}
                </Button>
            </Box>
        </Container>
    );
};

export default SprayMachinePage;