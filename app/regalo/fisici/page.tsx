/**
 * /regalo/fisici — "Il regalo prima del regalo"
 *
 * Pagina dedicata ai regali fisici (24Bottles e futuri partner di
 * regalo da spedire). Sotto-rotta del flusso unificato /regalo,
 * categoria editoriale distinta dal catalogo esperienze digitali:
 *
 *   /regalo/catalogo → esperienze digitali (GYG + VVT)
 *   /regalo/fisici   → oggetti fisici spediti (questo file)
 *
 * Differenza editoriale: con regali fisici, BeGift e' il "pacco
 * digitale anticipato" — il destinatario apre l'animazione subito,
 * sa cosa sta arrivando, vive l'attesa come parte del regalo.
 *
 * Layout: snello, no filtri (volume basso, ~10 categorie 24Bottles).
 * Lista grid uniforme, badge "📦 a casa" e shipping_estimated_days
 * sotto il titolo. Branch feature/regali-fisici-tab.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { ExperienceWithPartner } from "@/types/experiences";
import CatalogCardImage from "@/app/regalo/catalogo/CatalogCardImage";

const ACCENT = "#D4537E";
const ACCENT_ORANGE = "#E8A04A";
const INK = "#1a1a1a";
const MUTED = "#7a7a7a";
const SOFT_BG = "#f7f5f2";
const BORDER = "#e8e4de";
const CARD = "#fff";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Il regalo prima del regalo · BeGift",
  description:
    "Oggetti spediti a casa di chi li riceve. Il pacco BeGift si apre subito col messaggio e l'animazione, l'oggetto fisico arriva nei giorni successivi.",
};

export default async function FisiciPage() {
  if (process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP !== "true") {
    notFound();
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("experiences")
    .select("*, partner:experience_partners(slug, display_name)")
    .eq("active", true)
    .eq("is_physical_gift", true)
    .order("price_min_cents", { ascending: true, nullsFirst: false })
    .limit(40);

  if (error) {
    console.error("[fisici] DB error:", error.message);
  }

  const items = ((data || []) as Array<Record<string, unknown>>).map((row) => {
    const rawPartner = row.partner;
    const partner = Array.isArray(rawPartner) ? rawPartner[0] : rawPartner;
    return { ...row, partner } as unknown as ExperienceWithPartner;
  });

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
        {/* Breadcrumb */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/regalo"
            style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}
          >
            ← Indietro
          </Link>
        </div>

        {/* Hero header dedicato — il claim e' il titolo */}
        <header style={{ marginBottom: 28, maxWidth: 720 }}>
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: ACCENT_ORANGE,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              margin: "0 0 10px",
            }}
          >
            Regali fisici · da spedire a casa
          </p>
          <h1
            style={{
              fontSize: "clamp(28px, 5.5vw, 40px)",
              fontWeight: 900,
              color: INK,
              margin: "0 0 12px",
              letterSpacing: "-0.6px",
              lineHeight: 1.1,
            }}
          >
            Il regalo prima del regalo
          </h1>
          <p style={{ fontSize: 15.5, color: MUTED, margin: 0, lineHeight: 1.6 }}>
            Acquisti sul partner, BeGift impacchetta digitalmente quello che
            arriva a casa nei giorni successivi. Chi lo riceve apre subito
            l'animazione, vede l'oggetto, sa quando arriva. L'attesa diventa
            parte del regalo.
          </p>
        </header>

        {/* Info strip "come funziona" — 3 step rapidi specifici per fisici */}
        <section
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: "16px 22px",
            marginBottom: 28,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
          }}
        >
          <Step n={1} title="Scegli l'oggetto" text="Sfoglia il catalogo qui sotto, clicca quello che ti piace." />
          <Step n={2} title="Acquisti sul partner" text="Il bottone ti porta dal venditore. Paghi lì, niente costi BeGift." />
          <Step n={3} title="Doppio regalo" text="BeGift apre il pacco digitale subito. L'oggetto arriva a casa nei giorni successivi." />
        </section>

        {/* Lista regali fisici */}
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <p
              style={{
                fontSize: 12,
                color: MUTED,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              {items.length} {items.length === 1 ? "regalo disponibile" : "regali disponibili"}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {items.map((e) => (
                <PhysicalCard key={e.id} experience={e} />
              ))}
            </div>
          </>
        )}

        {/* Disclosure */}
        <p
          style={{
            fontSize: 11.5,
            color: MUTED,
            marginTop: 40,
            textAlign: "center",
            lineHeight: 1.65,
            maxWidth: 720,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          BeGift mostra prodotti dei partner ufficiali con cui ha un accordo
          affiliate. Acquistando dai partner BeGift puo&apos; ricevere una
          piccola commissione, senza alcun costo aggiuntivo per te.{" "}
          <Link href="/privacy" style={{ color: ACCENT, textDecoration: "underline" }}>
            Privacy & partner
          </Link>
        </p>
      </div>
    </main>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: ACCENT_ORANGE,
          color: "#fff",
          fontSize: 13,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-hidden
      >
        {n}
      </div>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: INK, margin: "0 0 3px" }}>
          {title}
        </p>
        <p style={{ fontSize: 12.5, color: MUTED, margin: 0, lineHeight: 1.5 }}>
          {text}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 18,
        padding: "44px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
      <h2 style={{ fontSize: 18, color: INK, margin: "0 0 8px", fontWeight: 800 }}>
        Catalogo regali fisici in arrivo
      </h2>
      <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.55 }}>
        Stiamo aggiungendo i primi partner. Torna fra poco.
      </p>
    </div>
  );
}

function PhysicalCard({ experience: e }: { experience: ExperienceWithPartner }) {
  const priceLabel = e.price_min_cents
    ? `da €${(e.price_min_cents / 100).toFixed(0)}`
    : null;
  const shippingLabel = e.shipping_estimated_days
    ? `Consegna ~${e.shipping_estimated_days} giorni`
    : null;

  return (
    <Link
      href={`/experiences/${e.id}?from=fisici`}
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        transition: "transform .14s, box-shadow .14s, border-color .14s",
      }}
      className="phys-card"
    >
      <div style={{ position: "relative" }}>
        <CatalogCardImage
          src={e.image_url || null}
          alt={e.title}
          placeholderEmoji="📦"
          placeholderGradient="linear-gradient(135deg,#FFF3E0,#FCE4EC)"
        />
        <span
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            background: "rgba(255,255,255,0.96)",
            color: INK,
            fontSize: 10.5,
            fontWeight: 800,
            padding: "4px 9px",
            borderRadius: 999,
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            pointerEvents: "none",
          }}
        >
          <span aria-hidden>📦</span>
          <span>a casa</span>
        </span>
      </div>
      <div
        style={{
          padding: "12px 14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          flex: 1,
        }}
      >
        <h3
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: INK,
            margin: 0,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {e.title}
        </h3>
        {shippingLabel && (
          <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{shippingLabel}</p>
        )}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 6,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 13,
            color: MUTED,
          }}
        >
          {priceLabel ? (
            <span style={{ color: ACCENT_ORANGE, fontWeight: 800 }}>
              {priceLabel}
            </span>
          ) : (
            <span></span>
          )}
        </div>
      </div>
      <style>{`
        .phys-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.06);
          border-color: ${ACCENT_ORANGE};
        }
      `}</style>
    </Link>
  );
}
