"use client";

/**
 * OccasionLanding — component shared per le landing page SEO
 * per occasione (/compleanno, /anniversario, /laurea,
 * /san-valentino, /natale).
 *
 * Struttura ottimizzata per SEO italiano:
 * - H1 con keyword principale "regalo digitale {occasione}"
 * - Paragrafo intro con keyword naturali
 * - Sezione "Come funziona" in 3 step (rich snippet potenziale)
 * - Preview visuale del template packaging dell'occasione
 * - Testimonianza placeholder (social proof)
 * - FAQ mini (JSON-LD FAQPage per featured snippets)
 * - CTA finale a /create?occasion=X
 *
 * Include JSON-LD structured data:
 * - WebPage + breadcrumbs
 * - SoftwareApplication (servizio)
 * - FAQPage (FAQ sezione)
 *
 * Tutte le pagine occasion usano questo component passando config
 * diversa (emoji, colori packaging, copy, FAQ specifiche).
 */

import Link from "next/link";
import Script from "next/script";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#666";
const LIGHT = "#f7f5f2";

export interface OccasionConfig {
  /** URL slug dell'occasione: "compleanno", "anniversario", etc. */
  slug: string;
  /** Titolo H1 SEO-friendly (con keyword principale) */
  h1: string;
  /** Emoji rappresentativa (es. "🎂") */
  emoji: string;
  /** Colore carta del packaging preview */
  paperColor: string;
  /** Colore nastro del packaging preview */
  ribbonColor: string;
  /** Sottotitolo descrittivo sotto H1 */
  subtitle: string;
  /** Paragrafo intro SEO (200-300 caratteri ca.) */
  intro: string;
  /** 3 step "Come funziona" specifici per occasione */
  steps: { title: string; desc: string }[];
  /** FAQ specifiche occasione (3-5 domande) */
  faq: { q: string; a: string }[];
  /** Query string per pre-selezionare template in /create */
  occasionParam: string;
}

