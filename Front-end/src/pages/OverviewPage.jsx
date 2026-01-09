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
import OverviewPageHeader from '../components/overview/OverviewPageHeader';
import OverviewPageStatsCards from '../components/overview/OverviewPageStatsCards';
import OverviewPageMachinesGrid from '../components/overview/OverviewPageMachinesGrid';

// Import API and hooks
import { getMachines } from '../api/machineAPI';
import { useAllMachinesStatusUpdates } from '../hooks/useSocketEvents';

const OverviewPage = ({ user }) => {
    const theme = useTheme();
    const navigate = useNavigate();
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
        setLoading(true);
        
        try {
            const result = await getMachines();
            
            // Back-end returns: { success, data: { success, machines } }
            const machines = result.data?.machines || [];
            
            if (result.success && machines.length > 0) {
                
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
            // setError("Lỗi kết nối API - Kiểm tra kết nối server");
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Handle machine status updates from socket
    const handleMachineStatusUpdate = useCallback((update) => {
        console.log('   Machine status update from socket:', update);
        console.log('   Status:', update.status);          
        console.log('   isConnected:', update.isConnected); 
        console.log('   lastStatus:', update.lastStatus);   
        
        setMachines((prevMachines) =>
            prevMachines.map((machine) =>
                machine.machineId === update.machineId  
                    ? {
                        ...machine,
                        status: update.status,              
                        isConnected: update.isConnected,   
                        lastStatus: update.lastStatus,       
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
        if (machine.type === 'Powder Filling Machine') {
            navigate(`/powder/${machine.machineId}`);
        } else if (machine.type === 'CNC Machine') {
            navigate(`/cnc/${machine.machineId}`);
        } else if (machine.type === 'Spray Machine') {  
            navigate(`/spray/${machine.machineId}`);
        } else if (machine.type === 'Salt Filling Machine') {
            navigate(`/salt/${machine.machineId}`);
        } else {
            navigate(`/machine/${machine.machineId}`);
        }
    };

    const handleMachineDelete = async (deletedMachine) => {
        try {
            console.log('   Deleted machine:', deletedMachine.machineId);
            
            const result = await getMachines();
            const machines = result.data?.machines || [];
            
            if (result.success && machines.length >= 0) {
                const sortedMachines = sortMachinesByMachineId(machines);
                setMachines(sortedMachines);
            } else {
                setMachines([]);
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
                <OverviewPageHeader isMobile={isMobile} error={error} user={user} />

                {/* Stats Cards */}
                <OverviewPageStatsCards machines={machines} loading={loading} />

                {/* Machines Grid */}
                <OverviewPageMachinesGrid 
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

export default OverviewPage;