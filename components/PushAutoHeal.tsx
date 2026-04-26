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

    // Skip se gia' fatto in questa sessione browser.
    try {
      if (sessionStorage.getItem(SESSION_FLAG) === "1") return;
    } catch { /* private mode: continua */ }

    // Skip se feature non supportate o permission non granted.
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Best-effort, non bloccante.
    (async () => {
      try {
        // Verifica con il server quanti device ho registrati.
        const res = await fetchAuthed("/api/push/status");
        if (!res.ok) return;
        const data = await res.json();
        const dbCount = data?.subscriptions?.length ?? 0;
        if (dbCount > 0) {
          // Tutto in ordine, non fare niente.
          try { sessionStorage.setItem(SESSION_FLAG, "1"); } catch { /* ignore */ }
          return;
        }
        // Drift rilevato: granted ma 0 subscriptions in DB.
        // Tentiamo re-subscribe silenzioso.
        const result = await ensurePushSubscription();
        if (result.ok) {
          console.log("[PushAutoHeal] re-subscribed", result.created ? "(new)" : "(restored)");
        } else {
          console.log("[PushAutoHeal] could not auto-heal:", result.reason);
        }
        try { sessionStorage.setItem(SESSION_FLAG, "1"); } catch { /* ignore */ }
      } catch (e) {
        console.error("[PushAutoHeal] error", e);
      }
    })();
  }, []);

  return null;
}
