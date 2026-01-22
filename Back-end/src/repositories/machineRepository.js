import Machine from '../models/Machine.model.js';
import SprayMachineData from '../models/SprayMachineData.model.js';
import mongoose from 'mongoose';

/**
 * ========================================
 * MACHINE REPOSITORY
 * ========================================
 * Data access layer for Machine operations
 */

/**
 * Check if machine ID already exists
 */
export const checkMachineExists = async (machineId) => {
    return await Machine.findOne({ machineId });
};

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

/**
 * Get all machines with query
 */
export const getMachines = async (query) => {
    return await Machine.find(query)
        .select('-__v')
        .sort({ createdAt: -1 });
};

/**
 * Create new machine
 */
export const createMachine = async (machineData) => {
    return await Machine.create(machineData);
};

/**
 * Update machine by ID or machineId
 */
export const updateMachine = async (id, updates) => {
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
    
    return machine;
};

/**
 * Delete machine by ID or machineId with cleanup
 */
export const deleteMachine = async (id) => {
    let machine;
    
    // Try deleting by MongoDB _id first
    if (mongoose.Types.ObjectId.isValid(id)) {
        const existingMachine = await Machine.findById(id);
        if (existingMachine) {
            // Cleanup related data
            await SprayMachineData.deleteMany({ machineId: existingMachine.machineId });
        }
        
        machine = await Machine.findByIdAndDelete(id);
    }
    
    // If not found, try machineId
    if (!machine) {
        const existingByMachineId = await Machine.findOne({ machineId: id });
        
        if (existingByMachineId) {
            // Cleanup related data
            await SprayMachineData.deleteMany({ machineId: existingByMachineId.machineId });
        }
        
        machine = await Machine.findOneAndDelete({ machineId: id });
    }
    
    return machine;
};

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
    
    if (machineStatus !== null && machineStatus !== undefined) {
        updates.status = machineStatus;
    }
    
    return await Machine.findOneAndUpdate(
        { machineId },
        updates,
        { new: true }
    );
};

/**
 * Update machine status only
 */
export const updateMachineStatus = async (machineId, status) => {
    return await Machine.findOneAndUpdate(
        { machineId },
        { status },
        { new: true }
    );
};