/**
 * POST /api/reports
 *
 * Accetta segnalazioni di contenuti inappropriati su regali.
 * Requisito DSA art. 16 "notice and action mechanism".
 *
 * Non richiede auth: chiunque (anche anonimi) può segnalare. Se c'è
 * session, tracciamo reporter_user_id per follow-up + anti-spam.
 *
 * Body: { giftId, category, description? }
 * Response:
 *   200 { ok: true, id }
 *   400 { error: "invalid" }
 *
 * Anti-abuse: rate limit in-memory (max 5 report/15min per IP).
 * Limite morbido: evita troll che spammano segnalazioni false.
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_CATEGORIES = ["illegal", "disturbing", "spam", "copyright", "privacy", "other"] as const;
type Category = typeof VALID_CATEGORIES[number];

// Rate limit in-memory (OK per deploy single-region). Map: ip → [timestamp]
const recentReports = new Map<string, number[]>();
const RATE_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = recentReports.get(ip) || [];
  const recent = arr.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  recentReports.set(ip, recent);
  // Cleanup map se diventa grande (best-effort)
  if (recentReports.size > 5000) {
    recentReports.forEach((v: number[], k: string) => {
      if (v.every((t: number) => now - t >= WINDOW_MS)) recentReports.delete(k);
    });
  }
  return false;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const giftId: string | undefined = body?.giftId;
  const category: string | undefined = body?.category;
  const description: string | undefined = body?.description;

  if (!giftId || typeof giftId !== "string") {
    return NextResponse.json({ error: "giftId required" }, { status: 400 });
  }
  if (!category || !VALID_CATEGORIES.includes(category as Category)) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }
  if (description && description.length > 2000) {
    return NextResponse.json({ error: "description too long" }, { status: 400 });
  }

  // Client IP: Vercel popola x-forwarded-for
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "rate_limited", message: "Troppe segnalazioni da questo IP. Riprova tra 15 minuti." },
      { status: 429 }
    );
  }

  // Resolve user ID se c'è session (best-effort, non obbligatorio)
  let reporterUserId: string | null = null;
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const admin = createSupabaseAdmin();
      const { data } = await admin.auth.getUser(token);
      reporterUserId = data.user?.id ?? null;
    }
    if (!reporterUserId) {
      const supabase = createSupabaseServer();
      const { data } = await supabase.auth.getUser();
      reporterUserId = data.user?.id ?? null;
    }
  } catch { /* anonymous report, OK */ }

  const userAgent = req.headers.get("user-agent") || null;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("reports")
    .insert({
      gift_id: giftId,
      reporter_user_id: reporterUserId,
      category,
      description: description?.trim() || null,
      reporter_ip: ip,
      reporter_ua: userAgent,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[reports] insert error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
