/**
 * Loading state per /regalo/catalogo.
 *
 * Next.js convention: questo file viene renderizzato automaticamente
 * mentre il server component principale (page.tsx) fa fetch dei dati.
 * Mostra skeleton di filtri + card per "feel" istantaneo.
 *
 * Aggiunto 2026-05-21 (UX revamp overnight) per evitare flash of empty
 * state.
 */
import Skeleton from "@/components/Skeleton";

const SOFT_BG = "#f7f5f2";

export default function CatalogoLoading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "28px 16px 100px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Breadcrumb skeleton */}
        <Skeleton width={100} height={14} style={{ marginBottom: 22 }} />

        {/* Header */}
        <div style={{ marginBottom: 22, maxWidth: 720 }}>
          <Skeleton height={38} width="60%" style={{ marginBottom: 12 }} />
          <Skeleton height={18} width="85%" />
          <div style={{ marginTop: 8 }}>
            <Skeleton height={18} width="65%" />
          </div>
        </div>

        {/* Filter rows */}
        {[1, 2, 3].map((row) => (
          <section key={row} style={{ marginBottom: 14 }}>
            <Skeleton width={90} height={12} style={{ marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 7 }}>
              {[1, 2, 3, 4, 5, 6].map((chip) => (
                <Skeleton
                  key={chip}
                  width={chip === 1 ? 70 : 100}
                  height={32}
                  style={{ borderRadius: 999, flexShrink: 0 }}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Stats placeholder */}
        <div style={{ marginTop: 28, marginBottom: 14 }}>
          <Skeleton width={220} height={14} />
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          <Skeleton variant="card" count={6} />
        </div>
      </div>
    </main>
  );
}
