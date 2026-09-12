#pragma once

#include <Arduino.h>
#include <Wire.h>

// ==============================================================================
// IMU FILTER & ORIENTATION ENGINE
// Samples MPU-6050 registers and computes filtered Euler pitch/roll & relative angle
// ==============================================================================

struct IMUData {
    float ax, ay, az;      // Accelerations in G
    float gx, gy, gz;      // Angular rates in deg/s
    float pitch;           // Filtered pitch angle in degrees
    float roll;            // Filtered roll angle in degrees
    bool  healthy;         // Communication state flag
};

class IMUFilter {
public:
    IMUFilter(uint8_t i2cAddress);

    bool init();
    bool sample(float dt);
    void calibrateZero();

    float getAngle() const { return currentAngle - zeroOffset; }
    float getRawAngle() const { return currentAngle; }
    float getAngularRate() const { return gyroRate; }
    bool  isHealthy() const { return data.healthy; }

    void setZeroOffset(float offset) { zeroOffset = offset; }
    float getZeroOffset() const { return zeroOffset; }

private:
    uint8_t i2cAddr;
    IMUData data;
    float currentAngle;    // Primary kinematic angle (pitch)
    float gyroRate;        // Gyro rate around flexion axis (deg/s)
    float zeroOffset;      // Tare offset in degrees
    float alpha;           // Complementary filter weight (default 0.96)

    // Gyroscope bias calibration offsets
    float gyroBiasX;
    float gyroBiasY;
    float gyroBiasZ;

    bool readRawRegisters(int16_t raw[7]);
};
