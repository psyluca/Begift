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

  const inner = (
    <>
      {e.image_url && (
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
            (ev.target as HTMLImageElement).style.display = "none";
          }}
        />
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
