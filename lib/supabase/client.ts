import { createBrowserClient } from "@supabase/ssr";

const PROJECT_REF = "acoettfsxcfpvhjzreoy";
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: STORAGE_KEY,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      }
    }
  );
}

export async function getSessionUser() {
  // Prova prima dal localStorage direttamente
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user) return parsed.user;
      }
    } catch(_) {}
  }
  // Fallback con getUser
  const sb = createSupabaseClient();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

// Lazy singleton for hooks
let _supabase: ReturnType<typeof createSupabaseClient> | null = null;
export function getSupabaseClient() {
  if (!_supabase) _supabase = createSupabaseClient();
  return _supabase;
}
export const supabase = typeof window !== "undefined" ? getSupabaseClient() : null as any;

/**
 * Separate client for OAuth flows (Google, Apple, Facebook, …).
 *
 * Uses **flowType "implicit"** instead of the default PKCE. After a
 * couple of attempts we couldn't keep the PKCE code_verifier cookie
 * alive through the redirect chain
 *   browser → Google → Supabase → our /auth/callback
 * — the `@supabase/ssr` cookie storage (non-httpOnly, SameSite=Lax)
 * was silently missing on the server at exchange time, producing
 * `error=pkce_code_verifier_not_found` reliably.
 *
 * With implicit flow the tokens come back directly in the URL hash
 * (#access_token=...&refresh_token=...), no server-side exchange is
 * needed, and `supabase-js` auto-picks them up via
 * `detectSessionInUrl` (default true). The trade-off: implicit flow
 * is slightly less secure than PKCE because the tokens transit via
 * URL hash — but they're only visible to the user's own browser,
 * HTTPS protects in transit, and for the BeGift scope this is fine.
 * We can revisit PKCE later if/when we move all auth state onto
 * cookies across the whole app.
 *
 * `storage` is intentionally left at default (localStorage) so the
 * session that supabase-js establishes post-redirect ends up in the
 * SAME localStorage key that the rest of the app reads. No cross-
 * storage mirror needed: the /auth/finalize page just forwards the
 * user to `next` after supabase-js has done its work.
 */
export function createSupabaseOAuthClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    }
  );
}
