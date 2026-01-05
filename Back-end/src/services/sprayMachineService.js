import SprayMachineData from '../models/SprayMachineData.model.js';
import Machine from '../models/Machine.model.js';
import cron from 'node-cron';
import { getIO } from '../config/socket.js';

const WORK_HOURS_PER_DAY = 12; 
const WORK_START_HOUR = 6;    
const WORK_START_MINUTE = 0;   
const WORK_END_HOUR = 18;     
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
 * Tạo timestamp chính xác cho 6:00 AM của ngày chỉ định
 */
const getWorkStartTime = (dateString) => {
    // dateString format: "2026-01-06"
    const date = new Date(dateString + 'T00:00:00Z');
    date.setUTCHours(WORK_START_HOUR - 7, WORK_START_MINUTE, 0, 0); // UTC+7 -> UTC
    return date;
};

/**
 * Kiểm tra xem hiện tại có trong ca làm việc không
 * @returns {boolean} true nếu trong ca làm việc
 */
const isWithinWorkShift = () => {
    const vnTime = getVietnamTime();
    const currentHour = vnTime.getUTCHours();
    const currentMinute = vnTime.getUTCMinutes();
    
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
        const today = getVietnamDateString();
        
        // Bước 1: Tìm data mới nhất
        let latestData = await SprayMachineData.findOne({ 
            machineId 
        }).sort({ date: -1 });
        
        // Bước 2: Nếu không có data hoặc data cũ → Tạo/Lấy data hôm nay
        if (!latestData || latestData.date < today) {
            console.log(`📝 [Service] Creating/getting data for ${today}`);
            
            // Lấy energyAtStartOfDay từ ngày hôm qua
            const yesterday = getVietnamDateString(-1);
            const yesterdayData = await SprayMachineData.findOne({
                machineId,
                date: yesterday
            });
            
            const energyAtStartOfDay = yesterdayData?.currentPowerConsumption || 0;
            const workStartTime = getWorkStartTime(today);
            
            // Tránh duplicate key error khi nhiều request đồng thời
            latestData = await SprayMachineData.findOneAndUpdate(
                { 
                    machineId, 
                    date: today 
                },
                {
                    $setOnInsert: {
                        // Chỉ set các field này khi tạo mới (insert)
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
            
            console.log(`✅ [Service] Data ready for ${today}`);
            console.log(`   energyAtStartOfDay: ${energyAtStartOfDay} kWh`);
            console.log(`   lastStatusChangeTime: ${workStartTime.toISOString()} (6:00 AM VN)`);
            
        } else {
            console.log(`✅ [Service] Using existing data: ${latestData.date}`);
        }
        
        return latestData;
        
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
        const now = new Date();
        
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
        
        if (timeSinceLastChange > 1000) {
            
            if (previousStatus === 1) {
                data.activeTime += hoursSinceLastChange;
                data.activeTime = Math.min(data.activeTime, WORK_HOURS_PER_DAY);
                console.log(`▶️ [Service] Added ${hoursSinceLastChange.toFixed(3)}h to activeTime. Total: ${data.activeTime.toFixed(2)}h`);
            } else {
                data.stopTime += hoursSinceLastChange;
                data.stopTime = Math.min(data.stopTime, WORK_HOURS_PER_DAY);
                console.log(`⏸️ [Service] Added ${hoursSinceLastChange.toFixed(3)}h to stopTime. Total: ${data.stopTime.toFixed(2)}h`);
            }
            
            data.lastStatusChangeTime = now;
            data.lastStatus = currentStatus;
            
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
        
        data.activeTime = Math.max(0, Math.min(data.activeTime, WORK_HOURS_PER_DAY));
        data.stopTime = Math.max(0, Math.min(data.stopTime, WORK_HOURS_PER_DAY));
        
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
 * DAILY RESET - TẠO DATA MỚI CHO NGÀY HÔM NAY
 * ========================================
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
            console.log(`🔄 [Service] Resetting existing data for ${machineId} on ${targetDate}`);
            
            targetData.activeTime = 0;
            targetData.stopTime = 0;
            targetData.totalEnergyConsumed = 0;
            targetData.energyAtStartOfDay = energyAtStartOfDay;
            targetData.currentPowerConsumption = energyAtStartOfDay;
            targetData.lastStatus = 0;
            targetData.lastStatusChangeTime = workStartTime; 
            
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
                lastStatusChangeTime: workStartTime 
            });
        }
        
        console.log(`🌙 [Service] Reset data for ${machineId} on ${targetDate}`);
        console.log(`   EnergyAtStart: ${energyAtStartOfDay} kWh`);
        console.log(`   lastStatusChangeTime: ${workStartTime.toISOString()} (6:00 AM VN)`);
        
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
 * DAILY RESET SCHEDULER - TẠO CA MỚI LÚC 6:00 SÁNG
 * ========================================
 */
export const resetAllSprayMachines = async (daysOffset = 0) => {
    const targetDate = getVietnamDateString(daysOffset);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌅 Daily Reset - Creating new shift`);
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
                io.to(`machine-${machine.machineId}`).emit('spray:daily-reset', {
                    machineId: machine.machineId,
                    date: targetDate,
                    message: 'New shift created at 6:00 AM'
                });
                
                io.to('spray-machines').emit('spray:daily-reset', {
                    machineId: machine.machineId,
                    date: targetDate,
                    message: 'New shift created at 6:00 AM'
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
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.log(`   Machine ${machines[index].machineId}: ${result.reason}`);
                }
            });
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ [Daily Reset] Error:', error.message);
    }
};


export const initializeDailyResetScheduler = () => {
    console.log('⏰ [Scheduler] Initializing daily reset');
    console.log(`   Work shift: ${formatWorkShift()}`);
    
    const RESET_HOUR = WORK_START_HOUR; // 6 AM
    const RESET_MINUTE = WORK_START_MINUTE; // 0
    
    const UTC_HOUR = (RESET_HOUR - 7 + 24) % 24; // 6 - 7 = -1 -> 23 (11 PM UTC ngày hôm trước)
    
    console.log(`   🌅 Will create TODAY's data at:`);
    console.log(`      Vietnam time: ${RESET_HOUR.toString().padStart(2, '0')}:${RESET_MINUTE.toString().padStart(2, '0')} (6:00 AM)`);
    console.log(`      UTC time: ${UTC_HOUR.toString().padStart(2, '0')}:${RESET_MINUTE.toString().padStart(2, '0')}`);
    
    const cronExpression = `${RESET_MINUTE} ${UTC_HOUR} * * *`; // "0 23 * * *" (11 PM UTC)
    
    const cronJob = cron.schedule(cronExpression, async () => {
        console.log('🌅 [Cron] Creating data for TODAY at 6:00 AM Vietnam time');
        
        await resetAllSprayMachines(0);
    }, {
        timezone: 'UTC', 
        scheduled: true
    });
    
    return cronJob;
};

export const testDailyReset = async () => {
    console.log('🧪 [Test] Running manual reset for TODAY...\n');
    await resetAllSprayMachines(0);
};

/**
 * ========================================
 * WEEKLY DATA 
 * ========================================
 */

const getMondayOfWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const day = date.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() + diff);
    
    return monday.toISOString().split('T')[0];
};

const getDayOfWeekName = (dateString) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const day = date.getUTCDay();
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[day];
};

export const getCurrentWeekData = async (machineId) => {
    try {
        const today = getVietnamDateString();
        const monday = getMondayOfWeek(today);
        
        console.log(`📅 [Service] Current week: Monday = ${monday}, Today = ${today}`);
        
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday + 'T00:00:00Z');
            date.setUTCDate(date.getUTCDate() + i);
            weekDates.push(date.toISOString().split('T')[0]);
        }
        
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