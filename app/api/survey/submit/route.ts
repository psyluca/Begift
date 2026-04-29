/**
 * POST /api/survey/submit
 *
 * Endpoint per ricevere risposte sondaggio post-gift. Accetta DUE
 * formati di payload:
 *
 *  1. INTERNAL (form nativo BeGift in /sondaggio):
 *     {
 *       source: "internal",
 *       formId: "post_gift_v1",
 *       giftId?: "uuid",
 *       userId?: "uuid",
 *       answers: { recipient_type, occasion, ... }
 *     }
 *
 *  2. TALLY webhook (legacy / opzionale):
 *     {
 *       formId: "...",
 *       fields: [...],
 *       hiddenFields: { userId, giftId }
 *     }
 *
 * Lo distinguiamo da `body.source === "internal"` o presence di
 * `body.answers`. Per ora il flow primario e' INTERNAL (Tally e'
 * stato sostituito con form nativo per evitare dipendenza Pro).
 *
 * Sicurezza:
 *  - Rate limit 100 submission/min/IP per evitare flood
 *  - Validazione UUID per user_id e gift_id
 *  - INTERNAL: niente form ID validation specifica (auth implicita
 *    dalla session se presente; altrimenti accetta comunque per
 *    non costringere login dopo email click)
 */

export const dynamic = "force-dynamic";

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 100;

interface InternalPayload {
  source: "internal";
  formId?: string;
  giftId?: string | null;
  userId?: string | null;
  answers: Record<string, unknown>;
}

interface TallyHidden {
  userId?: string;
  giftId?: string;
}

interface TallyWebhookBody {
  source?: string;
  eventId?: string;
  eventType?: string;
  formId?: string;
  formName?: string;
  submittedAt?: string;
  respondentId?: string;
  fields?: { key?: string; label?: string; value?: unknown }[];
  hiddenFields?: TallyHidden;
  answers?: Record<string, unknown>;
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
  // Rate limit per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || req.headers.get("x-real-ip") || "unknown";
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

  // Distinguere INTERNAL vs Tally
  const isInternal = body.source === "internal" || (body.answers && typeof body.answers === "object");

  let userId: string | null = null;
  let giftId: string | null = null;
  let payload: unknown = body;
  let surveyId = "post_gift_v1";
  let source = "internal";

  if (isInternal) {
    const internal = body as unknown as InternalPayload;
    userId = isValidUuid(internal.userId) ? internal.userId : null;
    giftId = isValidUuid(internal.giftId) ? internal.giftId : null;
    surveyId = internal.formId || "post_gift_v1";
    source = "internal";
    // Salviamo SOLO answers come payload puro per analisi piu' rapida
    payload = { answers: internal.answers, formId: surveyId };
  } else {
    // TALLY format
    const formId = body.formId ?? body.data?.formId;
    const hidden = body.hiddenFields ?? body.data?.hiddenFields ?? {};

    const expectedFormId = process.env.TALLY_FORM_ID;
    if (expectedFormId && formId !== expectedFormId) {
      console.warn("[survey/submit] tally form id mismatch", { received: formId, expected: expectedFormId });
      return NextResponse.json({ error: "unknown_form" }, { status: 400 });
    }

    userId = isValidUuid(hidden.userId) ? hidden.userId : null;
    giftId = isValidUuid(hidden.giftId) ? hidden.giftId : null;
    source = "tally";
  }

  // Insert
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("survey_responses")
    .insert({
      user_id: userId,
      gift_id: giftId,
      survey_id: surveyId,
      source,
      payload,
    });

  if (error) {
    console.error("[survey/submit] insert error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
