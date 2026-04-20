"use client";

/**
 * CreditToast — notifica celebrativa quando arriva un credito.
 *
 * Componente globale che si aggancia alla subscription realtime di
 * Supabase sulle INSERT in `credit_ledger` per l'utente corrente.
 * Mostra un toast "+N crediti" con animazione slide-in dall'alto,
 * auto-dismiss dopo ~4s. Impilabile (più crediti arrivati insieme
 * si sovrappongono).
 *
 * Da renderizzare nel layout root (app/layout.tsx) così copre tutte
 * le pagine autenticate. Se l'utente non è loggato o il flag
 * `ENABLE_CREDITS_WALLET` è off, il componente non fa nulla.
 *
 * Non mostra toast per le spese (delta < 0) — quelle sono azioni
 * iniziate dall'utente, feedback ridondante.
 */

import { useEffect, useState } from "react";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { createSupabaseClient, getSessionUser } from "@/lib/supabase/client";

interface ToastEntry {
  id: string;        // ledger row id, string per univocità
  delta: number;
  reason: string;
  createdAt: number; // timestamp per ordinamento stack
}

const ACCENT_GREEN = "#2c8a4a";

export function CreditToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const enabled = isFeatureEnabled("ENABLE_CREDITS_WALLET");

  // Risolvi l'utente corrente una volta al mount (async)
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const u = await getSessionUser();
      if (!cancelled && u) setUserId(u.id);
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  // Supabase realtime subscription
  useEffect(() => {
    if (!enabled || !userId) return;
    const sb = createSupabaseClient();
    const channel = sb
      .channel(`credit_toast:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "credit_ledger",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { id: number; delta: number; reason: string };
          if (row.delta <= 0) return; // mostra solo earns
          setToasts((prev) => [
            ...prev,
            {
              id: String(row.id),
              delta: row.delta,
              reason: row.reason,
              createdAt: Date.now(),
            },
          ]);
        }
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [enabled, userId]);

  // Auto-dismiss dopo 4s — timer per-toast
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4000)
    );
    return () => { timers.forEach(clearTimeout); };
  }, [toasts]);

  if (!enabled || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        top: 20,
        left: 0,
        right: 0,
        pointerEvents: "none",
        zIndex: 10_000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <style>{`
        @keyframes creditToastIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            pointerEvents: "auto",
            background: "#fff",
            color: "#1a1a1a",
            border: `1.5px solid ${ACCENT_GREEN}`,
            borderRadius: 20,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "creditToastIn .35s ease-out both",
            maxWidth: 360,
          }}
        >
          <span style={{ fontSize: 20 }}>🎉</span>
          <span>
            <strong style={{ color: ACCENT_GREEN, fontWeight: 800 }}>+{t.delta}</strong>
            <span style={{ marginLeft: 4 }}>{reasonShort(t.reason)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// Etichetta breve in italiano per il toast (più corta della modal).
function reasonShort(reason: string): string {
  switch (reason) {
    case "open_gift":          return "crediti — regalo aperto!";
    case "share_gift":         return "crediti — regalo condiviso!";
    case "referral_converted": return "crediti — nuovo mittente!";
    case "first_gift":         return "crediti — primo regalo!";
    case "weekly_streak":      return "crediti — streak!";
    case "feedback_received":  return "crediti — feedback ricevuto!";
    case "invite_installed":   return "crediti — invito convertito!";
    case "profile_complete":   return "crediti — profilo completato!";
    case "gift_received":      return "crediti — regalo ricevuto!";
    case "gift_shared_rcvd":   return "crediti — regalo ricondiviso!";
    default:                   return "crediti guadagnati!";
  }
}
