# Saathi MSK Triage Machine Learning Pipeline

**Multimodal Dual-Branch Kinematic Neural Network & INT8 Quantization**  
*Problem Statement ID: 26004 | Target: On-Device Android CPU Inference (<30 ms, <250 KB)*

---

## 1. Pipeline Overview

The Saathi ML engine ingests multimodal screening data combining dynamic biomechanical time series from the dual-IMU wearable harness with patient demographic and clinical survey scores.

```
 Temporal Kinematics (200, 3)                Tabular Demographics & Survey (10,)
 [θ_rel, ω, Jerk]                            [Age, Gender, BMI, VAS, Survey, Joint_OneHot]
          │                                                       │
   Conv1D(32, k=5) + BN + ReLU                               Dense(32, ReLU)
          │                                                       │
     MaxPool1D(2)                                             Dense(16, ReLU)
          │                                                       │
   Conv1D(64, k=3) + BN + ReLU                                    │
          │                                                       │
 GlobalAveragePooling1D                                           │
          │                                                       │
          └───────────────────── Concatenate ─────────────────────┘
                                      │
                               Dense(32, ReLU)
                                      │
                                 Dropout(0.2)
                                      │
                         Dense(3, Softmax Triage)
                         [P(Green), P(Yellow), P(Red)]
```

---

## 2. Universal Joints & Movement Articulations

1. **Knee (0):** Sit-to-stand functional flexion/extension (0° to 135°).
2. **Hip (1):** Lateral abduction/adduction (0° to 45°).
3. **Shoulder (2):** Active arm elevation in scapular plane (0° to 180°).
4. **Elbow (3):** Flexion and extension (0° to 145°).
5. **Wrist (4):** Radial/ulnar deviation and flexion (0° to 75°).
6. **Cervical Spine (5):** Sagittal neck flexion/extension (0° to 50°).

---

## 3. Clinical Triage Classes

- **Green (Low Risk / Healthy):** Smooth excursion, full physiological Range of Motion ($\Delta\theta_{\text{ROM}}$), bell-shaped angular velocity $\omega(t)$, low jerk ($< 50 \text{ deg/s}^3$).
- **Yellow (Moderate / Early Osteoarthritis):** 15–25% restricted ROM, involuntary velocity dip during mid-arc, pain-guarding hesitation arc $\theta_{\text{crit}}$ detected between 30°–60°.
- **Red (Severe Osteoarthritis / High Risk):** Severely restricted ROM ($<60\%$, e.g., $<85^\circ$ knee, $<90^\circ$ shoulder), cogwheel velocity stalls, erratic high-jerk spikes.

---

## 4. Execution Workflow

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Generate Synthetic 100 Hz Biomechanical Dataset
```bash
python generate_dataset.py
```
Outputs `data/synthetic_msk_dataset.npz` (6,000 samples balanced across 6 joints and 3 clinical risk tiers).

### Step 3: Train Dual-Branch Neural Network
```bash
python model.py
```
Trains multimodal model with early stopping, saving FP32 checkpoint to `export/triage_model_fp32.keras`.

### Step 4: Quantize to INT8 TFLite & Copy to Mobile App
```bash
python quantize_and_export.py
```
Applies Full Integer INT8 Post-Training Quantization with calibration samples. Exports `export/triage_model_int8.tflite` (`< 250 KB`) and mirrors directly into `mobile_app/assets/models/`.

### Step 5: Test Inference & Benchmark Latency
```bash
python test_inference.py
```
Validates on-device inference latency ($< 30 \text{ ms}$) and dynamic biomarker extraction ($\Delta\theta_{\text{ROM}}$, $\omega_{\text{peak}}$, $\text{Jerk}$, $\theta_{\text{crit}}$).
