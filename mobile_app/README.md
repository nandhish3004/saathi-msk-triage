# Saathi MSK Mobile Application (Flutter)

**100% Offline-First Multi-Joint Kinematic Screening App for Rural North East**  
*Problem Statement ID: 26004 | Target: Android Tablet / Smartphone (ASHA / PHC Health Workers)*

---

## 1. Feature Architecture

1. **Interactive Multi-Joint Selector:** Universal support for 6 articulations (Knee, Hip, Shoulder, Elbow, Wrist, Cervical Spine) with 5-second strap placement animated guidance (Pod A proximal, Pod B distal) and 1-tap neutral tare zero-calibration.
2. **Universal BLE Telemetry:** Ingests 100 Hz 16-byte packed binary frames from `SAATHI_TRIAGE_HUB`. Includes rolling 200-sample ring buffer, XOR checksum validation, and real-time detection of hesitation arcs ($\theta_{\text{crit}}$).
3. **Hardware-Free Simulation Mode:** Allows testing, evaluating, and demonstrating the complete 100 Hz kinematic rendering pipeline without requiring physical ESP32 hardware connected.
4. **On-Device INT8 Neural Triage:** Runs quantized multimodal Keras model via TFLite in $<30$ ms on local CPU. Returns 3-tier risk badge (Green, Yellow, Red) with exact probabilities.
5. **Offline SQLite Storage:** Local encrypted database storing patient demographics, ABHA IDs, district livelihoods from `ner_district_registry.json`, dynamic biomarkers, and sync flags.
6. **1-Tap PDF Referral Slip:** Generates printable 1-page clinical document with ROM curves, biomarker breakdown, indigenous diet tips, and a doctor QR code embedding compressed JSON for quick specialist scans.
7. **Store-and-Forward Sync:** Background sync manager batching unsynced screening records (`synced_to_server = 0`) to the Next.js central portal whenever connectivity is detected.

---

## 2. Directory Structure

```
mobile_app/
├── pubspec.yaml
├── assets/
│   ├── data/
│   │   └── ner_district_registry.json   # 8-State NER districts, dialects & livelihoods
│   └── models/
│       └── triage_model_int8.tflite     # Quantized edge neural model (<250 KB)
├── lib/
│   ├── main.dart
│   ├── constants/
│   │   ├── theme.dart
│   │   └── ble_uuids.dart
│   ├── models/
│   │   ├── patient.dart
│   │   ├── screening_record.dart
│   │   ├── kinematic_sample.dart
│   │   └── joint_config.dart
│   ├── database/
│   │   └── sqlite_helper.dart
│   ├── services/
│   │   ├── ble_service.dart
│   │   ├── tflite_service.dart
│   │   ├── pose_detector_service.dart
│   │   ├── pdf_export_service.dart
│   │   ├── tts_service.dart
│   │   └── sync_service.dart
│   ├── widgets/
│   │   ├── kinematic_chart_widget.dart
│   │   ├── risk_badge_widget.dart
│   │   └── mannequin_selector_widget.dart
│   └── screens/
│       ├── splash_screen.dart
│       ├── language_select_screen.dart
│       ├── role_select_screen.dart
│       ├── home_dashboard_screen.dart
│       ├── patient_registration_screen.dart
│       ├── joint_selector_screen.dart
│       ├── clinical_questionnaire_screen.dart
│       ├── sensor_connect_screen.dart
│       ├── sensor_instruction_screen.dart
│       ├── live_assessment_screen.dart
│       ├── posture_camera_screen.dart
│       ├── result_screen.dart
│       ├── preventive_guidance_screen.dart
│       ├── patient_records_screen.dart
│       └── sync_status_screen.dart
```

---

## 3. Running & Building Locally

### Prerequisites
- Flutter SDK (version 3.19+ or 3.22+)
- Android Studio / Android SDK (API level 24+)

### Commands
```bash
cd mobile_app

# Fetch dependencies
flutter pub get

# Run on connected device / emulator
flutter run

# Build release APK for field deployment
flutter build apk --release
```
The resulting release APK will be located at:
`build/app/outputs/flutter-apk/app-release.apk`
