/**
 * Helper server-side per invio Web Push tramite libreria `web-push`.
 *
 * Espone:
 *  - sendPushToUser(userId, payload): invia una push a TUTTI gli
 *    endpoint (device/browser) registrati per quell'utente. Pulisce
 *    automaticamente endpoint scaduti (410 Gone).
 *  - sendPushToEndpoint(subscription, payload): send singolo, low-level.
 *
 * Env richieste:
 *  - VAPID_PUBLIC_KEY  — chiave pubblica VAPID (generata una volta,
 *                         condivisa anche col client via
 *                         NEXT_PUBLIC_VAPID_PUBLIC_KEY per la
 *                         sottoscrizione browser)
 *  - VAPID_PRIVATE_KEY — chiave privata VAPID (SOLO server)
 *  - VAPID_SUBJECT     — mailto: per identificazione al push service
 *                         (opzionale, default mailto:hello@begift.app)
 */

import webpush from "web-push";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export interface PushPayload {
  /** Titolo notifica OS */
  title: string;
  /** Corpo notifica OS */
  body: string;
  /** URL da aprire al tap (default /) */
  url?: string;
  /** ID del gift correlato (passato al client per deep-linking) */
  giftId?: string;
  /** Override icon (default /icon-192.png) */
  icon?: string;
  /** Tag per dedupe: push con stesso tag si sostituiscono invece che accumularsi */
  tag?: string;
}

/**
 * Tipo di notifica — mappa alle colonne notify_* su profiles.
 * Il server controlla la pref corrispondente prima di inviare:
 * se false, skip silenzioso (user ha disabilitato questo tipo).
 */
export type NotificationType = "gift_received" | "gift_opened" | "reaction";

let vapidConfigured = false;
function configureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@begift.app";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys missing — set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

/**
 * Invia una push a tutti gli endpoint dell'utente.
 * Ritorna il numero di endpoint che hanno ricevuto la push con successo.
 * Non lancia eccezioni per errori su singoli endpoint (li logga e pulisce).
 *
 * Se `type` è specificato, controlla la pref utente (colonna
 * notify_<type> su profiles): se false, skip senza errori.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  type?: NotificationType
): Promise<{ sent: number; failed: number; pruned: number; skipped?: boolean }> {
  configureVapid();
  const admin = createSupabaseAdmin();

  // Pref check: se l'utente ha disabilitato questo tipo, skip.
  if (type) {
    const col = `notify_${type}`;
    const { data: pref } = await admin
      .from("profiles")
      .select(col)
      .eq("id", userId)
      .maybeSingle();
    // Se la colonna manca (backfill non ancora eseguito) o è null,
    // trattiamo come TRUE (default sicuro). Se esplicitamente false,
    // skippiamo.
    const prefValue = (pref as Record<string, boolean | null> | null)?.[col];
    if (prefValue === false) {
      return { sent: 0, failed: 0, pruned: 0, skipped: true };
    }
  }

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.error("[webPush] error reading subscriptions", error);
    return { sent: 0, failed: 0, pruned: 0 };
  }
  if (!subs || subs.length === 0) {
    return { sent: 0, failed: 0, pruned: 0 };
  }

  let sent = 0;
  let failed = 0;
  let pruned = 0;
  const toDelete: string[] = [];

  await Promise.all(
    subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
        sent++;
        // Aggiorna last_used_at in background (best effort)
        admin
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", sub.id)
          .then(() => {});
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        failed++;
        // 410 Gone / 404 Not Found: l'endpoint non è più valido
        // (browser disinstallato, permesso revocato, token scaduto).
        // Lo eliminiamo dal DB per non continuare a provarlo.
        if (e.statusCode === 410 || e.statusCode === 404) {
          toDelete.push(sub.id);
        } else {
          console.error("[webPush] send failed", sub.endpoint, e.statusCode, e.message);
        }
      }
    })
  );

  if (toDelete.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", toDelete);
    pruned = toDelete.length;
  }

  return { sent, failed, pruned };
}
