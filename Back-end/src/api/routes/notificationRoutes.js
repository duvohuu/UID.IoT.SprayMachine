import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead 
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);
router.patch('/mark-all-read', protect, markAllAsRead);

export default router;