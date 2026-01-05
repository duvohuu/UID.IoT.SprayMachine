import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { CalendarTodayOutlined, AccessTimeOutlined } from '@mui/icons-material';

/**
 * ========================================
 * MACHINE FOOTER COMPONENT
 * ========================================
 * Hiển thị ngày giờ hiện tại
 */
const MachineFooter = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDate = () => {
        return currentTime.toLocaleDateString('vi-VN', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatTime = () => {
        return currentTime.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <Box
            sx={{
                mt: 'auto',
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Stack spacing={1} alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarTodayOutlined sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Typography variant="body" color="text.primary" fontWeight={500}>
                        {formatDate()}
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeOutlined sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Typography variant="body" color="text.primary" fontWeight={500}>
                        {formatTime()}
                    </Typography>
                </Stack>
            </Stack>
        </Box>
    );
};

export default MachineFooter;