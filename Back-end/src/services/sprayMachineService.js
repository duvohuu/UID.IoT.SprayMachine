import cron from 'node-cron';
import { getIO } from '../config/socket.js';
import { WORK_SHIFT, TIME_CONFIG } from '../shared/constant/workShift.constant.js';
import { isWithinWorkShift, getVietnamDateString, getWorkStartTime } from '../shared/utils/datetime.util.js';
import { getTodayData, getLatestData, saveData, getCurrentWeekData, getCurrentMonthData, getAllSprayMachines, createDailyData, findDataByDate } from '../repositories/sprayMachineRepository.js';
import { calculateEnergyConsumption, calculateEfficiency, updateMachineTime, validateAndClampTimeValues, calculateStatistics } from '../shared/utils/sprayMachine.utils.js';
import { startErrorTracking } from '../iot/mqttClient.js';

/**
 * ========================================
 * SPRAY MACHINE SERVICE
 * ========================================
 * Business logic for Spray Machine operations
 */

// ==================== MQTT & DATA PROCESSING ====================

/**
 * Process MQTT update
 */
export const processMQTTUpdate = async (machineId, mqttData) => {
    try {
        const { status, powerConsumption } = mqttData;
        const now = new Date();

        if (!isWithinWorkShift()) {
            console.log(`⏰ [${machineId}] Outside work shift - ignoring message`);
            return null;
        }

        let data = await getTodayData(machineId);
        if (!data) {
            console.log(`⚠️ [${machineId}] No shift exists for today`);
            return null;
        }

        data = calculateEnergyConsumption(data, powerConsumption);
        const statusMap = { 1: 1, 0: 0, '-1': -1 };
        const currentStatus = statusMap[status] ?? -1;
        data = updateMachineTime(data, currentStatus, now);
        data = validateAndClampTimeValues(data);
        data.efficiency = calculateEfficiency(data.activeTime, data.stopTime);
        data.lastUpdate = now;

        return await saveData(data);
    } catch (error) {
        console.error(`Error processing MQTT for ${machineId}:`, error);
        throw error;
    }
};

/**
 * Process machine timeout (update errorTime)
 */
export const processErrorTimeout = async (machineId) => {
    try {
        const now = new Date();

        if (!isWithinWorkShift()) {
            console.log(`⏰ [${machineId}] Outside work shift - ignoring timeout`);
            return null;
        }

        let data = await getTodayData(machineId);
        if (!data) {
            console.log(`⚠️ [${machineId}] No shift exists for today`);
            return null;
        }

        const timeSinceLastUpdate = now - new Date(data.lastStatusChangeTime);
        const hoursSinceLastUpdate = timeSinceLastUpdate / (1000 * 60 * 60);

        if (timeSinceLastUpdate > TIME_CONFIG.MIN_UPDATE_INTERVAL) {
            data.errorTime += hoursSinceLastUpdate;
            data = validateAndClampTimeValues(data);
            data.efficiency = calculateEfficiency(data.activeTime, data.stopTime);
            data.lastStatusChangeTime = now;
            data.lastUpdate = now;
            return await saveData(data);
        }
        return data;
    } catch (error) {
        console.error(`Error processing timeout for ${machineId}:`, error);
        throw error;
    }
};

// ==================== DATA RETRIEVAL ====================

/**
 * Get latest data (or create if not exists)
 */
export const getLatestDataOrCreate = async (machineId) => {
    const today = getVietnamDateString();
    let latestData = await getLatestData(machineId);

    if (!latestData || latestData.date < today) {
        const existingToday = await getTodayData(machineId);
        if (existingToday) return existingToday;

        // Create new data for today
        const yesterday = getVietnamDateString(-1);
        const yesterdayData = await findDataByDate(machineId, yesterday);
        const energyAtStartOfDay = yesterdayData?.currentPowerConsumption || 0;
        const workStartTime = getWorkStartTime(today);

        latestData = await createDailyData({
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
    }
    return latestData;
};

/**
 * Get statistics for last 30 days
 */
export const getStatistics = async (machineId) => {
    const history = await getCurrentMonthData(machineId);
    return calculateStatistics(history);
};

// ==================== RESET & SCHEDULING ====================

/**
 * Reset daily data - Create new data for target date
 */
export const resetDailyData = async (machineId, daysOffset = 0) => {
    const targetDate = getVietnamDateString(daysOffset);
    const previousDate = getVietnamDateString(daysOffset - 1);
    const previousData = await findDataByDate(machineId, previousDate);
    const energyAtStartOfDay = previousData?.currentPowerConsumption || 0;
    const workStartTime = getWorkStartTime(targetDate);

    try {
        return await createDailyData({
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
    } catch (error) {
        console.error(`Error resetting data for ${machineId}:`, error);
        throw error;
    }
};

/**
 * Reset all spray machines - Create new shift at START_HOUR
 */
export const resetAllSprayMachines = async (daysOffset = 0) => {
    const targetDate = getVietnamDateString(daysOffset);

    try {
        const machines = await getAllSprayMachines();
        console.log(`🌅 [Daily Reset] Creating new shift for ${machines.length} machines on ${targetDate}`);

        const results = await Promise.allSettled(
            machines.map(async (machine) => {
                await resetDailyData(machine.machineId, daysOffset);
                startErrorTracking(machine.machineId);

                const io = getIO();
                const resetEvent = {
                    machineId: machine.machineId,
                    date: targetDate,
                    message: `New shift created at ${WORK_SHIFT.START_HOUR}:${String(WORK_SHIFT.START_MINUTE).padStart(2, '0')}`
                };
                io.to(`machine-${machine.machineId}`).emit('spray:daily-reset', resetEvent);
                io.emit('spray:daily-reset', resetEvent);
                return machine.machineId;
            })
        );

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`🌅 [Daily Reset] Completed: ${succeeded}/${machines.length} succeeded`);

        if (failed > 0) {
            console.error(`❌ [Daily Reset] Failed for ${failed} machines`);
        }
    } catch (error) {
        console.error('❌ [Daily Reset] Error:', error.message);
    }
};

/**
 * Initialize daily reset scheduler - Runs at START_HOUR:START_MINUTE Vietnam time
 */
export const initializeDailyResetScheduler = () => {
    const vnHour = WORK_SHIFT.START_HOUR;
    const vnMinute = WORK_SHIFT.START_MINUTE;
    const vnTotalMinutes = vnHour * 60 + vnMinute;
    const utcTotalMinutes = vnTotalMinutes - (TIME_CONFIG.VIETNAM_TIMEZONE_OFFSET * 60);

    let UTC_HOUR, UTC_MINUTE;
    if (utcTotalMinutes < 0) {
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
// ==================== WRAPPER FUNCTIONS FOR CONTROLLER ====================

/**
 * Get latest data (wrapper for controller)
 */
export const getSprayLatestData = async (machineId) => {
    return await getLatestData(machineId);
};

/**
 * Get today's data (wrapper for external use, e.g., MQTT)
 */
export const getSprayTodayData = async (machineId) => {
    return await getTodayData(machineId);
};


/**
 * Get current week data (wrapper for controller)
 */
export const getSprayCurrentWeekData = async (machineId) => {
    return await getCurrentWeekData(machineId);
};

/**
 * Get current month data (wrapper for controller)
 */
export const getSprayCurrentMonthData = async (machineId) => {
    return await getCurrentMonthData(machineId);
};
