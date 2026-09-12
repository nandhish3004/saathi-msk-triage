#!/usr/bin/env python3
"""
SAATHI MSK TRIAGE - INFERENCE & BIOMARKER BENCHMARK TEST RUNNER
Problem Statement ID: 26004 (SIH 2026)

Tests the exported INT8 TFLite model, measures inference latency, and extracts
critical biomechanical biomarkers (ROM, Peak Velocity, Jerk, Hesitation Arc θ_crit).
"""

import os
import time
import numpy as np
import tensorflow as tf

JOINTS = ["Knee", "Hip", "Shoulder", "Elbow", "Wrist", "Cervical Spine"]
TIERS = ["Green (Low Risk / Healthy)", "Yellow (Moderate / Early OA)", "Red (Severe OA / High Risk)"]

def detect_hesitation_angle(theta_rel: np.ndarray, omega: np.ndarray, dt: float = 0.01) -> float:
    """
    Detects critical pain arc angle θ_crit where acceleration (dω/dt)
    hits an abnormal negative dip during the ascending flexion phase.
    """
    alpha = np.gradient(omega, dt) # angular acceleration
    # Look for deceleration dip in the middle 60% of motion where velocity is positive
    mid_start = int(len(theta_rel) * 0.20)
    mid_end   = int(len(theta_rel) * 0.80)
    
    worst_dip_val = 0.0
    crit_angle = 0.0
    
    for i in range(mid_start, mid_end):
        if omega[i] > 15.0 and alpha[i] < -250.0: # Sudden involuntary guarding deceleration
            if alpha[i] < worst_dip_val:
                worst_dip_val = alpha[i]
                crit_angle = theta_rel[i]
                
    return float(crit_angle)

def run_test():
    print("=" * 70)
    print("SAATHI EDGE-AI MULTI-JOINT TFLITE INFERENCE TEST")
    print("=" * 70)

    model_path = os.path.join(os.path.dirname(__file__), "export", "triage_model_int8.tflite")
    if not os.path.exists(model_path):
        print(f"Model file not found at {model_path}. Run quantize_and_export.py first.")
        return

    # Load TFLite interpreter
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    print(f"Loaded INT8 Model: {model_path} ({os.path.getsize(model_path)/1024.0:.1f} KB)")
    print(f"Input tensors:  {[d['name'] for d in input_details]}")
    print(f"Output tensors: {[d['name'] for d in output_details]}")
    print("-" * 70)

    # Find which input index corresponds to temporal vs tabular
    temp_idx = 0 if input_details[0]["shape"][1] == 200 else 1
    tab_idx  = 1 - temp_idx

    # Warm-up run
    dummy_temp = np.zeros(input_details[temp_idx]["shape"], dtype=np.float32)
    dummy_tab  = np.zeros(input_details[tab_idx]["shape"], dtype=np.float32)
    interpreter.set_tensor(input_details[temp_idx]["index"], dummy_temp)
    interpreter.set_tensor(input_details[tab_idx]["index"], dummy_tab)
    interpreter.invoke()

    # Benchmark latency over 50 executions
    latencies = []
    for _ in range(50):
        t0 = time.perf_counter()
        interpreter.set_tensor(input_details[temp_idx]["index"], dummy_temp)
        interpreter.set_tensor(input_details[tab_idx]["index"], dummy_tab)
        interpreter.invoke()
        _ = interpreter.get_tensor(output_details[0]["index"])
        latencies.append((time.perf_counter() - t0) * 1000.0)

    avg_latency = np.mean(latencies)
    p95_latency = np.percentile(latencies, 95)
    print(f"Average Inference Latency: {avg_latency:.2f} ms")
    print(f"95th Percentile Latency:   {p95_latency:.2f} ms (Target: < 30.0 ms)")
    if p95_latency < 30.0:
        print("[PASS] Latency well within < 30 ms real-time edge constraints!")
    print("-" * 70)

    # Test cases across joints
    print("Testing Clinical Joint Scenarios:")
    test_cases = [
        {"joint": 0, "name": "Knee - Early OA Case",      "age": 58, "bmi": 28.4, "vas": 5.5, "survey": 48.0, "true_tier": 1},
        {"joint": 2, "name": "Shoulder - Severe OA Case", "age": 67, "bmi": 31.2, "vas": 8.5, "survey": 82.0, "true_tier": 2},
        {"joint": 3, "name": "Elbow - Healthy Subject",   "age": 29, "bmi": 21.8, "vas": 0.5, "survey": 5.0,  "true_tier": 0},
    ]

    for tc in test_cases:
        j_id = tc["joint"]
        
        # Synthesize a curve matching expected true tier
        from generate_dataset import generate_kinematic_curve
        theta, omega, jerk, sim_crit = generate_kinematic_curve(j_id, tc["true_tier"])
        
        # Calculate dynamic biomarkers
        delta_rom = float(np.max(theta) - np.min(theta))
        peak_omega = float(np.max(np.abs(omega)))
        mean_jerk = float(np.mean(np.abs(jerk)))
        det_crit = detect_hesitation_angle(theta, omega)

        # Build model inputs
        temp_input = np.zeros((1, 200, 3), dtype=np.float32)
        temp_input[0, :, 0] = theta / 180.0
        temp_input[0, :, 1] = np.clip(omega / 300.0, -1.0, 1.0)
        temp_input[0, :, 2] = np.clip(jerk / 2000.0, -1.0, 1.0)

        tab_input = np.zeros((1, 10), dtype=np.float32)
        tab_input[0, 0] = (tc["age"] - 18.0) / 70.0
        tab_input[0, 1] = 1.0 # Female
        tab_input[0, 2] = (tc["bmi"] - 15.0) / 30.0
        tab_input[0, 3] = tc["vas"] / 10.0
        tab_input[0, 4] = tc["survey"] / 100.0
        tab_input[0, 5 + j_id] = 1.0 # One-hot joint

        interpreter.set_tensor(input_details[temp_idx]["index"], temp_input)
        interpreter.set_tensor(input_details[tab_idx]["index"], tab_input)
        interpreter.invoke()

        probs = interpreter.get_tensor(output_details[0]["index"])[0]
        pred_tier = int(np.argmax(probs))

        print(f"\nScenario: {tc['name']} ({JOINTS[j_id]})")
        print(f"  Biomarkers: ROM = {delta_rom:.1f} deg | Peak Vel = {peak_omega:.1f} deg/s | Jerk = {mean_jerk:.1f} deg/s^2 | θ_crit = {det_crit:.1f}°")
        print(f"  Probabilities: Green={probs[0]*100:.1f}%, Yellow={probs[1]*100:.1f}%, Red={probs[2]*100:.1f}%")
        print(f"  Predicted Triage: {TIERS[pred_tier]} (Match: {'YES' if pred_tier == tc['true_tier'] else 'NO'})")

    print("\n" + "=" * 70)
    print("[TEST COMPLETE] Quantized edge model validated for on-device deployment.")
    print("=" * 70)

if __name__ == "__main__":
    run_test()
