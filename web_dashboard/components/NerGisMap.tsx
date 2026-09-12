"use client";

import React, { useState } from "react";
import { NER_STATES_GIS, NerStateGisData } from "@/lib/ner_geo_data";
import { MapPin, Users, AlertTriangle, ChevronRight } from "lucide-react";

export const NerGisMap: React.FC = () => {
  const [selectedState, setSelectedState] = useState<NerStateGisData>(NER_STATES_GIS[0]);

  // Aggregate stats
  const totalScreened = NER_STATES_GIS.reduce((acc, s) => acc + s.screenedCount, 0);
  const totalHighRisk = NER_STATES_GIS.reduce((acc, s) => acc + s.highRiskCount, 0);
  const totalModerateRisk = NER_STATES_GIS.reduce((acc, s) => acc + s.moderateRiskCount, 0);

  const getHeatmapColor = (pct: number) => {
    if (pct >= 32.0) return "#dc2626"; // Strong red
    if (pct >= 28.0) return "#ea580c"; // Orange
    if (pct >= 24.0) return "#f59e0b"; // Amber
    return "#10b981"; // Emerald green
  };

  return (
    <div className="space-y-6">
      {/* Top Regional Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Rural Screenings</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalScreened.toLocaleString()}</p>
          <p className="text-[11px] text-teal-600 font-medium mt-1">Across 8 North Eastern States</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">High Risk Cases (Red Tier)</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{totalHighRisk.toLocaleString()}</p>
          <p className="text-[11px] text-rose-500 font-medium mt-1">
            {((totalHighRisk / totalScreened) * 100).toFixed(1)}% of total cohort
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Early OA / Hesitation Arc</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{totalModerateRisk.toLocaleString()}</p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            {((totalModerateRisk / totalScreened) * 100).toFixed(1)}% early intervention target
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Health Sub-centres</p>
          <p className="text-2xl font-black text-teal-700 mt-1">142 PHCs</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Streaming over offline SQLite sync</p>
        </div>
      </div>

      {/* Main Map & District Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Choropleth Map Canvas */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                North Eastern Region Osteoarthritis Risk Heatmap
              </h3>
              <p className="text-xs text-slate-500">
                Click any state node to inspect district-level risk density and livelihood clusters
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> &lt;24%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span> 24-28%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block"></span> 28-32%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-red-600 inline-block"></span> &gt;32%
              </span>
            </div>
          </div>

          {/* SVG Map Layout */}
          <div className="relative bg-slate-50 rounded-xl p-4 border border-slate-100 overflow-hidden">
            <svg viewBox="100 80 500 420" className="w-full h-auto drop-shadow-sm">
              {/* Regional Outline Background */}
              <path
                d="M 170,160 L 250,140 L 280,180 L 370,170 L 440,110 L 520,130 L 540,210 L 510,290 L 460,370 L 410,470 L 370,440 L 350,380 L 300,340 L 240,320 L 190,240 Z"
                fill="#f1f5f9"
                stroke="#cbd5e1"
                strokeWidth="2"
              />

              {/* State Nodes & Polygonal Cards */}
              {NER_STATES_GIS.map((s) => {
                const isSelected = selectedState.stateCode === s.stateCode;
                const nodeColor = getHeatmapColor(s.prevalencePercentage);

                return (
                  <g
                    key={s.stateCode}
                    onClick={() => setSelectedState(s)}
                    className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        cx={s.svgCentroid.x}
                        cy={s.svgCentroid.y}
                        r="32"
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Node Circle */}
                    <circle
                      cx={s.svgCentroid.x}
                      cy={s.svgCentroid.y}
                      r="22"
                      fill={nodeColor}
                      stroke="#ffffff"
                      strokeWidth="3"
                      className="shadow-md"
                    />

                    {/* State Code Label */}
                    <text
                      x={s.svgCentroid.x}
                      y={s.svgCentroid.y + 4}
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {s.stateCode}
                    </text>

                    {/* Name and Prevalence Label Tag */}
                    <rect
                      x={s.svgCentroid.x - 42}
                      y={s.svgCentroid.y + 26}
                      width="84"
                      height="18"
                      rx="4"
                      fill={isSelected ? "#0f172a" : "#ffffff"}
                      stroke={isSelected ? "#0f172a" : "#cbd5e1"}
                      strokeWidth="1"
                    />
                    <text
                      x={s.svgCentroid.x}
                      y={s.svgCentroid.y + 39}
                      fill={isSelected ? "#ffffff" : "#1e293b"}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {s.stateName.split(" ")[0]} ({s.prevalencePercentage}%)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected State & District Detail Panel */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                  State Focus
                </span>
                <h3 className="text-xl font-bold text-slate-800 mt-1">{selectedState.stateName}</h3>
                <p className="text-xs text-slate-500">Capital: {selectedState.capital}</p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-rose-600">
                  {selectedState.prevalencePercentage}%
                </span>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">OA Risk Index</p>
              </div>
            </div>

            {/* Risk Breakdown Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
                <span>Screened Cohort: {selectedState.screenedCount}</span>
                <span>High Risk: {selectedState.highRiskCount}</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100">
                <div
                  style={{ width: `${(selectedState.highRiskCount / selectedState.screenedCount) * 100}%` }}
                  className="bg-rose-500 h-full"
                  title="High Risk (Red)"
                />
                <div
                  style={{ width: `${(selectedState.moderateRiskCount / selectedState.screenedCount) * 100}%` }}
                  className="bg-amber-500 h-full"
                  title="Moderate (Yellow)"
                />
                <div
                  style={{ width: `${(selectedState.lowRiskCount / selectedState.screenedCount) * 100}%` }}
                  className="bg-emerald-500 h-full"
                  title="Low Risk (Green)"
                />
              </div>
            </div>

            {/* District Breakdown */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                District Vulnerability & High-Risk Occupations
              </h4>
              <div className="space-y-2.5">
                {selectedState.districts.map((d) => (
                  <div
                    key={d.name}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{d.name}</span>
                      <span className="text-xs font-bold text-rose-600">{d.prevalence}% OA</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Screened: {d.screened}</span>
                      <span className="font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                        {d.highRiskOccupation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Data synced via Saathi Mobile Offline Store-and-Forward</span>
            <span className="font-bold text-teal-700">SIH 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
