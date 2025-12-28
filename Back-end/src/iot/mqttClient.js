import mqtt from 'mqtt';
import * as SprayMachineService from '../services/sprayMachineService.js';
import { getIO } from '../config/socket.js';
import {
    verifyMachine,
    processMQTTUpdate,
} from '../services/sprayMachineService.js';

/**
 * ========================================
 * MQTT CLIENT FOR SPRAY MACHINE
 * ========================================
 * Kết nối đến MQTT broker và nhận dữ liệu từ máy Spray
 */

const MQTT_CONFIG = {
    broker: 'mqtt://broker.hivemq.com',
    port: 1883,
    topic: 'NgocHiepIOT/data',
    clientId: `spray_backend_${Math.random().toString(16).substr(2, 8)}`
};

let mqttClient = null;

/**
 * Khởi tạo kết nối MQTT
 */
export const initializeMQTT = () => {
    console.log('🔌 Initializing MQTT Client...');
    console.log(`📡 Broker: ${MQTT_CONFIG.broker}:${MQTT_CONFIG.port}`);
    console.log(`📨 Topic: ${MQTT_CONFIG.topic}`);

    mqttClient = mqtt.connect(MQTT_CONFIG.broker, {
        port: MQTT_CONFIG.port,
        clientId: MQTT_CONFIG.clientId,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000
    });

    // ==================== CONNECTION EVENTS ====================

    mqttClient.on('connect', () => {
        console.log('✅ MQTT Connected successfully');
        
        // Subscribe to topic
        mqttClient.subscribe(MQTT_CONFIG.topic, (err) => {
            if (err) {
                console.error('❌ MQTT Subscribe Error:', err);
            } else {
                console.log(`📬 Subscribed to topic: ${MQTT_CONFIG.topic}`);
            }
        });
    });

    mqttClient.on('error', (error) => {
        console.error('❌ MQTT Connection Error:', error);
    });

    mqttClient.on('offline', () => {
        console.log('⚠️ MQTT Client is offline');
    });

    mqttClient.on('reconnect', () => {
        console.log('🔄 MQTT Reconnecting...');
    });

    mqttClient.on('close', () => {
        console.log('🔌 MQTT Connection closed');
    });

    // ==================== MESSAGE HANDLER ====================

    mqttClient.on('message', async (topic, message) => {
        try {
            const data = JSON.parse(message.toString());
            const { machineId, status, powerConsumption } = data;

            console.log(`\n📨 [MQTT] Received from ${topic}:`, data);
            console.log(`🎯 Processing data for machine: ${machineId}`);
            console.log(`   Status: ${status} ${status === 1 ? '▶️  Running' : '⏸️  Stopped'}`);
            console.log(`   Power: ${powerConsumption.toFixed(3)} kWh`);

            // Verify machine exists
            await verifyMachine(machineId);

            // Process MQTT update
            const updatedData = await processMQTTUpdate(machineId, {
                status,
                powerConsumption
            });

            if (!updatedData) {
                console.log(`✅ [MQTT] Message ignored (outside work shift) for ${machineId}`);
                return;
            }

            console.log(`✅ [MQTT] Data processed successfully for ${machineId}`);

            // Emit real-time update via Socket.IO
            try {
                const io = getIO();
                
                const responseData = {
                    machineId: updatedData.machineId,
                    date: updatedData.date,
                    status: updatedData.lastStatus,
                    activeTime: updatedData.activeTime.toFixed(2),
                    stopTime: updatedData.stopTime.toFixed(2),
                    totalEnergyConsumed: updatedData.totalEnergyConsumed.toFixed(3),
                    currentPowerConsumption: updatedData.currentPowerConsumption.toFixed(3),
                    lastUpdate: updatedData.lastUpdate
                };

                // Emit to specific machine room
                io.to(`machine-${machineId}`).emit('spray:data-update', responseData);
                
                // Emit to all spray machines room
                io.to('spray-machines').emit('spray:data-update', responseData);
                
                console.log(`📤 [Socket] Emitted update for ${machineId}`);

            } catch (socketError) {
                console.error(`⚠️  [Socket] Error emitting update: ${socketError.message}`);
            }

        } catch (error) {
            console.error(`❌ [MQTT] Message processing error: ${error.message}`);
            console.error(error);
            console.log('   Raw message:', JSON.parse(message.toString()));
        }
    });

        return mqttClient;
    };

/**
 * Publish message to MQTT (nếu cần control máy từ backend)
 */
export const publishMQTT = (topic, message) => {
    if (!mqttClient || !mqttClient.connected) {
        console.error('❌ MQTT Client not connected');
        return false;
    }

    try {
        mqttClient.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
            if (err) {
                console.error('❌ MQTT Publish Error:', err);
            } else {
                console.log(`📤 [MQTT] Published to ${topic}:`, message);
            }
        });
        return true;
    } catch (error) {
        console.error('❌ MQTT Publish Exception:', error);
        return false;
    }
};

/**
 * Disconnect MQTT client
 */
export const disconnectMQTT = () => {
    if (mqttClient) {
        mqttClient.end();
        console.log('🔌 MQTT Client disconnected');
    }
};

/**
 * Get MQTT client status
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

export default {
    initializeMQTT,
    publishMQTT,
    disconnectMQTT,
    getMQTTStatus
};