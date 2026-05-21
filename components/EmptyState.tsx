/**
 * EmptyState — componente riusabile per stati vuoti.
 *
 * Usato in tutte le pagine list di BeGift (catalogo senza filtri match,
 * drafts vuoti, dashboard senza regali, ecc.) per dare un'impressione
 * "amichevole" invece che "buco vuoto".
 *
 * Pattern:
 *   - Emoji grande in cima (visualmente caldo)
 *   - Titolo bold breve
 *   - Descrizione 1-2 righe spiega cosa fare
 *   - CTA opzionale (link o button) per next action
 *
 * Design tokens (CSS vars da app/globals.css):
 *   - var(--color-card), var(--color-border), var(--color-ink), ecc.
 *
 * Server component (no client JS) per evitare hydration overhead in
 * pagine static-friendly.
 */
import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  /** Extra slot per contenuto custom sotto la CTA (es. lista hint). */
  children?: ReactNode;
}

export default function EmptyState({
  emoji = "✨",
  title,
  description,
  ctaLabel,
  ctaHref,
  ctaOnClick,
  children,
}: EmptyStateProps) {
  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        padding: "44px 24px",
        textAlign: "center",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          fontSize: 56,
          marginBottom: "var(--space-3)",
          lineHeight: 1,
        }}
        aria-hidden
      >
        {emoji}
      </div>
      <h2
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: 800,
          color: "var(--color-ink)",
          margin: "0 0 var(--space-2)",
          lineHeight: "var(--leading-tight)",
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-muted)",
            margin: "0 0 var(--space-5)",
            lineHeight: "var(--leading-normal)",
            maxWidth: 380,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {description}
        </p>
      )}
      {ctaLabel &&
        (ctaHref ? (
          <Link
            href={ctaHref}
            style={{
              display: "inline-block",
              padding: "10px 22px",
              background: "var(--color-accent)",
              color: "#fff",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              textDecoration: "none",
              transition: "background var(--transition-fast)",
              boxShadow: "var(--shadow-brand)",
            }}
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={ctaOnClick}
            style={{
              padding: "10px 22px",
              background: "var(--color-accent)",
              color: "#fff",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "var(--shadow-brand)",
            }}
          >
            {ctaLabel}
          </button>
        ))}
      {children && (
        <div style={{ marginTop: "var(--space-5)" }}>{children}</div>
      )}
    </div>
  );
}
