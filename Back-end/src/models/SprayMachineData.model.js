import mongoose from 'mongoose';

const SprayMachineDataSchema = new mongoose.Schema({
    machineId: {
        type: String,
        required: [true, 'Machine ID is required'],
        trim: true,
        index: true
    },
    date: {
        type: String,
        required: true,
        index: true
    },
    
    // ==================== THỜI GIAN - NEW LOGIC ====================
    
    // Thời gian máy HOẠT ĐỘNG (status = 1)
    activeTime: {
        type: Number,
        default: 0,
        min: 0,
        max: 12
    },
    
    // Thời gian máy DỪNG (status != 1, bao gồm: status=0, không nhận JSON, server đang chạy nhưng máy không phản hồi)
    stopTime: {
        type: Number,
        default: 0,
        min: 0,
        max: 12
    },
    
    // ==================== NĂNG LƯỢNG ====================
    
    totalEnergyConsumed: {
        type: Number,
        default: 0,
        min: 0
    },
    
    energyAtStartOfDay: {
        type: Number,
        default: 0
    },
    
    currentPowerConsumption: {
        type: Number,
        default: 0
    },
    
    // ==================== TRACKING STATUS ====================
    
    lastStatus: {
        type: Number,
        enum: [0, 1],
        default: 0
    },
    
    lastStatusChangeTime: {
        type: Date,
        default: Date.now
    },
    
    lastUpdate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

SprayMachineDataSchema.index({ machineId: 1, date: -1 });
SprayMachineDataSchema.index({ machineId: 1, date: 1 }, { unique: true });

export default mongoose.model('SprayMachineData', SprayMachineDataSchema);