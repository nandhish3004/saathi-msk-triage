#pragma once

#include <Arduino.h>

// ==============================================================================
// SAATHI MSK JOINT TRIAGE HUB - HARDWARE & SYSTEM CONFIGURATION
// Problem Statement ID: 26004 | Target: ESP32 DevKit V1
// ==============================================================================

// --- I2C Configuration ---
#define I2C_SDA_PIN               21
#define I2C_SCL_PIN               22
#define I2C_BUS_FREQ_HZ           400000 // 400 kHz Fast-Mode

// --- I2C Device Addresses ---
#define MPU_PROXIMAL_ADDR         0x68   // Pod A (Proximal Segment, AD0 connected to GND)
#define MPU_DISTAL_ADDR           0x69   // Pod B (Distal Segment, AD0 pulled HIGH to 3.3V)
#define INA219_ADDR               0x40   // Current/Voltage monitor on belt hub

// --- Sampling Cadence & Real-Time Constraints ---
#define SAMPLING_FREQ_HZ          100
#define SAMPLING_PERIOD_MS        (1000 / SAMPLING_FREQ_HZ) // 10 ms strict period
#define SENSOR_QUEUE_LEN          10

// --- FreeRTOS Core Allocation ---
#define CORE_SENSOR_TASK          0      // Core 0 handles deterministic 100 Hz I2C sampling
#define CORE_TELEMETRY_TASK       1      // Core 1 handles BLE stack, derivative math & INA219

// --- BLE GATT Configuration ---
#define BLE_DEVICE_NAME           "SAATHI_TRIAGE_HUB"
#define SERVICE_UUID              "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define TELEMETRY_CHAR_UUID       "beb5483e-36e1-4688-b7f5-ea07361b26a8" // NOTIFY (16-byte kinematic stream)
#define COMMAND_CHAR_UUID         "cba1d466-344c-4be3-ab3f-189f80dd7518" // WRITE (Tare calibration commands)

// --- Command Codes ---
#define CMD_TARE_ZERO             0x01   // Zero current relative angle
#define CMD_RECOVER_I2C           0x02   // Force I2C bus recovery
#define CMD_CALIBRATE_GYRO        0x03   // Recalibrate gyro biases

// --- Status Indicator LED Pins ---
#define LED_BLE_CONNECTED         2      // Onboard LED (GPIO 2)
