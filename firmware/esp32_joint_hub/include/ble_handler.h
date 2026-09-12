#pragma once

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "telemetry_packet.h"

// ==============================================================================
// BLE GATT SERVER HANDLER FOR SAATHI MSK TRIAGE HUB
// Streams 100 Hz 16-byte packed packets and listens for tare zero-point commands
// ==============================================================================

class BleTelemetryHandler : public BLEServerCallbacks, public BLECharacteristicCallbacks {
public:
    BleTelemetryHandler();

    bool init();
    void notifyPacket(const KinematicPacket& packet);
    bool isClientConnected() const { return deviceConnected; }
    bool checkTareRequested();

    // BLEServerCallbacks
    void onConnect(BLEServer* pServer) override;
    void onDisconnect(BLEServer* pServer) override;

    // BLECharacteristicCallbacks
    void onWrite(BLECharacteristic* pCharacteristic) override;

private:
    BLEServer* pServer;
    BLECharacteristic* pTelemetryChar;
    BLECharacteristic* pCommandChar;
    bool deviceConnected;
    bool oldDeviceConnected;
    volatile bool tareRequested;
};
