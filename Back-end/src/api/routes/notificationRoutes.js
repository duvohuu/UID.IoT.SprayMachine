import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - Lấy danh sách thông báo
router.get('/', authenticateToken, async (req, res) => {
    try {
        // TODO: Implement notification logic
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications'
        });
    }
});

export default router;