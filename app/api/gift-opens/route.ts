/**
 * POST /api/gift-opens
 *
 * Registra l'apertura di un regalo (usato dalla gift-opening page
 * non appena il contenuto è rivelato). Serve per:
 * - Contatore "aperto N volte" nella dashboard del creator
 * - Timestamp "aperto il GG/MM" mostrato al creator
 * - Trigger push "Il tuo regalo è stato aperto!" al creator
 *
 * Dedupe: l'open viene registrato 1 volta per (gift_id, device_id)
 * — il client invia un deviceId random persistito in localStorage.
 * Aperture successive dello stesso device non creano duplicati.
 *
 * Push trigger: controllato da notify_gift_opened del CREATOR.
 * Mandato solo alla PRIMA apertura (prima riga in gift_opens per
 * quel gift) per evitare spam — se Marta riapre 3 volte un regalo,
 * Luca riceve 1 sola push "Marta ha aperto il tuo regalo".
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/webPush";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const admin = createSupabaseAdmin();
  const { giftId, deviceId } = await req.json();

  if (!giftId) {
    return NextResponse.json({ error: "giftId required" }, { status: 400 });
  }

  // Controlla se è la prima apertura (per decidere se mandare la push)
  const { count: existingCount } = await admin
    .from("gift_opens")
    .select("id", { count: "exact", head: true })
    .eq("gift_id", giftId);
  const isFirstOpen = (existingCount ?? 0) === 0;

  await supabase.from("gift_opens").insert({
    gift_id: giftId,
    device_id: deviceId,
  });

  // Push "il tuo regalo è stato aperto" — solo alla prima apertura,
  // best-effort (non blocca la risposta).
  if (isFirstOpen) {
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
            title: "🎉 Il tuo regalo è stato aperto",
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
