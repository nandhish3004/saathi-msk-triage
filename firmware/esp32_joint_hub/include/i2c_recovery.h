#pragma once

#include <Arduino.h>

// ==============================================================================
// I2C BUS HANG RECOVERY DRIVER
// Recovers locked SDA/SCL lines caused by cable flex or slave lockup
// ==============================================================================

class I2CBusRecovery {
public:
    static bool recover(uint8_t sdaPin, uint8_t sclPin, uint32_t frequency = 400000);
    static bool isBusHealthy(uint8_t sdaPin, uint8_t sclPin);
};
