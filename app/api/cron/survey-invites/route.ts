/**
 * GET /api/cron/survey-invites
 *
 * Cron giornaliero (10:00 UTC = 12:00 CET, fascia di pranzo italiana
 * dove il tasso di apertura email B2C è tra i piu' alti).
 *
 * Logica:
 *  1. Trova tutti i `gift_opens` con `opened_at` tra 24h e 48h fa
 *  2. JOIN gifts per ottenere `creator_id` + `recipient_name`
 *  3. Per ogni creator unique:
 *      - Skip se ha gia' ricevuto la survey (profiles.survey_invite_sent_at non null)
 *      - Skip se notify_email = false
 *      - Altrimenti invia survey via sendSurveyInvite (lock atomico)
 *
 * La logica "24-48h fa" garantisce che:
 *  - L'esperienza e' fresca (non chiediamo dopo settimane)
 *  - Ma non chiediamo subito (evita di interrompere il momento "wow"
 *    della prima apertura, che e' del destinatario non del creator)
 *
 * URL del sondaggio: di default usa il form NATIVO BeGift a
 * /sondaggio (richiesta del 28-04-2026: sostituiti Tally + Zapier
 * con un form interno per evitare dipendenze a piano Pro / terze
 * parti). Override: SURVEY_TALLY_URL env var, se settata punta a
 * un form esterno (es. Tally) — utile per A/B test futuri.
 *
 * Auth: stesso schema CRON_SECRET di altri cron.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendSurveyInvite } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://begift.app";
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  // URL base del sondaggio: priorita' a env var Tally se settata,
  // altrimenti default al form nativo BeGift /sondaggio.
  const surveyBaseUrl = process.env.SURVEY_TALLY_URL || `${getAppUrl()}/sondaggio`;

  const admin = createSupabaseAdmin();
  const now = Date.now();
  const d24 = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const d48 = new Date(now - 48 * 60 * 60 * 1000).toISOString();

  // Step 1: gift_opens 24-48h fa
  const { data: opens, error: opensErr } = await admin
    .from("gift_opens")
    .select("gift_id, opened_at")
    .gte("opened_at", d48)
    .lt("opened_at", d24);
  if (opensErr) {
    console.error("[cron/survey-invites] opens query error", opensErr);
    return NextResponse.json({ error: "server", detail: opensErr.message }, { status: 500 });
  }
  if (!opens || opens.length === 0) {
    return NextResponse.json({ checked: 0, sent: 0, skipped: 0 });
  }

  // Step 2: gift IDs unique → fetch gifts to get creator + recipient
  const giftIds = Array.from(new Set(opens.map((o: { gift_id: string }) => o.gift_id)));
  const { data: gifts, error: giftsErr } = await admin
    .from("gifts")
    .select("id, creator_id, recipient_name")
    .in("id", giftIds);
  if (giftsErr) {
    console.error("[cron/survey-invites] gifts query error", giftsErr);
    return NextResponse.json({ error: "server", detail: giftsErr.message }, { status: 500 });
  }

  // Step 3: deduplicate per creator (un creator riceve UNA survey, non
  // una per ogni gift aperto). Tieni il primo gift come "anchor" per
  // personalizzazione recipient_name nel copy.
  type Anchor = { creator_id: string; recipient_name: string | null; gift_id: string };
  const byCreator = new Map<string, Anchor>();
  for (const g of (gifts ?? []) as { id: string; creator_id: string | null; recipient_name: string | null }[]) {
    if (!g.creator_id) continue;
    if (!byCreator.has(g.creator_id)) {
      byCreator.set(g.creator_id, {
        creator_id: g.creator_id,
        recipient_name: g.recipient_name,
        gift_id: g.id,
      });
    }
  }

  // Step 4: invio survey per ogni creator unique
  let sent = 0;
  const skipped = { already_sent: 0, opted_out: 0, no_email: 0, no_api_key: 0, send_failed: 0 };

  // Iterazione compatibile col target ES2015 (no downlevelIteration).
  const anchorList: Anchor[] = [];
  byCreator.forEach((a) => anchorList.push(a));
  for (const anchor of anchorList) {
    // URL sondaggio con hidden fields per associare la risposta
    // (Tally li accetta come query string e li passa nei webhook).
    const url = new URL(surveyBaseUrl);
    url.searchParams.set("userId", anchor.creator_id);
    url.searchParams.set("giftId", anchor.gift_id);
    const surveyUrl = url.toString();

    // Fetch profile name per saluto personalizzato. Best-effort.
    let displayName: string | undefined;
    try {
      const { data: prof } = await admin
        .from("profiles")
        .select("display_name, username")
        .eq("id", anchor.creator_id)
        .single();
      displayName = (prof?.display_name || prof?.username) ?? undefined;
    } catch { /* skip */ }

    const r = await sendSurveyInvite(anchor.creator_id, {
      name: displayName,
      surveyUrl,
      recipientName: anchor.recipient_name ?? undefined,
    });
    if (r.sent) sent++;
    else if (r.reason === "already_sent") skipped.already_sent++;
    else if (r.reason === "opted_out") skipped.opted_out++;
    else if (r.reason === "no_email") skipped.no_email++;
    else if (r.reason === "no_api_key") skipped.no_api_key++;
    else skipped.send_failed++;

    // Pausa minima per non saturare rate Resend (5 mail/s su free tier)
    await new Promise((resolve) => setTimeout(resolve, 220));
  }

  return NextResponse.json({
    checked: byCreator.size,
    sent,
    skipped,
  });
}
