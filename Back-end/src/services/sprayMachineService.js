import SprayMachineData from '../models/SprayMachineData.model.js';
import Machine from '../models/Machine.model.js';
import cron from 'node-cron';
import { getIO } from '../config/socket.js';
import { 
    getVietnamDateString, 
    getWorkStartTime,
    isWithinWorkShift,
    getMondayOfWeek,
    getDayOfWeekName,
    getWeekDates
} from '../shared/utils/datetime.util.js';
import { WORK_SHIFT, TIME_CONFIG } from '../shared/constant/workShift.constant.js';
import { startErrorTracking } from '../iot/mqttClient.js';


/**
 * Get today's data 
 * @param {string} machineId - Machine identifier
 * @returns {Promise<Object|null>} Spray machine data document or null if not exists
 */
export const getTodayData = async (machineId) => {
    try {
        const today = getVietnamDateString();
        
        const todayData = await SprayMachineData.findOne({ 
            machineId,
            date: today
        });
        
        return todayData;
        
    } catch (error) {
        console.error(`Error getting today data for ${machineId}:`, error);
        throw error;
    }
};

/**
 * Get or create document for today
 * @param {string} machineId - Machine identifier
 * @returns {Promise<Object>} Spray machine data document
 */
export const getLatestData = async (machineId) => {
    try {
        const today = getVietnamDateString();
        
        let latestData = await SprayMachineData.findOne({ 
            machineId 
        }).sort({ date: -1 });
        
        // Nếu chưa có data hoặc data cũ hơn hôm nay
        if (!latestData || latestData.date < today) {
            const existingToday = await SprayMachineData.findOne({
                machineId,
                date: today
            });
            
            if (existingToday) {
                return existingToday;
            }
            
            // Nếu chưa có, tạo mới với giá trị khởi tạo
            const yesterday = getVietnamDateString(-1);
            const yesterdayData = await SprayMachineData.findOne({
                machineId,
                date: yesterday
            });
            
            const energyAtStartOfDay = yesterdayData?.currentPowerConsumption || 0;
            const workStartTime = getWorkStartTime(today);
            
            latestData = await SprayMachineData.create({
                machineId,
                date: today,
                activeTime: 0,
                stopTime: 0,
                errorTime: 0,
                totalEnergyConsumed: 0,
                efficiency: 0,
                energyAtStartOfDay,
                currentPowerConsumption: energyAtStartOfDay,
                lastStatus: 0,
                lastStatusChangeTime: workStartTime,
                lastUpdate: new Date()
            });
            
            console.log(`✅ Created new data for ${machineId} on ${today}`);
        }
        
        return latestData;
        
    } catch (error) {
        console.error(`Error getting latest data for ${machineId}:`, error);`   `
        throw error;
    }
};

/**
 * Calculate energy consumption
 * @param {Object} data - Current spray machine data
 * @param {number} powerConsumption - Current power consumption reading
 * @returns {Object} Updated data with energy consumption
 */
const calculateEnergyConsumption = (data, powerConsumption) => {
    const energyConsumed = powerConsumption - data.energyAtStartOfDay;
    data.totalEnergyConsumed = Math.max(0, energyConsumed);
    data.currentPowerConsumption = powerConsumption;
    
    return data;
};

/**
 * Calculate efficiency based on active time and stop time
 * @param {number} activeTime - Active time in hours
 * @param {number} stopTime - Stop time in hours
 * @returns {number} Efficiency percentage (0-100)
 */
const calculateEfficiency = (activeTime, stopTime) => {
    const totalTime = activeTime + stopTime;
    if (totalTime === 0) return 0;
    
    const efficiency = (activeTime / totalTime) * 100;
    return parseFloat(efficiency.toFixed(1)); // Round to 1 decimal
};

/**
 * Update machine active/stop time based on status change
 * @param {Object} data - Current spray machine data
 * @param {number} currentStatus - Current machine status (0 or 1)
 * @param {Date} now - Current timestamp
 * @returns {Object} Updated data with time calculations
 */
const updateMachineTime = (data, currentStatus, now) => {
    const previousStatus = data.lastStatus;
    const timeSinceLastChange = now - new Date(data.lastStatusChangeTime);
    const hoursSinceLastChange = timeSinceLastChange / (1000 * 60 * 60);
    
    if (timeSinceLastChange > TIME_CONFIG.MIN_UPDATE_INTERVAL) {
        if (previousStatus === 1) {
            data.activeTime += hoursSinceLastChange;
            data.activeTime = Math.min(data.activeTime, WORK_SHIFT.HOURS_PER_DAY);
        } else if (previousStatus === 0) {
            data.stopTime += hoursSinceLastChange;
            data.stopTime = Math.min(data.stopTime, WORK_SHIFT.HOURS_PER_DAY);
        }
        else {
            data.errorTime += hoursSinceLastChange;
            data.errorTime = Math.min(data.errorTime, WORK_SHIFT.HOURS_PER_DAY);
        }
        
        data.lastStatusChangeTime = now;
        data.lastStatus = currentStatus;
    }
    
    return data;
};

