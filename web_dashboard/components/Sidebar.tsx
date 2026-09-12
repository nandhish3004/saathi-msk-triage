"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  ClipboardCheck,
  BarChart3,
  CloudUpload,
  HeartPulse,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  {
    name: "NER GIS Heatmap",
    href: "/dashboard/gis",
    icon: MapPin,
    badge: "8 States",
  },
  {
    name: "Doctor Review Queue",
    href: "/dashboard/specialist",
    icon: ClipboardCheck,
    badge: "Specialist",
  },
  {
    name: "Epidemiological Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    badge: "Public Health",
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Clinical Modules
          </p>
          <nav className="mt-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? "bg-teal-700 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            System & Sync
          </p>
          <div className="mt-2 px-3 py-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
              <CloudUpload className="w-3.5 h-3.5 text-teal-600" />
              <span>Mobile Sync Receiver</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              POST JSON endpoint active at <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-mono">/api/sync</code>
            </p>
            <a
              href="/api/sync"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline"
            >
              Inspect Status JSON <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-gradient-to-br from-teal-900 to-teal-800 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <HeartPulse className="w-4 h-4 text-teal-300" />
          <span className="text-xs font-bold">Saathi Edge AI</span>
        </div>
        <p className="text-[11px] text-teal-200">
          SIH 2026 Problem 26004 • Dual MPU-6050 100 Hz kinematic edge screening.
        </p>
      </div>
    </aside>
  );
};
