# Saathi MSK Central Web Portal & Epidemiological Dashboard

**Next.js 14 App Router Clinical Specialist Hub, GIS Risk Heatmap & Ingestion API**  
*Problem Statement ID: 26004 | Smart India Hackathon (SIH 2026)*

---

## 1. Modules & Routes

1. **`/dashboard/gis` (North Eastern Region GIS Heatmap):**
   - Interactive SVG/Canvas choropleth covering all 8 NER states (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura).
   - Real-time prevalence color mapping with district breakdown and high-risk occupational clustering.
2. **`/dashboard/specialist` (Doctor Review Hub & Patient Dossier):**
   - Filterable triage queue (Red / Yellow / Green badges, search by Name or ABHA ID).
   - Comprehensive Patient Dossier Modal: Dynamic 100 Hz kinematic curve viewer ($\theta_{\text{rel}}$, $\omega_{\text{peak}}$, $\theta_{\text{crit}}$ hesitation marker), optical posture findings, and specialist prescription sign-off.
3. **`/dashboard/analytics` (Epidemiological Cross-Tabulation):**
   - OA severity vs. occupational clusters (Tea Garden Pluckers, Hill Transport Drivers, Handloom Artisans, Terraced Farmers, Sedentary Staff).
   - Correlation with BMI bands and age distributions.
4. **`/api/sync` (Store-and-Forward Ingestion Endpoint):**
   - HTTP `POST` endpoint receiving compressed batch JSON screening records from the mobile tablets.
   - Validates schema, stores into the central database, and issues synchronization receipts (`RCP-...`).
   - HTTP `GET` endpoint returning service telemetry and triage cohort statistics.

---

## 2. Local Setup & Execution

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm or yarn

### Commands
```bash
cd web_dashboard

# Install dependencies
npm install

# Launch Next.js local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
