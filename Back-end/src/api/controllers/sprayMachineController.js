import * as SprayMachineService from '../../services/sprayMachineService.js';
import { getMQTTStatus } from '../../iot/mqttClient.js';

/**
 * GET /api/spray-machine/realtime/:machineId
 */
export const getSprayRealtimeData = async (req, res) => {
    try {
        const { machineId } = req.params;
        console.log(`📊 [Controller] GET Realtime for: ${machineId}`);
        
        const todayData = await SprayMachineService.getLatestData(machineId);
        
        // ✅ FIX: Lấy trực tiếp từ DB, KHÔNG dùng getCurrentActiveTime/getCurrentStopTime
        const realtimeData = {
            sprayStatus: todayData.lastStatus,
            pressure: 0,
            temperature: 0,
            flowRate: 0,
            totalPaintUsed: 0,
            productCount: 0,
            activeTime: parseFloat(todayData.activeTime.toFixed(2)),      // ← Lấy từ DB
            stopTime: parseFloat(todayData.stopTime.toFixed(2)),          // ← Lấy từ DB
            energyConsumption: parseFloat(todayData.totalEnergyConsumed.toFixed(3)),
            errorCode: 0,
            operatorName: 'N/A',
            lastUpdate: todayData.lastUpdate,
            isConnected: true
        };
        
        console.log(`📤 [Controller] Realtime response:`, {
            activeTime: realtimeData.activeTime,
            stopTime: realtimeData.stopTime,
            lastStatus: realtimeData.sprayStatus
        });
        
        res.json(realtimeData);
        
    } catch (error) {
        console.error('❌ [Controller] Realtime Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching spray realtime data', 
            error: error.message 
        });
    }
};

/**
 * GET /api/spray-machine/daily/:machineId
 */
export const getSprayDailyData = async (req, res) => {
    try {
        const { machineId } = req.params;
        console.log(`📅 [Controller] GET Daily for: ${machineId}`);
        
        const data = await SprayMachineService.getLatestData(machineId);
        
        // ✅ FIX: Lấy trực tiếp từ DB, KHÔNG dùng getCurrentActiveTime/getCurrentStopTime
        const efficiency = (data.activeTime / 12) * 100;
        
        const dailyData = {
            date: data.date,
            operatingTime: parseFloat(data.activeTime.toFixed(2)),       // ← Lấy từ DB
            pausedTime: parseFloat(data.stopTime.toFixed(2)),            // ← Lấy từ DB
            totalPaintUsed: 0,
            productCount: 0,
            energyConsumption: parseFloat(data.totalEnergyConsumed.toFixed(3)),
            efficiency: parseFloat(efficiency.toFixed(1)),
            avgCurrent: 0,
            current: 0
        };
        
        console.log(`📤 [Controller] Daily response:`, {
            operatingTime: dailyData.operatingTime,
            pausedTime: dailyData.pausedTime,
            efficiency: dailyData.efficiency
        });
        
        res.json(dailyData);
        
    } catch (error) {
        console.error('❌ [Controller] Daily Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching spray daily data', 
            error: error.message 
        });
    }
};

/**
 * GET /api/spray-machine/history/:machineId
 */
export const getSpray30DaysHistory = async (req, res) => {
    try {
        const { machineId } = req.params;
        console.log(`📜 [Controller] GET History for: ${machineId}`);
        
        const history = await SprayMachineService.get30DaysHistory(machineId);
        
        // ✅ FIX: Lấy trực tiếp từ DB
        const formattedHistory = history.map(day => ({
            date: day.date,
            operatingTime: parseFloat(day.activeTime.toFixed(2)),        // ← Lấy từ DB
            pausedTime: parseFloat(day.stopTime.toFixed(2)),             // ← Lấy từ DB
            energyConsumption: parseFloat(day.totalEnergyConsumed.toFixed(3)),
            efficiency: parseFloat(((day.activeTime / 12) * 100).toFixed(1))
        }));
        
        res.json(formattedHistory);
        
    } catch (error) {
        console.error('❌ [Controller] History Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching spray history', 
            error: error.message 
        });
    }
};

