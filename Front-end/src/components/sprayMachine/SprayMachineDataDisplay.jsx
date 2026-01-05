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
import { Pie, Bar } from 'react-chartjs-2';
import { 
    Chart as ChartJS, 
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip, 
    Legend 
} from 'chart.js';
import { dailyStats, monthlyStats } from '../../config/sprayMachineConfig';

ChartJS.register(
    ArcElement, 
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip, 
    Legend
);

const SprayMachineDataDisplay = ({ dailyData, statistics, weeklyData, loading, error }) => {

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

    // ==================== FORMAT DATE ====================
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
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

    // ==================== BAR CHART DATA (TUẦN HIỆN TẠI) ====================
    const getWeekRange = () => {
        if (!weeklyData || weeklyData.length === 0) return '';
        const firstDate = new Date(weeklyData[0].date + 'T00:00:00Z');
        const lastDate = new Date(weeklyData[weeklyData.length - 1].date + 'T00:00:00Z');
        return `${firstDate.getUTCDate()}/${firstDate.getUTCMonth() + 1} - ${lastDate.getUTCDate()}/${lastDate.getUTCMonth() + 1}`;
    };

    const barData = weeklyData && weeklyData.length > 0 ? {
        labels: weeklyData.map(day => {
            const dateObj = new Date(day.date + 'T00:00:00Z');
            const dateStr = `${dateObj.getUTCDate()}/${dateObj.getUTCMonth() + 1}`;
            return `${day.dayOfWeek}\n${dateStr}`;
        }),
        datasets: [
            {
                label: 'Thời gian chạy',
                data: weeklyData.map(day => day.operatingTime || 0), 
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: '#4caf50',
                borderWidth: 2
            },
            {
                label: 'Thời gian dừng',
                data: weeklyData.map(day => day.pausedTime || 0), 
                backgroundColor: 'rgba(255, 152, 0, 0.2)',
                borderColor: '#ff9800',
                borderWidth: 2
            }
        ]
    } : null;


    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: { size: 14 },
                    padding: 15
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} giờ`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 12,
                title: {
                    display: true,
                    text: 'Giờ'
                },
                ticks: {
                    stepSize: 2
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Ngày trong tuần'
                }
            }
        }
    };

    return (
        <Box>
            {/* ==================== BIỂU ĐỒ TRÒN ==================== */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                        📊 Thời gian hoạt động hôm nay ({formatDate(dailyData.date)})
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

            {/* ==================== BIỂU ĐỒ CỘT (TUẦN HIỆN TẠI) ==================== */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                        📊 Thời gian hoạt động tuần này {getWeekRange()}
                    </Typography>
                    {barData ? (
                        <>
                            <Box sx={{ height: 400, position: 'relative' }}>
                                <Bar data={barData} options={barOptions} />
                            </Box>
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    💡 Mỗi cột thể hiện thời gian hoạt động và dừng trong ngày (tối đa 12h/ngày)
                                </Typography>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                Chưa có dữ liệu tuần này
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* ==================== THỐNG KÊ HÔM NAY ==================== */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
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
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
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