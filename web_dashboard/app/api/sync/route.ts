import { NextRequest, NextResponse } from "next/server";
import {
  addSyncedRecords,
  getScreenings,
} from "@/lib/mock_database";

/* =========================================================
   POST — Receive screening data from Mobile App
   ========================================================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !Array.isArray(body.records)) {
      return NextResponse.json(
        {
          error:
            "Invalid payload: 'records' must be an array of screening objects.",
        },
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
      {
        error: "Failed to parse batch JSON sync payload",
        details: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET — Return screening records to Specialist Dashboard
   ========================================================= */
export async function GET() {
  const currentRecords = getScreenings();

  return NextResponse.json({
    status: "online",
    endpoint: "/api/sync",
    service: "Saathi MSK Triage Ingestion API",

    total_screenings_in_db: currentRecords.length,

    high_risk_count: currentRecords.filter(
      (s) => s.triageClass === "Red"
    ).length,

    moderate_risk_count: currentRecords.filter(
      (s) => s.triageClass === "Yellow"
    ).length,

    low_risk_count: currentRecords.filter(
      (s) => s.triageClass === "Green"
    ).length,

    records: currentRecords,
  });
}

/* =========================================================
   PATCH — Specialist Referral Sign-Off
   ========================================================= */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      id,
      notes = "",
      signedOff = false,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          error: "Screening ID is required.",
        },
        { status: 400 }
      );
    }

    const currentRecords = getScreenings();

    const screening = currentRecords.find(
      (s) => s.id === id
    );

    if (!screening) {
      return NextResponse.json(
        {
          error: "Screening record not found.",
          screening_id: id,
        },
        { status: 404 }
      );
    }

    /* Update specialist decision */
    screening.specialistNotes = notes;
    screening.isSignedOff = signedOff === true;

    return NextResponse.json({
      success: true,
      message: screening.isSignedOff
        ? "Referral successfully signed off by specialist."
        : "Referral sign-off removed.",

      screening_id: screening.id,
      signed_off: screening.isSignedOff,

      record: screening,

      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error updating specialist sign-off:", error);

    return NextResponse.json(
      {
        error: "Failed to update specialist referral sign-off.",
        details: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}