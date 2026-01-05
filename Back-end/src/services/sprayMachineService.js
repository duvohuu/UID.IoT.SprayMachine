import SprayMachineData from '../models/SprayMachineData.model.js';
import Machine from '../models/Machine.model.js';
import cron from 'node-cron';
import { getIO } from '../config/socket.js';

const WORK_HOURS_PER_DAY = 12; 
const WORK_START_HOUR = 6;    
const WORK_START_MINUTE = 0;   
const WORK_END_HOUR = 20;     
const WORK_END_MINUTE = 0;     
/**
 * Lấy date string theo timezone Việt Nam (UTC+7)
 */
const getVietnamDateString = (daysOffset = 0) => {
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000) + (daysOffset * 24 * 60 * 60 * 1000));
    return vnTime.toISOString().split('T')[0];
};

/**
 * Lấy thời gian hiện tại theo timezone Việt Nam
 */
const getVietnamTime = () => {
    const now = new Date();
    return new Date(now.getTime() + (7 * 60 * 60 * 1000));
};

/**
 * Kiểm tra xem hiện tại có trong ca làm việc không
 * @returns {boolean} true nếu trong ca làm việc
 */
const isWithinWorkShift = () => {
    const vnTime = getVietnamTime();
    const currentHour = vnTime.getUTCHours();
    const currentMinute = vnTime.getUTCMinutes();
    
    // Tính tổng phút từ 00:00
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const startTotalMinutes = WORK_START_HOUR * 60 + WORK_START_MINUTE;
    const endTotalMinutes = WORK_END_HOUR * 60 + WORK_END_MINUTE;
    
    return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
};

/**
 * Format thời gian ca làm việc để hiển thị
 */
const formatWorkShift = () => {
    const startTime = `${WORK_START_HOUR.toString().padStart(2, '0')}:${WORK_START_MINUTE.toString().padStart(2, '0')}`;
    const endTime = `${WORK_END_HOUR.toString().padStart(2, '0')}:${WORK_END_MINUTE.toString().padStart(2, '0')}`;
    return `${startTime} - ${endTime}`;
};

/**
 * Lấy hoặc tạo document cho hôm nay
 */
export const getLatestData = async (machineId) => {
    try {
        const latestData = await SprayMachineData.findOne({ 
            machineId 
        }).sort({ date: -1 });
        
        const today = getVietnamDateString();
        
        if (!latestData) {
            console.log(`📝 [Service] No data found. Creating for ${today}`);
            
            const yesterday = getVietnamDateString(-1);
            const yesterdayData = await SprayMachineData.findOne({
                machineId,
                date: yesterday
            });
            
            const energyAtStartOfDay = yesterdayData?.currentPowerConsumption || 0;
            const creationTime = new Date();
            
            const newData = await SprayMachineData.create({
                machineId,
                date: today,
                activeTime: 0,
                stopTime: 0,
                totalEnergyConsumed: 0,
                energyAtStartOfDay,
                currentPowerConsumption: energyAtStartOfDay,
                lastStatus: 0,
                lastStatusChangeTime: creationTime,
                lastUpdate: creationTime
            });
            
            console.log(`✅ [Service] Created with energyAtStartOfDay: ${energyAtStartOfDay} kWh`);
            return newData;
        }
        
        const latestDate = latestData.date;
        
        console.log(`📅 [Service] Latest data: ${latestDate}, Today: ${today}`);
        
        if (latestDate >= today) {
            console.log(`✅ [Service] Using latest date: ${latestDate}`);
            return latestData;
        } else {
            console.log(`📝 [Service] Latest date is old. Creating for ${today}`);
            
            const energyAtStartOfDay = latestData.currentPowerConsumption || 0;
            const creationTime = new Date();
            
            const newData = await SprayMachineData.create({
                machineId,
                date: today,
                activeTime: 0,
                stopTime: 0,
                totalEnergyConsumed: 0,
                energyAtStartOfDay,
                currentPowerConsumption: energyAtStartOfDay,
                lastStatus: 0,
                lastStatusChangeTime: creationTime,
                lastUpdate: creationTime
            });
            
            console.log(`✅ [Service] Created for ${today}. EnergyAtStart: ${energyAtStartOfDay} kWh`);
            return newData;
        }
        
    } catch (error) {
        console.error(`❌ [Service] Error getting latest data for ${machineId}:`, error);
        throw error;
    }
};

