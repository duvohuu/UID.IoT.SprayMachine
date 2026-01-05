import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
    getSprayRealtimeData,
    getSprayDailyData,
    getSpray30DaysHistory,
    getSprayStatistics,
    getSprayPieChartData,
    getSprayWeeklyData,
    handleMQTTUpdate, 
    getMQTTConnectionStatus 
} from '../controllers/sprayMachineController.js';

const router = express.Router();

// ==================== GET ROUTES ====================
// Tất cả routes đều cần authentication
router.use(protect);

router.get('/realtime/:machineId', getSprayRealtimeData);
router.get('/daily/:machineId', getSprayDailyData);
router.get('/weekly/:machineId', getSprayWeeklyData); 
router.get('/history/:machineId', getSpray30DaysHistory);
router.get('/statistics/:machineId', getSprayStatistics);
router.get('/pie-chart/:machineId', getSprayPieChartData);

// ==================== POST ROUTES ====================
// Endpoint để nhận MQTT data
router.post('/mqtt-update/:machineId', handleMQTTUpdate);
router.get('/mqtt-status', getMQTTConnectionStatus); 

export default router;