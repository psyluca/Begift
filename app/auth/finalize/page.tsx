"use client";

/**
 * Auth finalize — bridge step dopo un callback OAuth (o magic-link).
 *
 * Perché esiste:
 * @supabase/ssr (PKCE) salva la session lato server in un cookie. Il
 * resto dell'app legge però `sb-<project>-auth-token` dal localStorage
 * (configurato in lib/supabase/client.ts per retrocompatibilità con
 * l'OTP login originale). Dopo un OAuth callback, il server-side
 * exchangeCodeForSession ha messo tutto nei cookie — ma useAuth /
 * getStoredUser lato client non lo trovano, e un F5 fa apparire
 * l'utente come "non loggato" finché non si rifà il login.
 *
 * Questa pagina è un piccolo proxy: legge la session dai cookie via
 * il client OAuth, la serializza nel formato che localStorage si
 * aspetta, poi redirige all'eventuale `next`. Dopo questo passaggio,
 * il resto dell'app vede l'utente loggato anche sul client — così
 * F5, /create, /dashboard funzionano tutti senza rilogin.
 *
 * Il bridge è invocato automaticamente da `/auth/callback/route.ts`
 * dopo l'exchangeCodeForSession riuscito. Viene mostrato solo per
 * frazioni di secondo all'utente.
 */

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseOAuthClient } from "@/lib/supabase/client";

const PROJECT_REF = "acoettfsxcfpvhjzreoy";
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

function FinalizeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [msg, setMsg] = useState("Finalizzazione accesso…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Client OAuth = cookie storage. getSession() legge i cookie
        // impostati dal callback server-side.
        const sb = createSupabaseOAuthClient();
        const { data, error } = await sb.auth.getSession();
        if (cancelled) return;
        if (error || !data.session) {
          // Nessuna session nel cookie — qualcosa è andato storto nel
          // callback. Torniamo a login con messaggio di errore.
          router.replace(`/auth/login?error=${encodeURIComponent(error?.message ?? "no_session")}`);
          return;
        }

        // Mirror in localStorage nel formato che il resto dell'app
        // si aspetta (identico a quello scritto dalla login OTP).
        const s = data.session;
        const mirrored = {
          access_token: s.access_token,
          refresh_token: s.refresh_token,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: s.expires_at,
          user: s.user,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mirrored));
        } catch {
          // localStorage bloccato (es. Safari private). Non fatale: la
          // session è comunque nei cookie, l'utente sarà loggato lato
          // server. Solo il client-side useAuth hook potrebbe non
          // vederla subito — verrà caricata via supabase.auth.getUser().
        }

        // Anche nei cookie "plain" che il server helper si aspetta
        // (lib/supabase/server.ts ha fallback per sb-access-token +
        // sb-refresh-token). Scrittura best-effort.
        try {
          const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
          document.cookie = `sb-access-token=${s.access_token}; path=/; expires=${exp}; SameSite=Lax`;
          document.cookie = `sb-refresh-token=${s.refresh_token}; path=/; expires=${exp}; SameSite=Lax`;
        } catch { /* ignore */ }

        if (cancelled) return;
        setMsg("Accesso completato, reindirizzamento…");
        // Piccolo delay per dare al browser il tempo di applicare
        // cookie/storage prima del redirect.
        setTimeout(() => router.replace(next), 120);
      } catch (e) {
        if (cancelled) return;
        router.replace(`/auth/login?error=${encodeURIComponent("finalize_failed")}`);
      }
    })();
    return () => { cancelled = true; };
  }, [router, next]);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f7f5f2",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      color: "#1a1a1a",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 42, marginBottom: 14 }}>🎁</div>
        <div style={{ fontSize: 14, color: "#666" }}>{msg}</div>
      </div>
    </main>
  );
}

export default function FinalizePage() {
  return (
    <Suspense fallback={null}>
      <FinalizeInner />
    </Suspense>
  );
}
