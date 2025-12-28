import {
    PlayArrow as RunningIcon,
    PrecisionManufacturing as PrecisionIcon, 
    Speed as SpeedIcon,
    Build as ToolIcon,
    Straighten as DimensionIcon,
    Timer as TimerIcon,
    TrendingUp as EfficiencyIcon,
    Error as ErrorIcon,
    Engineering as EngineeringIcon,
    Thermostat as TempIcon,
    Power as PowerIcon,
    Assessment as CountIcon, 
    Architecture as CoordinateIcon, 
    Settings as MaintenanceIcon 
} from '@mui/icons-material';

// MONITORING DATA - Hiển thị cho tất cả user
export const MONITORING_DATA_CONFIG = {
    machineStatus: {
        title: 'Trạng thái máy CNC',
        icon: RunningIcon,
        type: 'status',
        values: {
            0: { label: 'Đang dừng', color: 'warning' },
            1: { label: 'Đang gia công', color: 'success' },
            2: { label: 'Tạm dừng', color: 'error' },
            3: { label: 'Bảo trì', color: 'info' }
        }
    },
    spindleSpeed: {
        title: 'Tốc độ trục chính',
        icon: SpeedIcon,
        type: 'integer',
        unit: 'RPM',
        range: '0 - 8000'
    },
    feedRate: {
        title: 'Tốc độ tiến dao',
        icon: SpeedIcon,
        type: 'float',
        unit: 'mm/min',
        range: '0 - 5000'
    },
    currentTool: {
        title: 'Dao cắt hiện tại',
        icon: ToolIcon,
        type: 'text',
        description: 'Số dao đang sử dụng'
    },
    partCount: {
        title: 'Số chi tiết đã hoàn thành',
        icon: CountIcon, 
        type: 'integer',
        unit: 'sản phẩm',
        range: '0 - 99999'
    },
    cycleTime: {
        title: 'Thời gian chu kỳ',
        icon: TimerIcon,
        type: 'float',
        unit: 'phút',
        range: '0 - 999'
    },
    efficiency: {
        title: 'Hiệu suất máy',
        icon: EfficiencyIcon,
        type: 'percentage',
        unit: '%',
        range: '0 - 100'
    },
    operatorName: {
        title: 'Tên người vận hành',
        icon: EngineeringIcon,
        type: 'text',
        description: 'Nhân viên phụ trách ca này'
    },
    temperature: {
        title: 'Nhiệt độ động cơ',
        icon: TempIcon,
        type: 'float',
        unit: '°C',
        range: '20 - 80'
    },
    powerConsumption: {
        title: 'Công suất tiêu thụ',
        icon: PowerIcon,
        type: 'float',
        unit: 'kW',
        range: '0 - 50'
    }
};

// ADMIN DATA CONFIG
export const ADMIN_DATA_CONFIG = {
    'coordinates.xAxis': {
        title: 'Vị trí trục X',
        icon: CoordinateIcon, 
        type: 'float',
        unit: 'mm',
        range: '-999 - 999'
    },
    'coordinates.yAxis': {
        title: 'Vị trí trục Y',
        icon: CoordinateIcon, 
        type: 'float',
        unit: 'mm',
        range: '-999 - 999'
    },
    'coordinates.zAxis': {
        title: 'Vị trí trục Z',
        icon: CoordinateIcon, 
        type: 'float',
        unit: 'mm',
        range: '-999 - 999'
    },
    errorCode: {
        title: 'Mã lỗi hệ thống',
        icon: ErrorIcon,
        type: 'status',
        values: {
            0: { label: 'Không có lỗi', color: 'success' },
            1: { label: 'Lỗi cảm biến', color: 'error' },
            2: { label: 'Lỗi động cơ', color: 'error' },
            3: { label: 'Lỗi dao cắt', color: 'error' },
            4: { label: 'Lỗi hệ thống làm mát', color: 'error' }
        }
    },
    'maintenance.lastMaintenance': {
        title: 'Bảo trì lần cuối',
        icon: MaintenanceIcon, 
        type: 'datetime',
        description: 'Thời gian bảo trì gần nhất'
    },
    'maintenance.nextMaintenance': {
        title: 'Bảo trì tiếp theo',
        icon: MaintenanceIcon, 
        type: 'datetime',
        description: 'Thời gian bảo trì dự kiến'
    }
};

// STATUS VALUES
export const STATUS_VALUES = {
    MACHINE_STATUS: {
        0: { label: 'Đang dừng', color: 'warning' },
        1: { label: 'Đang gia công', color: 'success' },
        2: { label: 'Tạm dừng', color: 'error' },
        3: { label: 'Bảo trì', color: 'info' }
    }
};

// EXPORT ALL
export default {
    MONITORING_DATA_CONFIG,
    ADMIN_DATA_CONFIG,
    STATUS_VALUES
};