import jwt from 'jsonwebtoken';
import User from '../../models/User.model.js';

/**
 * ========================================
 * AUTH CONTROLLER
 * ========================================
 */

/**
 * Generate Access Token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.userId || user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );
};

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.userId || user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username và password là bắt buộc'
            });
        }

        // Find user
        const user = await User.findOne({ username }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username hoặc password không đúng'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Username hoặc password không đúng'
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        // ✅ FIX: Set cookies với SameSite: 'none' cho cross-origin
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        console.log(`✅ User logged in: ${user.username} (${user.role})`);
        console.log(`🍪 Cookies set: secure=${process.env.NODE_ENV === 'production'}, sameSite=${process.env.NODE_ENV === 'production' ? 'none' : 'lax'}`);

        // Return user data (exclude password & refreshToken)
        const userData = user.toObject();
        delete userData.password;
        delete userData.refreshToken;

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            user: userData
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (refreshToken) {
            // Remove refresh token from database
            await User.findOneAndUpdate(
                { refreshToken },
                { $unset: { refreshToken: 1 } }
            );
        }

        // Clear cookies với options phù hợp
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        res.json({
            success: true,
            message: 'Logout successful'
        });

        console.log(`✅ User logged out`);
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided'
            });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        // Find user
        const user = await User.findOne({ 
            userId: decoded.userId, 
            refreshToken 
        }).select('+refreshToken');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user);

        // ✅ FIX: Set new access token cookie với SameSite: 'none'
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000
        });

        console.log(`✅ Access token refreshed for user: ${user.username}`);

        res.json({
            success: true,
            message: 'Access token refreshed successfully'
        });
    } catch (error) {
        console.error('❌ Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
};

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify if token is valid
 * @access  Public
 */
export const verifyToken = async (req, res) => {
    try {
        const { accessToken } = req.cookies;

        if (!accessToken) {
            return res.json({
                valid: false,
                message: 'No token provided'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.json({
                valid: false,
                message: 'Invalid token'
            });
        }

        // Get user
        const user = await User.findOne({ userId: decoded.userId }).select('-password -refreshToken');

        if (!user || !user.isActive) {
            return res.json({
                valid: false,
                message: 'User not found or inactive'
            });
        }

        res.json({
            valid: true,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('❌ Verify token error:', error);
        res.json({
            valid: false,
            message: 'Invalid token'
        });
    }
};