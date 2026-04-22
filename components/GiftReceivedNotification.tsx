"use client";

/**
 * GiftReceivedNotification — componente globale (montato in layout.tsx)
 * che mostra una notifica toast quando al destinatario loggato arriva
 * un nuovo regalo via InAppSend.
 *
 * Meccanismo:
 *  1. Al mount risolve l'utente corrente.
 *  2. Si sottoscrive a Supabase realtime su INSERT di `notifications`
 *     filtrate per user_id = current_user.
 *  3. All'arrivo: fetch del gift corrispondente (per ottenere
 *     recipient_name, sender_alias, packaging per preview) e push
 *     del toast in stack.
 *  4. Se la tab è in background e il permesso è granted, emette
 *     anche una Notification OS nativa (stesso pattern della chat).
 *
 * Il toast ha CTA "Apri regalo →" che porta a /gift/[id].
 * Auto-dismiss dopo 8 secondi; l'utente può anche tapparlo per
 * chiuderlo manualmente.
 *
 * Richiede: Supabase Realtime abilitato sulla tabella `notifications`
 * (Dashboard Supabase → Database → Replication → toggle notifications).
 * Senza questo, il realtime INSERT event non arriva e la notifica
 * appare solo al prossimo reload della dashboard.
 */

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { createSupabaseClient, getSessionUser } from "@/lib/supabase/client";

interface ToastEntry {
  id: string;
  giftId: string;
  senderName: string;
  createdAt: number;
}

const ACCENT = "#D4537E";

export function GiftReceivedNotification() {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Risolvi utente corrente
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await getSessionUser();
      if (!cancelled && u) setUserId(u.id);
    })();
    return () => { cancelled = true; };
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const sb = createSupabaseClient();
    const channel = sb
      .channel(`notif-gift-received:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const row = payload.new as { id: string; gift_id: string; type: string };
          if (row.type !== "gift_received") return;

          // Fetch del gift per prendere nome mittente
          let senderName = "Qualcuno";
          try {
            const { data: gift } = await sb
              .from("gifts")
              .select("sender_alias, creator_id, profiles!gifts_creator_id_fkey(display_name, email)")
              .eq("id", row.gift_id)
              .maybeSingle();
            if (gift) {
              const g = gift as { sender_alias?: string; profiles?: { display_name?: string; email?: string } };
              senderName = g.sender_alias
                || g.profiles?.display_name
                || (g.profiles?.email ? g.profiles.email.split("@")[0] : undefined)
                || "Qualcuno";
            }
          } catch { /* use default */ }

          const entry: ToastEntry = {
            id: String(row.id),
            giftId: row.gift_id,
            senderName,
            createdAt: Date.now(),
          };
          setToasts((prev) => [...prev, entry]);

          // Notifica OS se tab in background + permesso granted
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            const tabHidden = typeof document !== "undefined" && document.hidden;
            if (tabHidden) {
              try {
                const n = new Notification(`🎁 Hai ricevuto un regalo`, {
                  body: `${senderName} ti ha mandato un regalo su BeGift. Tocca per aprirlo.`,
                  icon: "/icon-192.png",
                  tag: `begift-gift-${row.gift_id}`,
                });
                n.onclick = () => {
                  window.focus();
                  window.location.href = `/gift/${row.gift_id}`;
                  n.close();
                };
              } catch { /* ignore */ }
            }
          }
        }
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [userId]);

  // Auto-dismiss dopo 8 secondi
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== toast.id));
      }, 8000)
    );
    return () => { timers.forEach(clearTimeout); };
  }, [toasts]);

  if (toasts.length === 0) return null;

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
        padding: "0 16px",
      }}
    >
      <style>{`
        @keyframes giftReceivedIn {
          from { opacity: 0; transform: translateY(-20px) scale(.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: "auto",
            background: "#fff",
            color: "#1a1a1a",
            border: `2px solid ${ACCENT}`,
            borderRadius: 20,
            padding: "14px 18px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(212,83,126,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "giftReceivedIn .4s cubic-bezier(.34,1.56,.64,1) both",
            maxWidth: 420,
            width: "100%",
          }}
        >
          <span style={{ fontSize: 28, flexShrink: 0 }}>🎁</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#888", fontWeight: 500, marginBottom: 2 }}>
              {t("notif_toast.new_gift")}
            </div>
            <div style={{ fontSize: 14, color: "#1a1a1a", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {t("notif_toast.sent_you_gift", { name: toast.senderName })}
            </div>
          </div>
          <a
            href={`/gift/${toast.giftId}`}
            style={{
              background: ACCENT,
              color: "#fff",
              border: "none",
              borderRadius: 20,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              fontFamily: "inherit",
            }}
          >
            {t("notif_toast.open_cta")}
          </a>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== toast.id))}
            aria-label={t("notif_toast.close")}
            style={{
              background: "transparent", border: "none", fontSize: 20,
              color: "#bbb", cursor: "pointer", padding: 0, lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
