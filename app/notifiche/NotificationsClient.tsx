"use client";

/**
 * NotificationsClient — pagina /notifiche, "centro notifiche" in-app.
 *
 * Mostra TUTTE le notifiche dell'utente (gift ricevuto, gift aperto,
 * reazione ricevuta, gift chain) anche se la push del momento e'
 * stata persa o non recapitata. Risolve il problema "ho ricevuto un
 * regalo ma non l'ho mai aperto perche' non mi e' arrivata la push":
 * la persona apre la pagina e vede tutto lo storico.
 *
 * Auto-marca tutte come lette al primo mount. Bottone "marca tutte"
 * sempre visibile in alto.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";
const LIGHT = "#f7f5f2";
const BORDER = "#e0dbd5";

interface Notif {
  id: string;
  type: string;
  gift_id: string | null;
  created_at: string;
  read_at: string | null;
  title: string;
  body: string;
  url: string;
  emoji: string;
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "ora";
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ore fa`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} g fa`;
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: days > 365 ? "numeric" : undefined });
}

export default function NotificationsClient() {
  const [items, setItems] = useState<Notif[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [needsLogin, setNeedsLogin] = useState(false);

  const load = async () => {
    try {
      const res = await fetchAuthed("/api/notifications/list?limit=100");
      if (res.status === 401) { setNeedsLogin(true); return; }
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch (e) {
      console.error("[notifiche] load failed", e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetchAuthed("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setUnread(0);
      setItems((prev) => prev?.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })) ?? null);
    } catch (e) {
      console.error("[notifiche] mark-all failed", e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Auto mark-all-read 3 secondi dopo il mount, se l'utente e' ancora
  // sulla pagina. Cosi' lo storico resta consultabile ma il badge
  // contatore va a zero — pattern delle email/messenger.
  useEffect(() => {
    if (!items || unread === 0) return;
    const t = setTimeout(() => { markAllRead(); }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, unread]);

  if (needsLogin) {
    return (
      <main style={{ minHeight: "100vh", background: LIGHT, padding: 40, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🔔</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: DEEP, margin: "0 0 8px" }}>Accedi per vedere le tue notifiche</h2>
        <Link href="/auth/login?next=/notifiche" style={{
          display: "inline-block", marginTop: 18,
          background: ACCENT, color: "#fff", borderRadius: 40,
          padding: "12px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none",
        }}>
          Accedi
        </Link>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: DEEP, margin: 0, letterSpacing: "-.5px" }}>
            Notifiche
            {unread > 0 && (
              <span style={{
                marginLeft: 10,
                background: ACCENT, color: "#fff",
                fontSize: 12, fontWeight: 700,
                borderRadius: 20, padding: "3px 10px",
                verticalAlign: "middle",
              }}>{unread}</span>
            )}
          </h1>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: "transparent", border: "none",
                color: ACCENT, fontSize: 13, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Segna tutte come lette
            </button>
          )}
        </div>

        {items === null && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: MUTED, fontSize: 14 }}>
            Caricamento…
          </div>
        )}

        {items?.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: MUTED }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🔕</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: DEEP, margin: "0 0 6px" }}>Nessuna notifica</p>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Quando qualcuno ti manda un regalo, lo apre o reagisce, lo trovi qui.
            </p>
          </div>
        )}

        {items && items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((n) => (
              <Link
                key={n.id}
                href={n.url}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "14px 16px",
                  background: n.read_at ? "#fff" : "#fff5f8",
                  border: `1px solid ${n.read_at ? BORDER : "#fadce7"}`,
                  borderRadius: 12,
                  textDecoration: "none",
                  color: "inherit",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2 }} aria-hidden>
                  {n.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DEEP, lineHeight: 1.35, marginBottom: 3 }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
                    {n.body}
                  </div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.read_at && (
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: ACCENT, flexShrink: 0, marginTop: 8,
                  }}/>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
