import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, CircularProgress, Alert, Button, Typography, Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useMachine } from '../hooks/useMachine';
import { useMachineSocketEvents } from '../hooks/useSocketEvents';
import MachineHeader from '../components/machine/MachineHeader';
import CNCMachinePanel from '../components/cncMachine/CNCMachinePanel';
import CNCMachineDataDisplay from '../components/cncMachine/CNCMachineDataDisplay';

const CNCMachinePage = ({ user }) => {
    const { machineId } = useParams();
    const navigate = useNavigate();
    const [machineRealtime, setMachineRealtime] = useState(null);
    
    const {
        machine,
        loading: machineLoading,
        error: machineError
    } = useMachine(machineId, 'machineId');

    // Socket event callbacks
    const handleMachineUpdate = useCallback((update) => {
        console.log(`[${machine?.name}] CNC Machine status updated:`, update);
        setMachineRealtime(prevMachine => ({
            ...prevMachine,
            ...update,
            lastUpdate: update.lastUpdate,
            lastHeartbeat: update.lastHeartbeat
        }));
    }, [machine]);

    const handleShiftChange = useCallback((data) => {
        console.log(`[${machine?.name}] CNC data changed:`, data);
        // CNC không có shift, có thể xử lý data change khác
    }, [machine]);

    const { isConnected } = useMachineSocketEvents(machine, {
        onMachineUpdate: handleMachineUpdate,
        onShiftChange: handleShiftChange
    });

    useEffect(() => {
        if (machine) {
            setMachineRealtime(machine);
        }
    }, [machine]);

    if (machineLoading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Đang tải thông tin máy CNC...</Typography>
            </Container>
        );
    }

    if (machineError || !machine) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {machineError || `Không tìm thấy máy CNC với ID: ${machineId}`}
                </Alert>
                <Button 
                    variant="contained" 
                    startIcon={<ArrowBack />} 
                    onClick={() => navigate('/status')}
                >
                    Quay lại
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <MachineHeader machine={machineRealtime || machine} />
            
            <Grid container spacing={3}>
                {/* Left Column - Thông tin máy và thống kê */}
                <Grid size={{ xs: 3.8, md: 3.64 }}>
                    <CNCMachinePanel
                        machine={machine}
                        machineRealtime={machineRealtime}
                        isConnected={isConnected}
                        user={user}
                    />
                </Grid>
                
                {/* Right Column - Biểu đồ CNC */}
                <Grid size={{ xs: 8.2, md: 8.36 }}>
                    <CNCMachineDataDisplay
                        machine={machine}
                        machineRealtime={machineRealtime}
                        isConnected={isConnected}
                        user={user}
                    />
                </Grid>
            </Grid>

            {/* Last Update Info */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Cập nhật lần cuối: {(machineRealtime || machine)?.lastUpdate ? 
                        new Date((machineRealtime || machine).lastUpdate).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
                </Typography>
            </Box>
        </Container>
    );
};

export default CNCMachinePage;