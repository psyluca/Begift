"use client";

/**
 * MonthlySuggestionsWidget — banner mensile nella dashboard che
 * suggerisce occasioni dei prossimi 30 giorni e nudge contestuali.
 *
 * Ruolo retention: dare all'utente un MOTIVO strutturale per tornare
 * almeno una volta al mese. Anche senza ricorrenze salvate, ogni mese
 * c'e' qualcosa di calendariale (Festa della Mamma, Natale, ecc.) che
 * vale la pena suggerire.
 *
 * Il calendario e' hard-coded per ora: festivita' italiane principali.
 * In futuro potra' adattarsi alla locale dell'utente.
 *
 * Design: card minimalista con titolo "Maggio: 2 occasioni in arrivo",
 * lista contestuale, CTA di apertura del relativo template.
 */

import Link from "next/link";

const ACCENT = "#D4537E";
const GOLD = "#D4A340";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";

interface CalendarEntry {
  // Mese 1-12, giorno 1-31
  month: number;
  day: number;
  label: string;
  emoji: string;
  /** Link al template / occasione corrispondente in /create. */
  href: string;
  /** Quando (in giorni prima) iniziare a mostrarlo come "in arrivo". */
  noticeWindow: number;
}

const CALENDAR: CalendarEntry[] = [
  { month: 1, day: 1, label: "Capodanno", emoji: "🎊", href: "/create?occasion=other", noticeWindow: 14 },
  { month: 2, day: 14, label: "San Valentino", emoji: "❤️", href: "/san-valentino", noticeWindow: 21 },
  { month: 3, day: 8, label: "Festa della Donna", emoji: "🌷", href: "/create?occasion=other", noticeWindow: 14 },
  { month: 3, day: 19, label: "Festa del Papa'", emoji: "👨", href: "/create?occasion=other", noticeWindow: 21 },
  { month: 5, day: 11, label: "Festa della Mamma", emoji: "💐", href: "/festa-mamma", noticeWindow: 28 },
  { month: 6, day: 2, label: "Festa della Repubblica", emoji: "🇮🇹", href: "/create?occasion=other", noticeWindow: 7 },
  { month: 8, day: 15, label: "Ferragosto", emoji: "☀️", href: "/create?occasion=other", noticeWindow: 14 },
  { month: 11, day: 1, label: "Onomastico (Tutti i Santi)", emoji: "🎊", href: "/onomastico", noticeWindow: 14 },
  { month: 12, day: 8, label: "Immacolata", emoji: "✨", href: "/create?occasion=other", noticeWindow: 14 },
  { month: 12, day: 25, label: "Natale", emoji: "🎄", href: "/natale", noticeWindow: 35 },
  { month: 12, day: 31, label: "Capodanno", emoji: "🥂", href: "/create?occasion=other", noticeWindow: 14 },
];

function daysUntil(month: number, day: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = new Date(now.getFullYear(), month - 1, day);
  if (target.getTime() < today.getTime()) {
    target = new Date(now.getFullYear() + 1, month - 1, day);
  }
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function relativeLabel(days: number): string {
  if (days === 0) return "oggi";
  if (days === 1) return "domani";
  if (days < 7) return `tra ${days} giorni`;
  if (days < 14) return "la prossima settimana";
  if (days < 31) return `tra ${Math.round(days / 7)} settimane`;
  return `tra ${Math.round(days / 30)} mesi`;
}

export function MonthlySuggestionsWidget() {
  // Filtra le occasioni che cadono dentro la finestra di "preavviso"
  // (oggi <= target <= target.noticeWindow giorni nel futuro).
  const upcoming = CALENDAR
    .map((c) => ({ ...c, days: daysUntil(c.month, c.day) }))
    .filter((c) => c.days >= 0 && c.days <= c.noticeWindow)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <div style={{
      background: "#fff",
      border: `1px solid #eadfd5`,
      borderRadius: 16,
      padding: 16,
      margin: "10px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }} aria-hidden>📅</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: DEEP }}>
          {upcoming.length === 1 ? "Occasione in arrivo" : "Prossime occasioni"}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {upcoming.map((c) => {
          const urgent = c.days <= 3;
          return (
            <Link
              key={`${c.month}-${c.day}`}
              href={c.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: urgent ? "#fff5f8" : "#fafaf7",
                border: `1px solid ${urgent ? "#fadce7" : "#eadfd5"}`,
                borderRadius: 10,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span style={{ fontSize: 18 }} aria-hidden>{c.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: DEEP }}>{c.label}</div>
                <div style={{ fontSize: 11, color: urgent ? ACCENT : MUTED, fontWeight: urgent ? 600 : 400 }}>
                  {String(c.day).padStart(2, "0")}/{String(c.month).padStart(2, "0")} · {relativeLabel(c.days)}
                </div>
              </div>
              <span style={{ fontSize: 11, color: ACCENT, fontWeight: 700 }}>
                Prepara →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
