/**
 * Fallback 404 globale BeGift.
 *
 * Migliorato 2026-05-21 (overnight revamp):
 *   - Layout coerente con design tokens (CSS vars)
 *   - Microinterazione: emoji 🎁 con float animation
 *   - Suggerimenti utili: link alle 3 pagine principali (regalo, catalog, drafts)
 *   - Copy piu' calda
 *
 * Route /gift/[id]/not-found.tsx (se creata) sovrascrive per pagine gift
 * con copy "Regalo non trovato o link scaduto".
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
        padding: "var(--space-6)",
      }}
    >
      {/* Hero emoji con animazione float, coerente con la home */}
      <div
        style={{
          fontSize: 72,
          marginBottom: "var(--space-5)",
          filter: "drop-shadow(0 12px 32px rgba(212,83,126,0.25))",
          animation: "notFoundFloat 3.2s ease-in-out infinite",
          lineHeight: 1,
        }}
        aria-hidden
      >
        🎁
      </div>
      <style>{`
        @keyframes notFoundFloat {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-8px); }
        }
      `}</style>

      <h1
        style={{
          fontSize: "var(--text-3xl)",
          fontWeight: 900,
          color: "var(--color-ink)",
          margin: "0 0 var(--space-3)",
          letterSpacing: "-1px",
          lineHeight: "var(--leading-tight)",
        }}
      >
        Pagina non trovata
      </h1>
      <p
        style={{
          color: "var(--color-muted)",
          fontSize: "var(--text-base)",
          lineHeight: "var(--leading-normal)",
          maxWidth: 360,
          margin: "0 0 var(--space-8)",
        }}
      >
        La pagina che cerchi non esiste o non è più disponibile.
        <br />
        Se stavi aprendo un regalo, il link potrebbe essere scaduto.
      </p>

      <Link
        href="/"
        style={{
          background: "var(--color-accent)",
          color: "#fff",
          borderRadius: "var(--radius-full)",
          padding: "14px 32px",
          fontSize: "var(--text-sm)",
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "var(--shadow-brand)",
          marginBottom: "var(--space-8)",
        }}
      >
        Torna alla home
      </Link>

      {/* Altri suggerimenti utili — micro-recovery UX */}
      <p
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-muted)",
          margin: "0 0 var(--space-3)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 700,
        }}
      >
        Oppure prova
      </p>
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { href: "/regalo", emoji: "🎁", label: "Fai un regalo" },
          { href: "/regalo/catalogo", emoji: "✨", label: "Vedi il catalogo" },
          { href: "/drafts", emoji: "📬", label: "Le tue bozze" },
        ].map((s) => (
          <Link
            key={s.href}
            href={s.href}
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-full)",
              padding: "8px 14px",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--color-ink)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span aria-hidden style={{ fontSize: 14 }}>{s.emoji}</span>
            {s.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
