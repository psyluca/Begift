/**
 * POST /api/gift-opens
 *
 * Registra l'apertura di un regalo (chiamata dalla gift-opening page
 * appena il contenuto e' rivelato). Serve per:
 * - Contatore "aperto N volte" nella dashboard del creator
 * - Timestamp "aperto il GG/MM" mostrato al creator
 * - Trigger push "Il tuo regalo e' stato aperto" al creator
 *
 * Dedupe: l'open viene registrato 1 volta per (gift_id, device_id) —
 * il client invia un deviceId random persistito in localStorage.
 * Aperture successive dello stesso device non creano duplicati.
 *
 * Push trigger: controllato da notify_gift_opened del CREATOR.
 * Mandato solo alla PRIMA apertura (prima riga in gift_opens per
 * quel gift) per evitare spam.
 *
 * BUG FIX 2026-04-25: la versione precedente usava createSupabaseServer()
 * (cookie session) per l'INSERT. Il destinatario di un regalo e' quasi
 * sempre ANONIMO (non ha session cookie), quindi l'INSERT veniva
 * bloccato da RLS senza errore visibile lato client. Risultato: il
 * creator vedeva "non ancora aperto" anche se il destinatario aveva
 * gia' aperto e magari lasciato una reazione.
 *
 * Fix: usiamo SOLO il client admin (service_role) per l'INSERT.
 * L'API e' aperta intenzionalmente: chiunque conosce il gift_id puo'
 * registrare un'apertura — coerente col fatto che il link gift e'
 * pubblico e l'apertura e' un evento volontario del visitatore.
 * Il dedupe per device_id evita gonfiature.
 */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/webPush";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const admin = createSupabaseAdmin();

  let body: { giftId?: string; deviceId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { giftId, deviceId } = body;

  if (!giftId || typeof giftId !== "string") {
    return NextResponse.json({ error: "giftId_required" }, { status: 400 });
  }

  // 1) Conta aperture esistenti (per decidere se mandare la push).
  const { count: existingCount, error: countErr } = await admin
    .from("gift_opens")
    .select("id", { count: "exact", head: true })
    .eq("gift_id", giftId);
  if (countErr) {
    console.error("[gift-opens] count error", countErr);
    // Non blocchiamo: proviamo comunque l'insert.
  }
  const isFirstOpen = (existingCount ?? 0) === 0;

  // 2) Dedupe per (gift_id, device_id) se device_id presente.
  //    Senza device_id facciamo comunque insert (caso edge: client
  //    senza localStorage / privacy mode).
  let alreadyRecordedForThisDevice = false;
  if (deviceId) {
    const { data: existing } = await admin
      .from("gift_opens")
      .select("id")
      .eq("gift_id", giftId)
      .eq("device_id", deviceId)
      .maybeSingle();
    if (existing) alreadyRecordedForThisDevice = true;
  }

  // 3) INSERT solo se non e' duplicato per device_id.
  if (!alreadyRecordedForThisDevice) {
    const { error: insertErr } = await admin
      .from("gift_opens")
      .insert({
        gift_id: giftId,
        device_id: deviceId ?? null,
      });
    if (insertErr) {
      console.error("[gift-opens] INSERT failed", insertErr);
      // Restituiamo 200 OK lo stesso: l'errore e' tracciato server-side
      // ma il client non ha modo di reagire utilmente. La realtime
      // delle reactions arriva comunque al creator.
    }
  }

  // 4) Push "il tuo regalo e' stato aperto" — solo alla prima apertura
  //    in assoluto (prima riga creata), best-effort, non blocca la
  //    risposta al client.
  if (isFirstOpen && !alreadyRecordedForThisDevice) {
    try {
      const { data: gift } = await admin
        .from("gifts")
        .select("creator_id, recipient_name")
        .eq("id", giftId)
        .maybeSingle();
      const g = gift as { creator_id?: string; recipient_name?: string } | null;
      if (g?.creator_id) {
        const recipient = g.recipient_name || "qualcuno";
        sendPushToUser(
          g.creator_id,
          {
            title: "🎉 Il tuo regalo e' stato aperto",
            body: `${recipient} ha appena aperto il regalo che le hai mandato.`,
            url: `/dashboard?tab=sent`,
            giftId,
            tag: `begift-opened-${giftId}`,
          },
          "gift_opened"
        ).catch((e) => console.error("[gift-opens] push failed", e));
      }
    } catch (e) {
      console.error("[gift-opens] push setup failed", e);
    }
  }

  return NextResponse.json({ ok: true });
}
