#!/usr/bin/env python3
"""
SAATHI MSK TRIAGE - INT8 POST-TRAINING QUANTIZATION & EXPORT
Problem Statement ID: 26004 (SIH 2026)

Quantizes the trained dual-branch Keras model to full integer INT8 format
Target constraints: File size < 250 KB, Android mobile CPU latency < 30 ms.
"""

import os
import shutil
import numpy as np
import tensorflow as tf

def representative_data_gen():
    dataset_path = os.path.join(os.path.dirname(__file__), "data", "synthetic_msk_dataset.npz")
    data = np.load(dataset_path)
    train_temp = data["train_temp"]
    train_tab  = data["train_tab"]

    # Provide 200 representative calibration samples
    num_calibration_steps = min(200, len(train_temp))
    for i in range(num_calibration_steps):
        temp_sample = np.expand_dims(train_temp[i], axis=0).astype(np.float32)
        tab_sample  = np.expand_dims(train_tab[i], axis=0).astype(np.float32)
        yield [temp_sample, tab_sample]

def quantize():
    print("=" * 60)
    print("STARTING INT8 POST-TRAINING QUANTIZATION (TFLITE)")
    print("=" * 60)

    export_dir = os.path.join(os.path.dirname(__file__), "export")
    keras_model_path = os.path.join(export_dir, "triage_model_fp32.keras")

    if not os.path.exists(keras_model_path):
        print("Trained Keras model not found. Executing model.py training first...")
        import model as model_module
        model_module.train_and_save()

    print(f"Loading float32 model from: {keras_model_path}")
    model = tf.keras.models.load_model(keras_model_path)

    # Initialize TFLite Converter
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.representative_dataset = representative_data_gen
    
    # Enforce INT8 operations for edge inference
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS_INT8,
        tf.lite.OpsSet.TFLITE_BUILTINS
    ]
    # Keep input/output as float32 for seamless Flutter Dart List<double> integration,
    # with internal weights and activations fully quantized to INT8
    converter.inference_input_type = tf.float32
    converter.inference_output_type = tf.float32

    print("Executing quantization compilation...")
    tflite_quant_model = converter.convert()

    tflite_output_path = os.path.join(export_dir, "triage_model_int8.tflite")
    with open(tflite_output_path, "wb") as f:
        f.write(tflite_quant_model)

    size_kb = len(tflite_quant_model) / 1024.0
    print(f"\n[SUCCESS] Quantized model exported to: {tflite_output_path}")
    print(f"  Model Size: {size_kb:.2f} KB (Target: < 250 KB)")
    
    if size_kb < 250.0:
        print("  [PASS] INT8 Model meets strict edge-device constraint!")
    else:
        print("  [WARNING] Model exceeds 250 KB threshold.")

    # Mirror copy directly into the Flutter mobile app assets directory
    flutter_assets_dir = os.path.join(os.path.dirname(__file__), "..", "mobile_app", "assets", "models")
    os.makedirs(flutter_assets_dir, exist_ok=True)
    flutter_dest = os.path.join(flutter_assets_dir, "triage_model_int8.tflite")
    shutil.copyfile(tflite_output_path, flutter_dest)
    print(f"[HANDOFF] Mirrored quantized model to Flutter asset bundle: {flutter_dest}")

if __name__ == "__main__":
    quantize()
