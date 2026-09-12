# Saathi: AI-Assisted Universal MSK Joint Kinematics & Triage System

**SIH Problem Statement ID: 26004**  
*Comprehensive Edge-AI Cyber-Physical Platform for Rural North Eastern Region Screening*

---

## 🌟 Executive Summary

**Saathi** is an offline-first, cyber-physical musculoskeletal screening and edge-AI triage platform tailored for the 8 states of the North Eastern Region of India (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura).

The platform decouples kinematic measurement from specific body joints using a **universal 2-pod wearable harness**, streaming 100 Hz relative angular displacement ($\theta_{\text{rel}} = \theta_{\text{proximal}} - \theta_{\text{distal}}$) over BLE. It executes an on-device INT8 quantized multimodal neural network ($<30$ ms, $<250$ KB), extracts biomechanical biomarkers (Range of Motion, Peak Angular Velocity, and Pain-Guarding Hesitation Arc $\theta_{\text{crit}}$), issues 1-tap printable PDF referral slips with QR codes, and synchronizes with an 8-state GIS epidemiological web portal via store-and-forward batch JSON.

---

## 📁 Monorepo Architecture

```
saathi-msk/
├── .gitignore                      # Universal git ignore covering C++, Python, Flutter, Node
├── CONTRIBUTING.md                 # Team branch workflow & multi-developer guide
├── README.md                       # Master project overview & system specs
│
├── firmware/esp32_joint_hub/       # [Hardware & Firmware - Prakash & Nandhish]
│   ├── platformio.ini              # ESP32 DevKit V1 configuration
│   ├── include/
│   │   ├── config.h                # Pinouts (SDA=21, SCL=22), I2C addrs (0x68, 0x69, 0x40), BLE UUIDs
│   │   ├── telemetry_packet.h      # 16-byte packed binary struct & XOR checksum
│   │   ├── imu_filter.h            # Complementary filter & tare zeroing
│   │   ├── i2c_recovery.h          # 9-clock bus hang failsafe driver
│   │   └── ble_handler.h           # BLE GATT server definitions
│   ├── src/
│   │   ├── main.cpp                # FreeRTOS: SensorTask (Core 0, 100Hz) & TelemetryTask (Core 1)
│   │   ├── ble_server.cpp          # SAATHI_TRIAGE_HUB notification service & Tare command
│   │   ├── imu_filter.cpp          # Dual MPU-6050 sampling & orientation engine
│   │   └── i2c_recovery.cpp        # Clock toggling bus recovery implementation
│   └── README.md
│
├── ml_pipeline/                    # [Edge AI & Quantization - Nandhish]
│   ├── requirements.txt            # TensorFlow, NumPy, SciPy, Scikit-Learn
│   ├── generate_dataset.py         # 100 Hz biomechanical simulator (6 joints, 3 clinical tiers)
│   ├── model.py                    # Multimodal dual-branch Keras model (1D-CNN + Tabular)
│   ├── quantize_and_export.py      # INT8 Post-Training Quantization (<250 KB .tflite export)
│   ├── test_inference.py           # On-device latency benchmark (<30 ms) & biomarker tests
│   └── README.md
│
├── mobile_app/                     # [Offline Flutter App - Saran Raj & Prakash]
│   ├── pubspec.yaml                # Flutter 3.x dependencies
│   ├── assets/
│   │   ├── data/
│   │   │   └── ner_district_registry.json # 8 NER states, dialects, diets, livelihoods (Gokul)
│   │   └── models/
│   │       └── triage_model_int8.tflite   # Mirrored INT8 edge model
│   ├── lib/
│   │   ├── main.dart               # MultiProvider application entry point
│   │   ├── constants/              # AppTheme & BleConfig UUIDs
│   │   ├── models/                 # Patient, ScreeningRecord, KinematicSample, JointConfig
│   │   ├── database/               # Offline SQLiteHelper with sync tracking
│   │   ├── services/
│   │   │   ├── ble_service.dart    # 100 Hz binary unpacker + zero-hardware simulator
│   │   │   ├── tflite_service.dart # On-device INT8 CPU inference & biomarker extractor
│   │   │   ├── pose_detector_service.dart # ML Kit markerless posture check
│   │   │   ├── pdf_export_service.dart    # 1-page referral slip + QR code generator
│   │   │   ├── tts_service.dart    # Regional vernacular voice prompt guide
│   │   │   └── sync_service.dart   # Store-and-forward batch JSON cloud syncer
│   │   ├── widgets/                # KinematicChartWidget, RiskBadgeWidget, MannequinSelector
│   │   └── screens/                # All 15 complete screening & clinical workflow screens
│   └── README.md
│
└── web_dashboard/                  # [Web Portal & GIS - Janani & Prithyanka]
    ├── package.json                # Next.js 14, Tailwind CSS, Lucide icons
    ├── app/
    │   ├── api/sync/route.ts       # Mobile batch JSON ingestion endpoint
    │   ├── dashboard/
    │   │   ├── gis/page.tsx        # Interactive 8-state NER risk choropleth
    │   │   ├── specialist/page.tsx # Doctor review queue & dossier modal
    │   │   └── analytics/page.tsx  # Occupational clusters vs OA cross-tabulation
    │   └── page.tsx                # Gateway landing page
    ├── components/                 # NerGisMap, KinematicCurveViewer, PatientDossierModal
    ├── lib/                        # Mock database & NER geographic metadata
    └── README.md
```

