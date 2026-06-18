"use client";

import { useEffect } from "react";
import type { PluginListenerHandle } from "@capacitor/core";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";

/**
 * Listener globale per le notifiche push iOS/Android via APNs/FCM.
 *
 * Cosa fa al mount (native only):
 *  1. Richiede permessi all'utente (PushNotifications.requestPermissions)
 *  2. Se concessi, registra il device → APNs ritorna un token push
 *  3. Manda il token al nostro backend (/api/push/register) per salvarlo
 *     nella tabella Supabase `push_devices`, associato all'utente loggato
 *  4. Aggancia 3 listener:
 *     - 'registration': successo, riceviamo il token
 *     - 'registrationError': fallimento (es. simulator senza APNs setup)
 *     - 'pushNotificationReceived': notifica arriva mentre l'app e' in foreground
 *       (di default APNs/Capacitor non mostra l'alert in foreground)
 *     - 'pushNotificationActionPerformed': utente ha cliccato la notifica
 *       (in background o lock screen), apre l'app e arriva qui
 *
 * No-op su web (Capacitor.isNativePlatform() === false), quindi safe da
 * montare nel root layout.
 *
 * IMPORTANTE: il setup APNs lato Apple Developer (Key + App ID capability)
 * deve essere completato. Vedi feature/native-oauth-integration commit
 * principali per setup completo. Key ID corrente: DV6UQV84V6.
 */
export function CapacitorPushListener() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handles: PluginListenerHandle[] = [];

    (async () => {
      const { PushNotifications } = await import("@capacitor/push-notifications");

      // 1. Richiedi permessi
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== "granted") {
        console.log("[Push] permessi negati o non determinati:", permResult.receive);
        return;
      }

      // 2. Registra device con APNs
      await PushNotifications.register();

      // 3. Listener registration success — invia token al backend
      handles.push(await PushNotifications.addListener("registration", async ({ value: token }) => {
        try {
          await fetch("/api/push/register-native", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              platform: Capacitor.getPlatform(), // 'ios' | 'android'
            }),
          });
        } catch (err) {
          console.error("[Push] errore registrazione token al backend:", err);
        }
      }));

      // 4. Listener errore registration
      handles.push(await PushNotifications.addListener("registrationError", (err) => {
        console.error("[Push] registrationError:", err);
      }));

      // 5. Listener push ricevuta in foreground
      handles.push(await PushNotifications.addListener("pushNotificationReceived", (notification) => {
        console.log("[Push] ricevuta in foreground:", notification);
        // TODO: mostrare in-app toast con titolo/body
        // Per ora silenzioso, l'utente la vede in Notification Center
      }));

      // 6. Listener tap notifica (background → app aperta)
      handles.push(await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        // I dati custom della notifica sono in action.notification.data
        const data = (action.notification.data ?? {}) as Record<string, string>;
        if (data.deepLink && typeof data.deepLink === "string") {
          router.push(data.deepLink);
        } else if (data.giftId) {
          router.push(`/gift/${data.giftId}`);
        }
      }));
    })();

    return () => {
      handles.forEach((h) => h.remove?.());
    };
  }, [router]);

  return null;
}
