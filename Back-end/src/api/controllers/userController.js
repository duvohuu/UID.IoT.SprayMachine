import User from '../../models/User.model.js';
import bcrypt from 'bcryptjs';

/**
 * ========================================
 * USER CONTROLLER
 * ========================================
 */

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
export const getProfile = async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId })
            .select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const updates = {};

        if (username) updates.username = username;
        if (email) updates.email = email;

        // Check if email already exists (if changing email)
        if (email && email !== req.user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
        }

        const user = await User.findOneAndUpdate(
            { userId: req.user.userId },
            updates,
            { new: true, runValidators: true }
        ).select('-password -refreshToken');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @route   PUT /api/users/change-password
 * @desc    Change password
 * @access  Private
 */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        // Get user with password
        const user = await User.findOne({ userId: req.user.userId })
            .select('+password');

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @route   PUT /api/users/avatar
 * @desc    Update avatar
 * @access  Private
 */
export const updateAvatar = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image file'
            });
        }

        // Create avatar URL path
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        // Update user avatar
        const user = await User.findOneAndUpdate(
            { userId: req.user.userId },
            { avatar: avatarUrl },
            { new: true }
        ).select('-password -refreshToken');

        res.json({
            success: true,
            message: 'Avatar updated successfully',
            avatar: avatarUrl,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * ========================================
 * ADMIN ONLY ROUTES
 * ========================================
 */

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password -refreshToken')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users: users.map(user => user.toJSON())
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID
 * @access  Private/Admin
 */
export const getUserById = async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId })
            .select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private/Admin
 */
export const createUser = async (req, res) => {
    try {
        const { userId, username, email, password, role } = req.body;

        // Validation
        if (!userId || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ userId }, { email }] 
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User ID or email already exists'
            });
        }

        // Create user
        const user = await User.create({
            userId,
            username,
            email,
            password,
            role: role || 'user'
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: user.toJSON()
        });

        console.log(`User created: ${username} (${userId})`);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @route   PUT /api/users/:userId
 * @desc    Update user
 * @access  Private/Admin
 */
export const updateUser = async (req, res) => {
    try {
        const { username, email, role, isActive } = req.body;
        const updates = {};

        if (username) updates.username = username;
        if (email) updates.email = email;
        if (role) updates.role = role;
        if (typeof isActive === 'boolean') updates.isActive = isActive;

        const user = await User.findOneAndUpdate(
            { userId: req.params.userId },
            updates,
            { new: true, runValidators: true }
        ).select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            user: user.toJSON()
        });

        console.log(`User updated: ${user.username} (${user.userId})`);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user
 * @access  Private/Admin
 */
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ userId: req.params.userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

        console.log(`User deleted: ${user.username} (${user.userId})`);
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