---

## 👥 Team Work Distribution (48-Hour Sprint Handshakes)

| Member | Focus Module | Deliverables & Responsibilities |
|---|---|---|
| **Prakash** | Hardware & Harness | Modular quick-mount pod enclosures (35x25x12mm) with multi-size velcro straps, belt hub, 70cm silicone interconnect cable, and physical joint fixation testing. |
| **Nandhish** | Firmware & ML Lead | FreeRTOS dual-core firmware, 100 Hz 16-byte BLE notifications, dual-branch 1D-CNN + Tabular model, and INT8 TFLite quantization (`< 250 KB`, `< 30 ms`). |
| **Saran Raj** | Mobile App Lead | Offline Flutter application, universal BLE binary packet unpacker, 60 FPS `fl_chart` kinematics, SQLite storage, and 1-tap PDF referral slip with QR code. |
| **Gokul** | Field Research & Content | 8 NER district livelihoods (`ner_district_registry.json`), native anti-inflammatory diets (Dhekia, fermented fish, Lakadong turmeric), and practical ergonomic posture rules. |
| **Janani** | Doctor Specialist Hub | Orthopedic specialist review queue, filterable triage badges (Red/Yellow/Green), and Patient Dossier Modal with interactive flexion-extension curves & clinical referral sign-offs. |
| **Prithyanka** | GIS & Ingestion API | Regional 8-state GIS choropleth heatmap, occupational cross-tabulation analytics, and the `/api/sync` store-and-forward cloud ingestion endpoint. |

---

## 🚀 How to Share with Your Friends & Teammates (Git Setup)

To allow all teammates to access, edit, and collaborate on this codebase:

### 1. Initialize Git & Create First Commit
Open your terminal in this directory (`saathi-msk`) and run:
```bash
git init
git add .
git commit -m "feat: complete initial codebase for Saathi MSK Triage System (SIH 26004)"
```

### 2. Push to Remote Repository (GitHub / GitLab)
Create a new repository on [GitHub](https://github.com/new) named `saathi-msk-triage` and run:
```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/saathi-msk-triage.git
git branch -M main
git push -u origin main
```

### 3. Grant Edit Permissions to Your Teammates
1. Go to your GitHub repository -> **Settings** -> **Collaborators**.
2. Click **Add people** and enter your friends' GitHub usernames or email addresses (Saran Raj, Prakash, Gokul, Nandhish, Janani, Prithyanka).
3. Once they accept the invitation, they have full read and write access to edit all files, push commits, and create branches!
