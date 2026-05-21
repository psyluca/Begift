"use client";

/**
 * ExperienceCard — UI riusabile per un'esperienza del catalogo.
 *
 * Usata in:
 *   - /discover (lista discovery)
 *   - /experiences/[id] (dettaglio, vista compatta correlate)
 *   - DraftCompletionClient (cross-sell dopo email parser)
 *   - CreateGiftClient (picker durante create gift)
 *
 * Render minimo stile BeGift: foto hero, titolo, città, prezzo, rating.
 * Click → onPick callback (parent gestisce navigazione/azione).
 */

import Link from "next/link";
import type { ExperienceWithPartner } from "@/types/experiences";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const BORDER = "#e8e4de";
const CARD = "#fff";

interface Props {
  experience: ExperienceWithPartner;
  /** Se passato, il componente diventa <button>, altrimenti <Link> a /experiences/[id] */
  onPick?: (id: string) => void;
  variant?: "default" | "compact";
}

export default function ExperienceCard({
  experience: e,
  onPick,
  variant = "default",
}: Props) {
  const isCompact = variant === "compact";

  const priceLabel = (() => {
    if (!e.price_min_cents) return null;
    const min = (e.price_min_cents / 100).toFixed(0);
    const max = e.price_max_cents
      ? (e.price_max_cents / 100).toFixed(0)
      : null;
    if (max && max !== min) return `€${min}–€${max}`;
    return `€${min}`;
  })();

  const ratingLabel =
    e.rating != null && e.reviews_count > 0
      ? `★ ${e.rating.toFixed(1)} (${formatReviews(e.reviews_count)})`
      : null;

  // Placeholder con gradient + emoji per categoria quando manca image_url
  // o quando l'URL e' rotto. Eleganza > foto stock generica.
  const categoryStyle = getCategoryPlaceholder(e.category);

  const inner = (
    <>
      {e.image_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={e.image_url}
          alt={e.title}
          style={{
            width: "100%",
            height: isCompact ? 120 : 180,
            objectFit: "cover",
            background: "#f0ece6",
            display: "block",
          }}
          onError={(ev) => {
            // Se l'URL fallisce, mostra il placeholder al posto dell'icona rotta
            const img = ev.target as HTMLImageElement;
            const parent = img.parentElement;
            if (!parent) return;
            img.style.display = "none";
            const ph = document.createElement("div");
            ph.style.cssText = `
              width: 100%;
              height: ${isCompact ? 120 : 180}px;
              background: ${categoryStyle.gradient};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${isCompact ? 36 : 56}px;
            `;
            ph.textContent = categoryStyle.emoji;
            parent.insertBefore(ph, img);
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: isCompact ? 120 : 180,
            background: categoryStyle.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isCompact ? 36 : 56,
          }}
          aria-hidden="true"
        >
          {categoryStyle.emoji}
        </div>
      )}
      <div style={{ padding: "12px 14px" }}>
        <p style={{ fontSize: 11, color: MUTED, margin: "0 0 4px" }}>
          {[e.city, e.country !== "IT" ? e.country : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h3
          style={{
            fontSize: isCompact ? 14 : 16,
            fontWeight: 700,
            color: INK,
            margin: "0 0 8px",
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {e.title}
        </h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: MUTED,
          }}
        >
          {priceLabel ? (
            <span style={{ color: INK, fontWeight: 600 }}>
              da {priceLabel}
            </span>
          ) : (
            <span></span>
          )}
          {ratingLabel && <span>{ratingLabel}</span>}
        </div>
      </div>
    </>
  );

  const baseStyle: React.CSSProperties = {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 14,
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
    display: "block",
    transition: "transform .14s, box-shadow .14s",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  };

  if (onPick) {
    return (
      <button
        type="button"
        onClick={() => onPick(e.id)}
        style={{ ...baseStyle, background: CARD }}
        aria-label={`Scegli ${e.title}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link href={`/experiences/${e.id}`} style={baseStyle}>
      {inner}
    </Link>
  );
}

function formatReviews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/**
 * Mappa categoria → emoji + gradient di sfondo per il placeholder.
 * Usato quando l'esperienza non ha image_url o quando il caricamento
 * fallisce (URL rotto, hotlink protetto). Più affidabile di URL stock
 * di terzi che possono sparire.
 */
function getCategoryPlaceholder(category: string): {
  emoji: string;
  gradient: string;
} {
  const map: Record<string, { emoji: string; gradient: string }> = {
    food:     { emoji: "🍷", gradient: "linear-gradient(135deg,#d4537e,#f4a04a)" },
    outdoor:  { emoji: "🥾", gradient: "linear-gradient(135deg,#3b8c5a,#7dbf63)" },
    culture:  { emoji: "🎨", gradient: "linear-gradient(135deg,#6b5bcc,#a484e8)" },
    wellness: { emoji: "🧖", gradient: "linear-gradient(135deg,#5fb8c4,#9ad6df)" },
    travel:   { emoji: "✈️", gradient: "linear-gradient(135deg,#3a78c2,#7eb3ed)" },
    music:    { emoji: "🎵", gradient: "linear-gradient(135deg,#c4407a,#e87ba8)" },
    show:     { emoji: "🎭", gradient: "linear-gradient(135deg,#a04a8c,#d97cb8)" },
    gear:     { emoji: "🎁", gradient: "linear-gradient(135deg,#888,#bbb)" },
  };
  return map[category] || { emoji: "🎁", gradient: "linear-gradient(135deg,#888,#bbb)" };
}
