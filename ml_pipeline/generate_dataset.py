#!/usr/bin/env python3
"""
SAATHI MSK TRIAGE SYSTEM - KINEMATIC DATASET GENERATOR
Problem Statement ID: 26004 (SIH 2026)

Generates physiologically realistic 100 Hz kinematic trajectories (200 samples = 2.0s)
for 6 universal joint articulations across 3 clinical triage tiers:
  - Tier 0: Green (Healthy / Low Risk)
  - Tier 1: Yellow (Moderate / Early Osteoarthritis / Hesitation Arc)
  - Tier 2: Red (Severe OA / High Risk / Guarded ROM)

Outputs:
  - Temporal tensor: [N, 200, 3] -> (Relative Angle θ_rel, Velocity ω, Jerk J)
  - Tabular tensor:  [N, 10]     -> (Age, Gender, BMI, VAS, Survey, Joint_OneHot[6])
  - Labels:          [N, 3]      -> One-hot (Green, Yellow, Red)
"""

import os
import numpy as np
from scipy.ndimage import gaussian_filter1d

# Constants
SAMPLE_RATE_HZ = 100
TIME_STEPS = 200       # 2.0 seconds of functional movement
TOTAL_SAMPLES = 6000   # 1000 per joint class

JOINTS = ["Knee", "Hip", "Shoulder", "Elbow", "Wrist", "Cervical Spine"]
NUM_JOINTS = len(JOINTS)

# Physiological Maximum ROM bounds for healthy movement (degrees)
PHYSIO_ROM = {
    0: (120.0, 140.0),  # Knee (Sit-to-stand flexion)
    1: (40.0, 50.0),    # Hip (Abduction)
    2: (150.0, 175.0),  # Shoulder (Active Elevation)
    3: (130.0, 145.0),  # Elbow (Flexion)
    4: (60.0, 75.0),    # Wrist (Flexion / Extension)
    5: (45.0, 55.0),    # Cervical Spine (Neck Flexion)
}

def generate_kinematic_curve(joint_idx: int, risk_tier: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, float]:
    """
    Simulates a 200-sample (2.0s @ 100Hz) dynamic joint articulation.
    Returns:
      theta_rel (200,), omega (200,), jerk (200,), theta_crit
    """
    t = np.linspace(0, 2.0, TIME_STEPS) # 0 to 2 seconds
    min_rom, max_rom = PHYSIO_ROM[joint_idx]
    base_rom = np.random.uniform(min_rom, max_rom)

    theta_crit = 0.0

    if risk_tier == 0:
        # -------------------------------------------------------------
        # GREEN (Healthy): Smooth minimum-jerk sigmoid trajectory
        # -------------------------------------------------------------
        # Bell-shaped velocity excursion
        sig = 1.0 / (1.0 + np.exp(-10.0 * (t - 1.0)))
        # Scale to full ROM with small return excursion
        theta = base_rom * np.sin(np.pi * t / 2.0) ** 2
        # Add micro sensor noise (simulating MPU-6050 vibration)
        theta += np.random.normal(0, 0.4, size=TIME_STEPS)

    elif risk_tier == 1:
        # -------------------------------------------------------------
        # YELLOW (Moderate / Early OA): 15-25% ROM reduction + Hesitation Arc
        # -------------------------------------------------------------
        restricted_rom = base_rom * np.random.uniform(0.72, 0.85)
        theta = restricted_rom * np.sin(np.pi * t / 2.0) ** 2

        # Inject pain-guarding hesitation dip around 30° to 60° (t approx 0.6s to 1.1s)
        hesitation_center = np.random.uniform(0.7, 1.1)
        hesitation_width = 0.25
        dip_depth = np.random.uniform(0.20, 0.35) # 20-35% velocity stall
        
        dip_envelope = np.exp(-((t - hesitation_center) ** 2) / (2 * hesitation_width ** 2))
        theta -= dip_depth * restricted_rom * dip_envelope

        # Record critical hesitation angle
        crit_idx = int(hesitation_center * SAMPLE_RATE_HZ)
        crit_idx = min(max(crit_idx, 0), TIME_STEPS - 1)
        theta_crit = float(theta[crit_idx])

        # Add modest tremor noise
        theta += np.random.normal(0, 0.8, size=TIME_STEPS)

    else:
        # -------------------------------------------------------------
        # RED (Severe OA / High Risk): >40% ROM reduction + Velocity Stalls
        # -------------------------------------------------------------
        severely_restricted_rom = base_rom * np.random.uniform(0.40, 0.60)
        # Multi-phase stepped cogwheel motion
        step1 = 0.5 * (1.0 / (1.0 + np.exp(-15.0 * (t - 0.5))))
        step2 = 0.5 * (1.0 / (1.0 + np.exp(-12.0 * (t - 1.3))))
        theta = severely_restricted_rom * (step1 + step2) * np.sin(np.pi * t / 2.0)

        # Prominent guarding stall / sudden deceleration
        stall_t = np.random.uniform(0.8, 1.2)
        stall_envelope = np.exp(-((t - stall_t) ** 2) / (2 * 0.15 ** 2))
        theta -= 0.4 * severely_restricted_rom * stall_envelope
        theta_crit = float(theta[int(stall_t * SAMPLE_RATE_HZ)])

        # High erratic tremor noise
        theta += np.random.normal(0, 1.6, size=TIME_STEPS)

    # Smooth the position curve slightly with low-pass filter
    theta_rel = gaussian_filter1d(theta, sigma=1.2)
    # Ensure non-negative baseline
    theta_rel = np.clip(theta_rel, 0.0, 180.0)

    # 1st Derivative: Angular Velocity ω (deg/s) via central differences
    omega = np.gradient(theta_rel, 1.0 / SAMPLE_RATE_HZ)

    # 2nd Derivative: Angular Jerk J (deg/s^2)
    jerk = np.gradient(omega, 1.0 / SAMPLE_RATE_HZ)

    return theta_rel, omega, jerk, theta_crit

