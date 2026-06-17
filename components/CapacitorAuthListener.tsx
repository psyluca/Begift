"use client";

import { useEffect } from "react";
import type { PluginListenerHandle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { createSupabaseOAuthClient } from "@/lib/supabase/client";

/**
 * Listener globale per i deep link via custom URL scheme di Capacitor.
 *
 * Quando l'app riceve un URL del tipo
 *   app.begift.mobile://oauth-callback#access_token=...&refresh_token=...
 * (tipicamente dopo che SFSafariViewController completa il flow OAuth
 * con Google o Apple), questo componente:
 *   1. Parsea l'URL ed estrae i token Supabase Auth dal fragment.
 *   2. Chiama supabase.auth.setSession() per stabilire la sessione.
 *   3. Chiude SFSafariViewController via Browser.close().
 *   4. Naviga alla destinazione richiesta (?next=... o /dashboard).
 *
 * Senza questo componente, il callback OAuth via Browser plugin
 * non saprebbe come tornare nello stato logged-in dell'app.
 *
 * IMPORTANTE: va montato nel root layout (app/layout.tsx) UNA volta
 * sola. Su web il componente è no-op (Capacitor.isNativePlatform()
 * ritorna false), quindi non c'è overhead.
 */
export function CapacitorAuthListener() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: PluginListenerHandle | null = null;

    (async () => {
      listenerHandle = await App.addListener("appUrlOpen", async ({ url }) => {
        if (!url.startsWith("app.begift.mobile://oauth-callback")) {
          return;
        }

        try {
          // URL example:
          //   app.begift.mobile://oauth-callback?next=/dashboard#access_token=eyJ...&refresh_token=...
          const urlObj = new URL(url);
          const hashParams = new URLSearchParams(urlObj.hash.slice(1));
          const queryParams = new URLSearchParams(urlObj.search);

          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const next = queryParams.get("next") ?? "/dashboard";

          if (accessToken && refreshToken) {
            const supabase = createSupabaseOAuthClient();
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error("[CapacitorAuthListener] setSession failed:", error);
              return;
            }
          }

          // Chiudi SFSafariViewController (best effort, silenzioso se non aperto)
          try { await Browser.close(); } catch { /* noop */ }

          // Redirect alla destinazione richiesta
          window.location.href = next;
        } catch (err) {
          console.error("[CapacitorAuthListener] errore parsing callback URL:", err);
        }
      });
    })();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  return null;
}