/**
 * ========================================
 * XỬ LÝ MQTT MESSAGE - CHỈ TRONG CA
 * ========================================
 */
export const processMQTTUpdate = async (machineId, mqttData) => {
    try {
        const { status, powerConsumption } = mqttData;
        const now = getVietnamTime();
        
        // ==================== KIỂM TRA CA LÀM VIỆC ====================
        if (!isWithinWorkShift()) {
            console.log(`⏰ [Service] Outside work shift. Ignoring update.`);
            return null;
        }
        
        // ==================== LẤY/TẠO DATA ====================
        const data = await getLatestData(machineId);
        
        // ==================== CẬP NHẬT NĂNG LƯỢNG ====================
        const energyConsumed = powerConsumption - data.energyAtStartOfDay;
        data.totalEnergyConsumed = Math.max(0, energyConsumed);
        data.currentPowerConsumption = powerConsumption;
        
        console.log(`⚡ [Service] Energy: start=${data.energyAtStartOfDay.toFixed(3)}kWh, current=${powerConsumption.toFixed(3)}kWh, consumed=${data.totalEnergyConsumed.toFixed(3)}kWh`);
        
        // ==================== CẬP NHẬT THỜI GIAN ====================
        
        const previousStatus = data.lastStatus;
        const currentStatus = (typeof status === 'number' && status === 1) ? 1 : 0;
        const timeSinceLastChange = now - new Date(data.lastStatusChangeTime);
        const hoursSinceLastChange = timeSinceLastChange / (1000 * 60 * 60);
        
        console.log(`[Service] Status: previous=${previousStatus}, current=${currentStatus}`);
        console.log(`[Service] Time since last change: ${hoursSinceLastChange.toFixed(3)}h`);
        
        if (timeSinceLastChange > 1000) { // Chỉ cập nhật nếu > 1 giây
            
            if (previousStatus === 1) {
                // Trước đó máy ĐANG CHẠY → cộng vào activeTime
                data.activeTime += hoursSinceLastChange;
                data.activeTime = Math.min(data.activeTime, WORK_HOURS_PER_DAY);
                console.log(`▶️ [Service] Added ${hoursSinceLastChange.toFixed(3)}h to activeTime. Total: ${data.activeTime.toFixed(2)}h`);
            } else {
                // Trước đó máy ĐANG DỪNG → cộng vào stopTime
                data.stopTime += hoursSinceLastChange;
                data.stopTime = Math.min(data.stopTime, WORK_HOURS_PER_DAY);
                console.log(`⏸️ [Service] Added ${hoursSinceLastChange.toFixed(3)}h to stopTime. Total: ${data.stopTime.toFixed(2)}h`);
            }
            
            // Cập nhật timestamp và status
            data.lastStatusChangeTime = now;
            data.lastStatus = currentStatus;
            
            // Log status change nếu có
            if (previousStatus !== currentStatus) {
                if (currentStatus === 1) {
                    console.log(`🟢 [Service] Machine STARTED running at ${now.toISOString()}`);
                } else {
                    console.log(`🔴 [Service] Machine STOPPED at ${now.toISOString()}`);
                }
            }
            
        } else {
            console.log(`⚠️ [Service] Update too fast (${timeSinceLastChange}ms), skipping time calculation`);
        }
        
        // ==================== CẬP NHẬT METADATA ====================
        
        data.lastUpdate = now;
        
        // Đảm bảo không âm
        data.activeTime = Math.max(0, data.activeTime);
        data.stopTime = Math.max(0, data.stopTime);
        
        await data.save();
        
        console.log(`✅ [Service] Saved: activeTime=${data.activeTime.toFixed(2)}h, stopTime=${data.stopTime.toFixed(2)}h, energy=${data.totalEnergyConsumed.toFixed(3)}kWh`);
        
        return data;
        
    } catch (error) {
        console.error(`[Service] Error processing MQTT for ${machineId}:`, error);
        throw error;
    }
};

