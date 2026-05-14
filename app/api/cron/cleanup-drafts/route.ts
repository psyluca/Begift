/**
 * GET /api/cron/cleanup-drafts
 *
 * Cron job giornaliero che marca come 'expired' i gift_drafts scaduti
 * (oltre la finestra di 30 giorni senza completion).
 *
 * Trigger: Vercel Cron (configurato in vercel.json) o pg_cron Supabase.
 *
 * Auth: header `Authorization: Bearer <CRON_SECRET>`.
 *
 * Operazioni:
 *   1. UPDATE status='expired' WHERE expires_at < now() AND status NOT IN ('completed','expired')
 *   2. (Opzionale) DELETE drafts expired >90 giorni (hard delete per GDPR data minimization)
 *
 * Risposta:
 *   { expired: N, hard_deleted: M }
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  // Auth via CRON_SECRET
  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  // 1) Soft-expire drafts oltre la finestra di 30 giorni
  const nowIso = new Date().toISOString();
  const { data: expired, error: expireErr } = await admin
    .from("gift_drafts")
    .update({ status: "expired" })
    .lt("expires_at", nowIso)
    .not("status", "in", "(completed,expired)")
    .select("id");

  if (expireErr) {
    console.error("[cleanup-drafts] expire error", expireErr);
    return NextResponse.json(
      { error: "expire_failed", detail: expireErr.message },
      { status: 500 }
    );
  }

  // 2) Hard-delete drafts expired da oltre 60 giorni (data minimization GDPR)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data: deleted, error: deleteErr } = await admin
    .from("gift_drafts")
    .delete()
    .eq("status", "expired")
    .lt("expires_at", sixtyDaysAgo)
    .select("id");

  if (deleteErr) {
    console.error("[cleanup-drafts] delete error", deleteErr);
    // Non blocchiamo: l'expire e' gia' fatto
  }

  return NextResponse.json({
    ok: true,
    expired: expired?.length || 0,
    hard_deleted: deleted?.length || 0,
  });
}
