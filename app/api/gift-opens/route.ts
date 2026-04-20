import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/gift-opens
 *
 * Chiamato dal client del destinatario (`/gift/[id]`) al momento
 * dell'apertura del pacco. Due responsabilità:
 *
 * 1) Registra l'apertura in `gift_opens` (una riga per device) — era
 *    già presente, utile per analytics e "opened by X devices".
 *
 * 2) Imposta `gifts.opened_at` alla PRIMA apertura (idempotente via
 *    `IS NULL`). La transizione NULL→timestamp fa scattare il trigger
 *    `gift_events_credits_trg` (migration 003) che assegna il
 *    credito `open_gift` al creator — è il meccanismo che rende il
 *    wallet effettivamente alimentato dall'engagement del destinatario.
 *    Usa client admin (service_role) per bypassare RLS — i destinatari
 *    sono spesso anonimi e la policy "gifts: creator update" lato
 *    client bloccherebbe la chiamata.
 */
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { giftId, deviceId } = await req.json();

  if (!giftId) {
    return NextResponse.json({ error: "missing_gift_id" }, { status: 400 });
  }

  // (1) gift_opens append — 1 riga per device
  await supabase.from("gift_opens").insert({
    gift_id:   giftId,
    device_id: deviceId,
  });

  // (2) gifts.opened_at — solo la prima volta (IS NULL guard).
  // Admin client per bypassare RLS (il destinatario non è il creator
  // del gift, quindi la policy "creator update" lo bloccherebbe).
  try {
    const admin = createSupabaseAdmin();
    await admin
      .from("gifts")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", giftId)
      .is("opened_at", null);
  } catch (e) {
    // Non-fatal: l'analytics gift_opens è comunque scritta.
    console.error("[gift-opens] opened_at update failed:", e);
  }

  return NextResponse.json({ ok: true });
}
