import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/webPush";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { giftId, recipientId } = await req.json();

  if (!giftId || !recipientId) {
    return NextResponse.json({ error: "giftId e recipientId richiesti" }, { status: 400 });
  }

  // 1. Crea notifica in-app (usata da GiftReceivedNotification toast
  //    + conteggio badge in BottomNav)
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: recipientId,
      gift_id: giftId,
      type: "gift_received",
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Invia Web Push OS-level al destinatario su TUTTI i suoi
  //    device/browser sottoscritti. Questa è la parte che fa arrivare
  //    la notifica anche ad app chiusa / tab in background (come
  //    WhatsApp). Fallisce in modo silenzioso se:
  //      - le VAPID keys non sono ancora configurate (env vars
  //        mancanti → prima del rollout push)
  //      - il destinatario non ha ancora dato il permesso / nessuna
  //        subscription registrata
  //    In entrambi i casi la notifica in-app toast funziona comunque.
  try {
    // Fetch del sender_alias per personalizzare il payload
    let senderName = "Qualcuno";
    const { data: gift } = await supabase
      .from("gifts")
      .select("sender_alias, creator_id, profiles!gifts_creator_id_fkey(display_name, email)")
      .eq("id", giftId)
      .maybeSingle();
    if (gift) {
      const g = gift as {
        sender_alias?: string;
        profiles?: { display_name?: string; email?: string };
      };
      senderName =
        g.sender_alias ||
        g.profiles?.display_name ||
        (g.profiles?.email ? g.profiles.email.split("@")[0] : undefined) ||
        "Qualcuno";
    }

    // Fire-and-forget: non awaittare per non rallentare la risposta API.
    // Errori loggati lato webPush helper.
    sendPushToUser(recipientId, {
      title: "🎁 Hai ricevuto un regalo",
      body: `${senderName} ti ha mandato un regalo su BeGift. Tocca per aprirlo.`,
      url: `/gift/${giftId}`,
      giftId,
      tag: `begift-gift-${giftId}`,
    }).catch((e) => console.error("[gifts/send] push failed", e));
  } catch (e) {
    // Failure del push non deve bloccare la creazione notifica
    console.error("[gifts/send] push setup failed", e);
  }

  return NextResponse.json({ ok: true });
}
