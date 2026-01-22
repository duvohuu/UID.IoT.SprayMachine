// filepath: /run/media/vhdu/WORK/Project/Project_11_UIDLab_IoTSprayMachine/Back-end/src/shared/utils/sprayMachine.util.js
import { WORK_SHIFT, TIME_CONFIG } from '../constant/workShift.constant.js';

/**
 * Calculate energy consumption
 */
export const calculateEnergyConsumption = (data, powerConsumption) => {
    const energyConsumed = powerConsumption - data.energyAtStartOfDay;
    data.totalEnergyConsumed = Math.max(0, energyConsumed);
    data.currentPowerConsumption = powerConsumption;
    return data;
};

/**
 * Calculate efficiency
 */
export const calculateEfficiency = (activeTime, stopTime) => {
    const totalTime = activeTime + stopTime;
    if (totalTime === 0) return 0;
    return parseFloat(((activeTime / totalTime) * 100).toFixed(1));
};

/**
 * Update machine time based on status
 */
export const updateMachineTime = (data, currentStatus, now) => {
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
        } else {
            data.errorTime += hoursSinceLastChange;
            data.errorTime = Math.min(data.errorTime, WORK_SHIFT.HOURS_PER_DAY);
        }
        data.lastStatusChangeTime = now;
        data.lastStatus = currentStatus;
    }
    return data;
};

/**
 * Validate and clamp time values
 */
export const validateAndClampTimeValues = (data) => {
    data.activeTime = Math.max(0, Math.min(data.activeTime, WORK_SHIFT.HOURS_PER_DAY));
    data.stopTime = Math.max(0, Math.min(data.stopTime, WORK_SHIFT.HOURS_PER_DAY));
    data.errorTime = Math.max(0, Math.min(data.errorTime, WORK_SHIFT.HOURS_PER_DAY));
    return data;
};

/**
 * Calculate statistics from history
 */
export const calculateStatistics = (history) => {
    if (history.length === 0) {
        return {
            totalActiveTime: 0,
            totalStopTime: 0,
            totalErrorTime: 0,
            totalEnergyConsumed: 0,
            averageEfficiency: 0,
            daysCount: 0
        };
    }

    const totalActiveTime = history.reduce((sum, day) => sum + day.activeTime, 0);
    const totalStopTime = history.reduce((sum, day) => sum + day.stopTime, 0);
    const totalErrorTime = history.reduce((sum, day) => sum + day.errorTime, 0);
    const totalEnergyConsumed = history.reduce((sum, day) => sum + day.totalEnergyConsumed, 0);
    const totalWorkTime = totalActiveTime + totalStopTime;
    const averageEfficiency = totalWorkTime > 0 ? (totalActiveTime / totalWorkTime) * 100 : 0;
    const activeDays = history.filter(day => day.hasData);


    return {
        totalActiveTime: parseFloat(totalActiveTime.toFixed(2)),
        totalStopTime: parseFloat(totalStopTime.toFixed(2)),
        totalErrorTime: parseFloat(totalErrorTime.toFixed(2)),
        totalEnergyConsumed: parseFloat(totalEnergyConsumed.toFixed(2)),
        averageEfficiency: parseFloat(averageEfficiency.toFixed(1)),
        daysCount: activeDays.length  
    };
};