/**
 * Validate and clamp time values within work hours
 * @param {Object} data - Spray machine data to validate
 * @returns {Object} Validated data
 */
const validateAndClampTimeValues = (data) => {
    data.activeTime = Math.max(0, Math.min(data.activeTime, WORK_SHIFT.HOURS_PER_DAY));
    data.stopTime = Math.max(0, Math.min(data.stopTime, WORK_SHIFT.HOURS_PER_DAY));
    data.errorTime = Math.max(0, Math.min(data.errorTime, WORK_SHIFT.HOURS_PER_DAY));
    return data;
};

/**
 * Process MQTT message update 
 * @param {string} machineId - Machine identifier
 * @param {Object} mqttData - MQTT message data containing status and powerConsumption
 * @returns {Promise<Object|null>} Updated data or null if no shift exists
 */
export const processMQTTUpdate = async (machineId, mqttData) => {
    try {
        const { status, powerConsumption } = mqttData;
        const now = new Date();
        
        // Check work shift
        if (!isWithinWorkShift()) {
            console.log(`⏰ [${machineId}] Outside work shift - ignoring message`);
            return null;
        }
        
        let data = await getTodayData(machineId);
        
        if (!data) {
            console.log(`⚠️ [${machineId}] No shift exists for today - waiting for daily reset at 6AM`);
            return null;
        }
        
        // Calculate energy consumption
        data = calculateEnergyConsumption(data, powerConsumption);
        
        // Update machine time based on status
        const statusMap = { 1: 1, 0: 0, '-1': -1 };
        const currentStatus = statusMap[status] ?? -1;

        data = updateMachineTime(data, currentStatus, now);
        
        // Validate and clamp values
        data = validateAndClampTimeValues(data);
        
        // Update efficiency
        data.efficiency = calculateEfficiency(data.activeTime, data.stopTime);

        // Update metadata
        data.lastUpdate = now;
        
        // Save to database
        await data.save();
        
        return data;
        
    } catch (error) {
        console.error(`Error processing MQTT for ${machineId}:`, error);
        throw error;
    }
}

/**
 * Process machine timeout (update errorTime)
 * @param {string} machineId - Machine identifier
 * @returns {Promise<Object|null>} Updated data or null
 */
export const processErrorTimeout = async (machineId) => {
    try {
        const now = new Date();
        
        // Check work shift
        if (!isWithinWorkShift()) {
            console.log(`⏰ [${machineId}] Outside work shift - ignoring timeout`);
            return null;
        }
        
        let data = await getTodayData(machineId);
        
        if (!data) {
            console.log(`⚠️ [${machineId}] No shift exists for today`);
            return null;
        }
        
        // Calculate time since last update
        const timeSinceLastUpdate = now - new Date(data.lastStatusChangeTime);
        const hoursSinceLastUpdate = timeSinceLastUpdate / (1000 * 60 * 60);
        
        // Update errorTime based on last status
        if (timeSinceLastUpdate > TIME_CONFIG.MIN_UPDATE_INTERVAL) {
            const previousStatus = data.lastStatus;
            
            // Add remaining time to appropriate field
            if (previousStatus === 1) {
                data.activeTime += hoursSinceLastUpdate;
                data.activeTime = Math.min(data.activeTime, WORK_SHIFT.HOURS_PER_DAY);
            } else if (previousStatus === 0) {
                data.stopTime += hoursSinceLastUpdate;
                data.stopTime = Math.min(data.stopTime, WORK_SHIFT.HOURS_PER_DAY);
            } else if (previousStatus === -1) {
                data.errorTime += hoursSinceLastUpdate;
                data.errorTime = Math.min(data.errorTime, WORK_SHIFT.HOURS_PER_DAY);
            }
            
            // Switch to error state
            data.lastStatus = -1;
            data.lastStatusChangeTime = now;
        }
        
        // Validate and clamp values
        data = validateAndClampTimeValues(data);
        
        // Update efficiency (exclude errorTime)
        data.efficiency = calculateEfficiency(data.activeTime, data.stopTime);
        
        // Update metadata
        data.lastUpdate = now;
        
        // Save to database
        await data.save();
        
        return data;
        
    } catch (error) {
        console.error(`Error processing timeout for ${machineId}:`, error);
        throw error;
    }
};
/**
 * Get 30 days history
 * @param {string} machineId - Machine identifier
 * @returns {Promise<Array>} Array of historical data
 */
