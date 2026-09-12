"use client";

import React, { useState, useEffect } from "react";
import { getScreenings, PatientScreening } from "@/lib/mock_database";
import { Search, Filter, Eye, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { PatientDossierModal } from "@/components/PatientDossierModal";

export default function SpecialistReviewPage() {
  const [screenings, setScreenings] = useState<PatientScreening[]>([]);
  const [filteredScreenings, setFilteredScreenings] = useState<PatientScreening[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [activeDossier, setActiveDossier] = useState<PatientScreening | null>(null);

  const refreshData = () => {
    const list = getScreenings();
    setScreenings([...list]);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    let result = screenings;
    if (selectedTier !== "All") {
      result = result.filter((s) => s.triageClass === selectedTier);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.abhaId.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.jointName.toLowerCase().includes(q)
      );
    }
    setFilteredScreenings(result);
  }, [screenings, searchQuery, selectedTier]);

  const getBadgeClass = (tier: string) => {
    switch (tier) {
      case "Red":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Yellow":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            Orthopedic Specialist Review Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review referred rural patients, evaluate 100 Hz kinematic curves & hesitation arcs, and authorize clinical sign-offs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">
            Showing {filteredScreenings.length} of {screenings.length} Cases
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Name, ABHA ID, or District..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Tier:
          </span>
          {["All", "Red", "Yellow", "Green"].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedTier === tier
                  ? tier === "Red"
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                    : tier === "Yellow"
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                    : tier === "Green"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                    : "bg-teal-600 text-white shadow-sm shadow-teal-600/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tier === "All" ? "All Tiers" : `${tier} Tier`}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Screening Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Patient / ABHA ID</th>
                <th className="px-4 py-3.5">District & Occupation</th>
                <th className="px-4 py-3.5">Joint</th>
                <th className="px-4 py-3.5">Dynamic ROM (Δθ)</th>
                <th className="px-4 py-3.5">Hesitation (θ_crit)</th>
                <th className="px-4 py-3.5">Triage Badge</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredScreenings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No matching screening cases in current review queue.
                  </td>
                </tr>
              ) : (
                filteredScreenings.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{s.abhaId}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-800">{s.district}</p>
                      <p className="text-[11px] text-teal-700">{s.occupation}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-800">{s.jointName}</td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-slate-800">{s.rom.toFixed(1)}°</span>
                      <p className="text-[10px] text-slate-400">Peak: {s.peakOmega.toFixed(0)} °/s</p>
                    </td>
                    <td className="px-4 py-4">
                      {s.thetaCrit > 0 ? (
                        <span className="font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                          {s.thetaCrit.toFixed(1)}° (Pain Arc)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Smooth</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getBadgeClass(s.triageClass)}`}>
                        {s.triageClass.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {s.isSignedOff ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Signed
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setActiveDossier(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-teal-600/20 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Dossier Modal */}
      {activeDossier && (
        <PatientDossierModal
          screening={activeDossier}
          onClose={() => setActiveDossier(null)}
          onSaved={() => {
            refreshData();
            setActiveDossier(null);
          }}
        />
      )}
    </div>
  );
}
