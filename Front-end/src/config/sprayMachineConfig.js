/**
 * ========================================
 * SIMPLIFIED SPRAY MACHINE CONFIG
 * ========================================
 * Chỉ hiển thị:
 * 1. Thời gian chạy/dừng (6h-18h) - Biểu đồ tròn
 * 2. Năng suất hôm nay (realtime, reset 6h sáng)
 * 3. Thống kê 30 ngày (năng lượng + % chạy)
 */

/**
 * Config cho dữ liệu hôm nay
 */
export const dailyStats = [
    {
        key: 'operatingTime',
        label: 'Thời gian chạy',
        icon: '⏱️',
        unit: 'giờ',
        color: '#4caf50',
        decimals: 2,
        description: 'Tổng thời gian máy hoạt động'
    },
    {
        key: 'pausedTime',
        label: 'Thời gian dừng',
        icon: '⏸️',
        unit: 'giờ',
        color: '#ff9800',
        decimals: 2,
        description: 'Tổng thời gian máy tạm dừng'
    },
    {
        key: 'energyConsumption',
        label: 'Năng lượng tiêu thụ',
        icon: '⚡',
        unit: 'kWh',
        color: '#2196f3',
        decimals: 3,
        description: 'Tổng năng lượng tiêu thụ hôm nay'
    },
    {
        key: 'efficiency',
        label: 'Hiệu suất',
        icon: '📊',
        unit: '%',
        color: '#9c27b0',
        decimals: 1,
        description: 'Tỷ lệ thời gian chạy / 12h'
    }
];

/**
 * Config cho thống kê 30 ngày
 */
export const monthlyStats = [
    {
        key: 'totalOperatingTime',
        label: 'Tổng giờ chạy',
        icon: '⏱️',
        unit: 'giờ',
        color: '#4caf50',
        decimals: 2,
        description: '30 ngày gần nhất'
    },
    {
        key: 'totalEnergyConsumed',
        label: 'Tổng năng lượng',
        icon: '⚡',
        unit: 'kWh',
        color: '#2196f3',
        decimals: 2,
        description: '30 ngày gần nhất'
    },
    {
        key: 'averageOperatingPercentage',
        label: 'Trung bình hiệu suất',
        icon: '📈',
        unit: '%',
        color: '#9c27b0',
        decimals: 1,
        description: 'Trung bình 30 ngày'
    }
];

/**
 * Config cho biểu đồ tròn
 */
export const pieChartConfig = {
    colors: {
        operating: '#4caf50',
        paused: '#ff9800',
        idle: '#9e9e9e'
    },
    labels: {
        operating: 'Thời gian chạy',
        paused: 'Thời gian dừng',
        idle: 'Thời gian chờ'
    }
};

/**
 * Config cho work shift (ca làm việc)
 */
export const workShiftConfig = {
    startHour: 6,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    totalHours: 12,
    displayText: '6:00 - 18:00'
};