export const get30DaysHistory = async (machineId) => {
    const history = await SprayMachineData
        .find({ machineId })
        .sort({ date: -1 })
        .limit(TIME_CONFIG.HISTORY_DAYS_LIMIT)
        .select('-__v -createdAt -updatedAt')
        .lean();
    
    return history;
};

/**
 * Get statistics for last 30 days
 * @param {string} machineId - Machine identifier
 * @returns {Promise<Object>} Statistics object
 */
export const getStatistics = async (machineId) => {
    const history = await get30DaysHistory(machineId);
    
    if (history.length === 0) {
        return {
            totalActiveTime: 0,
            totalStopTime: 0,
            totalEnergyConsumed: 0,
            averageEfficiency: 0,
            daysCount: 0
        };
    }
    
    const totalActiveTime = history.reduce((sum, day) => sum + day.activeTime, 0);
    const totalStopTime = history.reduce((sum, day) => sum + day.stopTime, 0);
    const totalEnergyConsumed = history.reduce((sum, day) => sum + day.totalEnergyConsumed, 0);
    
    const totalWorkTime = totalActiveTime + totalStopTime;
    const averageEfficiency = totalWorkTime > 0 
        ? (totalActiveTime / totalWorkTime) * 100 
        : 0;
    
    return {
        totalActiveTime: parseFloat(totalActiveTime.toFixed(2)),
        totalStopTime: parseFloat(totalStopTime.toFixed(2)),
        totalEnergyConsumed: parseFloat(totalEnergyConsumed.toFixed(2)),
        averageEfficiency: parseFloat(averageEfficiency.toFixed(1)),
        daysCount: history.length
    };
};

/**
 * Reset daily data - Create new data for target date
 * @param {string} machineId - Machine identifier
 * @param {number} daysOffset - Days offset from today (0 = today, -1 = yesterday)
 * @returns {Promise<Object>} Created or reset data document
 */
export const resetDailyData = async (machineId, daysOffset = 0) => {
    const targetDate = getVietnamDateString(daysOffset);
    
    try {
        const previousDate = getVietnamDateString(daysOffset - 1);
        const previousData = await SprayMachineData.findOne({
            machineId,
            date: previousDate
        });
        
        const energyAtStartOfDay = previousData?.currentPowerConsumption || 0;
        const workStartTime = getWorkStartTime(targetDate); 
        
        let targetData = await SprayMachineData.findOne({ 
            machineId, 
            date: targetDate 
        });
        
       
        // Create new data
        targetData = await SprayMachineData.create({
            machineId,
            date: targetDate,
            activeTime: 0,
            stopTime: 0,
            errorTime: 0,
            totalEnergyConsumed: 0,
            efficiency: 0,
            energyAtStartOfDay,
            currentPowerConsumption: energyAtStartOfDay,
            lastStatus: -1,
            lastStatusChangeTime: workStartTime 
        });

        startErrorTracking(machineId);
    
        return targetData;
        
    } catch (error) {
        console.error(`Error resetting data for ${machineId}:`, error);
        throw error;
    }
};

/**
 * Reset all spray machines - Create new shift at START_HOUR
 * @param {number} daysOffset - Days offset from today (0 = today)
 */
export const resetAllSprayMachines = async (daysOffset = 0) => {
    const targetDate = getVietnamDateString(daysOffset);

    try {
        const machines = await Machine.find({ type: 'Spray Machine' });
        
        console.log(`🌅 [Daily Reset] Creating new shift for ${machines.length} machines on ${targetDate}`);

        const results = await Promise.allSettled(
            machines.map(async (machine) => {
                const newData = await resetDailyData(machine.machineId, daysOffset);
                
                // Emit socket event
                const io = getIO();
                const resetEvent = {
                    machineId: machine.machineId,
                    date: targetDate,
                    message: `New shift created at ${WORK_SHIFT.START_HOUR}:${String(WORK_SHIFT.START_MINUTE).padStart(2, '0')}`
                };
                
                io.to(`machine-${machine.machineId}`).emit('spray:daily-reset', resetEvent);
                io.emit('spray:daily-reset', resetEvent);
                
                console.log(`✅ [${machine.machineId}] New shift created for ${targetDate}`);
                
                return machine.machineId;
            })
        );

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`🌅 [Daily Reset] Completed: ${succeeded}/${machines.length} succeeded`);
        
        if (failed > 0) {
            console.error(`❌ [Daily Reset] Failed for ${failed} machines`);
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`   Machine ${machines[index].machineId}:`, result.reason);
                }
            });
        }

    } catch (error) {
        console.error('❌ [Daily Reset] Error:', error.message);
    }
};

