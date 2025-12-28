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
    Wifi as WifiIcon,
    WifiOff as WifiOffIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';

/**
 * ========================================
 * SPRAY MACHINE PANEL COMPONENT
 * ========================================
 * Panel bên trái hiển thị thông tin cơ bản:
 * - Tên máy
 * - ID máy
 * - Chủ sở hữu
 * - Ca làm việc (6h-18h)
 */
const SprayMachinePanel = ({ 
    machine,
    isConnected
}) => {

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    📋 Thông tin máy
                </Typography>

                {/* Trạng thái kết nối */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    {isConnected ? (
                        <WifiIcon sx={{ color: 'success.main' }} />
                    ) : (
                        <WifiOffIcon sx={{ color: 'error.main' }} />
                    )}
                    <Chip
                        label={isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                        color={isConnected ? 'success' : 'error'}
                        size="small"
                    />
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Tên máy */}
                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Tên máy
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {machine?.name || 'N/A'}
                    </Typography>
                </Box>

                {/* Machine ID */}
                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Machine ID
                    </Typography>
                    <Typography 
                        variant="body1" 
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
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Chủ sở hữu
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {machine?.userId || 'N/A'}
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Ca làm việc */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TimeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="caption" color="text.secondary">
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
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                        12 giờ/ngày
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SprayMachinePanel;