def generate_tabular_sample(joint_idx: int, risk_tier: int) -> np.ndarray:
    """
    Generates realistic clinical demographic/survey vector [10]:
    [Age_norm, Gender, BMI_norm, VAS_norm, Survey_norm, OneHot_Joint(6)]
    """
    if risk_tier == 0:
        # Healthy
        age = np.random.normal(32, 10)
        bmi = np.random.normal(22.5, 2.5)
        vas = np.random.uniform(0, 2.5)
        survey = np.random.uniform(0, 20)  # Low WOMAC score
    elif risk_tier == 1:
        # Moderate OA
        age = np.random.normal(52, 9)
        bmi = np.random.normal(27.0, 3.5)
        vas = np.random.uniform(3.0, 6.5)
        survey = np.random.uniform(25, 60)
    else:
        # Severe OA
        age = np.random.normal(64, 8)
        bmi = np.random.normal(31.0, 4.0)
        vas = np.random.uniform(7.0, 10.0)
        survey = np.random.uniform(65, 98)

    # Bound clinical ranges
    age = np.clip(age, 18.0, 88.0)
    gender = float(np.random.choice([0.0, 1.0])) # 0=Male, 1=Female
    bmi = np.clip(bmi, 16.0, 44.0)
    vas = np.clip(vas, 0.0, 10.0)
    survey = np.clip(survey, 0.0, 100.0)

    # Normalization
    age_norm = (age - 18.0) / 70.0
    bmi_norm = (bmi - 15.0) / 30.0
    vas_norm = vas / 10.0
    survey_norm = survey / 100.0

    # One-hot joint index (length 6)
    joint_onehot = np.zeros(NUM_JOINTS, dtype=np.float32)
    joint_onehot[joint_idx] = 1.0

    tabular_vector = np.concatenate([
        np.array([age_norm, gender, bmi_norm, vas_norm, survey_norm], dtype=np.float32),
        joint_onehot
    ])
    return tabular_vector

def main():
    print("=" * 60)
    print("SAATHI MSK TRIAGE - SYNTHETIC DATASET GENERATOR")
    print(f"Target: {TOTAL_SAMPLES} samples across {NUM_JOINTS} joints and 3 triage tiers")
    print("=" * 60)

    X_temporal = np.zeros((TOTAL_SAMPLES, TIME_STEPS, 3), dtype=np.float32)
    X_tabular  = np.zeros((TOTAL_SAMPLES, 10), dtype=np.float32)
    Y_labels   = np.zeros((TOTAL_SAMPLES, 3), dtype=np.float32)

    sample_count = 0
    samples_per_joint = TOTAL_SAMPLES // NUM_JOINTS

    for j_idx in range(NUM_JOINTS):
        joint_name = JOINTS[j_idx]
        print(f"Generating synthetic biomechanical kinematic profiles for: {joint_name}...")
        for _ in range(samples_per_joint):
            # Assign risk tier: 40% Green, 35% Yellow, 25% Red
            tier = np.random.choice([0, 1, 2], p=[0.40, 0.35, 0.25])

            theta, omega, jerk, _ = generate_kinematic_curve(j_idx, tier)
            
            # Normalize temporal features:
            # Angle: 0..180 -> 0..1.0
            # Omega: -300..300 -> -1.0..1.0
            # Jerk: -2000..2000 -> -1.0..1.0
            theta_norm = theta / 180.0
            omega_norm = np.clip(omega / 300.0, -1.0, 1.0)
            jerk_norm  = np.clip(jerk / 2000.0, -1.0, 1.0)

            X_temporal[sample_count, :, 0] = theta_norm
            X_temporal[sample_count, :, 1] = omega_norm
            X_temporal[sample_count, :, 2] = jerk_norm

            X_tabular[sample_count] = generate_tabular_sample(j_idx, tier)

            # One-hot label
            Y_labels[sample_count, tier] = 1.0
            sample_count += 1

    # Shuffle dataset
    indices = np.arange(TOTAL_SAMPLES)
    np.random.seed(42)
    np.random.shuffle(indices)

    X_temporal = X_temporal[indices]
    X_tabular  = X_tabular[indices]
    Y_labels   = Y_labels[indices]

    # Train / Val / Test split: 70% / 15% / 15%
    n_train = int(TOTAL_SAMPLES * 0.70)
    n_val   = int(TOTAL_SAMPLES * 0.15)

    train_temp = X_temporal[:n_train]
    train_tab  = X_tabular[:n_train]
    train_y    = Y_labels[:n_train]

    val_temp   = X_temporal[n_train:n_train + n_val]
    val_tab    = X_tabular[n_train:n_train + n_val]
    val_y      = Y_labels[n_train:n_train + n_val]

    test_temp  = X_temporal[n_train + n_val:]
    test_tab   = X_tabular[n_train + n_val:]
    test_y     = Y_labels[n_train + n_val:]

    output_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, "synthetic_msk_dataset.npz")

    np.savez_compressed(
        out_file,
        train_temp=train_temp, train_tab=train_tab, train_y=train_y,
        val_temp=val_temp, val_tab=val_tab, val_y=val_y,
        test_temp=test_temp, test_tab=test_tab, test_y=test_y
    )

    print(f"\n[SUCCESS] Dataset generated and saved to: {out_file}")
    print(f"  Training set:   {train_temp.shape[0]} samples")
    print(f"  Validation set: {val_temp.shape[0]} samples")
    print(f"  Test set:       {test_temp.shape[0]} samples")
    print("=" * 60)

if __name__ == "__main__":
    main()
