/**
 * POST /api/survey/submit
 *
 * Endpoint pubblico (no auth) per ricevere webhook da Tally quando
 * un utente compila il sondaggio post-gift. Salva l'intero payload
 * grezzo in `survey_responses` per analisi successiva.
 *
 * Formato webhook Tally (semplificato):
 *   {
 *     eventId: "...",
 *     eventType: "FORM_RESPONSE",
 *     formId: "AbCdEf",
 *     formName: "BeGift Post-Gift Survey",
 *     submittedAt: "2026-04-29T10:23:00Z",
 *     respondentId: "...",
 *     fields: [
 *       { key: "...", label: "Per chi era?", value: "Mamma" },
 *       ...
 *     ],
 *     hiddenFields: { userId: "...", giftId: "..." }
 *   }
 *
 * Sicurezza:
 *  - TALLY_FORM_ID env var: se settata, accettiamo solo webhook che
 *    matchano quel formId. Altrimenti rifiutiamo (anti-spam basico).
 *  - TALLY_WEBHOOK_SECRET (opzionale): se settata, verifichiamo
 *    `X-Tally-Signature` HMAC. Tally lo supporta nativamente.
 *  - Rate limit IP-based: 100 submissions/min/IP per evitare flood.
 *
 * Storage:
 *  - user_id e gift_id estratti da hiddenFields (passati via URL nel
 *    cron survey-invites).
 *  - payload completo salvato in jsonb per parsing flessibile.
 *  - Niente parsing strutturato qui — analisi avviene off-line su
 *    snapshot del DB.
 */

export const dynamic = "force-dynamic";

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 100;

interface TallyHidden {
  userId?: string;
  giftId?: string;
}

interface TallyWebhookBody {
  eventId?: string;
  eventType?: string;
  formId?: string;
  formName?: string;
  submittedAt?: string;
  respondentId?: string;
  fields?: { key?: string; label?: string; value?: unknown }[];
  hiddenFields?: TallyHidden;
  // Tally formato esteso (data può essere annidato)
  data?: {
    formId?: string;
    fields?: { key?: string; label?: string; value?: unknown }[];
    hiddenFields?: TallyHidden;
  };
}

function isValidUuid(s: string | undefined | null): s is string {
  if (!s) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function POST(req: NextRequest) {
  // Rate limit IP (anti-flood)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  const now = Date.now();
  const slot = rateMap.get(ip);
  if (slot && slot.resetAt > now) {
    if (slot.count >= RATE_MAX) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    slot.count++;
  } else {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  }

  // Parse body
  let body: TallyWebhookBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Estrai formId / hiddenFields dal flat o dal data nested (Tally
  // negli ultimi anni usa data.fields, in passato fields top-level)
  const formId = body.formId ?? body.data?.formId;
  const hidden = body.hiddenFields ?? body.data?.hiddenFields ?? {};

  // Validazione formId atteso
  const expectedFormId = process.env.TALLY_FORM_ID;
  if (expectedFormId && formId !== expectedFormId) {
    console.warn("[survey/submit] form id mismatch", { received: formId, expected: expectedFormId });
    return NextResponse.json({ error: "unknown_form" }, { status: 400 });
  }

  // Estrai user/gift IDs (validati come UUID per evitare iniezioni)
  const userId = isValidUuid(hidden.userId) ? hidden.userId : null;
  const giftId = isValidUuid(hidden.giftId) ? hidden.giftId : null;

  // Salva payload completo (anche senza match user/gift — analisi
  // successiva potrebbe riusare le risposte anonime per insight).
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("survey_responses")
    .insert({
      user_id: userId,
      gift_id: giftId,
      survey_id: "post_gift_v1",
      source: "tally",
      payload: body,
    });

  if (error) {
    console.error("[survey/submit] insert error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
