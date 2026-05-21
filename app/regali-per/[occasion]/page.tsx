/**
 * /regali-per/[occasion]
 *
 * Landing page SEO-friendly per ricerca "regali per [occasione]".
 * Mappa l'occasione → tag(s) corrispondenti nel catalogo experiences.
 *
 * URL esempi:
 *   /regali-per/coppia       → tag couples
 *   /regali-per/anniversario → tag romantic, date-night
 *   /regali-per/laurea       → tag culture (proxy temporaneo)
 *   /regali-per/foodie       → tag foodie
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP
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
export const revalidate = 3600;

interface OccasionDef {
  slug: string;
  label: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  introCopy: string;
}

/** Mapping occasione URL slug → tag catalogo + SEO copy */
const OCCASIONS: Record<string, OccasionDef> = {
  coppia: {
    slug: "coppia",
    label: "una coppia",
    tags: ["couples", "romantic", "date-night"],
    seoTitle: "Regali ed esperienze per coppie · BeGift",
    seoDescription:
      "Idee regalo originali per una coppia: cene romantiche, weekend, wine tour. Scegli, impacchetta, regala in 60 secondi.",
    introCopy:
      "Idee regalo pensate per chi vuole celebrare due persone insieme: una cena, un weekend, un'esperienza condivisa.",
  },
  anniversario: {
    slug: "anniversario",
    label: "un anniversario",
    tags: ["romantic", "date-night", "couples"],
    seoTitle: "Regali per anniversario di matrimonio o fidanzamento · BeGift",
    seoDescription:
      "Esperienze emozionali per festeggiare un anniversario: gondola Venezia, weekend di charme, cena romantica.",
    introCopy:
      "Un anniversario merita un regalo che si racconti, non un oggetto. Qui trovi esperienze pensate per essere ricordate.",
  },
  "festa-mamma": {
    slug: "festa-mamma",
    label: "la mamma",
    tags: ["wellness", "foodie", "family"],
    seoTitle: "Regali per la Festa della Mamma 2027 · BeGift",
    seoDescription:
      "Idee regalo per la mamma: spa, cooking class, weekend benessere. Confezionalo come pacco emozionale in 60 secondi.",
    introCopy:
      "Per la mamma il regalo migliore è il tempo: qui esperienze pensate per regalarle un momento solo per sé o con te.",
  },
  "festa-papa": {
    slug: "festa-papa",
    label: "il papà",
    tags: ["outdoor", "adventure", "wine"],
    seoTitle: "Regali per la Festa del Papà 2027 · BeGift",
    seoDescription:
      "Idee regalo per il papà: trekking, degustazioni, esperienze outdoor. Pacchetto digitale emozionale in 60 secondi.",
    introCopy:
      "Esperienze outdoor, degustazioni, avventure: regali che il papà potrà raccontare, non solo sfogliare.",
  },
  foodie: {
    slug: "foodie",
    label: "chi ama mangiare",
    tags: ["foodie", "wine"],
    seoTitle: "Regali per foodie e appassionati di cucina · BeGift",
    seoDescription:
      "Lezioni di cucina, wine tour, esperienze gastronomiche italiane. Da regalare con un pacco digitale emozionale.",
    introCopy:
      "Per chi vede nella cucina la festa di ogni giorno. Lezioni di pasta, tour cantine, aperitivi top: il regalo perfetto per un foodie.",
  },
  compleanno: {
    slug: "compleanno",
    label: "un compleanno",
    tags: ["must-see", "couples", "friends"],
    seoTitle: "Regali per compleanno: esperienze e tour · BeGift",
    seoDescription:
      "Regali di compleanno originali: tour saltafila, cene, esperienze. Pacco regalo digitale emozionale in 60 secondi.",
    introCopy:
      "Un compleanno è un'occasione per fare ricordare. Qui le esperienze più amate, scelte per essere indimenticabili.",
  },
  amici: {
    slug: "amici",
    label: "gli amici",
    tags: ["friends", "aperitivo", "foodie"],
    seoTitle: "Regali per amici: idee originali · BeGift",
    seoDescription:
      "Aperitivi, cene, tour da fare in gruppo. Regali pensati per amicizie che amano vivere esperienze insieme.",
    introCopy:
      "Per gli amici che amano stare insieme: aperitivi, tour cittadini, cene di gruppo. L'esperienza giusta per la prossima serata memorabile.",
  },
};

interface Props {
  params: { occasion: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const occ = OCCASIONS[params.occasion];
  if (!occ) return {};
  return {
    title: occ.seoTitle,
    description: occ.seoDescription,
    alternates: {
      canonical: `https://begift.app/regali-per/${occ.slug}`,
    },
    openGraph: {
      title: occ.seoTitle,
      description: occ.seoDescription,
      type: "website",
    },
  };
}

export default async function OccasionLandingPage({ params }: Props) {
  if (process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP !== "true") {
    notFound();
  }

  const occ = OCCASIONS[params.occasion];
  if (!occ) notFound();

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("experiences")
    .select("*, partner:experience_partners(slug, display_name)")
    .eq("active", true)
    .overlaps("tags", occ.tags)
    .order("rating", { ascending: false, nullsFirst: false })
    .order("reviews_count", { ascending: false })
    .limit(24);

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
          Regali per {occ.label}
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
          {occ.introCopy}
        </p>

        {items.length > 0 ? (
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
        ) : (
          <div
            style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: "40px 24px",
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            <p style={{ color: MUTED, margin: 0 }}>
              Stiamo curando il catalogo per questa occasione.{" "}
              <Link href="/discover" style={{ color: ACCENT }}>
                Esplora tutte le esperienze →
              </Link>
            </p>
          </div>
        )}

        {/* Cross-link altre occasioni (SEO interno) */}
        <section
          style={{
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "24px 22px",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: INK,
              margin: "0 0 12px",
            }}
          >
            Altre idee regalo
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.values(OCCASIONS)
              .filter((o) => o.slug !== occ.slug)
              .map((other) => (
                <Link
                  key={other.slug}
                  href={`/regali-per/${other.slug}`}
                  style={{
                    padding: "8px 14px",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 50,
                    background: SOFT_BG,
                    color: INK,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Per {other.label}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
