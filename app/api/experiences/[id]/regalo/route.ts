/**
 * POST /api/experiences/[id]/regalo
 *
 * Crea un gift wrappato attorno a un'esperienza del catalogo.
 *
 * Pattern parallelo a /api/draft/[id]/complete (email parser POC):
 *   1. Verifica auth utente
 *   2. Carica experience + partner
 *   3. Genera tracking_id univoco per il futuro click
 *   4. Risolve affiliate_url_template con tracking_id
 *   5. Crea record in `gifts` con content_type=link e content_url
 *      che punta al short URL /r/{token} (NON al partner diretto: cosi'
 *      passiamo dal nostro endpoint per logging+attribution)
 *   6. Salva tracking_id↔gift_id mapping per /r/[token] resolver
 *      (per ora: storage in `experience_clicks` con conversion null
 *      e lazy lookup; vedi SPEC per soluzione production-grade con
 *      tabella `experience_short_links` dedicata)
 *
 * Body: { recipient_name, message, source? }
 * Response: { gift_id, tracking_url, experience_title, partner_display_name }
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import {
  PARTNERS,
  resolveAffiliateUrl,
} from "@/lib/experiences/partners";
import { generateTrackingId } from "@/lib/experiences/tracking";
import type {
  CreateGiftFromExperienceBody,
  CreateGiftFromExperienceResponse,
  PartnerSlug,
} from "@/types/experiences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default packaging (stesso di /api/draft/[id]/complete)
const DEFAULT_PACKAGING = {
  paperColor: "#D85A5A",
  ribbonColor: "#E8C84A",
  bowColor: "#E8C84A",
  bowType: "classic",
  openAnimation: "lift",
  sound: "bells",
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  // Auth
  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // Body
  let body: CreateGiftFromExperienceBody;
  try {
    body = (await req.json()) as CreateGiftFromExperienceBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const recipientName = body.recipient_name?.trim();
  const message = body.message?.trim();
  if (!recipientName || !message) {
    return NextResponse.json(
      { error: "missing_fields" },
      { status: 400 }
    );
  }

  // Fetch experience + partner
  const admin = createSupabaseAdmin();
  const { data: exp, error: expErr } = await admin
    .from("experiences")
    .select("*, partner:experience_partners(slug, display_name)")
    .eq("id", params.id)
    .eq("active", true)
    .maybeSingle();
  if (expErr || !exp) {
    return NextResponse.json(
      { error: "experience_not_found", detail: expErr?.message },
      { status: 404 }
    );
  }

  // Crea il gift PRIMA di avere il tracking_id (perche' tracking_id
  // include gift_id). Hack: usiamo un UUID temporaneo e poi update
  // dopo, oppure generiamo tracking_id dopo l'insert. Scegliamo opzione 2.

  // Build content_text con preview esperienza
  const lines: string[] = [];
  lines.push(exp.title as string);
  if (exp.city) lines.push(`📍 ${exp.city}, ${exp.country}`);
  if (exp.price_min_cents) {
    const priceEur = ((exp.price_min_cents as number) / 100).toFixed(2);
    lines.push(`💶 da €${priceEur}`);
  }
  if (exp.duration_minutes) {
    lines.push(`⏱️ ${exp.duration_minutes as number} minuti`);
  }
  const contentText = lines.join("\n");

  // Insert gift placeholder (content_url verra' settato sotto dopo
  // aver generato il tracking URL)
  const { data: gift, error: giftErr } = await admin
    .from("gifts")
    .insert({
      creator_id: userData.user.id,
      recipient_name: recipientName,
      message,
      packaging: DEFAULT_PACKAGING,
      content_type: exp.image_url ? "image" : "message",
      content_url: exp.image_url || null,
      content_text: contentText,
    })
    .select("id")
    .single();

  if (giftErr || !gift) {
    console.error("[api/experiences/regalo] gift insert failed", giftErr);
    return NextResponse.json(
      { error: "gift_creation_failed", detail: giftErr?.message },
      { status: 500 }
    );
  }

  // Genera tracking_id e short URL
  const trackingId = generateTrackingId(gift.id);

  // Risolve URL affiliate finale (per validare che la config sia OK).
  // Supabase tipa la FK relation come array anche se 1-1, quindi
  // normalizziamo prima.
  const partnerRel = exp.partner as
    | { slug: PartnerSlug; display_name: string }
    | { slug: PartnerSlug; display_name: string }[]
    | null
    | undefined;
  const partnerObj = Array.isArray(partnerRel)
    ? partnerRel[0]
    : partnerRel;
  const partnerSlug = partnerObj?.slug;
  if (!partnerSlug || !PARTNERS[partnerSlug]) {
    return NextResponse.json(
      { error: "partner_misconfigured" },
      { status: 500 }
    );
  }
  const finalUrl = resolveAffiliateUrl(
    exp.affiliate_url_template as string,
    partnerSlug,
    { gift_id: trackingId }
  );
  if (!finalUrl) {
    // Env var del partner non configurata; il gift e' creato ma
    // il tracking sara' rotto. Per il POC procediamo, in prod
    // dovremmo bloccare o avvisare.
    console.warn(
      `[api/experiences/regalo] partner ${partnerSlug} env var missing`
    );
  }

  // Salva il mapping tracking_id → experience/partner come "pre-click"
  // record (con clicked_at futuro = il click vero verra' loggato dal
  // /r/[token]). Per il POC usiamo experience_clicks come storage del
  // mapping. In prod meglio una tabella short_links dedicata.
  // ---
  // Per ora generiamo solo il tracking_url, il record sara' INSERTed
  // al click vero. Il mapping e' impliciti via gift_id + tracking_id
  // (lookup: gift → experience_id via content_url o metadata).

  // Override content_url con il short URL BeGift (passa da /r/[token])
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://begift.app";
  const trackingUrl = `${appUrl}/r/${trackingId}?exp=${exp.id}`;

  await admin
    .from("gifts")
    .update({ content_url: trackingUrl, content_type: "link" })
    .eq("id", gift.id);

  const response: CreateGiftFromExperienceResponse = {
    gift_id: gift.id,
    tracking_url: trackingUrl,
    experience_title: exp.title as string,
    partner_display_name: partnerObj?.display_name || partnerSlug,
  };

  return NextResponse.json(response);
}
