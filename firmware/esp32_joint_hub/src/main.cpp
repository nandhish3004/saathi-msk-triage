#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_INA219.h>
#include "config.h"
#include "telemetry_packet.h"
#include "imu_filter.h"
#include "i2c_recovery.h"
#include "ble_handler.h"

// ==============================================================================
// SAATHI MSK JOINT TRIAGE HUB - MAIN FIRMWARE
// Problem Statement ID: 26004 | Reconfigurable Dual-Pod Universal Kinematics
// ==============================================================================

// Intermediate data structure passed over FreeRTOS queue
struct SensorRawSnapshot {
    float thetaProx;
    float thetaDist;
    float thetaRel;
    uint32_t timestampMs;
    bool  error;
};

// Global Handlers
static IMUFilter imuProximal(MPU_PROXIMAL_ADDR);
static IMUFilter imuDistal(MPU_DISTAL_ADDR);
static Adafruit_INA219 ina219(INA219_ADDR);
static BleTelemetryHandler bleHandler;

// FreeRTOS Synchronization
static QueueHandle_t xSensorQueue = nullptr;
static SemaphoreHandle_t xI2CMutex = nullptr;

// Status Flags
static volatile bool ina219Available = false;
static float zeroOffsetRel = 0.0f;

// ==============================================================================
// TASK 1: SENSOR TASK (Core 0, 100 Hz / 10 ms strict cadence)
// Deterministic sampling of dual MPU-6050 pods + Complementary Angle Filter
// ==============================================================================
void SensorTask(void* pvParameters) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(SAMPLING_PERIOD_MS); // 10 ms
    const float dt = 0.010f; // 100 Hz

    int consecutiveI2CErrors = 0;

    for (;;) {
        vTaskDelayUntil(&xLastWakeTime, xFrequency);

        // Check if Tare Calibration was triggered via BLE
        if (bleHandler.checkTareRequested()) {
            imuProximal.calibrateZero();
            imuDistal.calibrateZero();
            zeroOffsetRel = (imuProximal.getRawAngle() - imuDistal.getRawAngle());
            log_i("System Tare Applied: Zero Relative Reference = %.2f deg", zeroOffsetRel);
        }

        bool successA = false;
        bool successB = false;

        if (xSemaphoreTake(xI2CMutex, pdMS_TO_TICKS(5)) == pdTRUE) {
            successA = imuProximal.sample(dt);
            successB = imuDistal.sample(dt);
            xSemaphoreGive(xI2CMutex);
        }

        SensorRawSnapshot snapshot;
        snapshot.timestampMs = millis();

        if (successA && successB) {
            consecutiveI2CErrors = 0;
            snapshot.thetaProx = imuProximal.getAngle();
            snapshot.thetaDist = imuDistal.getAngle();
            // Relative Dynamic Angular Excursion: θ_rel = θ_proximal - θ_distal - tare_offset
            snapshot.thetaRel  = (imuProximal.getRawAngle() - imuDistal.getRawAngle()) - zeroOffsetRel;
            snapshot.error     = false;
        } else {
            consecutiveI2CErrors++;
            snapshot.thetaProx = 0.0f;
            snapshot.thetaDist = 0.0f;
            snapshot.thetaRel  = 0.0f;
            snapshot.error     = true;

            // Failsafe: Trigger 9-clock bus hang recovery if errors persist (> 3 cycles)
            if (consecutiveI2CErrors >= 3) {
                log_w("I2C error threshold reached (%d). Initiating bus recovery...", consecutiveI2CErrors);
                if (xSemaphoreTake(xI2CMutex, pdMS_TO_TICKS(15)) == pdTRUE) {
                    I2CBusRecovery::recover(I2C_SDA_PIN, I2C_SCL_PIN, I2C_BUS_FREQ_HZ);
                    imuProximal.init();
                    imuDistal.init();
                    xSemaphoreGive(xI2CMutex);
                    consecutiveI2CErrors = 0;
                }
            }
        }

        // Send sample snapshot to Core 1 Telemetry Task (drop oldest if full)
        if (xSensorQueue != nullptr) {
            xQueueSend(xSensorQueue, &snapshot, 0);
        }
    }
}

