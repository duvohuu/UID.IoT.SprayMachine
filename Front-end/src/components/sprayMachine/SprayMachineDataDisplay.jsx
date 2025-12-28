import React from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Box, 
    Grid, 
    CircularProgress, 
    Alert 
} from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend 
} from 'chart.js';
import { dailyStats, monthlyStats } from '../../config/sprayMachineConfig';

ChartJS.register(ArcElement, Tooltip, Legend);

const SprayMachineDataDisplay = ({ dailyData, statistics, loading, error }) => {

    // ==================== STAT CARD COMPONENT ====================
    const StatCard = ({ config, value }) => {
        const displayValue = value !== null && value !== undefined 
            ? (typeof value === 'number' ? value.toFixed(config.decimals || 0) : value)
            : 'N/A';

        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ 
                            fontSize: '2rem', 
                            mr: 1,
                            color: config.color 
                        }}>
                            {config.icon}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {config.label}
                        </Typography>
                    </Box>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 'bold',
                            color: config.color,
                            mb: 1
                        }}
                    >
                        {displayValue} {config.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {config.description}
                    </Typography>
                </CardContent>
            </Card>
        );
    };

    // ==================== LOADING STATE ====================
    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 400,
                flexDirection: 'column',
                gap: 2
            }}>
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                    Đang tải dữ liệu...
                </Typography>
            </Box>
        );
    }

    // ==================== ERROR STATE ====================
    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    ❌ Lỗi tải dữ liệu
                </Typography>
                <Typography variant="body2">
                    {error}
                </Typography>
            </Alert>
        );
    }

    // ==================== NO DATA STATE ====================
    if (!dailyData || !statistics) {
        return (
            <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body1">
                    ⚠️ Chưa có dữ liệu
                </Typography>
            </Alert>
        );
    }

    // ==================== PIE CHART DATA ====================
    const pieData = {
        labels: ['Thời gian chạy', 'Thời gian dừng'],
        datasets: [{
            data: [
                dailyData.operatingTime || 0,
                dailyData.pausedTime || 0
            ],
            backgroundColor: ['#4caf50', '#f44336'],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: { size: 14 },
                    padding: 15
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value.toFixed(2)}h (${percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <Box>
            {/* ==================== BIỂU ĐỒ TRÒN ==================== */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                        📊 Thời gian hoạt động hôm nay (6h-18h)
                    </Typography>
                    <Box sx={{ height: 300, position: 'relative' }}>
                        <Pie data={pieData} options={pieOptions} />
                    </Box>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                            💡 Hiệu suất: <strong>{dailyData.efficiency || 0}%</strong> 
                            {' '}({dailyData.operatingTime || 0}h / 12h)
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* ==================== THỐNG KÊ HÔM NAY ==================== */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                📅 Thống kê hôm nay
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {dailyStats.map((stat) => (
                    <Grid item xs={12} sm={6} md={3} key={stat.key}>
                        <StatCard 
                            config={stat} 
                            value={dailyData[stat.key]} 
                        />
                    </Grid>
                ))}
            </Grid>

            {/* ==================== THỐNG KÊ 30 NGÀY ==================== */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                📈 Thống kê 30 ngày gần nhất
            </Typography>
            <Grid container spacing={2}>
                {monthlyStats.map((stat) => (
                    <Grid item xs={12} sm={6} md={4} key={stat.key}>
                        <StatCard 
                            config={stat} 
                            value={statistics[stat.key]} 
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default SprayMachineDataDisplay;