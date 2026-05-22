/**
 * Skeleton — placeholder visivi durante loading.
 *
 * Pattern usato in tutte le pagine list per evitare "flash of empty
 * state" (utente non sa se vuoto vero o ancora caricando).
 *
 * Variants:
 *   - card: rettangolo proporzionato a card catalog (immagine + body)
 *   - line: barra orizzontale per testo (height 14px default)
 *   - avatar: cerchio per profili/avatar
 *   - block: rettangolo generico personalizzabile via width/height
 *
 * Animation: shimmer diagonale 1.5s definito in app/globals.css
 * (.skeleton class). Rispetta prefers-reduced-motion.
 *
 * Server component — niente client JS necessario.
 */
import type { CSSProperties } from "react";

interface SkeletonProps {
  variant?: "card" | "line" | "avatar" | "block";
  width?: string | number;
  height?: string | number;
  count?: number;
  style?: CSSProperties;
}

export default function Skeleton({
  variant = "block",
  width,
  height,
  count = 1,
  style,
}: SkeletonProps) {
  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton
            key={i}
            variant={variant}
            width={width}
            height={height}
            style={style}
          />
        ))}
      </>
    );
  }

  const base: CSSProperties = {
    width: width ?? "100%",
    height: height ?? 14,
    ...style,
  };

  if (variant === "avatar") {
    const size = width ?? height ?? 40;
    return (
      <div
        className="skeleton"
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          ...style,
        }}
      />
    );
  }

  if (variant === "line") {
    return (
      <div
        className="skeleton"
        aria-hidden
        style={{
          height: height ?? 14,
          width: width ?? "100%",
          borderRadius: "var(--radius-sm)",
          ...style,
        }}
      />
    );
  }

  if (variant === "card") {
    return (
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          ...style,
        }}
      >
        <div className="skeleton" aria-hidden style={{ height: 170, borderRadius: 0 }} />
        <div style={{ padding: "14px 16px 16px" }}>
          <div className="skeleton" style={{ height: 11, width: "40%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: "85%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 11, width: "30%" }} />
        </div>
      </div>
    );
  }

  return <div className="skeleton" aria-hidden style={base} />;
}
