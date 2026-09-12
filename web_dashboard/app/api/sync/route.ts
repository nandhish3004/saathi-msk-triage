import { NextRequest, NextResponse } from "next/server";
import { addSyncedRecords, getScreenings } from "@/lib/mock_database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !Array.isArray(body.records)) {
      return NextResponse.json(
        { error: "Invalid payload: 'records' must be an array of screening objects." },
        { status: 400 }
      );
    }

    const records = body.records;
    const insertedCount = addSyncedRecords(records);

    return NextResponse.json(
      {
        success: true,
        message: `Successfully ingested ${insertedCount} screening records into Saathi Cloud DB.`,
        synced_count: insertedCount,
        sync_receipt_id: `RCP-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in /api/sync ingestion:", error);
    return NextResponse.json(
      { error: "Failed to parse batch JSON sync payload", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const currentRecords = getScreenings();
  return NextResponse.json({
    status: "online",
    endpoint: "/api/sync",
    service: "Saathi MSK Triage Ingestion API",
    total_screenings_in_db: currentRecords.length,
    high_risk_count: currentRecords.filter((s) => s.triageClass === "Red").length,
    moderate_risk_count: currentRecords.filter((s) => s.triageClass === "Yellow").length,
    low_risk_count: currentRecords.filter((s) => s.triageClass === "Green").length,
  });
}
