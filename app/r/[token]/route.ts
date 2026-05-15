/**
 * GET /r/[token]?exp={experience_id}
 *
 * Short-link redirect endpoint per click affiliate.
 *
 * Flusso:
 *  1. Riceve token (tracking_id) e exp (experience_id) come query
 *  2. Carica experience + partner
 *  3. Risolve affiliate_url con tracking_id
 *  4. Log click in experience_clicks (hash IP/UA per privacy)
 *  5. Anti-fraud check (count click recenti stesso IP)
 *  6. HTTP 302 redirect a URL partner
 *
 * URL format scelto: /r/[token]?exp=ID invece di /r/[experience]?t=token
 * perche' il token e' la parte "stabile" da loggare; experience_id
 * arriva come query per evitare lookup DB nel resolver gift→experience.
 *
 * In assenza di env var configurate, ritorna 302 a homepage BeGift
 * (graceful degradation).
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  PARTNERS,
  resolveAffiliateUrl,
} from "@/lib/experiences/partners";
import {
  buildClickPayload,
  hashWithSalt,
  countRecentClicksByIp,
} from "@/lib/experiences/tracking";
import type { ClickSource, PartnerSlug } from "@/types/experiences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_URL = "https://begift.app/?utm_source=affiliate_redirect_failed";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  if (process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP !== "true") {
    return NextResponse.redirect(FALLBACK_URL, 302);
  }

  const url = new URL(req.url);
  const experienceId = url.searchParams.get("exp");
  const source = (url.searchParams.get("src") || "gift_open") as ClickSource;
  const giftId = url.searchParams.get("gift");
  const trackingId = params.token;

  if (!experienceId) {
    return NextResponse.redirect(FALLBACK_URL, 302);
  }

  // Fetch experience + partner
  const admin = createSupabaseAdmin();
  const { data: exp, error: expErr } = await admin
    .from("experiences")
    .select(
      "id, partner_id, affiliate_url_template, active, partner:experience_partners(slug)"
    )
    .eq("id", experienceId)
    .maybeSingle();
  if (expErr || !exp || !exp.active) {
    console.warn("[r/token] experience not found/inactive", experienceId);
    return NextResponse.redirect(FALLBACK_URL, 302);
  }

  // Resolve URL affiliate
  const partnerSlug = (exp.partner as { slug: PartnerSlug } | null)?.slug;
  if (!partnerSlug || !PARTNERS[partnerSlug]) {
    console.warn("[r/token] partner misconfigured", partnerSlug);
    return NextResponse.redirect(FALLBACK_URL, 302);
  }
  const finalUrl = resolveAffiliateUrl(
    exp.affiliate_url_template as string,
    partnerSlug,
    { gift_id: trackingId }
  );
  if (!finalUrl) {
    return NextResponse.redirect(FALLBACK_URL, 302);
  }

  // Anti-fraud: skip log e redirect normale se sopra soglia (non blocchiamo
  // il click, solo skippiamo il log per evitare DB bloat)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const ua = req.headers.get("user-agent");
  const ipHash = hashWithSalt(ip);

  let recentCount = 0;
  try {
    recentCount = await countRecentClicksByIp(admin, ipHash, 24);
  } catch (e) {
    console.warn("[r/token] anti-fraud check failed", e);
  }

  if (recentCount < 30) {
    // Log click (best-effort, non blocchiamo redirect se fallisce)
    try {
      const payload = buildClickPayload({
        experienceId: exp.id as string,
        partnerId: exp.partner_id as string,
        giftId: giftId || null,
        trackingId,
        source,
        ip,
        userAgent: ua,
      });
      await admin.from("experience_clicks").insert(payload);
    } catch (e) {
      console.warn("[r/token] click log failed (non-blocking)", e);
    }
  } else {
    console.warn(
      `[r/token] anti-fraud threshold hit for ip_hash ${ipHash?.slice(0, 8)}…, skipping log`
    );
  }

  return NextResponse.redirect(finalUrl, 302);
}
