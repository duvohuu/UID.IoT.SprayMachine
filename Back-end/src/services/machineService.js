import Machine from '../models/Machine.model.js';
import SprayMachineData from '../models/SprayMachineData.model.js';
import mongoose from 'mongoose';

/**
 * ========================================
 * MACHINE SERVICE
 * ========================================
 * Business logic for Machine operations
 */

// ==================== VALIDATION ====================

/**
 * Validate machine creation data
 */
export const validateMachineData = (machineData) => {
    const { machineId, name, type } = machineData;
    
    if (!machineId || !name || !type) {
        throw new Error('Please provide machineId, name, and type');
    }
    
    return true;
};

/**
 * Check if machine ID already exists
 */
export const checkMachineExists = async (machineId) => {
    const existingMachine = await Machine.findOne({ machineId });
    if (existingMachine) {
        throw new Error('Machine ID already exists');
    }
    return false;
};

// ==================== FIND OPERATIONS ====================

/**
 * Find machine by ID (supports both _id and machineId)
 */
export const findMachineById = async (id) => {
    let machine;

    // Try finding by MongoDB _id first
    if (mongoose.Types.ObjectId.isValid(id)) {
        machine = await Machine.findById(id);
    }
    
    // If not found, try machineId
    if (!machine) {
        machine = await Machine.findOne({ machineId: id });
    }

    return machine;
};

/**
 * Find machine by machineId only
 */
export const findMachineByMachineId = async (machineId) => {
    return await Machine.findOne({ machineId });
};

// ==================== ACCESS CONTROL ====================

/**
 * Check if user can access machine
 */
export const canAccessMachine = (machine, userId, userRole) => {
    if (userRole === 'admin') {
        return true;
    }
    
    if (machine.userId !== userId) {
        throw new Error('Access denied');
    }
    
    return true;
};

/**
 * Build query based on user role
 */
export const buildMachineQuery = (userId, userRole) => {
    let query = {};
    
    // If not admin, only show user's machines
    if (userRole !== 'admin') {
        query.userId = userId;
    }
    
    return query;
};

// ==================== CRUD OPERATIONS ====================

/**
 * Get all machines with filtering
 */
export const getMachines = async (userId, userRole, filters = {}) => {
    const query = buildMachineQuery(userId, userRole);
    
    // Apply additional filters
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.isConnected !== undefined) query.isConnected = filters.isConnected;
    
    const machines = await Machine.find(query)
        .select('-__v')
        .sort({ createdAt: -1 });
    
    return machines;
};

/**
 * Get machine by ID with access check
 */
export const getMachineById = async (id, userId, userRole) => {
    const machine = await findMachineById(id);
    
    if (!machine) {
        throw new Error('Machine not found');
    }
    
    // Check access
    canAccessMachine(machine, userId, userRole);
    
    return machine;
};

/**
 * Create new machine
 */
export const createMachine = async (machineData, requestUserId) => {
    const { machineId, name, type, location, ip, port, userId } = machineData;
    
    // Validate
    validateMachineData(machineData);
    
    // Check duplicate
    await checkMachineExists(machineId);
    
    // Create machine with defaults
    const machine = await Machine.create({
        machineId,
        name,
        type,
        location: location || 'Unknown',
        ip: ip || null,
        port: port || null,
        userId: userId || requestUserId,
        status: 'idle',
        isConnected: false
    });
    
    console.log(`Machine created: ${name} (${machineId})`);
    
    return machine;
};

/**
 * Update machine
 */
export const updateMachine = async (id, updateData) => {
    // Build updates object
    const updates = {};
    if (updateData.name) updates.name = updateData.name;
    if (updateData.location) updates.location = updateData.location;
    if (updateData.ip) updates.ip = updateData.ip;
    if (updateData.port) updates.port = updateData.port;
    if (updateData.status) updates.status = updateData.status;
    if (typeof updateData.isConnected === 'boolean') {
        updates.isConnected = updateData.isConnected;
    }
    
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
        throw new Error('Machine not found');
    }
        
    return machine;
};

/**
 * Delete machine with cleanup
 */
export const deleteMachine = async (id) => {    
    let machine;
    
    // Try deleting by MongoDB _id first
    if (mongoose.Types.ObjectId.isValid(id)) {
        const existingMachine = await Machine.findById(id);        
        if (existingMachine) {
            console.log(`   Found machine: ${existingMachine.name} (${existingMachine.machineId})`);
            // Cleanup related data
            await SprayMachineData.deleteMany({ machineId: existingMachine.machineId });
        }
        
        machine = await Machine.findByIdAndDelete(id);
    }
    
    // If not found, try machineId
    if (!machine) {
        console.log('   Not found by _id, trying machineId...');
        const existingByMachineId = await Machine.findOne({ machineId: id });
        console.log(`   Machine exists with machineId? ${existingByMachineId ? 'YES' : 'NO'}`);
        
        if (existingByMachineId) {
            // Cleanup related data
            await SprayMachineData.deleteMany({ machineId: existingByMachineId.machineId });
        }
        
        machine = await Machine.findOneAndDelete({ machineId: id });
    }
    
    if (!machine) {
        console.log('   Machine not found in database');
        const totalCount = await Machine.countDocuments();
        console.log(`   Total machines in DB: ${totalCount}`);
        throw new Error('Machine not found');
    }
    
    console.log(`Machine deleted: ${machine.name} (${machine.machineId})`);
    
    return machine;
};

// ==================== CONNECTION & STATUS ====================

/**
 * Verify machine exists and optionally check type
 */
export const verifyMachine = async (machineId, type = null) => {
    const machine = await Machine.findOne({ machineId });
    
    if (!machine) {
        throw new Error(`Machine ${machineId} not found`);
    }
    
    if (type && machine.type !== type) {
        throw new Error(`Machine ${machineId} is not a ${type} machine`);
    }
    
    return machine;
};

/**
 * Update machine connection status
 */
export const updateMachineConnectionStatus = async (machineId, isConnected, machineStatus = null) => {
    const updates = { 
        isConnected,
        lastConnected: isConnected ? new Date() : undefined
    };
    
    if (machineStatus) {
        updates.status = machineStatus;
    }
    
    const machine = await Machine.findOneAndUpdate(
        { machineId },
        updates,
        { new: true }
    );
    
    if (!machine) {
        throw new Error(`Machine ${machineId} not found`);
    }
    
    console.log(`Machine ${machineId} connection status: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
    
    return machine;
};

/**
 * Update machine status only
 */
export const updateMachineStatus = async (machineId, status) => {
    const machine = await Machine.findOneAndUpdate(
        { machineId },
        { status },
        { new: true }
    );
    
    if (!machine) {
        throw new Error(`Machine ${machineId} not found`);
    }
    
    return machine;
};