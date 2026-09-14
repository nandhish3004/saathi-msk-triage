"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Printer,
  User,
  MapPin,
  Briefcase,
  Calendar,
} from "lucide-react";

import {
  PatientScreening,
  updateSpecialistNotes,
} from "@/lib/mock_database";

import { KinematicCurveViewer } from "./KinematicCurveViewer";

interface PatientDossierModalProps {
  screening: PatientScreening;
  onClose: () => void;
  onSaved: () => void;
}

export const PatientDossierModal: React.FC<PatientDossierModalProps> = ({
  screening,
  onClose,
  onSaved,
}) => {
  const [notes, setNotes] = useState(screening.specialistNotes || "");
  const [isSignedOff, setIsSignedOff] = useState(
    screening.isSignedOff || false
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSignOff = () => {
    setIsSaving(true);

    updateSpecialistNotes(screening.id, notes, true);

    setIsSignedOff(true);

    setTimeout(() => {
      setIsSaving(false);
      onSaved();
    }, 400);
  };

  const getBadgeClass = (tier: string) => {
    switch (tier) {
      case "Red":
        return "bg-rose-100 text-rose-800 border-rose-300";

      case "Yellow":
        return "bg-amber-100 text-amber-800 border-amber-300";

      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              {screening.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">

                <h3 className="font-bold text-slate-900 text-lg">
                  {screening.name}
                </h3>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getBadgeClass(
                    screening.triageClass
                  )}`}
                >
                  {screening.triageClass.toUpperCase()} TIER
                </span>

                {isSignedOff && (
                  <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Specialist Signed Off
                  </span>
                )}

              </div>

              <p className="text-xs text-slate-500 flex items-center gap-4 mt-0.5 flex-wrap">
                <span>
                  ABHA ID:{" "}
                  <strong className="text-slate-700">
                    {screening.abhaId}
                  </strong>
                </span>

                <span>
                  • Joint:{" "}
                  <strong className="text-teal-700">
                    {screening.jointName}
                  </strong>
                </span>

                <span>
                  • Screened: {screening.screenedAt.split("T")[0]}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Patient Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />

              <div>
                <p className="text-slate-400">Demographics</p>
                <p className="font-bold text-slate-800">
                  {screening.age} Yrs / {screening.gender}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />

              <div>
                <p className="text-slate-400">District / State</p>
                <p className="font-bold text-slate-800">
                  {screening.district}, {screening.state}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />

              <div>
                <p className="text-slate-400">Livelihood</p>
                <p className="font-bold text-slate-800">
                  {screening.occupation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />

              <div>
                <p className="text-slate-400">VAS Pain / Survey</p>
                <p className="font-bold text-slate-800">
                  VAS {screening.vasScore}/10 (WOMAC:{" "}
                  {screening.surveyScore.toFixed(0)})
                </p>
              </div>
            </div>

          </div>

          {/* REAL SENSOR KINEMATICS */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-2">
              100 Hz Dual-IMU Biomechanical Kinematics & Pain Hesitation Arc
            </h4>

            <KinematicCurveViewer
              rom={screening.rom}
              thetaCrit={screening.thetaCrit}
              peakVelocity={screening.peakOmega}
              jointName={screening.jointName}
              timeSeries={screening.timeSeries}
            />
          </div>

          {/* Biomarkers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="p-4 rounded-xl border border-slate-200 bg-white">

              <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-3">
                Biomechanical Biomarkers Table
              </h5>

              <div className="space-y-2 text-xs">

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">
                    Active Range of Motion (Δθ)
                  </span>

                  <span className="font-bold text-slate-800">
                    {screening.rom.toFixed(1)}°
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">
                    Hesitation Arc (θ_crit)
                  </span>

                  <span
                    className={`font-bold ${
                      screening.thetaCrit > 0
                        ? "text-rose-600"
                        : "text-slate-800"
                    }`}
                  >
                    {screening.thetaCrit > 0
                      ? `${screening.thetaCrit.toFixed(1)}° (Pain Arc)`
                      : "None"}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">
                    Peak Angular Velocity (ω)
                  </span>

                  <span className="font-bold text-slate-800">
                    {screening.peakOmega.toFixed(1)} °/s
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">
                    Mean Angular Jerk
                  </span>

                  <span className="font-bold text-slate-800">
                    {screening.meanJerk.toFixed(2)} °/s³
                  </span>
                </div>

              </div>
            </div>

            {/* Posture */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">

              <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                Markerless Optical Posture Check
              </h5>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {screening.postureResult}
              </p>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />

                <span>
                  Computed via on-device ML Kit coronal pose analysis.
                </span>
              </div>

            </div>

          </div>

          {/* Specialist Notes */}
          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200">

            <h5 className="font-bold text-xs text-teal-900 uppercase tracking-wider mb-2">
              Orthopedic Specialist Sign-Off & Prescription Notes
            </h5>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter clinical assessment notes or referral recommendations..."
              className="w-full h-24 p-3 text-xs text-slate-800 bg-white rounded-lg border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl"
          >
            <Printer className="w-4 h-4" />
            Print Referral Slip
          </button>

          <div className="flex items-center gap-3">

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
            >
              Close
            </button>

            <button
              onClick={handleSignOff}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-sm shadow-teal-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />

              {isSaving
                ? "Saving..."
                : isSignedOff
                ? "Update Sign-Off"
                : "Authorize Referral Sign-Off"}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};