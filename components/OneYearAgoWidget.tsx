"use client";

/**
 * OneYearAgoWidget — leva di retention "Replay del proprio archivio".
 * Mostra nella dashboard il regalo che l'utente ha mandato esattamente
 * un anno fa (in una finestra di +/- 7 giorni). Effetto nostalgia +
 * suggerimento implicito di rifarlo.
 *
 * Non rendere nulla se: utente non loggato, o non ha gift di un anno fa,
 * o il gift di un anno fa e' stato cancellato.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";

interface PastGift {
  id: string;
  recipient_name: string;
  created_at: string;
  packaging?: { paperColor?: string; ribbonColor?: string } | null;
  template_type?: string | null;
}

export function OneYearAgoWidget() {
  const [gift, setGift] = useState<PastGift | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAuthed("/api/gifts/one-year-ago");
        if (!res.ok) { setTried(true); return; }
        const data = await res.json();
        if (cancelled) return;
        if (data?.gift) setGift(data.gift);
        setTried(true);
      } catch {
        setTried(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!tried || !gift) return null;

  const daysAgo = Math.round(
    (Date.now() - new Date(gift.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const recipientLabel = gift.recipient_name;
  const dateStr = new Date(gift.created_at).toLocaleDateString("it-IT", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div style={{
      background: "linear-gradient(135deg, #fffaf0 0%, #fff 100%)",
      border: "1.5px solid #f0e1c5",
      borderRadius: 16,
      padding: 16,
      margin: "10px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }} aria-hidden>🕰️</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: DEEP }}>
            Un anno fa
          </div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>
            Hai mandato un regalo a {recipientLabel} il {dateStr}.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Link
          href={`/create?recipient=${encodeURIComponent(recipientLabel)}`}
          style={{
            flex: 1,
            background: ACCENT,
            color: "#fff",
            border: "none",
            borderRadius: 20,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          Mandagliene un altro
        </Link>
        <Link
          href={`/gift/${gift.id}`}
          style={{
            background: "transparent",
            color: MUTED,
            border: "1px solid #e0d0c8",
            borderRadius: 20,
            padding: "8px 14px",
            fontSize: 12,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          Rivedi
        </Link>
      </div>
    </div>
  );
}
