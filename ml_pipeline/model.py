#!/usr/bin/env python3
"""
SAATHI MSK TRIAGE - MULTIMODAL DUAL-BRANCH NEURAL NETWORK
Problem Statement ID: 26004 (SIH 2026)

Architecture:
  - Temporal Branch: Conv1D on 200 kinematic samples (θ_rel, ω, J)
  - Tabular Branch: Dense network on patient intake & one-hot joint ID
  - Fusion: Concatenate -> Dense -> Softmax Triage Classification (Green, Yellow, Red)
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model, Input, optimizers, callbacks

def build_multimodal_triage_model() -> Model:
    """
    Constructs the dual-branch multimodal MSK triage network.
    """
    # -----------------------------------------------------------------
    # Branch 1: Temporal Kinematics (200 timesteps, 3 channels)
    # -----------------------------------------------------------------
    temporal_input = Input(shape=(200, 3), name="temporal_input")
    
    x_temp = layers.Conv1D(filters=32, kernel_size=5, padding="same", activation="relu", name="conv1d_1")(temporal_input)
    x_temp = layers.BatchNormalization(name="bn_1")(x_temp)
    x_temp = layers.MaxPooling1D(pool_size=2, name="maxpool_1")(x_temp)
    
    x_temp = layers.Conv1D(filters=64, kernel_size=3, padding="same", activation="relu", name="conv1d_2")(x_temp)
    x_temp = layers.BatchNormalization(name="bn_2")(x_temp)
    x_temp = layers.GlobalAveragePooling1D(name="gap")(x_temp)

    # -----------------------------------------------------------------
    # Branch 2: Tabular Clinical Demographics & One-Hot Joint Index (10 features)
    # -----------------------------------------------------------------
    tabular_input = Input(shape=(10,), name="tabular_input")
    
    x_tab = layers.Dense(32, activation="relu", name="dense_tab_1")(tabular_input)
    x_tab = layers.Dense(16, activation="relu", name="dense_tab_2")(x_tab)

    # -----------------------------------------------------------------
    # Multimodal Fusion & Classification Head
    # -----------------------------------------------------------------
    fused = layers.Concatenate(name="fusion_concat")([x_temp, x_tab])
    fused = layers.Dense(32, activation="relu", name="dense_fusion")(fused)
    fused = layers.Dropout(0.2, name="dropout")(fused)
    
    output = layers.Dense(3, activation="softmax", name="triage_output")(fused)

    model = Model(inputs=[temporal_input, tabular_input], outputs=output, name="Saathi_MSK_Triage_Net")
    return model

def train_and_save():
    print("=" * 60)
    print("TRAINING SAATHI MULTIMODAL MSK DUAL-BRANCH NETWORK")
    print("=" * 60)

    dataset_path = os.path.join(os.path.dirname(__file__), "data", "synthetic_msk_dataset.npz")
    if not os.path.exists(dataset_path):
        print("Dataset not found. Invoking generator...")
        import generate_dataset
        generate_dataset.main()

    data = np.load(dataset_path)
    train_temp = data["train_temp"]
    train_tab  = data["train_tab"]
    train_y    = data["train_y"]

    val_temp   = data["val_temp"]
    val_tab    = data["val_tab"]
    val_y      = data["val_y"]

    test_temp  = data["test_temp"]
    test_tab   = data["test_tab"]
    test_y     = data["test_y"]

    model = build_multimodal_triage_model()
    model.summary()

    model.compile(
        optimizer=optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")]
    )

    export_dir = os.path.join(os.path.dirname(__file__), "export")
    os.makedirs(export_dir, exist_ok=True)
    checkpoint_path = os.path.join(export_dir, "triage_model_fp32.keras")

    early_stop = callbacks.EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True)
    lr_decay = callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-5)

    history = model.fit(
        x={"temporal_input": train_temp, "tabular_input": train_tab},
        y=train_y,
        validation_data=(
            {"temporal_input": val_temp, "tabular_input": val_tab},
            val_y
        ),
        epochs=20,
        batch_size=32,
        callbacks=[early_stop, lr_decay],
        verbose=1
    )

    test_results = model.evaluate(
        x={"temporal_input": test_temp, "tabular_input": test_tab},
        y=test_y,
        verbose=0
    )
    print("\n--- Test Set Evaluation ---")
    print(f"Test Loss:     {test_results[0]:.4f}")
    print(f"Test Accuracy: {test_results[1]*100:.2f}%")
    print(f"Test AUC:      {test_results[2]:.4f}")

    model.save(checkpoint_path)
    print(f"[SUCCESS] Trained model saved to: {checkpoint_path}")

if __name__ == "__main__":
    train_and_save()
