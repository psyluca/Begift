/**
 * GET /api/cron/reopen-notifications
 *
 * Cron giornaliero (11:00 UTC = 13:00 CET ora di pranzo italiano,
 * orario buono per push: l'utente ha il telefono in mano).
 *
 * Per ogni gift creato negli ultimi 30 giorni con piu' di N aperture
 * dallo STESSO destinatario (device_id distinto), manda al CREATOR
 * una push relazionale del tipo:
 *
 *   "Maria ha aperto il regalo 5 volte questa settimana.
 *    Continui a essere nei suoi pensieri."
 *
 * Logica anti-spam:
 *  - Solo gift creati negli ultimi 30 giorni (regali piu' vecchi:
 *    le riaperture sono nostalgia normale, non degne di push).
 *  - Soglie di trigger: 3, 5, 10 aperture totali. Una sola push per
 *    soglia (dedupe via tag push "begift-reopens-{giftId}-{tier}").
 *  - Skip se gia' triggerata oggi per QUEL gift (anti-spam giornaliero).
 *  - Rispetta notify_gift_opened del creator.
 *
 * Auth: stesso schema CRON_SECRET di birthday-reminders.
 */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/webPush";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TIERS = [3, 5, 10];

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const admin = createSupabaseAdmin();

  // Gift candidati: creati negli ultimi 30 giorni.
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: gifts, error: giftsErr } = await admin
    .from("gifts")
    .select("id, creator_id, recipient_name, created_at")
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (giftsErr) {
    console.error("[cron/reopen] gifts query error", giftsErr);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  const processed: { gift_id: string; result: string }[] = [];

  for (const g of gifts ?? []) {
    const gift = g as { id: string; creator_id: string; recipient_name: string; created_at: string };

    // Conta le aperture totali del gift.
    const { count: opensCount, error: opensErr } = await admin
      .from("gift_opens")
      .select("id", { count: "exact", head: true })
      .eq("gift_id", gift.id);
    if (opensErr) {
      processed.push({ gift_id: gift.id, result: "opens_count_error" });
      continue;
    }
    const totalOpens = opensCount ?? 0;

    // Trova il tier piu' alto raggiunto.
    const tier = TIERS.filter((t) => totalOpens >= t).pop();
    if (!tier) {
      processed.push({ gift_id: gift.id, result: "no_tier_yet" });
      continue;
    }

    // Dedupe: se per quel (gift_id, tier) abbiamo gia' notificato in
    // passato, skip. Usiamo una tabella reopen_notifications ad-hoc
    // (vedi migration 014). Schema:
    //   CREATE TABLE reopen_notifications (
    //     gift_id uuid, tier int, sent_at timestamptz default now(),
    //     PRIMARY KEY (gift_id, tier)
    //   );
    const { data: already } = await admin
      .from("reopen_notifications")
      .select("tier")
      .eq("gift_id", gift.id)
      .eq("tier", tier)
      .maybeSingle();
    if (already) {
      processed.push({ gift_id: gift.id, result: `tier_${tier}_already_sent` });
      continue;
    }

    // Manda push relazionale.
    const recipient = gift.recipient_name || "Qualcuno";
    const title = `💭 ${recipient} ha aperto il tuo regalo ${totalOpens} volte`;
    const body = "Continui a essere nei suoi pensieri. Vuoi mandare anche oggi?";
    const url = `/dashboard?tab=sent`;

    try {
      const result = await sendPushToUser(
        gift.creator_id,
        {
          title,
          body,
          url,
          giftId: gift.id,
          tag: `begift-reopens-${gift.id}-tier${tier}`,
        },
        "gift_opened" // riusiamo la preferenza notify_gift_opened
      );

      // Registra il dedupe.
      await admin
        .from("reopen_notifications")
        .insert({ gift_id: gift.id, tier });

      processed.push({
        gift_id: gift.id,
        result: `tier_${tier}_sent_${result.sent}/${result.sent + result.failed}`,
      });
    } catch (e) {
      console.error("[cron/reopen] send failed", gift.id, e);
      processed.push({ gift_id: gift.id, result: "send_error" });
    }
  }

  return NextResponse.json({
    date: new Date().toISOString().slice(0, 10),
    candidates: gifts?.length ?? 0,
    processed,
  });
}
