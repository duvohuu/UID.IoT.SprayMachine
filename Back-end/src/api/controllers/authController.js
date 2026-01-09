import User from '../../models/User.model.js';
import { 
    generateAccessToken, 
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken 
} from '../../shared/utils/token.util.js';
import { setAuthCookies, clearAuthCookies } from '../../shared/utils/cookie.util.js';

/**
 * ========================================
 * AUTH CONTROLLER
 * ========================================
 */

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email và password là bắt buộc'
            });
        }

        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc password không đúng'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc password không đúng'
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        // Set cookies
        setAuthCookies(res, accessToken, refreshToken);

        console.log(`User logged in: ${user.username} (${user.role})`);

        // Return user data
        const userData = user.toObject();
        delete userData.password;
        delete userData.refreshToken;

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            accessToken,
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
            await User.findOneAndUpdate(
                { refreshToken },
                { $unset: { refreshToken: 1 } }
            );
        }

        clearAuthCookies(res);

        res.json({
            success: true,
            message: 'Logout successful'
        });

        console.log(`User logged out`);
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
        const decoded = verifyRefreshToken(refreshToken);

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

        // Set new cookie
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000
        });

        console.log(`Access token refreshed for user: ${user.username}`);

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
        const decoded = verifyAccessToken(accessToken);

        // Get user
        const user = await User.findOne({ userId: decoded.userId })
            .select('-password -refreshToken');

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