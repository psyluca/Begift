/**
 * /api/admin/catalog/sync
 *
 * Endpoint per triggerare un import del catalogo GetYourGuide.
 *
 * Modalita':
 *   - GET con header `Authorization: Bearer <CRON_SECRET>` → cron Vercel
 *   - POST con stessa auth → trigger manuale da admin UI
 *
 * Risposta (200):
 *   {
 *     run_id: "...",
 *     stats: { fetched, filtered, inserted, updated, skipped, errors, ... }
 *   }
 *
 * Errori:
 *   - 401 Unauthorized se CRON_SECRET mancante o errato
 *   - 503 se la feature flag NEXT_PUBLIC_FEATURE_CATALOG_IMPORT non e' "true"
 *   - 500 con dettaglio errore se l'importer fallisce
 *
 * NOTA: l'importer ha una "mock mode" che si attiva quando GYG_PARTNER_API_KEY
 * non e' settata. Questo permette di testare la pipeline end-to-end (audit,
 * upsert, UI admin) prima di avere le credenziali GYG.
 */

import { NextRequest, NextResponse } from "next/server";
import { runImportWithAudit } from "@/lib/catalog/gyg_importer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min per consentire import lunghi

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function featureDisabled() {
  return NextResponse.json(
    {
      error: "feature_disabled",
      hint: "Set NEXT_PUBLIC_FEATURE_CATALOG_IMPORT=true to enable.",
    },
    { status: 503 }
  );
}

function checkAuth(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return false;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

async function runImport(trigger: "cron" | "manual", req: NextRequest) {
  if (process.env.NEXT_PUBLIC_FEATURE_CATALOG_IMPORT !== "true") {
    return featureDisabled();
  }
  if (!checkAuth(req)) return unauthorized();

  // Opzioni passate via query string (es. ?dryRun=1, ?minRating=4.5)
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const minRating = url.searchParams.get("minRating")
    ? parseFloat(url.searchParams.get("minRating")!)
    : undefined;
  const minReviews = url.searchParams.get("minReviews")
    ? parseInt(url.searchParams.get("minReviews")!, 10)
    : undefined;
  const maxPages = url.searchParams.get("maxPages")
    ? parseInt(url.searchParams.get("maxPages")!, 10)
    : undefined;
  const countries = url.searchParams.get("countries")
    ? url.searchParams.get("countries")!.split(",")
    : undefined;

  try {
    const result = await runImportWithAudit(trigger, {
      dryRun,
      minRating,
      minReviews,
      maxPages,
      countries,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      { error: "import_failed", message: msg },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return runImport("cron", req);
}

export async function POST(req: NextRequest) {
  return runImport("manual", req);
}
