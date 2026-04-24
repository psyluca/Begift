"use client";

/**
 * useBadges — hook centralizzato per i contatori notifiche nella
 * BottomNav (regali ricevuti + reazioni ricevute).
 *
 * Sostituisce il blob inline che era dentro BottomNav.tsx con bug
 * vari (race conditions, conteggi globali, no reset al cambio
 * account, no refresh on visibility change).
 *
 * Lifecycle:
 *  1. Mount: legge user dal localStorage (sticky) → fetch counts
 *  2. Sottoscrizione realtime Supabase: nuove reactions/notifications
 *     incrementano badge in modo ottimistico
 *  3. visibilitychange (tab torna foreground): reload counts
 *  4. Polling soft ogni 60s mentre la tab e' visibile
 *  5. Unmount: cleanup channel
 *
 * Reset:
 *  - clearGiftBadge / clearReactionBadge salvano in localStorage il
 *    timestamp "seen_at" PER USER (chiave include user_id). Cosi'
 *    cambiare account NON eredita il timestamp del precedente.
 *  - Il setter locale azzera immediatamente la UI senza aspettare
 *    fetch.
 *
 * Auth check:
 *  - Sticky: se trova qualsiasi sb-*-auth-token, e' loggato.
 *  - Risolve userId leggendo p.user.id dal token storage; se manca
 *    (Google OAuth flowType implicit), tenta sb.auth.getUser() async.
 *  - Senza userId: non fetcha (badges restano 0), evita leak globali.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

const POLL_INTERVAL_MS = 60_000;

function readUserIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const p = JSON.parse(raw);
          if (p?.user?.id) return p.user.id as string;
        } catch { /* malformed */ }
      }
    }
  } catch { /* ignore */ }
  return null;
}

function readAccessTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const p = JSON.parse(raw);
          if (p?.access_token) return p.access_token as string;
        } catch { /* malformed */ }
      }
    }
  } catch { /* ignore */ }
  return null;
}

/** Chiave localStorage per "seen_at" per-user. */
function seenKey(kind: "gifts" | "reactions", userId: string): string {
  return `begift_seen_${kind}_${userId}`;
}

export interface BadgesAPI {
  giftBadge: number;
  reactionBadge: number;
  /** True se l'auth check e' completo (loggedIn definito). */
  ready: boolean;
  loggedIn: boolean;
  /** Da chiamare quando l'utente visita la pagina dei regali. */
  clearGiftBadge: () => void;
  /** Da chiamare quando l'utente visita la pagina delle reazioni. */
  clearReactionBadge: () => void;
  /** Force refresh (es. dopo logout/login). */
  refresh: () => void;
}

export function useBadges(): BadgesAPI {
  const [giftBadge, setGiftBadge] = useState(0);
  const [reactionBadge, setReactionBadge] = useState(0);
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // userId stabile per la sessione corrente. Ref evita re-render
  // del consumer ad ogni cambio (lo usiamo solo come filtro).
  const userIdRef = useRef<string | null>(null);

  /** Fetch dei due counter. Idempotente, no race-safe needed: l'UI
   *  setta lo stato solo se i valori sono cambiati, e l'ordine di
   *  arrivo non altera la correttezza (i due endpoint sono indipendenti). */
  const fetchCounts = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    const token = readAccessTokenFromStorage();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const giftsSeen = localStorage.getItem(seenKey("gifts", userId)) ?? "1970-01-01";
    const reactionsSeen = localStorage.getItem(seenKey("reactions", userId)) ?? "1970-01-01";

    try {
      const [giftsRes, reactionsRes] = await Promise.all([
        fetch(`/api/gifts/received-count?since=${encodeURIComponent(giftsSeen)}`, { headers }),
        fetch(`/api/reactions/count?since=${encodeURIComponent(reactionsSeen)}`, { headers }),
      ]);
      if (giftsRes.ok) {
        const d = await giftsRes.json();
        setGiftBadge(typeof d.count === "number" ? d.count : 0);
      }
      if (reactionsRes.ok) {
        const d = await reactionsRes.json();
        setReactionBadge(typeof d.count === "number" ? d.count : 0);
      }
    } catch {
      /* network hiccup — non azzeriamo i badge esistenti, riproviamo
         al prossimo trigger (visibility / poll / realtime). */
    }
  }, []);

  const clearGiftBadge = useCallback(() => {
    const userId = userIdRef.current;
    if (userId) {
      try {
        localStorage.setItem(seenKey("gifts", userId), new Date().toISOString());
      } catch { /* ignore */ }
    }
    setGiftBadge(0);
  }, []);

  const clearReactionBadge = useCallback(() => {
    const userId = userIdRef.current;
    if (userId) {
      try {
        localStorage.setItem(seenKey("reactions", userId), new Date().toISOString());
      } catch { /* ignore */ }
    }
    setReactionBadge(0);
  }, []);

  const refresh = useCallback(() => {
    userIdRef.current = readUserIdFromStorage();
    if (userIdRef.current) {
      setLoggedIn(true);
      fetchCounts();
    } else {
      setGiftBadge(0);
      setReactionBadge(0);
    }
  }, [fetchCounts]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    // Resolve userId: prima sincrono da localStorage, poi async da
    // sb.auth.getUser() come fallback per Google OAuth con formato
    // implicit (manca p.user al top level del token).
    const resolveUserAndFetch = async () => {
      let userId = readUserIdFromStorage();
      if (!userId) {
        try {
          const { data } = await supabase.auth.getUser();
          if (data.user?.id) userId = data.user.id;
        } catch { /* ignore */ }
      }
      if (cancelled) return;
      userIdRef.current = userId;
      setLoggedIn(!!userId);
      setReady(true);
      if (userId) await fetchCounts();
    };
    resolveUserAndFetch();

    // Realtime: nuove reactions / notifications incrementano in
    // modo ottimistico. Filtriamo lato client su userIdRef per non
    // contare eventi altrui (la subscription Supabase non offre
    // filtri server su gift_id che non conosciamo a priori).
    const channel = supabase
      .channel("badges-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions" },
        async (payload) => {
          const userId = userIdRef.current;
          if (!userId) return;
          const giftId = (payload.new as { gift_id?: string }).gift_id;
          if (!giftId) return;
          // Verifica: il gift e' mio? (un singolo lookup veloce)
          const { data } = await supabase
            .from("gifts")
            .select("creator_id")
            .eq("id", giftId)
            .maybeSingle();
          if (data?.creator_id === userId) {
            setReactionBadge((b) => b + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const userId = userIdRef.current;
          if (!userId) return;
          const n = payload.new as { user_id?: string; type?: string };
          if (n.user_id === userId && n.type === "gift_received") {
            setGiftBadge((b) => b + 1);
          }
        }
      )
      .subscribe();

    // Visibility: quando l'utente torna sulla tab, fetcha fresco.
    // Tipico caso: utente apre regalo in un'altra tab → torna in
    // app, badge ancora vecchio. Visibility-change risolve.
    const onVisibility = () => {
      if (document.visibilityState === "visible" && userIdRef.current) {
        fetchCounts();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Polling soft di backup (60s). La realtime + visibility
    // dovrebbero coprire tutto, ma il polling salva il caso edge
    // di realtime disconnessa (es. wifi flakey).
    pollTimer = setInterval(() => {
      if (document.visibilityState === "visible" && userIdRef.current) {
        fetchCounts();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (pollTimer) clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchCounts]);

  return {
    giftBadge,
    reactionBadge,
    ready,
    loggedIn,
    clearGiftBadge,
    clearReactionBadge,
    refresh,
  };
}
