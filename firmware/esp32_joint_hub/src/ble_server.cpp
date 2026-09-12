#include "ble_handler.h"
#include "config.h"

BleTelemetryHandler::BleTelemetryHandler()
    : pServer(nullptr),
      pTelemetryChar(nullptr),
      pCommandChar(nullptr),
      deviceConnected(false),
      oldDeviceConnected(false),
      tareRequested(false) {}

bool BleTelemetryHandler::init() {
    log_i("Initializing BLE GATT Server: %s", BLE_DEVICE_NAME);
    BLEDevice::init(BLE_DEVICE_NAME);

    // Create BLE Server
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(this);

    // Create MSK Triage Service
    BLEService* pService = pServer->createService(SERVICE_UUID);

    // Create 100 Hz Telemetry Characteristic (NOTIFY | READ)
    pTelemetryChar = pService->createCharacteristic(
        TELEMETRY_CHAR_UUID,
        BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ
    );
    pTelemetryChar->addDescriptor(new BLE2902());

    // Create Command Characteristic (WRITE | WRITE_NR)
    pCommandChar = pService->createCharacteristic(
        COMMAND_CHAR_UUID,
        BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
    );
    pCommandChar->setCallbacks(this);

    // Start Service
    pService->start();

    // Configure Advertising
    BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06); // Fast connection intervals (7.5ms - 15ms)
    pAdvertising->setMaxPreferred(0x12);
    BLEDevice::startAdvertising();

    log_i("BLE Advertising active. Waiting for Saathi Mobile App to connect...");
    return true;
}

void BleTelemetryHandler::onConnect(BLEServer* pServer) {
    deviceConnected = true;
    digitalWrite(LED_BLE_CONNECTED, HIGH);
    log_i("Central device connected to Saathi MSK Hub.");
}

void BleTelemetryHandler::onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    digitalWrite(LED_BLE_CONNECTED, LOW);
    log_w("Central device disconnected. Restarting BLE advertising...");
    pServer->startAdvertising();
}

void BleTelemetryHandler::onWrite(BLECharacteristic* pCharacteristic) {
    std::string rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) {
        uint8_t cmd = (uint8_t)rxValue[0];
        log_i("Received BLE command: 0x%02X", cmd);
        if (cmd == CMD_TARE_ZERO) {
            tareRequested = true;
            log_i("Command: TARE ZERO triggered by mobile client.");
        }
    }
}

bool BleTelemetryHandler::checkTareRequested() {
    if (tareRequested) {
        tareRequested = false;
        return true;
    }
    return false;
}

void BleTelemetryHandler::notifyPacket(const KinematicPacket& packet) {
    if (deviceConnected && pTelemetryChar != nullptr) {
        pTelemetryChar->setValue((uint8_t*)&packet, sizeof(KinematicPacket));
        pTelemetryChar->notify();
    }
}
