import Link from "next/link";
import {
  Activity,
  MapPin,
  ClipboardCheck,
  ArrowRight,
  HeartPulse,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Hero Header */}
      <header className="border-b border-slate-800 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/30">
            <Activity className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight">
              Saathi MSK Triage
            </h1>
            <p className="text-xs text-teal-400 font-medium">
              Rural North Eastern Region Kinematics Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            SIH ID: 26004
          </span>

          <span className="text-xs bg-teal-950 text-teal-300 border border-teal-800 px-3 py-1 rounded-full font-semibold">
            100% Offline-Capable Edge-AI
          </span>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 mb-6">
          <HeartPulse className="w-4 h-4 text-rose-400" />
          <span>
            Universal 2-Pod IMU Harness • Reconfigurable Across Any Joint
          </span>
        </div>

        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
          AI-Assisted Musculoskeletal Joint Kinematics & Triage System
        </h2>

        <p className="mt-4 text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Screening rural populations across Assam, Arunachal Pradesh,
          Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura.
          Real-time 100 Hz relative angular excursion (theta rel),
          hesitation arc detection (theta crit), and INT8 on-device neural
          triage.
        </p>

        {/* Action Gateways */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
          {/* GIS Dashboard */}
          <Link
            href="/dashboard/gis"
            className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-teal-500 hover:bg-slate-800 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors flex items-center justify-between">
              <span>8-State NER GIS Heatmap</span>
              <ArrowRight className="w-4 h-4" />
            </h3>

            <p className="mt-2 text-xs text-slate-400">
              Interactive district-level choropleth showing OA risk density
              and tea-worker / hill-porter clusters.
            </p>
          </Link>

          {/* Specialist Dashboard */}
          <Link
            href="/dashboard/specialist"
            className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ClipboardCheck className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors flex items-center justify-between">
              <span>Doctor Specialist Portal</span>
              <ArrowRight className="w-4 h-4" />
            </h3>

            <p className="mt-2 text-xs text-slate-400">
              Review high-risk referred dossiers, examine 100 Hz kinematic
              flexion curves, and authorize clinical referral slips.
            </p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-8 py-4 text-center text-xs text-slate-500">
        Smart India Hackathon 2026 • Problem Statement 26004 • Built for
        Health Workers & Specialists in the North East
      </footer>
    </div>
  );
}