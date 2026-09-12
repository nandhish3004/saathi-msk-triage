"use client";

import React from "react";
import { Activity, Bell, ShieldCheck, UserCircle2 } from "lucide-react";

export const Navbar: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/30">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
            Saathi MSK
            <span className="text-[11px] font-semibold tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
              NER PORTAL
            </span>
          </h1>
          <p className="text-[11px] text-slate-500">
            SIH Problem Statement 26004 • Universal MSK Kinematics & Triage
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sync Gateway Online (100 Hz Ingestion)</span>
        </div>

        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg relative">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 bg-red-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white"></span>
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs border border-slate-300">
            DR
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-800">Dr. Janani Borah, MS</p>
            <p className="text-[10px] text-slate-500">Orthopedic Specialist • GMCH</p>
          </div>
        </div>
      </div>
    </header>
  );
};
