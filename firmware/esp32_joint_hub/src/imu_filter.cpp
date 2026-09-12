#include "imu_filter.h"
#include <math.h>

#define MPU_REG_SMPLRT_DIV    0x19
#define MPU_REG_CONFIG        0x1A
#define MPU_REG_GYRO_CONFIG   0x1B
#define MPU_REG_ACCEL_CONFIG  0x1C
#define MPU_REG_ACCEL_XOUT_H  0x3B
#define MPU_REG_PWR_MGMT_1    0x6B
#define MPU_REG_WHO_AM_I      0x75

// Scale factors
// Accel ±4g  -> 8192 LSB/g
// Gyro ±500 deg/s -> 65.5 LSB/(deg/s)
#define ACCEL_SCALE_4G        8192.0f
#define GYRO_SCALE_500        65.5f

IMUFilter::IMUFilter(uint8_t i2cAddress)
    : i2cAddr(i2cAddress),
      currentAngle(0.0f),
      gyroRate(0.0f),
      zeroOffset(0.0f),
      alpha(0.96f),
      gyroBiasX(0.0f),
      gyroBiasY(0.0f),
      gyroBiasZ(0.0f) {
    data.healthy = false;
    data.pitch = 0.0f;
    data.roll = 0.0f;
}

bool IMUFilter::init() {
    Wire.beginTransmission(i2cAddr);
    Wire.write(MPU_REG_WHO_AM_I);
    if (Wire.endTransmission() != 0) {
        data.healthy = false;
        return false;
    }

    Wire.requestFrom(i2cAddr, (uint8_t)1);
    if (Wire.available() < 1) {
        data.healthy = false;
        return false;
    }
    uint8_t whoAmI = Wire.read();
    if (whoAmI != 0x68 && whoAmI != 0x72 && whoAmI != 0x70) {
        // MPU-6050 typically returns 0x68
        log_w("IMU at 0x%02X reported WHO_AM_I=0x%02X", i2cAddr, whoAmI);
    }

    // 1. Wake up device (clear SLEEP bit)
    Wire.beginTransmission(i2cAddr);
    Wire.write(MPU_REG_PWR_MGMT_1);
    Wire.write(0x01); // Clock source: PLL with X axis gyroscope reference
    Wire.endTransmission();
    delay(10);

    // 2. Sample rate divider: 1 kHz / (1 + 9) = 100 Hz
    Wire.beginTransmission(i2cAddr);
    Wire.write(MPU_REG_SMPLRT_DIV);
    Wire.write(0x09);
    Wire.endTransmission();

    // 3. Digital Low-Pass Filter (DLPF): 42 Hz bandwidth
    Wire.beginTransmission(i2cAddr);
    Wire.write(MPU_REG_CONFIG);
    Wire.write(0x03);
    Wire.endTransmission();

    // 4. Gyro range: ±500 deg/s (FS_SEL = 1)
    Wire.beginTransmission(i2cAddr);
    Wire.write(MPU_REG_GYRO_CONFIG);
    Wire.write(0x08);
    Wire.endTransmission();

    // 5. Accel range: ±4g (AFS_SEL = 1)
    Wire.beginTransmission(i2cAddr);
    Wire.write(MPU_REG_ACCEL_CONFIG);
    Wire.write(0x08);
    Wire.endTransmission();

    data.healthy = true;
    log_i("IMU at 0x%02X successfully initialized.", i2cAddr);
    return true;
}

bool IMUFilter::readRawRegisters(int16_t raw[7]) {
    Wire.beginTransmission(i2cAddr);
    Wire.write(MPU_REG_ACCEL_XOUT_H);
    if (Wire.endTransmission(false) != 0) {
        data.healthy = false;
        return false;
    }

    // Burst read 14 bytes: Accel X, Y, Z, Temp, Gyro X, Y, Z
    uint8_t bytesReceived = Wire.requestFrom(i2cAddr, (uint8_t)14);
    if (bytesReceived != 14) {
        data.healthy = false;
        return false;
    }

    for (int i = 0; i < 7; i++) {
        raw[i] = (int16_t)((Wire.read() << 8) | Wire.read());
    }

    data.healthy = true;
    return true;
}

void IMUFilter::calibrateZero() {
    zeroOffset = currentAngle;
    log_i("IMU 0x%02X tare calibration set to offset: %.2f deg", i2cAddr, zeroOffset);
}

bool IMUFilter::sample(float dt) {
    int16_t raw[7];
    if (!readRawRegisters(raw)) {
        return false;
    }

    // Convert raw to engineering units
    data.ax = (float)raw[0] / ACCEL_SCALE_4G;
    data.ay = (float)raw[1] / ACCEL_SCALE_4G;
    data.az = (float)raw[2] / ACCEL_SCALE_4G;

    data.gx = ((float)raw[4] / GYRO_SCALE_500) - gyroBiasX;
    data.gy = ((float)raw[5] / GYRO_SCALE_500) - gyroBiasY;
    data.gz = ((float)raw[6] / GYRO_SCALE_500) - gyroBiasZ;

    // Calculate static accelerometer pitch & roll (degrees)
    // Pitch (sagittal plane flexion/extension)
    float accelPitch = atan2f(data.ay, sqrtf(data.ax * data.ax + data.az * data.az)) * (180.0f / M_PI);
    // Roll (frontal plane abduction/adduction)
    float accelRoll = atan2f(-data.ax, data.az) * (180.0f / M_PI);

    // Primary axis rate is gyro X (sagittal) or Y depending on orientation
    gyroRate = data.gx;

    // Complementary Filter fusion
    // Angle = alpha * (Angle + Gyro * dt) + (1 - alpha) * Accel
    currentAngle = alpha * (currentAngle + gyroRate * dt) + (1.0f - alpha) * accelPitch;
    data.pitch = currentAngle;
    data.roll = alpha * (data.roll + data.gy * dt) + (1.0f - alpha) * accelRoll;

    return true;
}
