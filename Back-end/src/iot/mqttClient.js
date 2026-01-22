import mqtt from 'mqtt';
import { getIO } from '../config/socket.js';
import { 
    verifyMachine, 
    updateMachineConnectionStatus 
} from '../services/machineService.js';
import { 
    processMQTTUpdate,
    processErrorTimeout
} from '../services/sprayMachineService.js';
import { createAndBroadcastNotification } from '../services/notificationService.js';
import { getTodayData } from '../repositories/sprayMachineRepository.js';
import Machine from '../models/Machine.model.js';

/**
 * ========================================
 * MQTT CLIENT FOR SPRAY MACHINE
 * ========================================
 * Kết nối đến MQTT broker và nhận dữ liệu từ máy Spray
 */

// ==================== MQTT CONFIGURATION ====================

const MQTT_CONFIG = {
    broker: 'mqtt://broker.hivemq.com',
    port: 1883,
    topic: 'NgocHiepIOT/data',
    clientId: `spray_backend_${Math.random().toString(16).substr(2, 8)}`
};

let mqttClient = null;
const machineTimeouts = new Map();
const machineErrorIntervals = new Map(); 
const MQTT_TIMEOUT_MS = 10000; 
const ERROR_UPDATE_INTERVAL_MS = 10000;

// ==================== MESSAGE PROCESSING FUNCTIONS ====================

/**
 * Process incoming MQTT message
 * @param {Object} data - Parsed MQTT message data
 * @returns {Promise<Object|null>} Processed result or null if ignored
 */
const processMQTTMessage = async (data) => {
    const { machineId, status, powerConsumption } = data;

    try {
        await verifyMachine(machineId);

        const updatedData = await processMQTTUpdate(machineId, {
            status,
            powerConsumption
        });

        if (!updatedData) {
            console.log(`⏰ [MQTT] No shift exists for ${machineId} - message ignored`);
            const machineStatus = status === 1 ? 'online' : 'offline';
            await updateMachineConnectionStatus(machineId, true, machineStatus);
            resetMachineTimeout(machineId);
            return null;
        }

        const machineStatus = status === 1 ? 'online' : 'offline';
        const updatedMachine = await updateMachineConnectionStatus(
            machineId, 
            true,
            machineStatus
        );

        const io = getIO();
        const updateEvent = {
            machineId,
            status: updatedMachine.status,
            isConnected: true,
            lastUpdate: updatedData.lastUpdate,
            data: {
                activeTime: updatedData.activeTime,
                stopTime: updatedData.stopTime,
                errorTime: updatedData.errorTime,
                totalEnergyConsumed: updatedData.totalEnergyConsumed,
                efficiency: updatedData.efficiency
            }
        };

        io.to(`machine-${machineId}`).emit('spray:realtime-update', updateEvent);
        io.emit('machine:status-update', updateEvent);

        resetMachineTimeout(machineId);
        
        return {
            updatedData,        
            machineStatus,         
            isConnected: true     
        };

    } catch (error) {
        console.error(`❌ [MQTT] Error processing message for ${machineId}:`, error);
        return null;
    }
};

/**
 * Emit socket events for realtime updates
 * Tách riêng logic emit socket để dễ test và maintain
 * @param {Object} result - Processed result from processMQTTMessage
 */
const emitSocketEvents = (result) => {
    if (!result) return;

    const { updatedData, machineStatus, isConnected } = result;

    try {
        const io = getIO();

        // Prepare spray realtime data
        const realtimeData = {
            machineId: updatedData.machineId,
            date: updatedData.date,
            status: updatedData.lastStatus,
            activeTime: parseFloat(updatedData.activeTime.toFixed(2)),
            stopTime: parseFloat(updatedData.stopTime.toFixed(2)),
            errorTime: parseFloat(updatedData.errorTime.toFixed(2)),
            totalEnergyConsumed: parseFloat(updatedData.totalEnergyConsumed.toFixed(3)),
            powerConsumption: parseFloat(updatedData.currentPowerConsumption.toFixed(3)),
            efficiency: updatedData.efficiency, 
            lastUpdate: updatedData.lastUpdate
        };

        // Emit spray realtime data
        io.emit('spray:realtime', realtimeData);
        io.to(`machine-${updatedData.machineId}`).emit('spray:realtime', realtimeData);

        // Prepare machine status update
        const statusUpdate = {
            machineId: updatedData.machineId,
            status: machineStatus,
            isConnected: isConnected,
            lastStatus: updatedData.lastStatus,
            lastUpdate: updatedData.lastUpdate,
            lastHeartbeat: new Date()
        };

        // Emit machine status update
        io.emit('machine:status-update', statusUpdate);

        console.log(`[Socket] Emitted updates for ${updatedData.machineId}`);

    } catch (socketError) {
        console.error(`[Socket] Error emitting update:`, socketError.message);
    }
};

