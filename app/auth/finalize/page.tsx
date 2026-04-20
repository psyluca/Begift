"use client";

/**
 * Auth finalize — bridge step after an OAuth implicit-flow redirect.
 *
 * With `flowType: "implicit"`, Supabase redirects the browser to this
 * page with access + refresh tokens in the URL hash:
 *   /auth/finalize?next=/dashboard#access_token=...&refresh_token=...&expires_at=...
 *
 * The OAuth client we instantiate here has `detectSessionInUrl: true`
 * (the default), which means it auto-parses the hash, writes the
 * session to its `storage` (localStorage, same key the rest of the app
 * reads), and returns the session via `getSession()`.
 *
 * So all we do is: wait a tick for the client to finish its hash
 * parsing, confirm a session exists, clear the hash from the URL so
 * the user doesn't see tokens in the address bar, then push the user
 * to `next`. On failure fall back to /auth/login with an error code.
 *
 * Also mirrors the session into the legacy plain cookies
 * `sb-access-token` and `sb-refresh-token` so `lib/supabase/server.ts`'s
 * fallback path still works for SSR pages.
 */

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseOAuthClient } from "@/lib/supabase/client";

function FinalizeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [msg, setMsg] = useState("Finalizzazione accesso…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Instantiate the OAuth client — this triggers detectSessionInUrl
        // which reads the hash fragment and populates localStorage.
        const sb = createSupabaseOAuthClient();

        // Give the client a tick to finish async parsing of the URL
        // hash. Without this, getSession() occasionally returns null
        // because the detection hasn't run yet.
        await new Promise((r) => setTimeout(r, 50));

        const { data, error } = await sb.auth.getSession();
        if (cancelled) return;
        if (error || !data.session) {
          router.replace(
            `/auth/login?error=${encodeURIComponent(error?.message ?? "no_session")}`
          );
          return;
        }

        const s = data.session;

        // Mirror to legacy plain cookies so server.ts's fallback keeps
        // working for SSR pages (/gift/[id], /dashboard server helpers).
        try {
          const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
          document.cookie = `sb-access-token=${s.access_token}; path=/; expires=${exp}; SameSite=Lax`;
          document.cookie = `sb-refresh-token=${s.refresh_token}; path=/; expires=${exp}; SameSite=Lax`;
        } catch { /* ignore */ }

        // Strip tokens from the URL hash so they don't linger in
        // history / address bar.
        try {
          window.history.replaceState(null, "", `/auth/finalize?next=${encodeURIComponent(next)}`);
        } catch { /* ignore */ }

        if (cancelled) return;
        setMsg("Accesso completato, reindirizzamento…");
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
