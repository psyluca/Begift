/**
 * /regali-a/[city]
 *
 * Landing page SEO-friendly per ricerca "regali a [città]".
 * Genera dinamicamente una pagina per ogni città presente nel catalogo
 * experiences. Pubblica (no auth), indicizzabile da Google.
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP (segue lo stesso
 * gate del catalogo /discover).
 *
 * URL esempi:
 *   /regali-a/roma     -> 2 esperienze Roma
 *   /regali-a/firenze  -> 2 esperienze Firenze
 *   /regali-a/lucca    -> 2 esperienze Lucca
 *
 * SEO note:
 * - title + description ottimizzati per "regali [città]" + "esperienze"
 * - canonical URL per evitare duplicati con maiuscole/case mixed
 * - generateMetadata dinamico
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import ExperienceCard from "@/components/ExperienceCard";
import type { ExperienceWithPartner } from "@/types/experiences";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const BORDER = "#e8e4de";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1h cache SEO

interface Props {
  params: { city: string };
}

/** Mappa slug url → nome città canonical per il DB lookup */
function denormalizeCitySlug(slug: string): string {
  // 'roma' → 'Roma', 'torre-del-lago' → 'Torre del Lago'
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityName = denormalizeCitySlug(params.city);
  return {
    title: `Regali ed esperienze a ${cityName} · BeGift`,
    description: `Idee regalo originali a ${cityName}: tour, cene, esperienze. Scegli, impacchetta, regala in pochi minuti.`,
    alternates: { canonical: `https://begift.app/regali-a/${params.city.toLowerCase()}` },
    openGraph: {
      title: `Regali a ${cityName} — BeGift`,
      description: `Esperienze giftabili a ${cityName}. Pacco emozionale in 60 secondi.`,
      type: "website",
    },
  };
}

export default async function CityLandingPage({ params }: Props) {
  if (process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP !== "true") {
    notFound();
  }

  const cityName = denormalizeCitySlug(params.city);

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("experiences")
    .select("*, partner:experience_partners(slug, display_name)")
    .eq("active", true)
    .ilike("city", cityName)
    .order("rating", { ascending: false, nullsFirst: false })
    .order("reviews_count", { ascending: false })
    .limit(30);

  const items = ((data || []) as Array<Record<string, unknown>>).map((row) => {
    const rawPartner = row.partner;
    const partner = Array.isArray(rawPartner) ? rawPartner[0] : rawPartner;
    return { ...row, partner } as unknown as ExperienceWithPartner;
  });

  if (items.length === 0) {
    notFound();
  }

  // Pre-render: H1 + intro SEO copy + grid + cross-link
  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, sans-serif",
        padding: "32px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ marginBottom: 12 }}>
          <Link
            href="/discover"
            style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}
          >
            ← Tutte le esperienze
          </Link>
        </div>

        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: INK,
            margin: "0 0 12px",
            letterSpacing: "-0.3px",
          }}
        >
          Regali ed esperienze a {cityName}
        </h1>
        <p
          style={{
            fontSize: 16,
            color: MUTED,
            margin: "0 0 32px",
            lineHeight: 1.6,
            maxWidth: 680,
          }}
        >
          Stai cercando un'idea regalo originale a {cityName}? Qui trovi tour,
          cene, esperienze pensate per essere regalate a chi ami. Scegli
          un'esperienza, l'acquisti sul partner ufficiale, e BeGift la
          impacchetta come un regalo emozionale in 60 secondi.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {items.map((it) => (
            <ExperienceCard key={it.id} experience={it} />
          ))}
        </div>

        {/* SEO copy aggiuntivo + cross-link a city e occasioni */}
        <section
          style={{
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "24px 22px",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: INK,
              margin: "0 0 10px",
            }}
          >
            Perché regalare un'esperienza a {cityName}?
          </h2>
          <p
            style={{
              fontSize: 14,
              color: INK,
              margin: "0 0 12px",
              lineHeight: 1.7,
            }}
          >
            Le esperienze valgono più di un oggetto: lasciano un ricordo.
            BeGift trasforma una prenotazione in un pacco digitale che si
            apre con animazione, messaggio e musica scelti da te.
          </p>
          <p
            style={{
              fontSize: 14,
              color: INK,
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            Funziona in tre passaggi: scegli un'esperienza qui sopra,
            completi l'acquisto sul sito del partner (GetYourGuide,
            Booking, Smartbox...), poi inoltri la mail di conferma a{" "}
            <code style={{ background: SOFT_BG, padding: "1px 6px", borderRadius: 4 }}>
              inbox@plans.begift.app
            </code>{" "}
            e ti prepariamo un pacco da inviare via WhatsApp.
          </p>
        </section>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link
            href="/discover"
            style={{
              fontSize: 14,
              color: ACCENT,
              textDecoration: "underline",
              fontWeight: 600,
            }}
          >
            Esplora tutte le città →
          </Link>
        </div>
      </div>
    </main>
  );
}
