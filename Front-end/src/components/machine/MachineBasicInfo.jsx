import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const MachineBasicInfo = ({ machine }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Thông tin cơ bản
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography>
                        <strong>Loại máy:</strong> {machine?.type || 'N/A'}
                    </Typography>
                    <Typography>
                        <strong>Chủ sở hữu:</strong> {machine?.userId || 'N/A'}
                    </Typography>
                    <Typography>
                        <strong>ID:</strong> {machine?.machineId || 'N/A'}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default MachineBasicInfo;