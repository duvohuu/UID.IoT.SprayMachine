import React from 'react';
import { Box, Badge, Typography, Chip } from '@mui/material';
import {
    Computer as MachineIcon,
    PlayArrow as PlayIcon,
    Error as ErrorIcon,
    Circle as CircleIcon,
    WifiOff as DisconnectedIcon,
    CheckCircle as ConnectedIcon,
    Settings as SettingsIcon,
    AccountCircle as AccountIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const MachineCardBody = ({ machine, statusColor, statusText, statusBgColor, isConnected }) => {
    const theme = useTheme();

    // Get icons based on status
    const primaryStatusIcon = machine.status === 'online' ? <PlayIcon /> : <ErrorIcon />;
    const statusIcon = machine.status === 'online' 
        ? <CircleIcon sx={{ fontSize: 12 }} /> 
        : <DisconnectedIcon sx={{ fontSize: 12 }} />;

    return (
        <>
            {/* MACHINE HEADER WITH STATUS BADGE */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 2 }}>
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                        <Box
                            sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: statusBgColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                border: `3px solid ${theme.palette.background.paper}`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            }}
                        >
                            {React.cloneElement(primaryStatusIcon, { sx: { fontSize: 14 } })}
                        </Box>
                    }
                >
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            animation: isConnected ? 'pulse 2s ease-in-out infinite' : 'none',
                            '@keyframes pulse': {
                                '0%': {
                                    boxShadow: `0 8px 24px rgba(0,0,0,0.15)`,
                                    transform: 'scale(1)',
                                },
                                '50%': {
                                    boxShadow: `0 12px 40px ${theme.palette.primary.main}80, 0 0 20px ${theme.palette.primary.main}40`,
                                    transform: 'scale(1.05)',
                                },
                                '100%': {
                                    boxShadow: `0 8px 24px rgba(0,0,0,0.15)`,
                                    transform: 'scale(1)',
                                },
                            }
                        }}
                    >
                        <MachineIcon sx={{ fontSize: 32 }} />
                    </Box>
                </Badge>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                            lineHeight: 1.3,
                            mb: 1,
                            fontSize: '1.4rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {machine.name}
                    </Typography>

                    <Chip
                        icon={statusIcon}
                        label={statusText}
                        color={statusColor}
                        size="medium"
                        sx={{
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            height: 32,
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                    />
                </Box>
            </Box>

            {/* MACHINE INFO - Owner và Type */}
            <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch' }}>
                    {/* Owner */}
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: `${theme.palette.secondary.main}08`,
                        border: `1px solid ${theme.palette.secondary.main}20`,
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <AccountIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                            <Typography variant="caption" sx={{
                                color: 'secondary.main',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                Chủ sở hữu máy
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{
                            fontWeight: 700,
                            color: 'secondary.main',
                            fontSize: '0.9rem'
                        }}>
                            {machine.userId || 'Chưa xác định chủ sở hữu'}
                        </Typography>
                    </Box>

                    {/* Machine Type */}
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: `${theme.palette.primary.main}08`,
                        border: `1px solid ${theme.palette.primary.main}20`,
                    }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 0.5,
                        }}>
                            <SettingsIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="caption" sx={{
                                color: 'primary.main',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                Loại máy
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{
                            fontWeight: 700,
                            color: 'primary.main',
                            fontSize: '0.9rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {machine.type}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* CONNECTION STATUS */}
            <Box sx={{
                mb: 1.5,
                p: 1.5,
                borderRadius: 3,
                background: isConnected
                    ? `linear-gradient(135deg, ${theme.palette.success.main}08, ${theme.palette.success.main}04)`
                    : `linear-gradient(135deg, ${theme.palette.error.main}08, ${theme.palette.error.main}04)`,
                border: `1px solid ${isConnected ? theme.palette.success.main + '25' : theme.palette.error.main + '25'}`,
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: 2,
                    background: `linear-gradient(90deg, ${isConnected ? theme.palette.success.main : theme.palette.error.main}, transparent)`,
                }
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 45,
                            height: 45,
                            borderRadius: 2,
                            backgroundColor: isConnected ? `${theme.palette.success.main}20` : `${theme.palette.error.main}20`,
                            color: isConnected ? theme.palette.success.main : theme.palette.error.main,
                        }}
                    >
                        {isConnected ? <ConnectedIcon /> : <ErrorIcon />}
                    </Box>
                    <Box>
                        <Typography variant="body1" sx={{
                            color: isConnected ? 'success.main' : 'error.main',
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}>
                            {isConnected ? 'Đã kết nối MQTT' : 'Chưa kết nối MQTT'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                            {isConnected ? 'Broker communication stable' : 'Kiểm tra MQTT broker'}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default MachineCardBody;