/**
 * Lấy lịch sử 30 ngày
 */
export const get30DaysHistory = async (machineId) => {
    const history = await SprayMachineData
        .find({ machineId })
        .sort({ date: -1 })
        .limit(30)
        .select('-__v -createdAt -updatedAt')
        .lean();
    
    return history;
};

/**
 * Lấy thống kê 30 ngày
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
 * ========================================
 * DAILY RESET - CHỈ TẠO DATA MỚI
 * ========================================
 */
export const resetDailyData = async (machineId, daysOffset = 0) => {
    const targetDate = getVietnamDateString(daysOffset);
    
    try {
        // Lấy data ngày trước để copy energyAtStartOfDay
        const previousDate = getVietnamDateString(daysOffset - 1);
        const previousData = await SprayMachineData.findOne({
            machineId,
            date: previousDate
        });
        
        const energyAtStartOfDay = previousData?.currentPowerConsumption || 0;
        
        // Kiểm tra xem đã có data cho ngày target chưa
        let targetData = await SprayMachineData.findOne({ 
            machineId, 
            date: targetDate 
        });
        
        if (targetData) {
            console.log(`🔄 [Service] Resetting existing data for ${machineId} on ${targetDate}`);
            
            targetData.activeTime = 0;
            targetData.stopTime = 0;
            targetData.totalEnergyConsumed = 0;
            targetData.energyAtStartOfDay = energyAtStartOfDay;
            targetData.currentPowerConsumption = energyAtStartOfDay;
            targetData.lastStatus = 0;
            targetData.lastStatusChangeTime = new Date();
            
            await targetData.save();
        } else {
            console.log(`📝 [Service] Creating new data for ${machineId} on ${targetDate}`);
            
            targetData = await SprayMachineData.create({
                machineId,
                date: targetDate,
                activeTime: 0,
                stopTime: 0,
                totalEnergyConsumed: 0,
                energyAtStartOfDay,
                currentPowerConsumption: energyAtStartOfDay,
                lastStatus: 0,
                lastStatusChangeTime: new Date()
            });
        }
        
        console.log(`🌙 [Service] Reset data for ${machineId} on ${targetDate}. EnergyAtStart: ${energyAtStartOfDay} kWh`);
        
        return targetData;
        
    } catch (error) {
        console.error(`❌ [Service] Error resetting data for ${machineId}:`, error);
        throw error;
    }
};

/**
 * Verify machine exists
 */
export const verifyMachine = async (machineId) => {
    const machine = await Machine.findOne({ 
        machineId, 
        type: 'Spray Machine' 
    });
    
    if (!machine) {
        throw new Error(`Spray Machine ${machineId} not found`);
    }
    
    return machine;
};

/**
 * Update machine connection status
 */
export const updateMachineConnectionStatus = async (machineId, isConnected) => {
    await Machine.findOneAndUpdate(
        { machineId },
        { 
            isConnected,
            lastHeartbeat: new Date(),
            status: isConnected ? 'online' : 'offline'
        }
    );
};


/**
 * ========================================
 * DAILY RESET SCHEDULER 
 * ========================================
 */
