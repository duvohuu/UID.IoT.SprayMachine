import Machine from '../../models/Machine.model.js';
import mongoose from 'mongoose';

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
        let query = {};
        
        // If not admin, only show user's machines
        if (req.user.role !== 'admin') {
            query.userId = req.user.userId;
        }

        const machines = await Machine.find(query)
            .select('-__v')
            .sort({ createdAt: -1 });

        // console.log(`📋 Returning ${machines.length} machines`);
        // if (machines.length > 0) {
        //     console.log(`   Sample machine _id: ${machines[0]._id}`);
        //     console.log(`   Sample machine machineId: ${machines[0].machineId}`);
        // }

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
        let machine;

        // Try finding by MongoDB _id first
        if (mongoose.Types.ObjectId.isValid(id)) {
            machine = await Machine.findById(id);
        }
        
        // If not found, try machineId
        if (!machine) {
            machine = await Machine.findOne({ machineId: id });
        }

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: 'Machine not found'
            });
        }

        // Check ownership (unless admin)
        if (req.user.role !== 'admin' && machine.userId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            machine
        });
    } catch (error) {
        console.error('Get machine error:', error);
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
        const { machineId, name, type, location, ip, port, userId } = req.body;

        // Validation
        if (!machineId || !name || !type) {
            return res.status(400).json({
                success: false,
                message: 'Please provide machineId, name, and type'
            });
        }

        // Check if machine exists
        const existingMachine = await Machine.findOne({ machineId });
        if (existingMachine) {
            return res.status(400).json({
                success: false,
                message: 'Machine ID already exists'
            });
        }

        // Create machine
        const machine = await Machine.create({
            machineId,
            name,
            type,
            location: location || 'Unknown',
            ip: ip || null,
            port: port || null,
            userId: userId || req.user.userId,
            status: 'idle',
            isConnected: false
        });

        res.status(201).json({
            success: true,
            message: 'Machine created successfully',
            machine
        });

        console.log(`✅ Machine created: ${name} (${machineId})`);
    } catch (error) {
        console.error('Create machine error:', error);
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
        const { name, location, ip, port, status, isConnected } = req.body;
        const { id } = req.params;
        
        const updates = {};
        if (name) updates.name = name;
        if (location) updates.location = location;
        if (ip) updates.ip = ip;
        if (port) updates.port = port;
        if (status) updates.status = status;
        if (typeof isConnected === 'boolean') updates.isConnected = isConnected;

        let machine;

        // Try updating by MongoDB _id first
        if (mongoose.Types.ObjectId.isValid(id)) {
            machine = await Machine.findByIdAndUpdate(
                id,
                updates,
                { new: true, runValidators: true }
            );
        }
        
        // If not found, try machineId
        if (!machine) {
            machine = await Machine.findOneAndUpdate(
                { machineId: id },
                updates,
                { new: true, runValidators: true }
            );
        }

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: 'Machine not found'
            });
        }

        res.json({
            success: true,
            message: 'Machine updated successfully',
            machine
        });

        console.log(`✅ Machine updated: ${machine.name} (${machine.machineId})`);
    } catch (error) {
        console.error('Update machine error:', error);
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
        let machine;

        console.log(`🗑️ Attempting to delete machine with ID: ${id}`);
        console.log(`   ID type: ${typeof id}, length: ${id?.length}`);

        // STEP 1: Check if machine exists BEFORE trying to delete
        if (mongoose.Types.ObjectId.isValid(id)) {
            console.log('   ✅ Valid ObjectId format');
            
            // First, check if it exists
            const existingMachine = await Machine.findById(id);
            console.log(`   Machine exists in DB? ${existingMachine ? 'YES' : 'NO'}`);
            
            if (existingMachine) {
                console.log(`   Found machine: ${existingMachine.name} (${existingMachine.machineId})`);
                console.log(`   Machine userId: ${existingMachine.userId}`);
            }
            
            // Now delete it
            machine = await Machine.findByIdAndDelete(id);
        } else {
            console.log('   ❌ Invalid ObjectId format, trying as machineId string');
        }
        
        // If not found, try machineId
        if (!machine) {
            console.log('   Not found by _id, trying machineId...');
            const existingByMachineId = await Machine.findOne({ machineId: id });
            console.log(`   Machine exists with machineId? ${existingByMachineId ? 'YES' : 'NO'}`);
            
            machine = await Machine.findOneAndDelete({ machineId: id });
        }

        if (!machine) {
            console.log('   ❌ Machine not found in database');
            // List all machines to debug
            const allMachines = await Machine.find().limit(5);
            console.log(`   Total machines in DB: ${await Machine.countDocuments()}`);
            if (allMachines.length > 0) {
                console.log(`   Sample machine IDs:`, allMachines.map(m => ({ _id: m._id.toString(), machineId: m.machineId })));
            }
            
            return res.status(404).json({
                success: false,
                message: 'Machine not found'
            });
        }

        res.json({
            success: true,
            message: 'Machine deleted successfully',
            deletedMachine: {
                machineId: machine.machineId,
                name: machine.name
            }
        });

        console.log(`✅ Machine deleted: ${machine.name} (${machine.machineId})`);
    } catch (error) {
        console.error('Delete machine error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
