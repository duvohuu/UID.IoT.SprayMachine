import * as machineService from '../../services/machineService.js';

/**
 * ========================================
 * MACHINE CONTROLLER
 * ========================================
 */

/**
 * @route   GET /api/machines
 * @desc    Get all machines (user sees only their machines, admin sees all)
 * @access  Private
 */
export const getMachines = async (req, res) => {
    try {
        const machines = await machineService.getMachines(
            req.user.userId,
            req.user.role
        );

        res.json({
            success: true,
            count: machines.length,
            machines
        });
    } catch (error) {
        console.error('Get machines error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @route   GET /api/machines/:id
 * @desc    Get machine by ID (supports both _id and machineId)
 * @access  Private
 */
export const getMachineById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const machine = await machineService.getMachineById(
            id,
            req.user.userId,
            req.user.role
        );

        res.json({
            success: true,
            machine
        });
    } catch (error) {
        console.error('Get machine error:', error);
        
        if (error.message === 'Machine not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'Access denied') {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @route   POST /api/machines
 * @desc    Create new machine
 * @access  Private/Admin
 */
export const createMachine = async (req, res) => {
    try {
        const machineData = req.body;
        
        const machine = await machineService.createMachine(
            machineData,
            req.user.userId
        );

        res.status(201).json({
            success: true,
            message: 'Machine created successfully',
            machine
        });
    } catch (error) {
        console.error('Create machine error:', error);
        
        if (error.message === 'Please provide machineId, name, and type' ||
            error.message === 'Machine ID already exists') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @route   PUT /api/machines/:id
 * @desc    Update machine (supports both _id and machineId)
 * @access  Private/Admin
 */
export const updateMachine = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const machine = await machineService.updateMachine(id, updateData);

        res.json({
            success: true,
            message: 'Machine updated successfully',
            machine
        });
    } catch (error) {
        console.error('Update machine error:', error);
        
        if (error.message === 'Machine not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @route   DELETE /api/machines/:id
 * @desc    Delete machine (supports both _id and machineId)
 * @access  Private/Admin
 */
export const deleteMachine = async (req, res) => {
    try {
        const { id } = req.params;
        
        const machine = await machineService.deleteMachine(id);

        res.json({
            success: true,
            message: 'Machine deleted successfully',
            deletedMachine: {
                machineId: machine.machineId,
                name: machine.name
            }
        });
    } catch (error) {
        console.error('Delete machine error:', error);
        
        if (error.message === 'Machine not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};