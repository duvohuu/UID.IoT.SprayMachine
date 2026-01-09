import jwt from 'jsonwebtoken';
import User from '../../models/User.model.js';

/**
 * ========================================
 * AUTH MIDDLEWARE
 * ========================================
 */

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (req, res, next) => {
    try {
        let token;

        // Get token from cookie or header
        if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await User.findOne({ userId: decoded.userId }).select('-password -refreshToken');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User account is disabled'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

/**
 * Admin only middleware
 */
export const adminOnly = (req, res, next) => {    
    if (req.user && req.user.role === 'admin') {
        console.log('[AdminCheck] Access granted - User is admin');
        next();
    } else {
        console.log(`[AdminCheck] Access DENIED - User is ${req.user?.role || 'not authenticated'}`);
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
};
