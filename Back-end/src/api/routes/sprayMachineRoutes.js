import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
    getSprayRealtimeData,
    getSprayDailyData,
    getSpray30DaysHistory,
    getSprayStatistics,
    getSprayPieChartData,
    getSprayWeeklyData,
    getSprayMonthlyData,
    handleMQTTUpdate, 
    getMQTTConnectionStatus 
} from '../controllers/sprayMachineController.js';

const router = express.Router();

// ==================== GET ROUTES ====================
router.use(protect);

router.get('/realtime/:machineId', getSprayRealtimeData);
router.get('/daily/:machineId', getSprayDailyData);
router.get('/weekly/:machineId', getSprayWeeklyData); 
router.get('/monthly/:machineId', getSprayMonthlyData); 
router.get('/history/:machineId', getSpray30DaysHistory);
router.get('/statistics/:machineId', getSprayStatistics);
router.get('/pie-chart/:machineId', getSprayPieChartData);

export default router;