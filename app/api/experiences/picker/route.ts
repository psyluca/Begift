/**
 * POST /api/experiences/picker
 *
 * Smart Gift Picker endpoint. Riceve i criteri di selezione del sender
 * dal flusso /picker e ritorna 4 esperienze rankate dall'algoritmo
 * lib/experiences/picker.ts.
 *
 * Body JSON:
 *   {
 *     recipientName: string;
 *     interests: PickerInterest[];      // 1-3 elementi tipico
 *     occasion: PickerOccasion;
 *     budgetCents: number;              // es. 5000, 10000, 20000
 *     targetCount?: number;             // default 4
 *     recentlyShown?: string[];         // experience ids gia' visti
 *   }
 *
 * Endpoint pubblico (no auth richiesta) — il picker e' onboarding-soft,
 * il sender ancora non si e' iscritto. Feature flag identico al
 * catalogo /discover: NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP=true.
 *
 * Privacy: il body non viene loggato, nessun PII salvato. Solo log di
 * un summary (n. interests, occasion, budget bucket) per analytics.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  pickGifts,
  type PickerInterest,
  type PickerOccasion,
} from "@/lib/experiences/picker";
import type { ExperienceWithPartner } from "@/types/experiences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const VALID_INTERESTS: PickerInterest[] = [
  "music",
  "food",
  "travel",
  "culture",
  "wellness",
  "sport",
];

const VALID_OCCASIONS: PickerOccasion[] = [
  "anniversary",
  "birthday",
  "valentine",
  "graduation",
  "thanks",
  "mothers_day",
  "fathers_day",
  "just_because",
];

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  // Parse body con guard-rails (l'input arriva dal client, non fidarti)
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const recipientName =
    typeof body.recipientName === "string" ? body.recipientName.trim().slice(0, 60) : "";

  const rawInterests = Array.isArray(body.interests) ? body.interests : [];
  const interests = (rawInterests as unknown[])
    .filter((v): v is string => typeof v === "string")
    .filter((v): v is PickerInterest => VALID_INTERESTS.includes(v as PickerInterest))
    .slice(0, 6); // hard cap, evita abuse

  const rawOccasion = typeof body.occasion === "string" ? body.occasion : "just_because";
  const occasion: PickerOccasion = VALID_OCCASIONS.includes(rawOccasion as PickerOccasion)
    ? (rawOccasion as PickerOccasion)
    : "just_because";

  const rawBudget =
    typeof body.budgetCents === "number" && Number.isFinite(body.budgetCents)
      ? body.budgetCents
      : 10000;
  const budgetCents = Math.min(Math.max(rawBudget, 1000), 100000); // 10€ .. 1000€

  const rawTarget = typeof body.targetCount === "number" ? body.targetCount : 4;
  const targetCount = Math.min(Math.max(rawTarget, 1), 12);

  const recentlyShownArr = Array.isArray(body.recentlyShown)
    ? (body.recentlyShown as unknown[]).filter((v): v is string => typeof v === "string")
    : [];
  const recentlyShown = new Set(recentlyShownArr);

  // Fetch catalogo attivo. Limit alto perche' lo scoring e' in-memory
  // ed il catalogo e' piccolo (<100). Se cresce > 500 considerare
  // pre-filtering via SQL (city, priceMax) prima dello scoring.
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("experiences")
    .select("*, partner:experience_partners(slug, display_name)")
    .eq("active", true)
    .limit(200);

  if (error) {
    console.error("[picker] DB error:", error.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const items = ((data || []) as Array<Record<string, unknown>>).map((row) => {
    const rawPartner = row.partner;
    const partner = Array.isArray(rawPartner) ? rawPartner[0] : rawPartner;
    return { ...row, partner } as unknown as ExperienceWithPartner;
  });

  const ranked = pickGifts(items, {
    recipientName,
    interests,
    occasion,
    budgetCents,
  }, { recentlyShown, targetCount });

  // Log compatto per capire l'uso senza salvare PII
  console.log(
    `[picker] interests=${interests.length} occ=${occasion} ` +
      `budget=${budgetCents} pool=${items.length} returned=${ranked.length}`
  );

  return NextResponse.json({
    items: ranked.map((s) => ({
      experience: s.experience,
      score: Math.round(s.score * 10) / 10,
      reasons: s.reasons,
    })),
    meta: {
      pool_size: items.length,
      target_count: targetCount,
      occasion,
      budget_cents: budgetCents,
    },
  });
}
