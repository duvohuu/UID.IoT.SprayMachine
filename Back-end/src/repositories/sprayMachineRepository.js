import SprayMachineData from '../models/SprayMachineData.model.js';
import Machine from '../models/Machine.model.js';
import { TIME_CONFIG } from '../shared/constant/workShift.constant.js';
import { getVietnamDateString, getMondayOfWeek, getWeekDates, getDayOfWeekName } from '../shared/utils/datetime.util.js';

/**
 * ========================================
 * SPRAY MACHINE REPOSITORY
 * ========================================
 * Data access layer for SprayMachineData operations
 */

// ==================== BASIC DATA OPERATIONS ====================

/**
 * Get today's data for a machine
 */
export const getTodayData = async (machineId) => {
    const today = getVietnamDateString();
    return await SprayMachineData.findOne({ machineId, date: today });
};

/**
 * Get latest data for a machine (most recent by date)
 */
export const getLatestData = async (machineId) => {
    return await SprayMachineData.findOne({ machineId }).sort({ date: -1 });
};

/**
 * Save updated data
 */
export const saveData = async (data) => {
    return await data.save();
};

/**
 * Create new daily data
 */
export const createDailyData = async (data) => {
    return await SprayMachineData.create(data);
};

/**
 * Find data by specific date
 */
export const findDataByDate = async (machineId, date) => {
    return await SprayMachineData.findOne({ machineId, date });
};

// ==================== HISTORY & AGGREGATE DATA ====================


/**
 * Get current week data
 */
export const getCurrentWeekData = async (machineId) => {
    const today = getVietnamDateString();
    const monday = getMondayOfWeek(today);
    const weekDates = getWeekDates(monday);

    const weekData = await SprayMachineData
        .find({ machineId, date: { $in: weekDates } })
        .sort({ date: 1 })
        .lean();

    return weekDates.map(date => {
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
};

/**
 * Get current month data
 */
export const getCurrentMonthData = async (machineId) => {
    const today = getVietnamDateString();
    const year = parseInt(today.substring(0, 4));
    const month = parseInt(today.substring(5, 7));
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const monthData = await SprayMachineData
        .find({ machineId, date: { $gte: firstDay, $lte: lastDayStr } })
        .sort({ date: 1 })
        .lean();

    const result = [];
    for (let day = 1; day <= lastDay; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const existingData = monthData.find(d => d.date === dateStr);
        result.push({
            date: dateStr,
            day,
            dayOfWeek: getDayOfWeekName(dateStr),
            activeTime: existingData?.activeTime || 0,
            stopTime: existingData?.stopTime || 0,
            errorTime: existingData?.errorTime || 0,
            totalEnergyConsumed: existingData?.totalEnergyConsumed || 0,
            hasData: !!existingData
        });
    }
    return result;
};

// ==================== MACHINE OPERATIONS ====================

/**
 * Get all spray machines
 */
export const getAllSprayMachines = async () => {
    return await Machine.find({ type: 'Spray Machine' });
};