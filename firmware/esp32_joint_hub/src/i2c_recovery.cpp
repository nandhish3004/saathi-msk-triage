#include "i2c_recovery.h"
#include <Wire.h>

bool I2CBusRecovery::isBusHealthy(uint8_t sdaPin, uint8_t sclPin) {
    pinMode(sdaPin, INPUT_PULLUP);
    pinMode(sclPin, INPUT_PULLUP);
    delayMicroseconds(10);
    return (digitalRead(sdaPin) == HIGH && digitalRead(sclPin) == HIGH);
}

bool I2CBusRecovery::recover(uint8_t sdaPin, uint8_t sclPin, uint32_t frequency) {
    log_w("I2C bus hang detected! Initiating 9-clock bus-clearing sequence...");

    // 1. Terminate current Wire instance to release hardware peripheral
    Wire.end();

    // 2. Configure pins as standard GPIO open-drain outputs with pullups
    pinMode(sclPin, OUTPUT_OPEN_DRAIN);
    pinMode(sdaPin, OUTPUT_OPEN_DRAIN);
    digitalWrite(sclPin, HIGH);
    digitalWrite(sdaPin, HIGH);
    delayMicroseconds(20);

    // 3. Pulse SCL up to 9 times to clock out any hung slave byte
    bool sdaReleased = false;
    for (int i = 0; i < 9; i++) {
        digitalWrite(sclPin, LOW);
        delayMicroseconds(10);
        digitalWrite(sclPin, HIGH);
        delayMicroseconds(10);

        if (digitalRead(sdaPin) == HIGH) {
            sdaReleased = true;
            break;
        }
    }

    // 4. Generate explicit I2C STOP condition:
    // SDA LOW while SCL is LOW, then SCL HIGH, then SDA HIGH
    digitalWrite(sdaPin, LOW);
    delayMicroseconds(10);
    digitalWrite(sclPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(sdaPin, HIGH);
    delayMicroseconds(20);

    // 5. Reinitialize the Wire hardware peripheral
    bool wireStarted = Wire.begin(sdaPin, sclPin, frequency);
    if (!wireStarted) {
        log_e("Wire.begin failed after recovery attempt.");
        return false;
    }

    log_i("I2C bus recovery completed. Bus cleared: %s", sdaReleased ? "YES" : "NO");
    return sdaReleased;
}