// ==================== MQTT CLIENT INITIALIZATION ====================

/**
 * Initialize MQTT Client
 * Khởi tạo kết nối MQTT và đăng ký event handlers
 */
export const initializeMQTT = () => {
    console.log(`Broker: ${MQTT_CONFIG.broker}:${MQTT_CONFIG.port}`);
    console.log(`Topic: ${MQTT_CONFIG.topic}`);

    mqttClient = mqtt.connect(MQTT_CONFIG.broker, {
        port: MQTT_CONFIG.port,
        clientId: MQTT_CONFIG.clientId,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000
    });

    // ==================== CONNECTION EVENTS ====================

    mqttClient.on('connect', () => {
        console.log('MQTT Connected successfully');
        
        mqttClient.subscribe(MQTT_CONFIG.topic, (err) => {
            if (err) {
                console.error('MQTT Subscribe Error:', err);
            } else {
                console.log(`Subscribed to topic: ${MQTT_CONFIG.topic}`);
                setTimeout(() => {
                    restoreErrorTracking();
                }, 2000);
            }
        });
    });

    mqttClient.on('error', (error) => {
        console.error('MQTT Connection Error:', error);
    });

    mqttClient.on('offline', () => {
        console.log('MQTT Client is offline');
    });

    mqttClient.on('reconnect', () => {
        console.log('MQTT Reconnecting...');
    });

    mqttClient.on('close', () => {
        console.log('MQTT Connection closed');
    });

    // ==================== MESSAGE HANDLER ====================

    mqttClient.on('message', async (topic, message) => {
        try {
            // Parse JSON message
            const data = JSON.parse(message.toString());

            // Process message (business logic)
            const result = await processMQTTMessage(data);

            // Emit socket events (realtime updates)
            if (result) {
                emitSocketEvents(result);
            }

        } catch (error) {
            console.error(`❌ [MQTT] Message handler error:`, error.message);
            console.error('   Raw message:', message.toString());
        }
    });

    return mqttClient;
};

// ==================== MQTT OPERATIONS ====================

/**
 * Publish message to MQTT topic
 * Dùng để control máy từ backend (nếu cần)
 * @param {string} topic - MQTT topic
 * @param {Object} message - Message object to publish
 * @returns {boolean} Success status
 */
export const publishMQTT = (topic, message) => {
    if (!mqttClient || !mqttClient.connected) {
        console.error('MQTT Client not connected');
        return false;
    }

    try {
        mqttClient.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
            if (err) {
                console.error('MQTT Publish Error:', err);
            } else {
                console.log(`[MQTT] Published to ${topic}:`, message);
            }
        });
        return true;
    } catch (error) {
        console.error('MQTT Publish Exception:', error);
        return false;
    }
};

/**
 * Get MQTT client status
 * @returns {Object} MQTT status information
 */
export const getMQTTStatus = () => {
    return {
        connected: mqttClient?.connected || false,
        broker: MQTT_CONFIG.broker,
        port: MQTT_CONFIG.port,
        topic: MQTT_CONFIG.topic,
        clientId: MQTT_CONFIG.clientId
    };
};

