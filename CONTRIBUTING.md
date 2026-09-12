# Saathi MSK Triage: Team Collaboration & Contribution Guide

This guide allows all team members to work concurrently on their respective subdirectories without git conflicts.

---

## 🌿 Branching Strategy

Each team member should create their own feature branch for their assigned module:

```bash
# Firmware & Hardware (Prakash & Nandhish)
git checkout -b feat/firmware-imu-ble

# Machine Learning & Quantization (Nandhish)
git checkout -b feat/ml-dual-branch-int8

# Mobile App Development (Saran Raj & Prakash)
git checkout -b feat/mobile-flutter-triage

# Web Portal & GIS Heatmap (Janani & Prithyanka)
git checkout -b feat/web-specialist-gis

# Regional Research & Content (Gokul)
git checkout -b feat/ner-registry-content
```

---

## 🛠️ Module Development Instructions

### 1. Firmware (`/firmware/esp32_joint_hub`) - Prakash & Nandhish
- Target Board: ESP32 DevKit V1 with Dual MPU-6050 (0x68 on GND, 0x69 on 3.3V) and INA219 (0x40).
- Tool: PlatformIO Core (`pio run` to build, `pio run -t upload` to flash).
- Test: Open serial monitor at 115200 baud to verify both IMUs initialize and 100 Hz binary packets stream.

### 2. Machine Learning Pipeline (`/ml_pipeline`) - Nandhish
- Python 3.10+ virtual environment:
  ```bash
  cd ml_pipeline
  python -m venv venv
  source venv/bin/activate  # On Windows: venv\Scripts\activate
  pip install -r requirements.txt
  ```
- Generate dataset & train model:
  ```bash
  python generate_dataset.py
  python model.py
  python quantize_and_export.py
  python test_inference.py
  ```

### 3. Mobile App (`/mobile_app`) - Saran Raj & Prakash
- Flutter 3.19+ / 3.22+:
  ```bash
  cd mobile_app
  flutter pub get
  flutter run
  ```
- **Zero-Hardware Testing:** On the "Connect IMU Sensor" screen, tap **"Enable 100 Hz Simulator (No Hardware)"** to test live kinematics, the 60 FPS curve, hesitation detection, and neural inference directly on any emulator or phone!

### 4. Web Dashboard (`/web_dashboard`) - Janani & Prithyanka
- Node.js 18+ / 20+:
  ```bash
  cd web_dashboard
  npm install
  npm run dev
  ```
- Access the GIS Map at `http://localhost:3000/dashboard/gis` and the Doctor Review Queue at `http://localhost:3000/dashboard/specialist`.
- Test the sync ingestion endpoint by sending POST requests to `http://localhost:3000/api/sync`.

---

## 🚀 Pushing Changes to the Shared Repository

```bash
# 1. Check changed files
git status

# 2. Stage your module files
git add firmware/
# or
git add mobile_app/
# or
git add web_dashboard/

# 3. Commit with a clear message
git commit -m "feat(mobile): add real-time fl_chart hesitation angle marker"

# 4. Pull latest changes from main before pushing
git pull origin main --rebase

# 5. Push your branch
git push origin <your-branch-name>
```
