"use client";

/**
 * SeasonalBanner — banner promozionale temporaneo che appare solo
 * dentro la "finestra di interesse" di una festivita' (default 14
 * giorni prima fino al giorno stesso). Si auto-nasconde dopo,
 * niente bloat permanente.
 *
 * Riusabile: configurazione in components/SeasonalBanner.tsx
 * stesso (BANNERS array). Aggiungere una nuova festivita' significa
 * aggiungere una entry, niente refactor lato consumer.
 *
 * Pensato per essere incluso in:
 *  - home (/) sotto l'hero
 *  - create (/create) in cima al flow al primo step
 *  - eventualmente altre superfici di entrata
 */

import Link from "next/link";

interface BannerConfig {
  /** ID per dismiss persistente (futuro). */
  id: string;
  /** Mese 1-12 e giorno 1-31 dell'evento. */
  month: number;
  day: number;
  /** Quanti giorni PRIMA della data inizia a mostrarsi. */
  noticeWindow: number;
  /** Pattern visivo. */
  emoji: string;
  paletteBg: string;
  paletteAccent: string;
  paletteText: string;
  /** Microcopy. */
  headline: string;
  subline: string;
  /** Destinazione. */
  href: string;
  ctaLabel: string;
}

const BANNERS: BannerConfig[] = [
  {
    id: "mothers_day_2026",
    month: 5,
    day: 11,
    noticeWindow: 14,
    emoji: "💐",
    paletteBg: "linear-gradient(135deg, #F4DCD8 0%, #FFF3EA 100%)",
    paletteAccent: "#D4A340",
    paletteText: "#1a1a1a",
    headline: "Festa della Mamma in arrivo",
    subline: "Crea la Lettera che cresce: 5 domande emotive, una foto, una canzone. Pronto in 3 minuti.",
    href: "/festa-mamma",
    ctaLabel: "Crea il regalo →",
  },
  {
    id: "fathers_day_2026_it",
    month: 3,
    day: 19,
    noticeWindow: 14,
    emoji: "🌳",
    paletteBg: "linear-gradient(135deg, #E8DCC4 0%, #F5EBD8 100%)",
    paletteAccent: "#5C7A4A",
    paletteText: "#1a1a1a",
    headline: "Festa del Papà in arrivo",
    subline: "Una Lettera che cresce per papà: 5 domande, una foto, una canzone. Pronta in 3 minuti.",
    href: "/festa-papa",
    ctaLabel: "Crea il regalo →",
  },
];

/** Calcola quanti giorni mancano alla prossima occorrenza dell'evento.
 *  Negativo se gia' passato in questo anno (ma riteniamo solo prossima
 *  occorrenza nello stesso anno). */
function daysUntilEvent(month: number, day: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(now.getFullYear(), month - 1, day);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function SeasonalBanner({ variant = "compact" }: { variant?: "compact" | "spacious" }) {
  // Trova un banner attivo (oggi nella finestra: tra noticeWindow giorni prima
  // e fino al giorno dell'evento incluso). Solo il primo che matcha viene
  // mostrato — se ce ne fossero due overlap (raro), priorita' al primo della
  // lista.
  const active = BANNERS.find((b) => {
    const days = daysUntilEvent(b.month, b.day);
    return days >= 0 && days <= b.noticeWindow;
  });
  if (!active) return null;

  const daysLeft = daysUntilEvent(active.month, active.day);
  const urgencyText =
    daysLeft === 0 ? "Oggi!" :
    daysLeft === 1 ? "Domani" :
    `Tra ${daysLeft} giorni`;

  const padding = variant === "spacious" ? "20px 22px" : "14px 16px";
  const headlineSize = variant === "spacious" ? "clamp(18px, 5vw, 22px)" : "clamp(15px, 4.4vw, 17px)";
  const sublineSize = variant === "spacious" ? 14 : 12.5;

  return (
    <Link
      href={active.href}
      style={{
        display: "block",
        textDecoration: "none",
        background: active.paletteBg,
        border: `1px solid ${active.paletteAccent}55`,
        borderRadius: 16,
        padding,
        margin: "10px 0",
        color: active.paletteText,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Badge urgenza in alto a destra */}
      <div style={{
        position: "absolute",
        top: 10, right: 12,
        background: active.paletteAccent,
        color: "#fff",
        fontSize: 10,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderRadius: 20,
        padding: "3px 9px",
      }}>
        {urgencyText}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingRight: 70 }}>
        <div style={{ fontSize: variant === "spacious" ? 32 : 26, lineHeight: 1, flexShrink: 0 }} aria-hidden>
          {active.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: headlineSize,
            fontWeight: 800,
            lineHeight: 1.25,
            margin: "0 0 4px",
          }}>
            {active.headline}
          </div>
          <div style={{
            fontSize: sublineSize,
            color: active.paletteText,
            opacity: 0.75,
            lineHeight: 1.5,
            marginBottom: 8,
          }}>
            {active.subline}
          </div>
          <div style={{
            display: "inline-block",
            fontSize: 13,
            fontWeight: 700,
            color: active.paletteAccent,
          }}>
            {active.ctaLabel}
          </div>
        </div>
      </div>
    </Link>
  );
}