/**
 * GET /api/spray-machine/statistics/:machineId
 */
export const getSprayStatistics = async (req, res) => {
    try {
        const { machineId } = req.params;
        console.log(`📊 [Controller] GET Statistics for: ${machineId}`);
        
        const stats = await SprayMachineService.getStatistics(machineId);
        
        // Stats đã dùng DB data, không cần sửa
        const mappedStats = {
            totalOperatingTime: parseFloat(stats.totalActiveTime.toFixed(2)),
            totalEnergyConsumed: parseFloat(stats.totalEnergyConsumed.toFixed(2)),
            averageOperatingPercentage: parseFloat(stats.averageEfficiency.toFixed(1)),
            daysCount: stats.daysCount
        };
        
        res.json(mappedStats);
        
    } catch (error) {
        console.error('❌ [Controller] Statistics Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching spray statistics', 
            error: error.message 
        });
    }
};

/**
 * GET /api/spray-machine/pie-chart/:machineId
 */
export const getSprayPieChartData = async (req, res) => {
    try {
        const { machineId } = req.params;
        console.log(`📊 [Controller] GET Pie Chart for: ${machineId}`);
        
        const data = await SprayMachineService.getLatestData(machineId);
        
        // ✅ FIX: Lấy trực tiếp từ DB
        const pieChartData = {
            operatingTime: parseFloat(data.activeTime.toFixed(2)),       // ← Lấy từ DB
            pausedTime: parseFloat(data.stopTime.toFixed(2)),            // ← Lấy từ DB
            idleTime: 0
        };
        
        console.log(`📤 [Controller] Pie Chart response:`, pieChartData);
        
        res.json(pieChartData);
        
    } catch (error) {
        console.error('❌ [Controller] Pie Chart Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching spray pie chart data', 
            error: error.message 
        });
    }
};

/**
 * POST /api/spray-machine/mqtt-update/:machineId
 */
export const handleMQTTUpdate = async (req, res) => {
    try {
        const { machineId } = req.params;
        const { status, powerConsumption } = req.body;
        
        console.log(`📨 [Controller] POST MQTT Update for: ${machineId}`, { status, powerConsumption });
        
        if (typeof status !== 'number' || (status !== 0 && status !== 1)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be 0 or 1'
            });
        }
        
        if (typeof powerConsumption !== 'number' || powerConsumption < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid powerConsumption. Must be >= 0'
            });
        }
        
        await SprayMachineService.verifyMachine(machineId);
        
        const updatedData = await SprayMachineService.processMQTTUpdate(machineId, {
            status,
            powerConsumption
        });
        
        await SprayMachineService.updateMachineConnectionStatus(machineId, true);
        
        // ✅ FIX: Lấy trực tiếp từ DB
        res.json({
            success: true,
            message: 'MQTT data processed successfully',
            data: {
                date: updatedData.date,
                operatingTime: parseFloat(updatedData.activeTime.toFixed(2)),    // ← Lấy từ DB
                pausedTime: parseFloat(updatedData.stopTime.toFixed(2)),         // ← Lấy từ DB
                totalEnergyConsumed: parseFloat(updatedData.totalEnergyConsumed.toFixed(3)),
                lastStatus: updatedData.lastStatus
            }
        });
        
    } catch (error) {
        console.error('❌ [Controller] MQTT Update Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error processing MQTT update', 
            error: error.message 
        });
    }
};

export const getMQTTConnectionStatus = async (req, res) => {
    try {
        const status = getMQTTStatus();
        
        res.json({
            success: true,
            mqtt: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ [Controller] MQTT Status Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching MQTT status', 
            error: error.message 
        });
    }
};