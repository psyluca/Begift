"use client";

/**
 * Auth finalize — bridge step after an OAuth implicit-flow redirect.
 *
 * With `flowType: "implicit"`, Supabase redirects the browser to this
 * page with access + refresh tokens in the URL hash:
 *   /auth/finalize?next=/dashboard#access_token=...&refresh_token=...&expires_at=...
 *
 * This page:
 *   1. Checks if tokens are actually in the hash (manual parse as
 *      fallback if supabase-js doesn't pick them up).
 *   2. Subscribes to onAuthStateChange waiting for SIGNED_IN. This is
 *      the most reliable signal that the session has been established
 *      — it fires as soon as detectSessionInUrl parses the hash.
 *   3. If SIGNED_IN doesn't fire within ~3 seconds, tries a manual
 *      setSession with the tokens from the hash.
 *   4. On success: mirrors to legacy cookies, strips hash from URL,
 *      redirects to `next`. On failure: redirects to /auth/login with
 *      an error code + debug details in development.
 */

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseOAuthClient } from "@/lib/supabase/client";

function FinalizeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [msg, setMsg] = useState("Finalizzazione accesso…");
  const [debug, setDebug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let authUnsub: { unsubscribe: () => void } | null = null;

    (async () => {
      try {
        // Parse tokens manuali dal hash come backup — supabase-js li
        // legge in automatico ma se qualcosa va storto almeno li abbiamo.
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
        const hashAccessToken = hashParams.get("access_token");
        const hashRefreshToken = hashParams.get("refresh_token");
        const hashError = hashParams.get("error") || hashParams.get("error_description");

        if (hashError) {
          router.replace(`/auth/login?error=${encodeURIComponent(hashError)}`);
          return;
        }

        const sb = createSupabaseOAuthClient();

        // Helper che finalizza dopo una session valida
        const finalize = async (session: { access_token: string; refresh_token: string }) => {
          if (cancelled) return;
          try {
            const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
            document.cookie = `sb-access-token=${session.access_token}; path=/; expires=${exp}; SameSite=Lax`;
            document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; expires=${exp}; SameSite=Lax`;
          } catch { /* ignore */ }
          try {
            window.history.replaceState(null, "", `/auth/finalize?next=${encodeURIComponent(next)}`);
          } catch { /* ignore */ }
          setMsg("Accesso completato, reindirizzamento…");
          setTimeout(() => { if (!cancelled) router.replace(next); }, 100);
        };

        // Primary path: ascolta SIGNED_IN. Supabase-js fa il parsing
        // asincrono del hash al mount e emette SIGNED_IN appena ha finito.
        const { data: subData } = sb.auth.onAuthStateChange((event, session) => {
          if (cancelled) return;
          if (event === "SIGNED_IN" && session) {
            if (authUnsub) { authUnsub.unsubscribe(); authUnsub = null; }
            if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
            finalize(session);
          }
        });
        authUnsub = subData.subscription;

        // Immediate check — la session potrebbe essere già stata stabilita
        // dal mount del client (se era rapido).
        const { data: sessData } = await sb.auth.getSession();
        if (sessData.session) {
          if (authUnsub) { authUnsub.unsubscribe(); authUnsub = null; }
          await finalize(sessData.session);
          return;
        }

        // Fallback dopo 3s: se SIGNED_IN non arriva, proviamo setSession
        // manualmente coi token presi dal hash.
        timeoutId = setTimeout(async () => {
          if (cancelled) return;
          if (authUnsub) { authUnsub.unsubscribe(); authUnsub = null; }
          if (hashAccessToken && hashRefreshToken) {
            try {
              const { data, error } = await sb.auth.setSession({
                access_token: hashAccessToken,
                refresh_token: hashRefreshToken,
              });
              if (!error && data.session) {
                await finalize(data.session);
                return;
              }
              // setSession fallito
              const detail = error?.message || "setSession_returned_null";
              setDebug(detail);
              router.replace(`/auth/login?error=${encodeURIComponent(detail)}`);
              return;
            } catch (e) {
              const detail = e instanceof Error ? e.message : String(e);
              setDebug(detail);
              router.replace(`/auth/login?error=${encodeURIComponent(detail)}`);
              return;
            }
          }
          // Niente token nel hash e niente SIGNED_IN — probabilmente
          // l'utente è arrivato qui senza aver completato OAuth.
          const debugInfo = `hash_present=${hash.length > 1} has_access=${!!hashAccessToken} has_refresh=${!!hashRefreshToken}`;
          setDebug(debugInfo);
          router.replace(`/auth/login?error=no_session`);
        }, 3000);
      } catch (e) {
        if (cancelled) return;
        const detail = e instanceof Error ? e.message : String(e);
        setDebug(detail);
        router.replace(`/auth/login?error=${encodeURIComponent("finalize_failed")}`);
      }
    })();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (authUnsub) authUnsub.unsubscribe();
    };
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
      padding: 20,
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 42, marginBottom: 14 }}>🎁</div>
        <div style={{ fontSize: 14, color: "#666" }}>{msg}</div>
        {debug && process.env.NODE_ENV !== "production" && (
          <div style={{
            marginTop: 20, padding: 12,
            background: "#fff3f3", border: "1px solid #f4b4b4",
            borderRadius: 8, fontSize: 11, color: "#8b2626",
            fontFamily: "monospace", textAlign: "left",
            wordBreak: "break-all",
          }}>
            DEBUG: {debug}
          </div>
        )}
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
