#pragma once

#include <stdint.h>
#include <stddef.h>

// ==============================================================================
// 16-BYTE HIGH-DENSITY PACKED KINEMATIC BINARY PACKET SPECIFICATION
// ==============================================================================
// Streamed at 100 Hz over BLE GATT Notification characteristic
// Total length: exactly 16 bytes (zero padding overhead)
// ==============================================================================

#define PACKET_HEADER_0          0xAA
#define PACKET_HEADER_1          0x55
#define PACKET_TOTAL_LEN         16

#pragma pack(push, 1)
struct KinematicPacket {
    uint8_t  header[2];      // [0xAA, 0x55] - Synchronization preamble
    int16_t  theta_prox;     // Proximal limb segment angle (degrees * 100, range -18000 to +18000)
    int16_t  theta_dist;     // Distal limb segment angle   (degrees * 100, range -18000 to +18000)
    int16_t  theta_rel;      // Relative joint angle θ_rel  (degrees * 100, θ_prox - θ_dist)
    int16_t  omega;          // Angular velocity ω          (deg/sec * 100, central difference)
    int16_t  jerk;           // Angular jerk J              (deg/sec^2 * 10, acceleration derivative)
    uint16_t batt_mv;        // Battery potential           (mV, measured by INA219, e.g. 3820 mV)
    uint8_t  status_flags;   // Bitmask: [0: calibrated, 1: tare active, 2: low batt (<3500mV), 3: sensor error]
    uint8_t  checksum;       // XOR checksum of bytes [2..14]
};
#pragma pack(pop)

// Compute 8-bit XOR checksum across bytes 2..14
static inline uint8_t calculate_packet_checksum(const KinematicPacket* pkt) {
    const uint8_t* raw = (const uint8_t*)pkt;
    uint8_t csum = 0;
    for (size_t i = 2; i < 15; i++) {
        csum ^= raw[i];
    }
    return csum;
}

// Validate integrity of a received packet
static inline bool validate_packet(const uint8_t* buffer, size_t len) {
    if (len != sizeof(KinematicPacket)) return false;
    if (buffer[0] != PACKET_HEADER_0 || buffer[1] != PACKET_HEADER_1) return false;
    
    uint8_t csum = 0;
    for (size_t i = 2; i < 15; i++) {
        csum ^= buffer[i];
    }
    return (csum == buffer[15]);
}