export default function OccasionLanding({ config }: { config: OccasionConfig }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://begift.app";
  const pageUrl = `${baseUrl}/${config.slug}`;

  // JSON-LD structured data per SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: config.h1,
        description: config.intro,
        inLanguage: "it-IT",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "BeGift", item: baseUrl },
          { "@type": "ListItem", position: 2, name: config.h1, item: pageUrl },
        ],
      },
      {
        "@type": "SoftwareApplication",
        name: "BeGift",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        description: "Servizio per creare regali digitali personalizzati con apertura emozionale.",
      },
      {
        "@type": "FAQPage",
        mainEntity: config.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <>
      <Script
        id={`occasion-jsonld-${config.slug}`}
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section style={{
          padding: "48px 24px 56px",
          textAlign: "center",
          background: `linear-gradient(135deg, ${config.paperColor}22, #fff)`,
        }}>
          <div style={{
            fontSize: 84, marginBottom: 16, lineHeight: 1,
            filter: "drop-shadow(0 10px 26px rgba(0,0,0,.12))",
          }}>{config.emoji}</div>
          <h1 style={{
            fontSize: "clamp(28px, 7vw, 44px)",
            fontWeight: 900,
            color: DEEP,
            margin: "0 0 12px",
            lineHeight: 1.1,
            letterSpacing: "-.5px",
            maxWidth: 720,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            {config.h1}
          </h1>
          <p style={{
            fontSize: 17, color: MUTED, maxWidth: 540,
            margin: "0 auto 28px", lineHeight: 1.6,
          }}>
            {config.subtitle}
          </p>
          <Link
            href={`/create?occasion=${config.occasionParam}`}
            style={{
              background: ACCENT, color: "#fff", borderRadius: 50,
              padding: "16px 40px", fontSize: 16, fontWeight: 700,
              textDecoration: "none", display: "inline-block",
              boxShadow: "0 10px 28px rgba(212,83,126,.3)",
            }}
          >
            Crea il tuo regalo {config.emoji}
          </Link>
        </section>

        {/* ── INTRO ─────────────────────────────────────────── */}
        <section style={{ padding: "48px 24px", maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: 16, color: DEEP, lineHeight: 1.75, margin: 0 }}>
            {config.intro}
          </p>
        </section>

        {/* ── COME FUNZIONA ────────────────────────────────── */}
        <section style={{ background: "#fff", padding: "56px 24px 60px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2 style={{
              fontSize: 26, fontWeight: 800, color: DEEP,
              textAlign: "center", margin: "0 0 32px", letterSpacing: "-.3px",
            }}>
              Come funziona
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 22,
            }}>
              {config.steps.map((step, i) => (
                <div key={i} style={{
                  background: LIGHT, borderRadius: 22,
                  padding: "28px 22px 24px",
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", top: -18, left: 22,
                    width: 36, height: 36, borderRadius: "50%",
                    background: ACCENT, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 900,
                    boxShadow: "0 4px 12px rgba(212,83,126,.35)",
                  }}>{i + 1}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: DEEP, margin: "10px 0 8px" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.6 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PREVIEW PACKAGING ─────────────────────────────── */}
        <section style={{ padding: "56px 24px", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: DEEP, margin: "0 0 12px" }}>
            Il tuo regalo {config.slug}, in anteprima
          </h2>
          <p style={{ fontSize: 14, color: MUTED, margin: "0 0 32px" }}>
            Colori e nastro già pre-selezionati. Puoi personalizzare ogni dettaglio.
          </p>
          <div style={{
            width: 180, height: 180, margin: "0 auto",
            background: config.paperColor,
            borderRadius: 14,
            position: "relative",
            boxShadow: "0 20px 48px rgba(0,0,0,.18)",
          }}>
            <div style={{
              position: "absolute", left: 0, right: 0, top: "50%",
              height: 22, background: config.ribbonColor,
              transform: "translateY(-50%)",
            }}/>
            <div style={{
              position: "absolute", top: 0, bottom: 0, left: "50%",
              width: 22, background: config.ribbonColor,
              transform: "translateX(-50%)",
            }}/>
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 50,
            }}>{config.emoji}</div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────── */}
        <section style={{ background: "#fff", padding: "56px 24px 60px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{
              fontSize: 26, fontWeight: 800, color: DEEP,
              textAlign: "center", margin: "0 0 32px",
            }}>
              Domande frequenti
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {config.faq.map((item, i) => (
                <details key={i} style={{
                  background: LIGHT, borderRadius: 14,
                  padding: "16px 20px", cursor: "pointer",
                  border: "1px solid #e8e4de",
                }}>
                  <summary style={{
                    fontSize: 15, fontWeight: 700, color: DEEP,
                    cursor: "pointer", listStyle: "none",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    {item.q}
                    <span style={{ fontSize: 18, color: ACCENT }}>+</span>
                  </summary>
                  <p style={{
                    fontSize: 14, color: MUTED,
                    margin: "12px 0 0", lineHeight: 1.7,
                  }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINALE ────────────────────────────────────── */}
        <section style={{
          padding: "64px 24px 80px", textAlign: "center",
          background: `linear-gradient(135deg, #fff5f8, #ffeef4)`,
        }}>
          <h2 style={{
            fontSize: 28, fontWeight: 900, color: DEEP,
            margin: "0 0 10px", letterSpacing: "-.5px",
          }}>
            Pronto a sorprendere?
          </h2>
          <p style={{ fontSize: 15, color: MUTED, margin: "0 0 28px" }}>
            Il primo regalo è gratis. Bastano 60 secondi.
          </p>
          <Link href={`/create?occasion=${config.occasionParam}`} style={{
            background: ACCENT, color: "#fff", borderRadius: 50,
            padding: "17px 44px", fontSize: 16, fontWeight: 800,
            textDecoration: "none", display: "inline-block",
            boxShadow: "0 10px 28px rgba(212,83,126,.35)",
          }}>
            Crea ora {config.emoji}
          </Link>
        </section>
      </main>
    </>
  );
}
