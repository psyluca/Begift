/**
 * GET /api/admin/survey
 *
 * Aggrega le risposte del sondaggio post-gift per la pagina admin.
 *
 * Auth: ADMIN_EMAILS (stesso pattern delle altre route admin).
 *
 * Response shape:
 *   {
 *     stats: {
 *       total: N,
 *       avg_experience_rating: 4.2,
 *       avg_nps: 7.5,
 *       nps_score: 42,           // % promoter - % detractor
 *       would_pay_breakdown: { yes_worth_it: 5, yes_low: 8, ... },
 *       voucher_interest_breakdown: { very_useful: 10, ... },
 *       van_westendorp: {
 *         too_expensive: 25.5,
 *         expensive_but_worth: 15.2,
 *         good_deal: 8.4,
 *         too_cheap: 3.1
 *       },
 *       top_recipients: [{ type: "Mamma", count: 18 }, ...],
 *       top_occasions: [{ occasion: "Festa Mamma", count: 22 }, ...],
 *     },
 *     responses: [
 *       {
 *         id, created_at, source, payload,
 *         creator: { id, display_name, username, email } | null,
 *         gift: { id, recipient_name, template_type } | null,
 *       },
 *       ...
 *     ]
 *   }
 *
 * Niente paginazione per ora (volumi attesi: <500 risposte nei
 * primi 6 mesi). Quando supereremo i 1000, aggiungeremo limit+offset.
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface AnswersShape {
  recipient_type?: string;
  occasion?: string;
  experience_rating?: number;
  nps_score?: number;
  would_pay?: string;
  voucher_interest?: string;
  price_too_expensive?: number;
  price_expensive_but_worth?: number;
  price_good_deal?: number;
  price_too_cheap?: number;
}

function answersOf(payload: unknown): AnswersShape {
  if (!payload || typeof payload !== "object") return {};
  const p = payload as { answers?: AnswersShape };
  return p.answers || {};
}

export async function GET(req: NextRequest) {
  // Auth: Bearer prima, cookie fallback (stesso pattern di /api/admin/stats)
  let email: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) email = data.user.email ?? null;
  }
  if (!email) {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  }
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();

  // Fetch risposte (ordinate per data desc)
  const { data: rawResponses, error } = await admin
    .from("survey_responses")
    .select("id, user_id, gift_id, survey_id, source, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("[admin/survey] query error", error);
    return NextResponse.json({ error: "server", detail: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    user_id: string | null;
    gift_id: string | null;
    survey_id: string;
    source: string | null;
    payload: unknown;
    created_at: string;
  };

  const responses: Row[] = (rawResponses ?? []) as Row[];

  // Fetch profiles + gifts in batch per gli IDs unique
  const userIds = Array.from(new Set(responses.map((r) => r.user_id).filter((id): id is string => !!id)));
  const giftIds = Array.from(new Set(responses.map((r) => r.gift_id).filter((id): id is string => !!id)));

  const profileMap = new Map<string, { id: string; display_name: string | null; username: string | null; email: string | null }>();
  if (userIds.length > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, display_name, username, email")
      .in("id", userIds);
    (profs ?? []).forEach((p: { id: string; display_name: string | null; username: string | null; email: string | null }) => profileMap.set(p.id, p));
  }

  const giftMap = new Map<string, { id: string; recipient_name: string | null; template_type: string | null }>();
  if (giftIds.length > 0) {
    const { data: gs } = await admin
      .from("gifts")
      .select("id, recipient_name, template_type")
      .in("id", giftIds);
    (gs ?? []).forEach((g: { id: string; recipient_name: string | null; template_type: string | null }) => giftMap.set(g.id, g));
  }

  // Enrichment lato server (più semplice del client)
  const enriched = responses.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    survey_id: r.survey_id,
    source: r.source,
    payload: r.payload,
    creator: r.user_id ? profileMap.get(r.user_id) ?? null : null,
    gift: r.gift_id ? giftMap.get(r.gift_id) ?? null : null,
  }));

  // ── Stats aggregati ────────────────────────────────────────────
  const total = responses.length;

  // Avg experience rating (Q3, scala 1-5)
  const ratings = responses.map((r) => answersOf(r.payload).experience_rating).filter((v): v is number => typeof v === "number");
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  // NPS (Q17, scala 0-10)
  const npsScores = responses.map((r) => answersOf(r.payload).nps_score).filter((v): v is number => typeof v === "number");
  const avgNps = npsScores.length > 0 ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length : 0;
  const promoters = npsScores.filter((s) => s >= 9).length;
  const detractors = npsScores.filter((s) => s <= 6).length;
  const npsScore = npsScores.length > 0 ? Math.round((promoters - detractors) / npsScores.length * 100) : 0;

  // Would-pay breakdown
  const wouldPayBreakdown: Record<string, number> = {};
  responses.forEach((r) => {
    const v = answersOf(r.payload).would_pay;
    if (v) wouldPayBreakdown[v] = (wouldPayBreakdown[v] || 0) + 1;
  });

  // Voucher interest breakdown
  const voucherInterestBreakdown: Record<string, number> = {};
  responses.forEach((r) => {
    const v = answersOf(r.payload).voucher_interest;
    if (v) voucherInterestBreakdown[v] = (voucherInterestBreakdown[v] || 0) + 1;
  });

  // Van Westendorp medie (solo per chi ha risposto NON "vorrei sempre gratis")
  const vwResponses = responses.filter((r) => {
    const a = answersOf(r.payload);
    return a.would_pay !== "no_free" && typeof a.price_too_expensive === "number";
  });
  const vwAvg = (key: keyof AnswersShape) => {
    const vals = vwResponses.map((r) => answersOf(r.payload)[key]).filter((v): v is number => typeof v === "number");
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const vanWestendorp = {
    n: vwResponses.length,
    too_expensive: vwAvg("price_too_expensive"),
    expensive_but_worth: vwAvg("price_expensive_but_worth"),
    good_deal: vwAvg("price_good_deal"),
    too_cheap: vwAvg("price_too_cheap"),
  };

  // Top recipients
  const recipientCounts: Record<string, number> = {};
  responses.forEach((r) => {
    const v = answersOf(r.payload).recipient_type;
    if (v) recipientCounts[v] = (recipientCounts[v] || 0) + 1;
  });
  const topRecipients = Object.entries(recipientCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Top occasions
  const occasionCounts: Record<string, number> = {};
  responses.forEach((r) => {
    const v = answersOf(r.payload).occasion;
    if (v) occasionCounts[v] = (occasionCounts[v] || 0) + 1;
  });
  const topOccasions = Object.entries(occasionCounts)
    .map(([occasion, count]) => ({ occasion, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    stats: {
      total,
      avg_experience_rating: Number(avgRating.toFixed(2)),
      avg_nps: Number(avgNps.toFixed(2)),
      nps_score: npsScore,
      would_pay_breakdown: wouldPayBreakdown,
      voucher_interest_breakdown: voucherInterestBreakdown,
      van_westendorp: vanWestendorp,
      top_recipients: topRecipients,
      top_occasions: topOccasions,
    },
    responses: enriched,
  });
}