export const resetAllSprayMachines = async (daysOffset = 0) => {
    const targetDate = getVietnamDateString(daysOffset);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Daily Reset`);
    console.log(`📅 Target date: ${targetDate}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        const machines = await Machine.find({ type: 'Spray Machine' });
        console.log(`📊 Found ${machines.length} Spray Machines\n`);

        const results = await Promise.allSettled(
            machines.map(async (machine) => {
                const newData = await resetDailyData(machine.machineId, daysOffset);
                
                // Emit socket event
                const io = getIO();
                io.emit('spray:daily-reset', {
                    machineId: machine.machineId,
                    date: targetDate,
                    message: 'Daily data has been reset'
                });
                
                return machine.machineId;
            })
        );

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Summary: ✅ ${succeeded}/${machines.length} succeeded`);
        if (failed > 0) {
            console.log(`   ❌ ${failed} failed`);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ [Daily Reset] Error:', error.message);
    }
};

export const initializeDailyResetScheduler = () => {
    console.log('⏰ [Scheduler] Initializing daily reset');
    console.log(`   Work shift: ${formatWorkShift()}`);
    
    const RESET_HOUR = WORK_END_HOUR;
    const RESET_MINUTE = WORK_END_MINUTE;
    
    console.log(`   📅 Will create TOMORROW's data at end of shift: ${RESET_HOUR.toString().padStart(2, '0')}:${RESET_MINUTE.toString().padStart(2, '0')}`);
    
    // Tạo cron expression động
    const cronExpression = `${RESET_MINUTE} ${RESET_HOUR} * * *`;
    
    const cronJob = cron.schedule(cronExpression, async () => {
        console.log('📅 Creating data for TOMORROW');
        
        await resetAllSprayMachines(1); // 
    }, {
        timezone: 'Asia/Ho_Chi_Minh',
        scheduled: true
    });
    console.log('✅ [Scheduler] Daily reset initialized\n');
    
    return cronJob;
};

export const testDailyReset = async () => {
    console.log('🧪 [Test] Running manual reset...\n');
    await resetAllSprayMachines();
};

/**
 * ========================================
 * WEEKLY DATA 
 * =======================================
 */

 const getMondayOfWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const day = date.getUTCDay(); // 0 = CN, 1 = T2, ..., 6 = T7
    const diff = day === 0 ? -6 : 1 - day; // Nếu CN thì lùi 6 ngày
    
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() + diff);
    
    return monday.toISOString().split('T')[0];
};

/**
 * Chuyển đổi ngày thành tên thứ trong tuần
 */
const getDayOfWeekName = (dateString) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const day = date.getUTCDay();
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[day];
};

/**
 * Lấy dữ liệu tuần hiện tại (T2-CN)
 */
export const getCurrentWeekData = async (machineId) => {
    try {
        const today = getVietnamDateString();
        const monday = getMondayOfWeek(today);
        
        console.log(`📅 [Service] Current week: Monday = ${monday}, Today = ${today}`);
        
        // Tạo mảng 7 ngày từ T2 đến CN
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday + 'T00:00:00Z');
            date.setUTCDate(date.getUTCDate() + i);
            weekDates.push(date.toISOString().split('T')[0]);
        }
        
        console.log(`📋 [Service] Week dates:`, weekDates);
        
        // Lấy dữ liệu từ DB
        const weekData = await SprayMachineData
            .find({ 
                machineId,
                date: { $in: weekDates }
            })
            .sort({ date: 1 })
            .lean();
        
        // Map với tên thứ
        const result = weekDates.map(date => {
            const existingData = weekData.find(d => d.date === date);
            
            return {
                date,
                dayOfWeek: getDayOfWeekName(date),
                activeTime: existingData?.activeTime || 0,
                stopTime: existingData?.stopTime || 0,
                totalEnergyConsumed: existingData?.totalEnergyConsumed || 0
            };
        });
        
        console.log(`✅ [Service] Week data prepared:`, result.length, 'days');
        
        return result;
        
    } catch (error) {
        console.error(`❌ [Service] Error getting week data for ${machineId}:`, error);
        throw error;
    }
};