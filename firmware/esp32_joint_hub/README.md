# Saathi MSK Triage Hub Firmware (ESP32)

**Universal Dual-IMU Kinematics & BLE GATT Telemetry Server**  
*Problem Statement ID: 26004 | Smart India Hackathon (SIH 2026)*

---

## 1. Hardware Architecture & Wiring

The Saathi wearable hub connects two modular quick-mount IMU pods (MPU-6050) across any human articulation (Knee, Hip, Shoulder, Elbow, Wrist, Cervical Spine) to stream relative angular displacement:
$$\theta_{\text{rel}} = \theta_{\text{proximal}} - \theta_{\text{distal}}$$

### Pinout Configuration (ESP32 DevKit V1)
| Component | Pin / Signal | ESP32 GPIO | Notes |
|---|---|---|---|
| **MPU-6050 Pod A** (Proximal) | SDA | GPIO 21 | Shared I2C Data bus |
| **MPU-6050 Pod A** (Proximal) | SCL | GPIO 22 | Shared I2C Clock bus (400 kHz) |
| **MPU-6050 Pod A** (Proximal) | AD0 | **GND** | Configures I2C address **0x68** |
| **MPU-6050 Pod B** (Distal) | SDA | GPIO 21 | Shared I2C Data bus |
| **MPU-6050 Pod B** (Distal) | SCL | GPIO 22 | Shared I2C Clock bus (400 kHz) |
| **MPU-6050 Pod B** (Distal) | AD0 | **3.3V** | Configures I2C address **0x69** |
| **INA219** (Power Monitor) | SDA / SCL | GPIO 21 / 22 | Configured at address **0x40** |
| **Status LED** | Anode | GPIO 2 | Onboard LED (HIGH when BLE connected) |

---

## 2. FreeRTOS Dual-Core Task Allocation

- **Core 0: `SensorTask` (100 Hz / 10 ms strict cadence, Priority 2)**
  - Samples 14 raw accelerometer and gyroscope registers from both MPU-6050 pods simultaneously over I2C at 400 kHz.
  - Applies complementary filtering ($\alpha = 0.96$) to compute pitch and roll angles.
  - Calculates relative angle: $\theta_{\text{rel}} = \theta_{\text{prox}} - \theta_{\text{dist}} - \theta_{\text{tare}}$.
  - **Failsafe:** Monitors consecutive I2C failures. If $\ge 3$ failures occur due to cable flex, it halts the peripheral and executes a 9-clock bus-clearing sequence with an explicit STOP condition.
- **Core 1: `TelemetryTask` (Core 1, Priority 1)**
  - Receives snapshots across a FreeRTOS queue.
  - Computes numerical 1st derivative (Angular Velocity $\omega$) and 2nd derivative (Angular Jerk $J$).
  - Queries INA219 battery voltage once per second.
  - Formats and packs the binary 16-byte struct, calculates the XOR checksum, and fires BLE GATT notifications.

---

## 3. 16-Byte High-Density Binary Packet Format

Streamed at 100 Hz over BLE Characteristic `beb5483e-36e1-4688-b7f5-ea07361b26a8`:

| Byte Offset | Field | Data Type | Scaling / Unit | Description |
|---|---|---|---|---|
| `[0..1]` | `header` | `uint8_t[2]` | `0xAA, 0x55` | Packet sync preamble |
| `[2..3]` | `theta_prox` | `int16_t` (LE) | $\times 100$ (deg) | Proximal segment angle |
| `[4..5]` | `theta_dist` | `int16_t` (LE) | $\times 100$ (deg) | Distal segment angle |
| `[6..7]` | `theta_rel` | `int16_t` (LE) | $\times 100$ (deg) | Relative joint angle ($\theta_p - \theta_d$) |
| `[8..9]` | `omega` | `int16_t` (LE) | $\times 100$ (deg/s) | Angular velocity $\omega$ |
| `[10..11]` | `jerk` | `int16_t` (LE) | $\times 10$ (deg/s$^2$) | Angular jerk $J$ |
| `[12..13]` | `batt_mv` | `uint16_t` (LE) | mV | Battery voltage (e.g. 3820 mV) |
| `[14]` | `status_flags` | `uint8_t` | Bitmask | Bit 0: Tare active, Bit 2: Low Batt, Bit 3: Err |
| `[15]` | `checksum` | `uint8_t` | XOR `[2..14]` | Packet integrity byte |

---

## 4. Build & Flash Instructions

### Prerequisites
- [PlatformIO Core](https://platformio.org/) or VS Code PlatformIO IDE.
- USB-to-UART CP2102 / CH340 drivers.

### Commands
```bash
# Navigate to firmware directory
cd firmware/esp32_joint_hub

# Compile firmware
pio run

# Upload to ESP32 DevKit V1
pio run --target upload

# Open serial monitor (115200 baud)
pio device monitor
```
