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

    // Controlla se il token è scaduto e refresha
    const checkAndRefresh = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Se scade entro 5 minuti, refresha
          if (parsed.expires_at && parsed.expires_at * 1000 < Date.now() + 5 * 60 * 1000) {
            const { data } = await sb.auth.refreshSession({ refresh_token: parsed.refresh_token });
            if (data.session) {
              const updated = {
                ...parsed,
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
                user: data.session.user,
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              setUser(data.session.user);
              setLoading(false);
              return;
            }
          } else if (parsed.user) {
            setUser(parsed.user);
            setLoading(false);
            return;
          }
        }
      } catch(_) {}

      // Fallback con getUser
      sb.auth.getUser().then(({ data }) => {
        setUser(data.user ?? null);
        setLoading(false);
      });
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
