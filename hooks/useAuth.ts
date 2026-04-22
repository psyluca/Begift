"use client";
import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

const STORAGE_KEY = "sb-acoettfsxcfpvhjzreoy-auth-token";

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const p = JSON.parse(stored);
      if (p.user && p.expires_at && p.expires_at * 1000 > Date.now()) return p.user;
    }
  } catch(_) {}
  return null;
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = "sb-access-token=; path=/; max-age=0";
  document.cookie = "sb-refresh-token=; path=/; max-age=0";
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createSupabaseClient();

    /**
     * Strategia auth "sticky":
     * 1. Leggi user da localStorage (se presente) e settalo SUBITO —
     *    evita flash "non loggato" durante il check remoto.
     * 2. Se il token sta per scadere, tenta refresh in background.
     * 3. Se il refresh FALLISCE (network hiccup, iOS PWA storage
     *    flakey, server busy…) teniamo la session vecchia invece
     *    di fare logout. Un fallimento temporaneo NON deve mai
     *    buttare l'utente fuori dall'app.
     * 4. Solo se localStorage è vuoto facciamo il fallback su
     *    sb.auth.getUser() che potrebbe trovare session da cookie.
     */
    const checkAndRefresh = async () => {
      let parsedSession: { user?: any; expires_at?: number; refresh_token?: string } | null = null;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) parsedSession = JSON.parse(stored);
      } catch { /* malformed storage, ignore */ }

      // Optimistic: se abbiamo user in storage, lo settiamo subito
      if (parsedSession?.user) {
        setUser(parsedSession.user);
        setLoading(false);
      }

      // Nessuna session in storage → affidati a getUser (cookies)
      if (!parsedSession) {
        try {
          const { data } = await sb.auth.getUser();
          setUser(data.user ?? null);
        } catch {
          setUser(null);
        }
        setLoading(false);
        return;
      }

      // Token in scadenza (<5 min)? Tenta refresh in background.
      const expiringSoon = parsedSession.expires_at &&
        parsedSession.expires_at * 1000 < Date.now() + 5 * 60 * 1000;
      if (expiringSoon && parsedSession.refresh_token) {
        try {
          const { data, error } = await sb.auth.refreshSession({
            refresh_token: parsedSession.refresh_token,
          });
          if (!error && data.session) {
            const updated = {
              ...parsedSession,
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
              user: data.session.user,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            setUser(data.session.user);
          }
          // Se error o !session: non tocchiamo nulla, l'utente resta
          // loggato con la session vecchia. Riproviamo fra 30 min
          // (timer sotto) o al prossimo mount.
        } catch {
          /* network hiccup — user resta loggato, ritenteremo */
        }
      }
    };

    checkAndRefresh();

    // Refresh automatico ogni 30 minuti
    const interval = setInterval(async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (!parsed.refresh_token) return;
        const { data } = await sb.auth.refreshSession({ refresh_token: parsed.refresh_token });
        if (data.session) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...parsed,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user: data.session.user,
          }));
          setUser(data.session.user);
        }
      } catch(_) {}
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const signOut = async () => {
    clearStoredSession();
    const sb = createSupabaseClient();
    await sb.auth.signOut();
    window.location.href = "/";
  };

  return { user, loading, signOut, isLoggedIn: !!user };
}
