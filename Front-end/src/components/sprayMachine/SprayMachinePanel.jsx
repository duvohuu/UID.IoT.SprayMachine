import React from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Box, 
    Chip,
    Divider
} from '@mui/material';
import { 
    Circle as CircleIcon,
    AccessTime as TimeIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    PowerSettingsNew as IdleIcon
} from '@mui/icons-material';

/**
 * ========================================
 * SPRAY MACHINE PANEL COMPONENT
 * ========================================
 * Panel bên trái hiển thị thông tin cơ bản:
 * - Tên máy
 * - ID máy
 * - Chủ sở hữu
 * - Trạng thái hoạt động (online/offline/idle)
 * - Ca làm việc (6h-18h)
 */
const SprayMachinePanel = ({ machine }) => {
    
    // ==================== STATUS LOGIC (DỰA VÀO machine.status) ====================
    
    const machineStatus = machine?.status; // 'online' | 'offline' | 'idle'
    
    let statusColor, statusText, statusIcon;
    
    // Xét theo machine.status
    switch (machineStatus) {
        case 'online':
            statusColor = 'success';
            statusText = 'Đang hoạt động';
            statusIcon = <PlayIcon sx={{ fontSize: 16 }} />;
            break;
        case 'offline':
            statusColor = 'error';
            statusText = 'Đang dừng';
            statusIcon = <PauseIcon sx={{ fontSize: 16 }} />;
            break;
        case 'idle':
            statusColor = 'warning';
            statusText = 'Chờ';
            statusIcon = <IdleIcon sx={{ fontSize: 16 }} />;
            break;
        default:
            statusColor = 'default';
            statusText = 'Không xác định';
            statusIcon = <CircleIcon sx={{ fontSize: 16 }} />;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    📋 Thông tin máy
                </Typography>

                {/* ==================== TRẠNG THÁI HOẠT ĐỘNG ==================== */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Trạng thái hoạt động
                    </Typography>
                    
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 1.5 
                    }}>
                        {/* Status Chip - Dựa vào machine.status */}
                        <Chip
                            icon={statusIcon}
                            label={statusText}
                            color={statusColor}
                            sx={{ 
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                height: 36,
                                '& .MuiChip-icon': {
                                    fontSize: 18
                                }
                            }}
                        />
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* ==================== THÔNG TIN MÁY ==================== */}
                
                {/* Tên máy */}
                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Tên máy
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {machine?.name || 'N/A'}
                    </Typography>
                </Box>

                {/* Machine ID */}
                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Machine ID
                    </Typography>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 'bold',
                            color: 'primary.main'
                        }}
                    >
                        {machine?.machineId || 'N/A'}
                    </Typography>
                </Box>

                {/* Chủ sở hữu */}
                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Chủ sở hữu
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {machine?.userId || 'N/A'}
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* ==================== CA LÀM VIỆC ==================== */}
                
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TimeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2" color="text.secondary">
                            Ca làm việc
                        </Typography>
                    </Box>
                    <Chip 
                        label="6:00 - 18:00"
                        color="primary"
                        sx={{ 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            width: '100%'
                        }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                        12 giờ/ngày
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SprayMachinePanel;