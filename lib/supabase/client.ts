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
