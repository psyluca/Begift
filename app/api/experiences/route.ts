/**
 * GET /api/experiences
 *
 * Lista esperienze attive con filtri opzionali. Endpoint pubblico
 * (lettura anche da utenti non loggati per discovery anonima).
 *
 * Query string:
 *   ?city=Roma            (filter per citta', ILIKE)
 *   ?category=food        (filter per categoria, exact)
 *   ?tags=foodie,couples  (filter per tag, match ANY)
 *   ?priceMaxCents=10000  (filter prezzo massimo)
 *   ?limit=20             (default 20, max 100)
 *   ?offset=0             (pagination)
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP
 *   Se false, endpoint torna 503 (feature disabilitata) — protegge da
 *   scoperta SEO accidentale durante il dev.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type {
  ExperienceCategory,
  ExperienceListResponse,
} from "@/types/experiences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const url = new URL(req.url);
  const sp = url.searchParams;

  // Parse filtri con bound conservativi
  const city = sp.get("city")?.trim() || undefined;
  const category = (sp.get("category") || undefined) as
    | ExperienceCategory
    | undefined;
  const tagsParam = sp.get("tags") || "";
  const tags = tagsParam
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const priceMaxCents = parseInt(sp.get("priceMaxCents") || "", 10);
  const priceMinCents = parseInt(sp.get("priceMinCents") || "", 10);
  const limit = Math.min(parseInt(sp.get("limit") || "20", 10) || 20, 100);
  const offset = Math.max(parseInt(sp.get("offset") || "0", 10) || 0, 0);

  // Build query
  const admin = createSupabaseAdmin();
  let q = admin
    .from("experiences")
    .select(
      "*, partner:experience_partners(slug, display_name)",
      { count: "exact" }
    )
    .eq("active", true)
    .order("rating", { ascending: false, nullsFirst: false })
    .order("reviews_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (city) q = q.ilike("city", `%${city}%`);
  if (category) q = q.eq("category", category);
  if (tags.length > 0) q = q.overlaps("tags", tags);
  if (Number.isFinite(priceMaxCents))
    q = q.lte("price_min_cents", priceMaxCents);
  if (Number.isFinite(priceMinCents))
    q = q.gte("price_max_cents", priceMinCents);

  const { data, error, count } = await q;

  if (error) {
    console.error("[api/experiences] query error", error);
    return NextResponse.json(
      { error: "server", detail: error.message },
      { status: 500 }
    );
  }

  // Normalizza partner: Supabase tipa la FK relation come array
  // anche se 1-1. Riduciamo a singolo oggetto per consumo client.
  const normalizedItems = ((data || []) as Array<Record<string, unknown>>).map(
    (row) => {
      const rawPartner = row.partner;
      const partner = Array.isArray(rawPartner) ? rawPartner[0] : rawPartner;
      return { ...row, partner };
    }
  );

  const body: ExperienceListResponse = {
    items: normalizedItems as unknown as ExperienceListResponse["items"],
    total: count ?? 0,
    filters_applied: {
      city,
      category,
      tags: tags.length > 0 ? (tags as ExperienceListResponse["filters_applied"]["tags"]) : undefined,
      priceMaxCents: Number.isFinite(priceMaxCents) ? priceMaxCents : undefined,
      priceMinCents: Number.isFinite(priceMinCents) ? priceMinCents : undefined,
      limit,
      offset,
    },
  };

  return NextResponse.json(body, {
    headers: {
      // Lista pubblica, ok cachare brevemente (la discovery sta uguale per tutti)
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
