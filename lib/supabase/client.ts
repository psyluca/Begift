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
 * Why not reuse `createSupabaseClient()` above?
 * That one forces `storage: localStorage`, which works fine for the
 * existing email-OTP login but BREAKS the OAuth PKCE flow: the
 * `code_verifier` generated at signInWithOAuth time is stashed under
 * the Supabase storage key — if that key is localStorage, the
 * server-side `/auth/callback` route handler can't read it when
 * exchanging the code for a session, and you get
 * `error=pkce_code_verifier_not_found`.
 *
 * This OAuth-only client omits the `storage` option entirely, so
 * `@supabase/ssr`'s default cookie storage kicks in. The code_verifier
 * lives in a cookie, the server sees it at callback time, and the
 * exchange succeeds. We use this client ONLY for `signInWithOAuth`;
 * all other auth calls (OTP, getUser, etc.) stay on the localStorage
 * client to preserve behaviour for existing users.
 */
export function createSupabaseOAuthClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
