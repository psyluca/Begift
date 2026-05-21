/**
 * /api/admin/catalog/runs
 *
 * GET:  ritorna le ultime 30 sync runs (ordine started_at DESC).
 * POST: triggera una nuova sync manuale (run completa, anche con dryRun=1).
 *
 * Auth: admin user (whitelist ADMIN_EMAILS), NON CRON_SECRET. Quel secret
 * resta per Vercel cron + invocazioni server-to-server (vedi
 * /api/admin/catalog/sync e /api/cron/catalog-sync). Qui Luca opera da
 * browser con sessione admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { runImportWithAudit } from "@/lib/catalog/gyg_importer";
import { runAwinImportWithAudit } from "@/lib/catalog/awin_feed_importer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireAdmin(req: NextRequest): Promise<{
  ok: true;
  email: string;
  userId: string | null;
} | { ok: false; res: NextResponse }> {
  let email: string | null = null;
  let userId: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) {
      email = data.user.email ?? null;
      userId = data.user.id;
    }
  }
  if (!email) {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
    userId = data.user?.id ?? null;
  }
  if (!isAdminEmail(email)) {
    return {
      ok: false,
      res: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, email: email!, userId };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("catalog_sync_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Conteggi catalogo correnti per partner+source
  const { data: counts } = await admin
    .from("experiences")
    .select("source, partner_id")
    .eq("active", true);

  const summary = (counts || []).reduce<Record<string, number>>((acc, r) => {
    const k = `${r.source || "manual"}`;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ runs: data || [], catalog_counts: summary });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  if (process.env.NEXT_PUBLIC_FEATURE_CATALOG_IMPORT !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  // ?merchant=gyg → import GetYourGuide via Partner API
  // ?merchant=vvt → import VivaTicket via Awin Product Feed
  // default → gyg (back-compat con bottone unico precedente)
  const merchant = (url.searchParams.get("merchant") || "gyg").toLowerCase();

  try {
    let result;
    if (merchant === "vvt" || merchant === "vivaticket") {
      result = await runAwinImportWithAudit(
        "manual",
        "vivaticket",
        { dryRun },
        auth.userId || null
      );
    } else {
      result = await runImportWithAudit(
        "manual",
        { dryRun },
        auth.userId || null
      );
    }
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "import_failed", message: (e as Error).message },
      { status: 500 }
    );
  }
}
