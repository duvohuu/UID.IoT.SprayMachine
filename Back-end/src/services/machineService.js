import * as machineRepository from '../repositories/machineRepository.js';
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
    const existingMachine = await machineRepository.checkMachineExists(machineId);
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
    return await machineRepository.findMachineById(id);
};

/**
 * Find machine by machineId only
 */
export const findMachineByMachineId = async (machineId) => {
    return await machineRepository.findMachineByMachineId(machineId);
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
    
    return await machineRepository.getMachines(query);
};

/**
 * Get machine by ID with access check
 */
export const getMachineById = async (id, userId, userRole) => {
    const machine = await machineRepository.findMachineById(id);
    
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
    const machine = await machineRepository.createMachine({
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
    
    const machine = await machineRepository.updateMachine(id, updates);
    
    if (!machine) {
        throw new Error('Machine not found');
    }
        
    return machine;
};

/**
 * Delete machine with cleanup
 */
export const deleteMachine = async (id) => {
    const machine = await machineRepository.deleteMachine(id);
    
    if (!machine) {
        console.log('   Machine not found in database');
        const totalCount = await Machine.countDocuments(); // Note: This could be moved to repo if needed, but kept here for simplicity
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
    return await machineRepository.verifyMachine(machineId, type);
};

/**
 * Update machine connection status
 */
export const updateMachineConnectionStatus = async (machineId, isConnected, machineStatus = null) => {
    const machine = await machineRepository.updateMachineConnectionStatus(machineId, isConnected, machineStatus);
    
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
    const machine = await machineRepository.updateMachineStatus(machineId, status);
    
    if (!machine) {
        throw new Error(`Machine ${machineId} not found`);
    }
    
    return machine;
};