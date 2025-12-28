import React, { useState, useEffect, useCallback } from 'react';
import { 
    Box, 
    Container, 
    useMediaQuery,
    Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Import components
import StatusHeader from '../components/status/StatusHeader';
import StatusStatsCards from '../components/status/StatusStatsCards';
import StatusMachinesGrid from '../components/status/StatusMachinesGrid';

// Import API and hooks
import { getMachines } from '../api/machineAPI';
import { useSnackbar } from '../context/SnackbarContext';
import { useSocket } from '../context/SocketContext';
import { useAllMachinesStatusUpdates } from '../hooks/useSocketEvents';

const StatusPage = ({ user }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const { isConnected } = useSocket(); 
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // State management
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper function để sort machines theo machineId
    const sortMachinesByMachineId = (machinesList) => {
        return [...machinesList].sort((a, b) => {
            const idA = a.machineId || '';
            const idB = b.machineId || '';
            return idA.localeCompare(idB);
        });
    };

    // Fetch machines
    const fetchMachines = useCallback(async () => {
        console.log("🔄 Fetching machines from mainServer...");
        setLoading(true);
        
        try {
            const result = await getMachines();
            
            // Back-end returns: { success, data: { success, machines } }
            const machines = result.data?.machines || [];
            
            if (result.success && machines.length > 0) {
                console.log("Machines loaded from API:", machines.length);
                console.log("Sample machine object:", machines[0]);
                console.log("Sample machine _id:", machines[0]?._id);
                console.log("Sample machine id:", machines[0]?.id);
                
                const sortedMachines = sortMachinesByMachineId(machines);
                setMachines(sortedMachines);
                setError(null);
            } else {
                console.warn("Không có dữ liệu từ API");
                setMachines([]);
                setError(user.role === 'admin' 
                    ? "Chưa có máy nào trong hệ thống" 
                    : "Bạn chưa có máy nào - Liên hệ admin để được cấp máy"
                );
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách máy:", error);
            setMachines([]);
            setError("Lỗi kết nối API - Kiểm tra kết nối server");
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Handle machine status updates from socket
    const handleMachineStatusUpdate = useCallback((update) => {
        console.log('📡 Machine status update from mainServer:', update);
        
        setMachines((prevMachines) =>
            prevMachines.map((machine) =>
                machine.ip === update.ip || machine.id === update.id
                    ? {
                        ...machine,
                        ...update,
                        lastUpdate: update.lastUpdate,
                        lastHeartbeat: update.lastHeartbeat
                    }
                    : machine
            )
        );
    }, []);

    // Use custom hook for socket events
    useAllMachinesStatusUpdates(handleMachineStatusUpdate);

    // Initial fetch when user logs in
    useEffect(() => {
        fetchMachines();
    }, [fetchMachines]);

    // Event handlers
    const handleMachineClick = (machine) => {
        console.log("Điều hướng đến chi tiết máy:", machine.name, "machineId:", machine.machineId);
        
        if (machine.type === 'Powder Filling Machine') {
            navigate(`/powder/${machine.machineId}`);
        } else if (machine.type === 'CNC Machine') {
            navigate(`/cnc/${machine.machineId}`);
        } else if (machine.type === 'Spray Machine') {  
            navigate(`/spray/${machine.machineId}`);
        } else if (machine.type === 'Salt Filling Machine') {
            navigate(`/salt/${machine.machineId}`);
        } else {
            // Fallback cho các loại máy khác
            navigate(`/machine/${machine.machineId}`);
        }
    };

    const handleMachineDelete = async (deletedMachine) => {
        try {
            console.log('🔄 Refreshing machine list after deletion...');
            console.log('   Deleted machine:', deletedMachine.machineId);
            
            const result = await getMachines();
            const machines = result.data?.machines || [];
            
            if (result.success && machines.length >= 0) {
                console.log(`   Fetched ${machines.length} machines from API`);
                const sortedMachines = sortMachinesByMachineId(machines);
                setMachines(sortedMachines);
                console.log("✅ Machine list refreshed - UI updated!");
            } else {
                // Nếu không có máy nào, set empty array
                setMachines([]);
                console.log("✅ No machines left - UI cleared");
            }
        } catch (error) {
            console.error("❌ Error refreshing machines after delete:", error);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${theme.palette.primary.dark}15 0%, ${theme.palette.secondary.dark}10 100%)`
                    : `linear-gradient(135deg, ${theme.palette.primary.light}08 0%, ${theme.palette.secondary.light}08 100%)`,
                py: 4,
            }}
        >
            <Container maxWidth="xl">
                {/* Header */}
                <StatusHeader isMobile={isMobile} error={error} user={user} />

                {/* Stats Cards */}
                <StatusStatsCards machines={machines} loading={loading} />

                {/* Machines Grid */}
                <StatusMachinesGrid 
                    machines={machines}
                    loading={loading}
                    error={error}
                    user={user}
                    onMachineClick={handleMachineClick}
                    onMachineDelete={handleMachineDelete}
                />
            </Container>
        </Box>
    );
};

export default StatusPage;