// ==============================================================================
// TASK 2: TELEMETRY TASK (Core 1)
// Numerical differentiation (ω, jerk), INA219 battery query & BLE notification
// ==============================================================================
void TelemetryTask(void* pvParameters) {
    SensorRawSnapshot currentSnap;
    float prevAngle = 0.0f;
    float prevOmega = 0.0f;
    uint32_t lastBatteryCheckMs = 0;
    uint16_t cachedBatteryMv = 3700; // Nominal 3.7V Li-ion default

    for (;;) {
        // Wait for next 100 Hz kinematic snapshot from Core 0
        if (xQueueReceive(xSensorQueue, &currentSnap, portMAX_DELAY) == pdTRUE) {
            const float dt = 0.010f; // 100 Hz = 10 ms interval

            // 1st Derivative: Angular Velocity ω = (θ_rel[n] - θ_rel[n-1]) / dt
            float omega = (currentSnap.thetaRel - prevAngle) / dt;

            // 2nd Derivative: Angular Jerk J = (ω[n] - ω[n-1]) / dt
            float jerk = (omega - prevOmega) / dt;

            prevAngle = currentSnap.thetaRel;
            prevOmega = omega;

            // Sample INA219 Battery Voltage periodically every 1000 ms (1 Hz) to prevent I2C bus congestion
            uint32_t now = millis();
            if (now - lastBatteryCheckMs >= 1000) {
                lastBatteryCheckMs = now;
                if (ina219Available && xSemaphoreTake(xI2CMutex, pdMS_TO_TICKS(5)) == pdTRUE) {
                    float busVoltageV = ina219.getBusVoltage_V();
                    cachedBatteryMv = (uint16_t)(busVoltageV * 1000.0f);
                    xSemaphoreGive(xI2CMutex);
                }
            }

            // Pack the 16-byte binary packet
            KinematicPacket packet;
            packet.header[0]    = PACKET_HEADER_0;
            packet.header[1]    = PACKET_HEADER_1;
            packet.theta_prox   = (int16_t)constrain(roundf(currentSnap.thetaProx * 100.0f), -32768, 32767);
            packet.theta_dist   = (int16_t)constrain(roundf(currentSnap.thetaDist * 100.0f), -32768, 32767);
            packet.theta_rel    = (int16_t)constrain(roundf(currentSnap.thetaRel  * 100.0f), -32768, 32767);
            packet.omega        = (int16_t)constrain(roundf(omega                * 100.0f), -32768, 32767);
            packet.jerk         = (int16_t)constrain(roundf(jerk                 * 10.0f),  -32768, 32767);
            packet.batt_mv      = cachedBatteryMv;

            uint8_t flags = 0;
            if (zeroOffsetRel != 0.0f) flags |= 0x01; // Calibrated
            if (currentSnap.error)     flags |= 0x08; // Sensor Error
            if (cachedBatteryMv < 3400) flags |= 0x04; // Low Battery Alert
            packet.status_flags = flags;

            // Compute Checksum
            packet.checksum     = calculate_packet_checksum(&packet);

            // Stream over BLE GATT Notification
            bleHandler.notifyPacket(packet);
        }
    }
}

// ==============================================================================
// SYSTEM SETUP
// ==============================================================================
void setup() {
    Serial.begin(115200);
    delay(500);
    log_i("==================================================");
    log_i("SAATHI MSK JOINT KINEMATICS & TRIAGE SYSTEM (ESP32)");
    log_i("SIH 2026 | Problem Statement 26004");
    log_i("==================================================");

    pinMode(LED_BLE_CONNECTED, OUTPUT);
    digitalWrite(LED_BLE_CONNECTED, LOW);

    // Create RTOS primitives
    xI2CMutex = xSemaphoreCreateMutex();
    xSensorQueue = xQueueCreate(SENSOR_QUEUE_LEN, sizeof(SensorRawSnapshot));

    // Initialize I2C Bus at 400 kHz Fast Mode
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN, I2C_BUS_FREQ_HZ);
    Wire.setTimeOut(25); // 25 ms timeout prevents infinite blocking

    // Initialize MPU-6050 Proximal Pod (0x68)
    if (!imuProximal.init()) {
        log_e("Failed to initialize Proximal MPU-6050 at 0x68!");
    } else {
        log_i("Proximal MPU-6050 (Pod A, 0x68) online.");
    }

    // Initialize MPU-6050 Distal Pod (0x69)
    if (!imuDistal.init()) {
        log_e("Failed to initialize Distal MPU-6050 at 0x69!");
    } else {
        log_i("Distal MPU-6050 (Pod B, 0x69) online.");
    }

    // Initialize INA219 Battery & Current Monitor
    if (ina219.begin()) {
        ina219Available = true;
        log_i("INA219 Power Monitor initialized at 0x40.");
    } else {
        ina219Available = false;
        log_w("INA219 not detected at 0x40. Fallback to default voltage estimate.");
    }

    // Initialize BLE Telemetry Server
    bleHandler.init();

    // Spawn Core 0 Real-Time Sensor Task (Priority 2)
    xTaskCreatePinnedToCore(
        SensorTask,
        "SensorTask",
        4096,
        nullptr,
        2,
        nullptr,
        CORE_SENSOR_TASK
    );

    // Spawn Core 1 Telemetry Processing Task (Priority 1)
    xTaskCreatePinnedToCore(
        TelemetryTask,
        "TelemetryTask",
        4096,
        nullptr,
        1,
        nullptr,
        CORE_TELEMETRY_TASK
    );

    log_i("FreeRTOS dual-core tasks scheduled successfully.");
}

void loop() {
    // Arduino loop remains idle; all processing is handled by FreeRTOS tasks
    vTaskDelay(pdMS_TO_TICKS(1000));
}
