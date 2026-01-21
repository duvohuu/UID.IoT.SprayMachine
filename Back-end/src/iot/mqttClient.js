import mqtt from 'mqtt';
import { getIO } from '../config/socket.js';
import { 
    verifyMachine, 
    updateMachineConnectionStatus 
} from '../services/machineService.js';
import { processMQTTUpdate } from '../services/sprayMachineService.js';
import { createNotification, 
        createAndBroadcastNotification } 
from '../services/notificationService.js';
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
const MQTT_TIMEOUT_MS = 10000; 

// ==================== MESSAGE PROCESSING FUNCTIONS ====================

/**
 * Process incoming MQTT message
 * @param {Object} data - Parsed MQTT message data
 * @returns {Promise<Object|null>} Processed result or null if ignored
 */
const processMQTTMessage = async (data) => {
    const { machineId, status, powerConsumption } = data;

    try {
        // Step 1: Verify machine exists
        await verifyMachine(machineId);
        resetMachineTimeout(machineId);

        // Step 2: Process MQTT update
        const updatedData = await processMQTTUpdate(machineId, {
            status,
            powerConsumption
        });

        if (!updatedData) {
            console.log(`⏰ [MQTT] No shift exists for ${machineId} - message ignored`);
            
            // Vẫn update machine status là online
            const machineStatus = status === 1 ? 'online' : 'offline';
            await updateMachineConnectionStatus(machineId, true, machineStatus);
            
            return null;
        }

        // Step 3: Update Machine model status
        const machineStatus = status === 1 ? 'online' : 'offline';
        await updateMachineConnectionStatus(machineId, true, machineStatus);

        // Return processed result for socket emission
        return {
            updatedData,
            machineStatus,
            isConnected: true
        };

    } catch (error) {
        console.error(`❌ [MQTT] Error processing message for ${machineId}:`, error.message);
        throw error;
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
    if (machineTimeouts.has(machineId)) {
        clearTimeout(machineTimeouts.get(machineId));
    }

    const timeoutId = setTimeout(async () => {
        console.log(`⏱️ [MQTT] Timeout for ${machineId} - No message in 10s`);
        
        try {
            const updatedMachine = await updateMachineConnectionStatus(machineId, false, 'error');
            
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
            
            try {
                const machine = await Machine.findOne({ machineId });
                
                if (!machine) {
                    console.error(`❌ [MQTT] Machine not found: ${machineId}`);
                    return;
                }
                
                console.log(`📋 [MQTT] Creating notification for machine: ${machineId}`);
                console.log(`   Machine name: ${machine.name}`);
                console.log(`   Owner userId: ${machine.userId}`);
                
                await createAndBroadcastNotification({
                    userId: machine.userId,
                    machineId: machine.machineId,
                    machineName: machine.name,
                    type: 'mqtt_disconnected',
                    severity: 'error',
                    title: '⚠️ Mất kết nối MQTT',
                    message: `${machine.name} không nhận được dữ liệu trong 10 giây. Vui lòng kiểm tra kết nối.`,
                    source: 'MQTT Monitor'
                });
                
            } catch (notifError) {
                console.error(`❌ [Notification] Error creating notification:`, notifError);
            }
            
        } catch (error) {
            console.error(`❌ [MQTT] Error handling timeout for ${machineId}:`, error);
        }
    }, MQTT_TIMEOUT_MS);

    machineTimeouts.set(machineId, timeoutId);
};
/**
 * Disconnect MQTT client
 * Graceful shutdown
 */
export const disconnectMQTT = () => {
    // Clear all timeouts
    for (const [machineId, timeoutId] of machineTimeouts.entries()) {
        clearTimeout(timeoutId);
        console.log(`🧹 Cleared timeout for ${machineId}`);
    }
    machineTimeouts.clear();

    if (mqttClient) {
        mqttClient.end();
        console.log('🔌 MQTT Client disconnected');
    }
};

// ==================== EXPORTS ====================

export default {
    initializeMQTT,
    publishMQTT,
    disconnectMQTT,
    getMQTTStatus
};