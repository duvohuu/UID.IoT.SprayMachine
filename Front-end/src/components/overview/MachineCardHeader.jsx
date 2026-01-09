import React from 'react';
import { Box, Chip, IconButton, Tooltip, Divider } from '@mui/material';
import {
    Business as CompanyIcon,
    AdminPanelSettings as AdminIcon,
    Person as UserIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const MachineCardHeader = ({ machine, isAdmin, onDelete }) => {
    const theme = useTheme();

    return (
        <Box sx={{ mb: 2, pt: 0.5 }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1.5,
                mb: 1.5
            }}>
                {/* Left side - Chips */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                        icon={<CompanyIcon />}
                        label={machine.machineId || 'N/A'}
                        size="medium"
                        variant="filled"
                        color="primary"
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            height: 30,
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                    />

                    <Chip
                        icon={isAdmin ? <AdminIcon /> : <UserIcon />}
                        label={isAdmin ? "ADMIN" : "USER"}
                        size="medium"
                        variant="outlined"
                        sx={{
                            fontSize: '0.8rem',
                            height: 30,
                            borderRadius: 3,
                            color: theme.palette.secondary.main,
                            borderColor: theme.palette.secondary.main,
                            backgroundColor: theme.palette.secondary.main + '08',
                            fontWeight: 600,
                            '&:hover': {
                                backgroundColor: theme.palette.secondary.main + '15',
                            }
                        }}
                    />
                </Box>

                {/* Right side - Delete button */}
                {isAdmin && (
                    <Tooltip title="Xóa máy" arrow>
                        <IconButton
                            size="small"
                            color="error"
                            onClick={onDelete}
                            sx={{
                                width: 32,
                                height: 32,
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                border: `2px solid ${theme.palette.error.main}30`,
                                '&:hover': {
                                    backgroundColor: 'error.main',
                                    color: 'white',
                                    transform: 'scale(1.1)',
                                    boxShadow: '0 6px 16px rgba(244,67,54,0.4)',
                                }
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            <Divider sx={{
                borderColor: theme.palette.divider,
                opacity: 0.6,
            }} />
        </Box>
    );
};

export default MachineCardHeader;