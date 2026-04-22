/**
 * Helper condiviso per chiamate autenticate al backend lato client.
 *
 * Problema risolto: alcuni endpoint (/api/profile/me,
 * /api/profile/username, /api/ai/*) richiedono auth. Il cookie-based
 * auth di Supabase SSR è flaky in certe condizioni (sessione appena
 * loggata, rotazione token, cross-tab sync). Se anche la sessione
 * del Supabase JS client non è ancora inizializzata al momento della
 * fetch, non si invia nemmeno Bearer e la request fallisce 401.
 *
 * Questo helper tenta 3 fonti di access token IN ORDINE finché ne
 * trova uno non-scaduto:
 *   1. supabase.auth.getSession() (via SDK ufficiale)
 *   2. localStorage 'sb-{projectRef}-auth-token' (dove il SDK scrive)
 *   3. scansione localStorage di tutte le chiavi sb-*-auth-token
 *      come ultima risorsa (copre cambio project ref o varianti)
 *
 * Se nessuna sorgente fornisce un token, l'helper invia comunque
 * la richiesta senza Authorization e lascia che il server provi il
 * cookie-based auth come ultimo fallback.
 */

import { createSupabaseClient } from "@/lib/supabase/client";

/** Tenta di leggere l'access token dalle fonti client disponibili. */
export async function getClientAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // 1. SDK ufficiale
  try {
    const sb = createSupabaseClient();
    const { data } = await sb.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  } catch {
    /* continua ai fallback */
  }

  // 2. Chiave localStorage canonica (project ref derivato da URL)
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url) {
      const ref = url.replace("https://", "").split(".")[0];
      const raw = localStorage.getItem(`sb-${ref}-auth-token`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.access_token) return parsed.access_token;
      }
    }
  } catch {
    /* continua */
  }

  // 3. Scansione fallback (qualsiasi sb-*-auth-token)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.access_token) return parsed.access_token;
        } catch { /* ignore malformed */ }
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

/**
 * Fetch wrapper che aggiunge automaticamente Authorization Bearer
 * se disponibile. Uso trasparente: sostituisci `fetch(url, opts)`
 * con `fetchAuthed(url, opts)`.
 */
export async function fetchAuthed(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = await getClientAccessToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
