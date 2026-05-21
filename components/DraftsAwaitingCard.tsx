"use client";

/**
 * Card "Bozze in attesa" per la dashboard.
 *
 * Mostra un riepilogo veloce delle bozze pending (forward mail in
 * attesa di personalizzazione). Pattern progressive disclosure:
 *   - se l'utente ha 0 bozze → componente NON renderizza nulla (return null)
 *   - se ha >=1 bozza → card prominente con count + CTA verso /drafts
 *
 * Rationale: la dashboard e' dove l'utente va per vedere i regali fatti.
 * Mostrare una card "Hai N bozze" subito in alto cattura chi ha
 * iniziato il flow mail-forward ma non l'ha completato. Quando ha 0
 * bozze, la card non distrae — la consapevolezza che il flow esista
 * la prende dal hub /regalo (banda mail) e dalla TopBar (icona bozze).
 */
import { useEffect, useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const BORDER = "#e8e4de";

export default function DraftsAwaitingCard() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAuthed("/api/drafts");
        if (!res.ok) return;
        const body = await res.json();
        if (cancelled) return;
        const list = Array.isArray(body) ? body : (body?.drafts || []);
        setCount(list.length || 0);
      } catch {
        /* silent: card non si mostra se fetch fallisce */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Render solo se ci sono >=1 bozze (Modo 1: progressive disclosure).
  if (count == null || count === 0) return null;

  const label =
    count === 1 ? "1 bozza in attesa" : `${count} bozze in attesa`;

  return (
    <a
      href="/drafts"
      style={{
        display: "block",
        background: "linear-gradient(135deg,#FFF3E0 0%,#FCE4EC 100%)",
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "14px 18px",
        margin: "16px 0",
        textDecoration: "none",
        color: "inherit",
        boxShadow: "0 2px 8px rgba(212,83,126,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flex: "1 1 auto",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 26,
              flexShrink: 0,
              lineHeight: 1,
            }}
            aria-hidden
          >
            📬
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 14.5,
                fontWeight: 800,
                color: INK,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: MUTED,
                margin: "2px 0 0",
                lineHeight: 1.4,
              }}
            >
              {count === 1
                ? "Una mail di conferma ti aspetta — personalizzala in un pacco regalo."
                : "Mail di conferma in attesa — personalizzale in pacchi regalo."}
            </p>
          </div>
        </div>
        <span
          style={{
            background: ACCENT,
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 700,
            padding: "7px 14px",
            borderRadius: 999,
            flexShrink: 0,
          }}
        >
          Apri →
        </span>
      </div>
    </a>
  );
}
