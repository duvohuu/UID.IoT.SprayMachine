import React from 'react';
import { Box, Button, Typography, Chip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MachineHeader = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/status')}
            >
                Quay lại
            </Button>
        </Box>
    );
};

export default MachineHeader;