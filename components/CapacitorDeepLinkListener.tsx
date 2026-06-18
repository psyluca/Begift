"use client";

import { useEffect } from "react";
import type { PluginListenerHandle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";

/**
 * Listener globale per i deeplink Capacitor verso rotte applicative
 * (non OAuth — quelli sono gestiti da CapacitorAuthListener).
 *
 * Quando l'app riceve un URL via custom URL scheme o Universal Link,
 * questo componente intercetta e fa router.push verso la rotta corretta.
 *
 * Esempi gestiti:
 *   app.begift.mobile://gift/abc123  → /gift/abc123
 *   app.begift.mobile://regalo       → /regalo
 *   https://begift.app/gift/abc123   → /gift/abc123 (Universal Link)
 *
 * Esempi NON gestiti (passano avanti senza modifiche):
 *   app.begift.mobile://oauth-callback#access_token=... → CapacitorAuthListener
 *
 * Da montare nel root layout UNA volta sola. No-op su web.
 *
 * NB: per attivare i Universal Links (URL https://begift.app/gift/X che
 * aprono l'app nativa invece del browser), serve setup separato:
 *   1. File public/.well-known/apple-app-site-association con AppID
 *   2. Associated Domains capability in Xcode (applinks:begift.app)
 *   3. Service worker setup per Android App Links
 * Per ora il listener gestisce solo i custom URL scheme app.begift.mobile://.
 */
export function CapacitorDeepLinkListener() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: PluginListenerHandle | null = null;

    (async () => {
      listenerHandle = await App.addListener("appUrlOpen", async ({ url }) => {
        // I callback OAuth sono gestiti da CapacitorAuthListener — skip
        if (url.startsWith("app.begift.mobile://oauth-callback")) {
          return;
        }

        try {
          let path = "";

          if (url.startsWith("app.begift.mobile://")) {
            // Custom URL scheme: strippa lo schema e prefissa con "/"
            const stripped = url.replace("app.begift.mobile://", "");
            path = "/" + stripped;
          } else if (url.startsWith("https://begift.app")) {
            // Universal Link (quando attivato in futuro): estrai pathname
            const urlObj = new URL(url);
            path = urlObj.pathname + urlObj.search + urlObj.hash;
          }

          if (path && path !== "/") {
            router.push(path);
          }
        } catch (err) {
          console.error("[CapacitorDeepLinkListener] errore parsing URL:", err);
        }
      });
    })();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [router]);

  return null;
}
