import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import {
    Refresh as RefreshIcon,
    Warning as WarningIcon,
    Visibility as ViewIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const MachineCardFooter = ({ lastClickTime, canViewDetails, isConnected }) => {
    const theme = useTheme();

    return (
        <>
            {/* LAST VIEW */}
            <Box sx={{ mt: 'auto', mb: 1.5 }}>
                {lastClickTime ? (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: `${theme.palette.info.main}06`,
                        border: `1px solid ${theme.palette.info.main}15`,
                    }}>
                        <RefreshIcon sx={{
                            fontSize: 20,
                            color: 'info.main',
                            animation: 'spin 2s linear infinite',
                            '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' },
                            }
                        }} />
                        <Box>
                            <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600, fontSize: '0.9rem' }}>
                                Lần xem gần nhất
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                {new Date(lastClickTime).toLocaleString('vi-VN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: `${theme.palette.warning.main}06`,
                        border: `1px solid ${theme.palette.warning.main}15`,
                    }}>
                        <WarningIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                        <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
                            Chưa xem máy này
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ACTION HINT */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                p: 1,
                borderRadius: 2,
                border: `2px dashed ${theme.palette.divider}`,
                background: `linear-gradient(45deg, transparent 48%, ${theme.palette.action.hover} 50%, transparent 52%)`,
                backgroundSize: '8px 8px',
                animation: canViewDetails ? 'slide 2s linear infinite' : 'none',
                '@keyframes slide': {
                    '0%': { backgroundPosition: '0 0' },
                    '100%': { backgroundPosition: '16px 16px' },
                }
            }}>
                {canViewDetails ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ViewIcon sx={{
                            fontSize: 20,
                            color: 'primary.main',
                            animation: 'bounce 1s infinite',
                            '@keyframes bounce': {
                                '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                                '40%': { transform: 'translateY(-4px)' },
                                '60%': { transform: 'translateY(-2px)' },
                            }
                        }} />
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'primary.main',
                                fontWeight: 600,
                                fontSize: '0.95rem'
                            }}
                        >
                            Click để xem chi tiết máy
                        </Typography>
                    </Box>
                ) : (
                    <Tooltip
                        title={!isConnected ? "Máy phải kết nối để xem chi tiết" : "Máy phải hoạt động để xem chi tiết"}
                        arrow
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LockIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                    fontSize: '0.9rem'
                                }}
                            >
                                {!isConnected ? 'Chưa kết nối' : 'Chưa thể xem chi tiết'}
                            </Typography>
                        </Box>
                    </Tooltip>
                )}
            </Box>
        </>
    );
};

export default MachineCardFooter;