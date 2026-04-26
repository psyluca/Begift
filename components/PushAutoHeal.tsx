"use client";

/**
 * PushAutoHeal — componente "ghost" senza UI che, una volta per
 * sessione, verifica che la push subscription del device sia
 * sincronizzata col DB. Se rileva drift (browser dice "granted" ma
 * /api/push/status restituisce 0 device), fa un re-subscribe
 * silenzioso usando ensurePushSubscription().
 *
 * Risolve il classico bug in cui, dopo un aggiornamento iOS o una
 * pulizia automatica di endpoint scaduti (410 Gone), l'utente
 * ha il permesso attivo ma non riceve piu' notifiche e non ne
 * conosce il motivo.
 *
 * Da montare nel layout root, vicino agli altri componenti ghost
 * (CookieBanner, GiftReceivedNotification, ecc.).
 *
 * Esegue il check una sola volta per sessione browser tramite
 * sessionStorage flag, per non spammare l'API ad ogni page nav.
 */

import { useEffect } from "react";
import { ensurePushSubscription } from "@/lib/pushSubscribe";
import { fetchAuthed } from "@/lib/clientAuth";

const SESSION_FLAG = "begift_push_autoheal_done";

export function PushAutoHeal() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // FIX 2026-04-26: PushAutoHeal era responsabile di accumulare
    // subscription duplicate (12 -> 16 -> 20...) perche' su iOS PWA
    // il sessionStorage flag non sempre persiste tra reload, e ogni
    // mount del layout creava nuove sub. Soluzione: NON fare auto
    // re-subscribe, limitarsi a un'unica chiamata di status per
    // verifica. L'utente puo' usare "Riconnetti notifiche" manuale
    // dalla diagnostic page se serve.
    //
    // Per il futuro: una soluzione migliore richiederebbe un dedupe
    // server-side che cancella vecchie sub dello stesso user al
    // momento della upsert (vedi /api/push/cleanup endpoint).
    //
    // Skip se feature non supportate o permission non granted.
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Solo log diagnostico, niente auto-subscribe.
    (async () => {
      try {
        const res = await fetchAuthed("/api/push/status");
        if (!res.ok) return;
        const data = await res.json();
        const dbCount = data?.subscriptions?.length ?? 0;
        if (dbCount === 0) {
          console.warn("[PushAutoHeal] drift detected: granted but 0 subs in DB. User can fix from /settings/notifiche-test");
        }
      } catch { /* silent */ }
    })();
  }, []);

  return null;
}
