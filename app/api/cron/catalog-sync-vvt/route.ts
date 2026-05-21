/**
 * GET /api/cron/catalog-sync-vvt
 *
 * Cron daily VivaTicket via Awin Product Feed.
 * Schedule: vercel.json → "30 2 * * *" UTC (sfasato 30min dal GYG cron).
 *
 * Auth: Bearer CRON_SECRET (uguale agli altri cron del progetto).
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_CATALOG_IMPORT=true.
 */

import { NextRequest, NextResponse } from "next/server";
import { runAwinImportWithAudit } from "@/lib/catalog/awin_feed_importer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_FEATURE_CATALOG_IMPORT !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") || "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runAwinImportWithAudit("cron", "vivaticket");
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "import_failed", message: (e as Error).message },
      { status: 500 }
    );
  }
}
