import React, { useState, useEffect } from 'react';
import { Card, CardActionArea, CardContent } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import MachineCardHeader from './MachineCardHeader';
import MachineCardBody from './MachineCardBody';
import MachineCardFooter from './MachineCardFooter';

const MachineStatusCard = ({ machine, user, onClick, onDelete }) => {
    const theme = useTheme();
    const isConnected = machine.isConnected;
    const isAdmin = user?.role === 'admin';
    const [lastClickTime, setLastClickTime] = useState(null);
    
    // Determine status config
    let statusColor, statusText, statusBgColor;
    
    if (machine.status === 'online') {
        statusColor = 'success';
        statusText = 'Đang hoạt động';
        statusBgColor = theme.palette.success.main;
    } else if (machine.status === 'offline') {
        statusColor = 'warning';
        statusText = 'Đang dừng';
        statusBgColor = theme.palette.warning.main;
    }
    else {
        statusColor = 'error';
        statusText = 'Mất kết nối';
        statusBgColor = theme.palette.error.main;
    }
    
    const canViewDetails = true;

    // Load last click time
    useEffect(() => {
        if (machine?.machineId) {
            const savedTime = localStorage.getItem(`machine_${machine.machineId}_lastClick`);
            if (savedTime) {
                setLastClickTime(savedTime);
            }
        }
    }, [machine?.machineId]);
    
    // Handle card click
    const handleCardClick = () => {
        if (canViewDetails && onClick) {
            const now = new Date().toISOString();
            localStorage.setItem(`machine_${machine.machineId}_lastClick`, now);
            setLastClickTime(now);
            onClick(machine);
        }
    };

    // Handle delete click
    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (onDelete) {
            localStorage.removeItem(`machine_${machine.machineId}_lastClick`);
            onDelete(machine);
        }
    };

    return (
        <Card
            sx={{
                width: '100%',
                height: 'auto',
                minHeight: 420,
                display: 'flex',
                flexDirection: 'column',
                background: isAdmin 
                    ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}05 100%)`
                    : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${statusBgColor}08 100%)`,
                border: `2px solid ${isAdmin ? theme.palette.primary.main + '20' : statusBgColor + '20'}`,
                borderRadius: 5,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: canViewDetails ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 5,
                    background: `linear-gradient(90deg, ${statusBgColor}, ${statusBgColor}80)`,
                    opacity: isConnected ? 1 : 0.3,
                },
                '&:hover': {
                    transform: canViewDetails ? 'translateY(-12px) scale(1.02)' : 'none',
                    boxShadow: canViewDetails 
                        ? `0 20px 60px ${statusBgColor}30, 0 0 0 1px ${statusBgColor}40` 
                        : 'none',
                    borderColor: canViewDetails ? statusBgColor + '60' : statusBgColor + '20',
                    '&::before': {
                        height: 5,
                    }
                },
            }}
        >
            <CardActionArea
                onClick={handleCardClick}
                disabled={!canViewDetails}
                sx={{ 
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    padding: '15px',
                    '&.Mui-disabled': {
                        cursor: 'default'
                    }
                }}
            >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                    
                    {/* Header */}
                    <MachineCardHeader
                        machine={machine}
                        isAdmin={isAdmin}
                        onDelete={handleDeleteClick}
                    />

                    {/* Body */}
                    <MachineCardBody
                        machine={machine}
                        statusColor={statusColor}
                        statusText={statusText}
                        statusBgColor={statusBgColor}
                        isConnected={isConnected}
                    />

                    {/* Footer */}
                    <MachineCardFooter
                        lastClickTime={lastClickTime}
                        canViewDetails={canViewDetails}
                        isConnected={isConnected}
                    />

                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default MachineStatusCard;