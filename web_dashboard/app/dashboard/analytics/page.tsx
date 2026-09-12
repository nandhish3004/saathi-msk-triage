import React from "react";
import { EpidemiologicalCharts } from "@/components/EpidemiologicalCharts";

export default function AnalyticsDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            Epidemiological Analytics & Cross-Tabulation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Correlating Musculoskeletal Risk severity against occupational clusters (tea workers, drivers, weavers, farmers) and BMI bands.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Cohort: N = 5,190 Screened
          </span>
        </div>
      </div>

      <EpidemiologicalCharts />
    </div>
  );
}
