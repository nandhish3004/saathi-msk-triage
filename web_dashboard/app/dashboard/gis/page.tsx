import React from "react";
import { NerGisMap } from "@/components/NerGisMap";

export default function GisDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            North Eastern Region GIS Heatmap
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            District-level Osteoarthritis prevalence and triage density across Assam, AP, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
            Live Field Telemetry
          </span>
        </div>
      </div>

      <NerGisMap />
    </div>
  );
}
