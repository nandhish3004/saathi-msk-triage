import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saathi MSK | Clinical Triage & NER Epidemiological Portal",
  description: "AI-Assisted Universal MSK Joint Kinematics & Triage System for Rural North Eastern Region (SIH 26004)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
