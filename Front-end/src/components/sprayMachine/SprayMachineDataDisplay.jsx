import React, { useState, useMemo } from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Box, 
    Grid, 
    CircularProgress, 
    Alert,
    Slider,      
    IconButton   
} from '@mui/material';
import { 
    ChevronLeft as ChevronLeftIcon,   
    ChevronRight as ChevronRightIcon  
} from '@mui/icons-material';
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

const SprayMachineDataDisplay = ({ dailyData, statistics, monthlyData, loading, error }) => {
    const [sliderValue, setSliderValue] = useState(0);
    const DAYS_PER_VIEW = 7;
    const totalDays = monthlyData?.length || 0;
    const maxSliderValue = Math.max(0, totalDays - DAYS_PER_VIEW);

    const displayedMonthData = useMemo(() => {
        if (!monthlyData || monthlyData.length === 0) return [];
        return monthlyData.slice(sliderValue, sliderValue + DAYS_PER_VIEW);
    }, [monthlyData, sliderValue]);

    const handleSliderChange = (event, newValue) => {
        setSliderValue(newValue);
    };

    const handlePrevious = () => {
        setSliderValue(prev => Math.max(0, prev - DAYS_PER_VIEW));
    };

    const handleNext = () => {
        setSliderValue(prev => Math.min(maxSliderValue, prev + DAYS_PER_VIEW));
    };
    

    // ==================== CONVERT HOURS TO HH:MM ====================
    const formatHoursToTime = (hours) => {
        if (!hours || hours === 0) return '0h 0m';
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };

    // ==================== STAT CARD COMPONENT ====================
    const StatCard = ({ config, value }) => {
        let displayValue = 'N/A';
        
        if (value !== null && value !== undefined) {
            if (config.key === 'operatingTime' || config.key === 'pausedTime' || 
                config.key === 'errorTime' || config.key === 'totalOperatingTime') {
                displayValue = formatHoursToTime(value);
            } else {
                displayValue = typeof value === 'number' 
                    ? value.toFixed(config.decimals || 0) 
                    : value;
                displayValue = `${displayValue} ${config.unit || ''}`;
            }
        }

        return (
            <Card>
                <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: 160
                }}>
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
                        {displayValue}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
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
        labels: ['Thời gian chạy', 'Thời gian dừng', 'Thời gian mất kết nối'],
        datasets: [{
            data: [
                dailyData.operatingTime || 0,
                dailyData.pausedTime || 0,
                dailyData.errorTime || 0
            ],
            backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
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
                        return `${label}: ${formatHoursToTime(value)} (${percentage}%)`;
                    }
                }
            }
        }
    };

    // ==================== BAR CHART DATA ====================
    const getMonthRange = () => {
        if (!monthlyData || monthlyData.length === 0) return '';
        const firstDate = new Date(monthlyData[0].date + 'T00:00:00Z');
        const year = firstDate.getUTCFullYear();
        const month = firstDate.toLocaleString('vi-VN', { month: 'long' });
        return `${month} ${year}`;
    };

    const barData = displayedMonthData.length > 0 ? {
        labels: displayedMonthData.map(day => {
            return `${day.dayOfWeek}\n${day.day}`;
        }),
        datasets: [
            {
                label: 'Thời gian chạy',
                data: displayedMonthData.map(day => day.operatingTime || 0), 
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: '#4caf50',
                borderWidth: 2
            },
            {
                label: 'Thời gian dừng',
                data: displayedMonthData.map(day => day.pausedTime || 0), 
                backgroundColor: 'rgba(255, 152, 0, 0.2)',
                borderColor: '#ff9800',
                borderWidth: 2
            },
            {
                label: 'Thời gian mất kết nối',
                data: displayedMonthData.map(day => day.errorTime || 0),
                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                borderColor: '#f44336',
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
                        return `${context.dataset.label}: ${formatHoursToTime(context.parsed.y)}`;
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
                    text: 'Ngày trong tháng'
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
                             {' '}({formatHoursToTime(dailyData.operatingTime || 0)} / {formatHoursToTime((dailyData.operatingTime || 0) + (dailyData.pausedTime || 0))})
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* ==================== BIỂU ĐỒ CỘT (THÁNG HIỆN TẠI) ==================== */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                        📊 Thời gian hoạt động tháng này - {getMonthRange()}
                    </Typography>
                    
                    {barData ? (
                        <>
                            {/* Bar Chart */}
                            <Box sx={{ height: 400, position: 'relative', mb: 2 }}>
                                <Bar data={barData} options={barOptions} />
                            </Box>

                            {/* Slider Controls */}
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2,
                                px: 2,
                                mb: 2
                            }}>
                                <IconButton 
                                    onClick={handlePrevious}
                                    disabled={sliderValue === 0}
                                    size="small"
                                    sx={{ 
                                        bgcolor: 'action.hover',
                                        '&:hover': { bgcolor: 'action.selected' }
                                    }}
                                >
                                    <ChevronLeftIcon />
                                </IconButton>

                                <Slider
                                    value={sliderValue}
                                    onChange={handleSliderChange}
                                    min={0}
                                    max={maxSliderValue}
                                    step={1}
                                    marks={[
                                        { value: 0, label: '1' },
                                        { value: maxSliderValue, label: `${totalDays}` }
                                    ]}
                                    sx={{ flexGrow: 1 }}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => `Ngày ${value + 1}`}
                                />

                                <IconButton 
                                    onClick={handleNext}
                                    disabled={sliderValue >= maxSliderValue}
                                    size="small"
                                    sx={{ 
                                        bgcolor: 'action.hover',
                                        '&:hover': { bgcolor: 'action.selected' }
                                    }}
                                >
                                    <ChevronRightIcon />
                                </IconButton>
                            </Box>

                            {/* Info Box */}
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    💡 Hiển thị {displayedMonthData.length} ngày ({sliderValue + 1} - {sliderValue + displayedMonthData.length}) 
                                    / Tổng {totalDays} ngày trong tháng
                                </Typography>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                Chưa có dữ liệu tháng này
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* ==================== THỐNG KÊ HÔM NAY ==================== */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                📅 Thống kê hôm nay
            </Typography>
            <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                },
                gap: 2,
                maxWidth: '900px', 
                mb: 3
            }}>
                {dailyStats.map((stat) => (
                    <StatCard 
                        key={stat.key}
                        config={stat} 
                        value={dailyData[stat.key]} 
                    />
                ))}
            </Box>

            {/* ==================== THỐNG KÊ THÁNG HIỆN TẠI ==================== */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                📈 Thống kê tháng hiện tại
            </Typography>
            <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                },
                gap: 2,
                maxWidth: '900px' 
            }}>
                {monthlyStats.map((stat) => (
                    <StatCard 
                        key={stat.key}
                        config={stat} 
                        value={statistics[stat.key]} 
                    />
                ))}
            </Box>
        </Box>
    );
};

export default SprayMachineDataDisplay;