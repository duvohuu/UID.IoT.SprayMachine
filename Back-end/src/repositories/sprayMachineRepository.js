// filepath: /run/media/vhdu/WORK/Project/Project_11_UIDLab_IoTSprayMachine/Back-end/src/repositories/sprayMachineRepository.js
import SprayMachineData from '../models/SprayMachineData.model.js';
import Machine from '../models/Machine.model.js';
import { TIME_CONFIG } from '../shared/constant/workShift.constant.js';
import { getVietnamDateString, getMondayOfWeek, getWeekDates, getDayOfWeekName } from '../shared/utils/datetime.util.js';

/**
 * Get today's data for a machine
 */
export const getTodayData = async (machineId) => {
    const today = getVietnamDateString();
    return await SprayMachineData.findOne({ machineId, date: today });
};

/**
 * Get latest data (or create if not exists)
 */
export const getLatestData = async (machineId) => {
    const today = getVietnamDateString();
    let latestData = await SprayMachineData.findOne({ machineId }).sort({ date: -1 });

    if (!latestData || latestData.date < today) {
        const existingToday = await SprayMachineData.findOne({ machineId, date: today });
        if (existingToday) return existingToday;

        // Create new data (logic moved from service)
        const yesterday = getVietnamDateString(-1);
        const yesterdayData = await SprayMachineData.findOne({ machineId, date: yesterday });
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
    }
    return latestData;
};

/**
 * Save updated data
 */
export const saveData = async (data) => {
    return await data.save();
};

/**
 * Get 30 days history
 */
export const get30DaysHistory = async (machineId) => {
    return await SprayMachineData
        .find({ machineId })
        .sort({ date: -1 })
        .limit(TIME_CONFIG.HISTORY_DAYS_LIMIT)
        .select('-__v -createdAt -updatedAt')
        .lean();
};

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

/**
 * Get all spray machines
 */
export const getAllSprayMachines = async () => {
    return await Machine.find({ type: 'Spray Machine' });
};

/**
 * Create new daily data
 */
export const createDailyData = async (data) => {
    return await SprayMachineData.create(data);
};

/**
 * Find data by date
 */
export const findDataByDate = async (machineId, date) => {
    return await SprayMachineData.findOne({ machineId, date });
};