/**
 * Initialize daily reset scheduler - Runs at START_HOUR:START_MINUTE Vietnam time
 * @returns {Object} Cron job instance
 */
export const initializeDailyResetScheduler = () => {
    // Convert Vietnam time to UTC for cron
    // Vietnam time = UTC + 7 hours
    // UTC = Vietnam time - 7 hours
    
    const vnHour = WORK_SHIFT.START_HOUR;
    const vnMinute = WORK_SHIFT.START_MINUTE;
    
    // Calculate total minutes
    const vnTotalMinutes = vnHour * 60 + vnMinute;
    const utcTotalMinutes = vnTotalMinutes - (TIME_CONFIG.VIETNAM_TIMEZONE_OFFSET * 60);
    
    // Handle negative minutes (previous day)
    let UTC_HOUR, UTC_MINUTE;
    if (utcTotalMinutes < 0) {
        // Previous day
        const adjustedMinutes = utcTotalMinutes + (24 * 60);
        UTC_HOUR = Math.floor(adjustedMinutes / 60);
        UTC_MINUTE = adjustedMinutes % 60;
    } else {
        UTC_HOUR = Math.floor(utcTotalMinutes / 60) % 24;
        UTC_MINUTE = utcTotalMinutes % 60;
    }
    
    const cronExpression = `${UTC_MINUTE} ${UTC_HOUR} * * *`;
    
    
    const cronJob = cron.schedule(cronExpression, async () => {
        await resetAllSprayMachines(0);
    }, {
        timezone: 'UTC',
        scheduled: true
    });
        
    return cronJob;
};

/**
 * Get current week data (Monday to Sunday)
 * @param {string} machineId - Machine identifier
 * @returns {Promise<Array>} Array of 7 days with data
 */
export const getCurrentWeekData = async (machineId) => {
    try {
        const today = getVietnamDateString();
        const monday = getMondayOfWeek(today);
        const weekDates = getWeekDates(monday);
        
        const weekData = await SprayMachineData
            .find({ 
                machineId,
                date: { $in: weekDates }
            })
            .sort({ date: 1 })
            .lean();
        
        const result = weekDates.map(date => {
            const existingData = weekData.find(d => d.date === date);
            
            return {
                date,
                dayOfWeek: getDayOfWeekName(date),
                activeTime: existingData?.activeTime || 0,              
                stopTime: existingData?.stopTime || 0,     
                errorTime: existingData?.errorTime || 0,             
                totalEnergyConsumed: existingData?.totalEnergyConsumed || 0,
                hasData: !!existingData
            };
        });
                
        return result;
        
    } catch (error) {
        console.error(`Error getting week data for ${machineId}:`, error);
        throw error;
    }
};

/**
 * Get current month data (all days in current month)
 * @param {string} machineId - Machine identifier
 * @returns {Promise<Array>} Array of days with data for current month
 */
export const getCurrentMonthData = async (machineId) => {
    try {
        const today = getVietnamDateString();
        const year = parseInt(today.substring(0, 4));
        const month = parseInt(today.substring(5, 7));
        
        // First day of month
        const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
        
        // Last day of month
        const lastDay = new Date(year, month, 0).getDate();
        const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        console.log(`📅 Getting month data: ${firstDay} to ${lastDayStr}`);
        
        // Fetch all days in month
        const monthData = await SprayMachineData
            .find({ 
                machineId,
                date: { $gte: firstDay, $lte: lastDayStr }
            })
            .sort({ date: 1 })
            .lean();
        
        // Generate all days in month
        const result = [];
        for (let day = 1; day <= lastDay; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const existingData = monthData.find(d => d.date === dateStr);
            
            result.push({
                date: dateStr,
                day: day,
                dayOfWeek: getDayOfWeekName(dateStr),
                activeTime: existingData?.activeTime || 0,
                stopTime: existingData?.stopTime || 0,
                errorTime: existingData?.errorTime || 0,
                totalEnergyConsumed: existingData?.totalEnergyConsumed || 0,
                hasData: !!existingData
            });
        }
        
        return result;
        
    } catch (error) {
        console.error(`Error getting month data for ${machineId}:`, error);
        throw error;
    }
};