// ==================== TIMEOUT HANDLING ====================
const resetMachineTimeout = (machineId) => {
    // Clear existing timeout
    if (machineTimeouts.has(machineId)) {
        clearTimeout(machineTimeouts.get(machineId));
    }

    if (machineErrorIntervals.has(machineId)) {
        clearInterval(machineErrorIntervals.get(machineId));
        machineErrorIntervals.delete(machineId);
        console.log(`⏹️ [MQTT] Stopped error interval for ${machineId}`);
    }

    const timeoutId = setTimeout(async () => {
        console.log(`⏱️ [MQTT] Timeout for ${machineId} - No message in 10s`);
        
        try {
            // Update Machine status to 'error'
            const updatedMachine = await updateMachineConnectionStatus(
                machineId, 
                false, 
                'error'
            );
            
            const updatedData = await processErrorTimeout(machineId);
            
            // Emit socket events
            const io = getIO();
            
            const disconnectEvent = {
                machineId,
                status: updatedMachine.status,
                isConnected: false,
                lastHeartbeat: updatedMachine.lastHeartbeat,
                lastUpdate: new Date(),
                message: 'MQTT timeout - No data received in 10s'
            };
            
            io.emit('machine:status-update', disconnectEvent);
            io.to(`machine-${machineId}`).emit('machine:status-update', disconnectEvent);
            
            if (updatedData) {
                const errorDataEvent = {
                    machineId: updatedData.machineId,
                    date: updatedData.date,
                    status: updatedData.lastStatus,
                    activeTime: parseFloat(updatedData.activeTime.toFixed(2)),
                    stopTime: parseFloat(updatedData.stopTime.toFixed(2)),
                    errorTime: parseFloat(updatedData.errorTime.toFixed(2)),
                    totalEnergyConsumed: parseFloat(updatedData.totalEnergyConsumed.toFixed(3)),
                    efficiency: updatedData.efficiency,
                    lastUpdate: updatedData.lastUpdate
                };
                
                io.emit('spray:realtime', errorDataEvent);
                io.to(`machine-${machineId}`).emit('spray:realtime', errorDataEvent);
            }
            
            const intervalId = setInterval(async () => {
                try {
                    console.log(`🔄 [MQTT] Updating errorTime for ${machineId}`);
                    
                    const updatedErrorData = await processErrorTimeout(machineId);
                    
                    if (updatedErrorData) {
                        const errorUpdateEvent = {
                            machineId: updatedErrorData.machineId,
                            date: updatedErrorData.date,
                            status: updatedErrorData.lastStatus,
                            activeTime: parseFloat(updatedErrorData.activeTime.toFixed(2)),
                            stopTime: parseFloat(updatedErrorData.stopTime.toFixed(2)),
                            errorTime: parseFloat(updatedErrorData.errorTime.toFixed(2)),
                            totalEnergyConsumed: parseFloat(updatedErrorData.totalEnergyConsumed.toFixed(3)),
                            efficiency: updatedErrorData.efficiency,
                            lastUpdate: updatedErrorData.lastUpdate
                        };
                        
                        io.emit('spray:realtime', errorUpdateEvent);
                        io.to(`machine-${machineId}`).emit('spray:realtime', errorUpdateEvent);
                    }
                } catch (error) {
                    console.error(`❌ [MQTT] Error updating errorTime for ${machineId}:`, error);
                }
            }, ERROR_UPDATE_INTERVAL_MS);
            
            machineErrorIntervals.set(machineId, intervalId);
            console.log(`▶️ [MQTT] Started error interval for ${machineId}`);
            
            // Create notification
            try {
                const machine = await Machine.findOne({ machineId });
                
                if (machine) {
                    await createAndBroadcastNotification({
                        userId: machine.userId,
                        machineId: machine.machineId,
                        machineName: machine.name,
                        type: 'mqtt_disconnected',
                        severity: 'error',
                        title: 'Mất kết nối MQTT',
                        message: `Máy ${machine.name} không phản hồi trong 10 giây. Kiểm tra kết nối mạng.`,
                        metadata: {
                            lastHeartbeat: updatedMachine.lastHeartbeat,
                            timeoutDuration: '10s'
                        }
                    });
                }
            } catch (notifError) {
                console.error(`❌ [MQTT] Notification Error:`, notifError);
            }
            
        } catch (error) {
            console.error(`❌ [MQTT] Timeout handler error for ${machineId}:`, error);
        }
    }, MQTT_TIMEOUT_MS);

    machineTimeouts.set(machineId, timeoutId);
};

export const disconnectMQTT = () => {
    // Clear all timeouts
    for (const [machineId, timeoutId] of machineTimeouts.entries()) {
        clearTimeout(timeoutId);
    }
    machineTimeouts.clear();

    for (const [machineId, intervalId] of machineErrorIntervals.entries()) {
        clearInterval(intervalId);
    }
    machineErrorIntervals.clear();

    if (mqttClient) {
        console.log('🔌 Disconnecting MQTT...');
        mqttClient.end();
        mqttClient = null;
    }
};

