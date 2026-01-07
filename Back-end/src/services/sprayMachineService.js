import SprayMachineData from '../models/SprayMachineData.model.js';
import Machine from '../models/Machine.model.js';
import cron from 'node-cron';
import { getIO } from '../config/socket.js';
import { 
    getVietnamDateString, 
    getVietnamTime, 
    getWorkStartTime,
    isWithinWorkShift,
    formatWorkShift,
    getMondayOfWeek,
    getDayOfWeekName,
    getWeekDates
} from '../shared/utils/datetime.util.js';
import { WORK_SHIFT, TIME_CONFIG } from '../shared/constant/workShift.constant.js';

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
        
        if (!latestData || latestData.date < today) {
            const yesterday = getVietnamDateString(-1);
            const yesterdayData = await SprayMachineData.findOne({
                machineId,
                date: yesterday
            });
            
            const energyAtStartOfDay = yesterdayData?.currentPowerConsumption || 0;
            const workStartTime = getWorkStartTime(today);
            
            latestData = await SprayMachineData.findOneAndUpdate(
                { 
                    machineId, 
                    date: today 
                },
                {
                    $setOnInsert: {
                        machineId,
                        date: today,
                        activeTime: 0,
                        stopTime: 0,
                        totalEnergyConsumed: 0,
                        energyAtStartOfDay,
                        currentPowerConsumption: energyAtStartOfDay,
                        lastStatus: 0,
                        lastStatusChangeTime: workStartTime,
                        lastUpdate: new Date()
                    }
                },
                {
                    upsert: true,              
                    new: true,                 
                    setDefaultsOnInsert: true  
                }
            );
        }
        
        return latestData;
        
    } catch (error) {
        console.error(`Error getting latest data for ${machineId}:`, error);
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
        } else {
            data.stopTime += hoursSinceLastChange;
            data.stopTime = Math.min(data.stopTime, WORK_SHIFT.HOURS_PER_DAY);
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
    return data;
};

/**
 * Process MQTT message update - Only during work shift
 * @param {string} machineId - Machine identifier
 * @param {Object} mqttData - MQTT message data containing status and powerConsumption
 * @returns {Promise<Object|null>} Updated data or null if outside work shift
 */
export const processMQTTUpdate = async (machineId, mqttData) => {
    try {
        const { status, powerConsumption } = mqttData;
        const now = new Date();
        
        // Check work shift
        if (!isWithinWorkShift()) {
            return null;
        }
        
        // Get or create today's data
        let data = await getLatestData(machineId);
        
        // Calculate energy consumption
        data = calculateEnergyConsumption(data, powerConsumption);
        
        // Update machine time based on status
        const currentStatus = (typeof status === 'number' && status === 1) ? 1 : 0;
        data = updateMachineTime(data, currentStatus, now);
        
        // Validate and clamp values
        data = validateAndClampTimeValues(data);
        
        // Update metadata
        data.lastUpdate = now;
        
        // Save to database
        await data.save();
        
        return data;
        
    } catch (error) {
        console.error(`Error processing MQTT for ${machineId}:`, error);
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
        
        if (targetData) {
            // Reset existing data
            targetData.activeTime = 0;
            targetData.stopTime = 0;
            targetData.totalEnergyConsumed = 0;
            targetData.energyAtStartOfDay = energyAtStartOfDay;
            targetData.currentPowerConsumption = energyAtStartOfDay;
            targetData.lastStatus = 0;
            targetData.lastStatusChangeTime = workStartTime; 
            
            await targetData.save();
        } else {
            // Create new data
            targetData = await SprayMachineData.create({
                machineId,
                date: targetDate,
                activeTime: 0,
                stopTime: 0,
                totalEnergyConsumed: 0,
                energyAtStartOfDay,
                currentPowerConsumption: energyAtStartOfDay,
                lastStatus: 0,
                lastStatusChangeTime: workStartTime 
            });
        }
        
        return targetData;
        
    } catch (error) {
        console.error(`Error resetting data for ${machineId}:`, error);
        throw error;
    }
};

/**
 * Reset all spray machines - Create new shift at 6:00 AM
 * @param {number} daysOffset - Days offset from today (0 = today)
 */
export const resetAllSprayMachines = async (daysOffset = 0) => {
    const targetDate = getVietnamDateString(daysOffset);

    try {
        const machines = await Machine.find({ type: 'Spray Machine' });

        const results = await Promise.allSettled(
            machines.map(async (machine) => {
                const newData = await resetDailyData(machine.machineId, daysOffset);
                
                // Emit socket event to machine room and general spray machines room
                const io = getIO();
                const resetEvent = {
                    machineId: machine.machineId,
                    date: targetDate,
                    message: 'New shift created at 6:00 AM'
                };
                
                io.to(`machine-${machine.machineId}`).emit('spray:daily-reset', resetEvent);
                io.to('spray-machines').emit('spray:daily-reset', resetEvent);
                
                return machine.machineId;
            })
        );

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`Daily reset completed: ${succeeded}/${machines.length} succeeded`);
        
        if (failed > 0) {
            console.error(`Daily reset failed for ${failed} machines`);
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Machine ${machines[index].machineId}:`, result.reason);
                }
            });
        }

    } catch (error) {
        console.error('Daily reset error:', error.message);
    }
};

/**
 * Initialize daily reset scheduler - Runs at 6:00 AM Vietnam time
 * @returns {Object} Cron job instance
 */
export const initializeDailyResetScheduler = () => {
    const UTC_HOUR = (WORK_SHIFT.START_HOUR - TIME_CONFIG.VIETNAM_TIMEZONE_OFFSET + 24) % 24;
    const cronExpression = `${WORK_SHIFT.START_MINUTE} ${UTC_HOUR} * * *`;
    
    console.log(`Daily reset scheduler initialized: ${formatWorkShift()}`);
    console.log(`Cron expression: ${cronExpression} (UTC)`);
    
    const cronJob = cron.schedule(cronExpression, async () => {
        console.log('Running daily reset at 6:00 AM Vietnam time');
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