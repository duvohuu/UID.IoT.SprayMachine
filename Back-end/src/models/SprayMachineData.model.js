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
    
    // ==================== THỜI GIAN ====================
    
    activeTime: {
        type: Number,
        default: 0,
        min: 0,
        max: 24
    },
    
    stopTime: {
        type: Number,
        default: 0,
        min: 0,
        max: 24
    },
    
    efficiency: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
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