/**
 * GET /api/cron/catalog-sync
 *
 * Cron job giornaliero (Vercel cron: 0 2 * * * UTC = 04:00 Roma estate).
 * Triggera l'importer GetYourGuide via la stessa logica di /api/admin/catalog/sync.
 *
 * Auth: header `Authorization: Bearer <CRON_SECRET>` (Vercel lo passa
 * automaticamente per i cron configurati in vercel.json).
 *
 * Tenuto separato dall'endpoint admin per due ragioni:
 *   1. Naming convenzione del progetto: tutti gli altri cron stanno
 *      sotto /api/cron/{name} (vedi cleanup-drafts, birthday-reminders).
 *   2. Permette di abilitare/disabilitare il cron senza toccare
 *      l'endpoint manuale (e viceversa).
 */

import { NextRequest, NextResponse } from "next/server";
import { runImportWithAudit } from "@/lib/catalog/gyg_importer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_FEATURE_CATALOG_IMPORT !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runImportWithAudit("cron");
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "import_failed", message: (e as Error).message },
      { status: 500 }
    );
  }
}