/**
 * Start error tracking for a machine
 * Called when:
 * 1. Daily reset creates new shift (machine starts in error state)
 * 2. Machine goes offline after timeout
 * 
 * @param {string} machineId - Machine identifier
 */
export const startErrorTracking = (machineId) => {
    console.log(`🔴 [MQTT] Starting error tracking for ${machineId}`);
    
    // Clear existing timeout/interval
    if (machineTimeouts.has(machineId)) {
        clearTimeout(machineTimeouts.get(machineId));
        machineTimeouts.delete(machineId);
    }
    
    if (machineErrorIntervals.has(machineId)) {
        clearInterval(machineErrorIntervals.get(machineId));
        machineErrorIntervals.delete(machineId);
    }
    
    // Immediately process first error timeout
    (async () => {
        try {
            const updatedData = await processErrorTimeout(machineId);
            
            if (updatedData) {
                const io = getIO();
                
                // Emit initial error state
                const errorDataEvent = {
                    machineId: updatedData.machineId,
                    date: updatedData.date,
                    status: updatedData.lastStatus,
                    activeTime: parseFloat(updatedData.activeTime.toFixed(2)),
                    stopTime: parseFloat(updatedData.stopTime.toFixed(2)),
                    errorTime: parseFloat(updatedData.errorTime.toFixed(2)),
                    totalEnergyConsumed: parseFloat(updatedData.totalEnergyConsumed.toFixed(3)),
                    efficiency: updatedData.efficiency,
                    lastUpdate: updatedData.lastUpdate
                };
                
                io.emit('spray:realtime', errorDataEvent);
                io.to(`machine-${machineId}`).emit('spray:realtime', errorDataEvent);
            }
            
            // Start interval to update errorTime every 10 seconds
            const intervalId = setInterval(async () => {
                try {
                    const io = getIO();
                    console.log(`🔄 [MQTT] Updating errorTime for ${machineId}`);
                    
                    const updatedErrorData = await processErrorTimeout(machineId);
                    
                    if (updatedErrorData) {
                        const errorUpdateEvent = {
                            machineId: updatedErrorData.machineId,
                            date: updatedErrorData.date,
                            status: updatedErrorData.lastStatus,
                            activeTime: parseFloat(updatedErrorData.activeTime.toFixed(2)),
                            stopTime: parseFloat(updatedErrorData.stopTime.toFixed(2)),
                            errorTime: parseFloat(updatedErrorData.errorTime.toFixed(2)),
                            totalEnergyConsumed: parseFloat(updatedErrorData.totalEnergyConsumed.toFixed(3)),
                            efficiency: updatedErrorData.efficiency,
                            lastUpdate: updatedErrorData.lastUpdate
                        };
                        
                        io.emit('spray:realtime', errorUpdateEvent);
                        io.to(`machine-${machineId}`).emit('spray:realtime', errorUpdateEvent);
                    }
                } catch (error) {
                    console.error(`❌ [MQTT] Error updating errorTime for ${machineId}:`, error);
                }
            }, ERROR_UPDATE_INTERVAL_MS);
            
            machineErrorIntervals.set(machineId, intervalId);
            console.log(`▶️ [MQTT] Error interval started for ${machineId}`);
            
        } catch (error) {
            console.error(`❌ [MQTT] Error starting error tracking for ${machineId}:`, error);
        }
    })();
};

export const restoreErrorTracking = async () => {
    try {
        console.log('🔄 [MQTT] Restoring error tracking for machines...');
        
        // Find all machines in error state
        const errorMachines = await Machine.find({ 
            status: 'error',
            type: 'Spray Machine'
        });
        
        console.log(`📊 [MQTT] Found ${errorMachines.length} machines in error state`);
        
        for (const machine of errorMachines) {
            const todayData = await getTodayData(machine.machineId);
            
            // Only restore if there's data for today and lastStatus is -1 (error)
            if (todayData && todayData.lastStatus === -1) {
                console.log(`🔴 [MQTT] Restoring error tracking for ${machine.machineId}`);
                startErrorTracking(machine.machineId);
            }
        }
        
        console.log('✅ [MQTT] Error tracking restoration completed');
        
    } catch (error) {
        console.error('❌ [MQTT] Error restoring error tracking:', error);
    }
};
// ==================== EXPORTS ====================

export default {
    initializeMQTT,
    publishMQTT,
    disconnectMQTT,
    getMQTTStatus,
    startErrorTracking,
    restoreErrorTracking 
};