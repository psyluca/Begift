/**
 * POST /api/awin/postback
 *
 * Endpoint che riceve i postback transazione da Awin.
 *
 * Awin manda POST JSON con i dati di una conversione affiliate appena
 * confermata (o annullata, vedere campo status). Il body include almeno:
 *   - transactionId, merchantId, clickRef, amount, commission, status,
 *     currency, transactionDate
 *   - se "Dati prodotto" abilitato: products[] con line items
 *   - se "Dati origine click" abilitato: click metadata
 *
 * Fase 1 (questo commit, audit-only):
 *   - Salva TUTTO il body raw in awin_postbacks_raw
 *   - Estrae fields quick-access (merchant_id, transaction_id, ecc.)
 *   - Risponde 200 OK (Awin necessita 2xx per non fare retry)
 *
 * Fase 2 (commit futuro, processing strutturato):
 *   - Match clickRef → gift_draft
 *   - Marca draft come purchased
 *   - Trigger push/email all'utente
 *
 * Auth: nessuna. Postback Awin non firmato (sigh). Mitigation:
 *   - Whitelist IP Awin (TODO: chiedere a Paola gli IP range)
 *   - Validazione merchant_id (deve essere in lista nota)
 *   - Idempotency su transaction_id (futuro)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

// Lista merchant_id Awin autorizzati. Aggiungere qui quando attiviamo
// nuovi programmi affiliate Awin.
const ALLOWED_AWIN_MERCHANTS = new Set<string>([
  "32283",   // VivaTicket IT (attivato 2026-05-20)
]);

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Leggi body raw (Awin potrebbe mandarlo in vari formati)
  let body: Record<string, unknown> = {};
  let rawText = "";
  try {
    rawText = await req.text();
    if (rawText) body = JSON.parse(rawText);
  } catch (e) {
    // Body non e' JSON valido — possibile postback Awin in form-encoded
    // (alcuni programmi). Salviamo comunque come stringa.
    body = { _raw: rawText, _parse_error: (e as Error).message };
  }

  // Estrai metadata HTTP utili per audit
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  const contentType = headers["content-type"] || "";
  const userAgent = headers["user-agent"] || null;
  const clientIp =
    headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    headers["x-real-ip"] ||
    null;

  // Estrai quick-access fields (proviamo varie naming convention Awin)
  const getField = (...keys: string[]): string | null => {
    for (const k of keys) {
      const v = body[k];
      if (v !== undefined && v !== null && v !== "") return String(v);
    }
    return null;
  };

  const merchantId = getField("merchantId", "merchant_id", "mid", "awinmid");
  const transactionId = getField("transactionId", "transaction_id", "txnid");
  const clickRef = getField("clickRef", "click_ref", "clickref");
  const amountStr = getField("amount", "amount_cents", "saleAmount");
  const commissionStr = getField("commission", "commission_cents");
  const currency = getField("currency", "currencyCode");
  const awinStatus = getField("status", "transactionStatus");

  const toCents = (s: string | null): number | null => {
    if (!s) return null;
    const n = parseFloat(s.replace(",", "."));
    if (isNaN(n)) return null;
    // Heuristic: se gia' troppo grande probabilmente e' gia' in cents
    // (es. 6500). Altrimenti e' decimale (65.00) — moltiplica per 100.
    return n > 1000 && Number.isInteger(n) ? n : Math.round(n * 100);
  };

  // Salva il record raw (best effort: anche se fallisce, rispondiamo 200)
  let savedId: string | null = null;
  try {
    const admin = createSupabaseAdmin();
    const insertPayload: Record<string, unknown> = {
      body,
      headers,
      method: "POST",
      content_type: contentType,
      client_ip: clientIp,
      user_agent: userAgent,
      merchant_id: merchantId,
      transaction_id: transactionId,
      click_ref: clickRef,
      amount_cents: toCents(amountStr),
      commission_cents: toCents(commissionStr),
      currency,
      awin_status: awinStatus,
      processed: false,
    };
    const { data, error } = await admin
      .from("awin_postbacks_raw")
      .insert(insertPayload)
      .select("id")
      .single();
    if (error) {
      console.error("[awin/postback] DB insert failed:", error.message);
    } else {
      savedId = (data as { id: string } | null)?.id ?? null;
    }
  } catch (e) {
    console.error("[awin/postback] DB exception:", e);
  }

  // Validazione merchant (warning, non blocker)
  if (merchantId && !ALLOWED_AWIN_MERCHANTS.has(merchantId)) {
    console.warn(
      `[awin/postback] Unknown merchant_id ${merchantId}, postback logged but ignored.`
    );
  }

  const elapsedMs = Date.now() - startTime;
  console.log(
    `[awin/postback] received in ${elapsedMs}ms, saved=${savedId}, ` +
      `merchant=${merchantId} tx=${transactionId} click=${clickRef} ` +
      `status=${awinStatus}`
  );

  // Awin vuole 200 OK per non fare retry.
  return NextResponse.json(
    {
      ok: true,
      received_at: new Date().toISOString(),
      audit_id: savedId,
    },
    { status: 200 }
  );
}

/**
 * GET — utile per controllo di health (Awin a volte fa GET come ping
 * iniziale per verificare che l'endpoint esista). Risponde 200 sempre.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: "awin-postback",
      message: "POST to this endpoint with Awin transaction JSON.",
    },
    { status: 200 }
  );
}
