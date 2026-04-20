import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/credits/spend
 *
 * Body JSON:
 *   {
 *     amount: number (positive integer),
 *     reason: string (es. "unlock_pro_gift", "unlock_custom_paper", ...),
 *     metadata?: object  (es. {gift_id: <uuid>})
 *   }
 *
 * Richiede utente autenticato (session Supabase). Chiama la RPC
 * spend_credits() che è atomica, valida il saldo e usa advisory lock
 * per prevenire race condition.
 *
 * Risposte:
 *   200 { ok: true, ledger_id: number }
 *   400 { error: "invalid_input" }
 *   401 { error: "not_authenticated" }
 *   402 { error: "insufficient_balance" }
 *   500 { error: "internal" }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { amount, reason, metadata } = parsed.value;

  const sb = createSupabaseServer();
  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data, error } = await sb.rpc("spend_credits", {
    p_user_id: userData.user.id,
    p_amount: amount,
    p_reason: reason,
    p_metadata: metadata,
  });

  if (error) {
    // La RPC lancia un'eccezione "insufficient balance: ..." quando il
    // saldo non basta. Convertiamo in 402 Payment Required per facilità
    // di handling lato client.
    if (error.message?.includes("insufficient balance")) {
      return NextResponse.json({ error: "insufficient_balance" }, { status: 402 });
    }
    console.error("spend_credits error:", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ledger_id: data }, { status: 200 });
}

// ── Body validation helpers ──

interface SpendPayload {
  amount: number;
  reason: string;
  metadata: Record<string, unknown>;
}

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function parseBody(body: unknown): Parsed<SpendPayload> {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_input" };
  const b = body as Record<string, unknown>;

  const amount = typeof b.amount === "number" ? Math.floor(b.amount) : NaN;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000) {
    return { ok: false, error: "invalid_amount" };
  }

  if (typeof b.reason !== "string" || b.reason.length < 1 || b.reason.length > 64) {
    return { ok: false, error: "invalid_reason" };
  }
  // Whitelist di reason accettate — piccolo controllo di sanità per
  // evitare che il client spenda con reason arbitrari.
  const allowedReasons = new Set([
    "spend_pro_gift",
    "spend_custom_paper",
    "spend_custom_song",
    "spend_ai_pattern",
    "spend_24h_pro",
    "spend_month_pro",
    "spend_skin_preview",
    "spend_cosmetic",
  ]);
  if (!allowedReasons.has(b.reason)) {
    return { ok: false, error: "invalid_reason" };
  }

  const metadata = (b.metadata && typeof b.metadata === "object")
    ? (b.metadata as Record<string, unknown>)
    : {};

  return { ok: true, value: { amount, reason: b.reason, metadata } };
}
