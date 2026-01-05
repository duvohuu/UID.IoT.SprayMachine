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
import { useMachine } from '../hooks/useMachine';
import { useSprayRealtime } from '../hooks/useSprayRealtime';
import { useMachineSocketEvents } from '../hooks/useSocketEvents';
import MachineHeader from '../components/machine/MachineHeader';
import SprayMachinePanel from '../components/sprayMachine/SprayMachinePanel';
import SprayMachineDataDisplay from '../components/sprayMachine/SprayMachineDataDisplay';

/**
 * ========================================
 * SPRAY MACHINE PAGE COMPONENT (RESPONSIVE)
 * ========================================
 * Page chính hiển thị thông tin chi tiết Spray Machine
 * Tối ưu cho cả Desktop và Mobile
 */
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
        loading: sprayLoading,
        error: sprayError,
        isConnected,
        todayEfficiency,
        refreshAllData,
        refreshHistoricalData
    } = useSprayRealtime(machineId);

    // ==================== SOCKET EVENT CALLBACKS ====================

    const handleMachineUpdate = useCallback((update) => {
        console.log(`[${machine?.name}] Machine status updated:`, update);
        setMachineRealtime(prevMachine => ({
            ...prevMachine,
            ...update,
            lastUpdate: update.lastUpdate,
            lastHeartbeat: update.lastHeartbeat
        }));
    }, [machine]);

    const handleRealtimeUpdate = useCallback((data) => {
        console.log(`[${machine?.name}] Realtime data update:`, data);
    }, [machine]);

    const handleDailyReset = useCallback(() => {
        console.log(`[${machine?.name}] Daily data reset at 6AM`);
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
                pressure: realtimeData.pressure,
                temperature: realtimeData.temperature
            });
        }
    }, [realtimeData]);

    // Auto collapse panel when switching to mobile
    useEffect(() => {
        setPanelExpanded(!isMobile);
    }, [isMobile]);

    // ==================== RENDER LOADING STATE ====================

    if (machineLoading || sprayLoading) {
        return (
            <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: { xs: '50vh', md: '60vh' },
                    flexDirection: 'column',
                    gap: 2
                }}>
                    <CircularProgress size={isSmallMobile ? 40 : 60} />
                    <Typography 
                        variant={isSmallMobile ? "body1" : "h6"} 
                        color="text.secondary"
                        textAlign="center"
                        px={2}
                    >
                        Đang tải dữ liệu Spray Machine...
                    </Typography>
                </Box>
            </Container>
        );
    }

    // ==================== RENDER ERROR STATE ====================

    if (machineError || sprayError) {
        return (
            <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/status')}
                        size={isSmallMobile ? "small" : "medium"}
                    >
                        {isSmallMobile ? "Quay lại" : "Quay lại trang chủ"}
                    </Button>
                </Box>
                <Alert severity="error" sx={{ mb: 2 }}>
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
                    fullWidth={isSmallMobile}
                    size={isSmallMobile ? "small" : "medium"}
                >
                    Tải lại trang
                </Button>
            </Container>
        );
    }

    // ==================== RENDER NO MACHINE STATE ====================

    if (!machine) {
        return (
            <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
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
                    fullWidth={isSmallMobile}
                    size={isSmallMobile ? "small" : "medium"}
                >
                    Quay về trang chủ
                </Button>
            </Container>
        );
    }

    // ==================== RENDER MAIN CONTENT ====================

    return (
        <Container 
            maxWidth="xl" 
            sx={{ 
                mt: { xs: 2, sm: 3, md: 4 }, 
                mb: { xs: 2, sm: 3, md: 4 },
                px: { xs: 1, sm: 2, md: 3 }
            }}
        >
            {/* Header with back button */}
            <MachineHeader machine={machine} />

            {/* Main Grid Layout - Responsive */}
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
                {/* Mobile: Collapsible Panel */}
                {isMobile ? (
                    <>
                        {/* Collapse Button */}
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

                        {/* Collapsible Machine Panel */}
                        <Grid size={12}>
                            <Collapse in={panelExpanded} timeout="auto">
                                <SprayMachinePanel
                                    machine={machineRealtime || machine}
                                    isConnected={isConnected}
                                />
                            </Collapse>
                        </Grid>

                        {/* Data Display - Always visible on mobile */}
                        <Grid size={12}>
                            <SprayMachineDataDisplay
                                dailyData={dailyData}
                                statistics={statistics}
                                loading={sprayLoading}
                                error={sprayError}
                            />
                        </Grid>
                    </>
                ) : (
                    /* Desktop: Side-by-side layout */
                    <>
                        {/* Left Column - Machine Info & Panel */}
                        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                            <SprayMachinePanel
                                machine={machineRealtime || machine}
                                isConnected={isConnected}
                            />
                        </Grid>

                        {/* Right Column - Data Display */}
                        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
                            <SprayMachineDataDisplay
                                dailyData={dailyData}
                                statistics={statistics}
                                loading={sprayLoading}
                                error={sprayError}
                            />
                        </Grid>
                    </>
                )}
            </Grid>

            {/* Footer Info - Responsive */}
            <Box 
                sx={{ 
                    mt: { xs: 3, md: 4 }, 
                    textAlign: 'center', 
                    py: { xs: 1.5, md: 2 }, 
                    borderTop: '1px solid', 
                    borderColor: 'divider',
                    px: { xs: 1, sm: 2 }
                }}
            >
                <Typography 
                    variant={isSmallMobile ? "caption" : "body2"} 
                    color="text.secondary" 
                    display="block" 
                    sx={{ mb: 0.5 }}
                >
                    📊 Hiệu suất hôm nay: <strong>{todayEfficiency}%</strong>
                </Typography>
                
                {!isSmallMobile && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        🔄 Dữ liệu được cập nhật tự động mỗi 5 giây
                    </Typography>
                )}
                
                <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    display="block"
                    sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        wordBreak: 'break-word'
                    }}
                >
                    🕐 Cập nhật lần cuối: {(machineRealtime || machine)?.lastUpdate ? 
                        new Date((machineRealtime || machine).lastUpdate).toLocaleString('vi-VN', {
                            dateStyle: isSmallMobile ? 'short' : 'medium',
                            timeStyle: 'short'
                        }) : 
                        'Chưa có dữ liệu'}
                </Typography>
            </Box>

            {/* Quick Actions - Responsive */}
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