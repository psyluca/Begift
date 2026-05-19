/**
 * /discover
 *
 * Discovery page pubblica per catalogo esperienze. Filtri base: città,
 * categoria, prezzo. Feature flag-gated.
 *
 * Server component minimale: fetch lista con filtri da query params,
 * render grid cards. Per il POC niente paginazione client-side
 * (limit 30 fissi). Iterazione futura: infinite scroll + filtri client.
 *
 * Spec: docs/vendita-esperienze/SPEC.md
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import ExperienceCard from "@/components/ExperienceCard";
import type {
  ExperienceCategory,
  ExperienceWithPartner,
} from "@/types/experiences";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const BORDER = "#e8e4de";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  searchParams: {
    city?: string;
    category?: ExperienceCategory;
    priceMax?: string;
    /** Nome destinatario passato da /start (per preservare nel back link) */
    for?: string;
  };
}

const CATEGORIES: { value: ExperienceCategory; label: string; emoji: string }[] = [
  { value: "food", label: "Food & wine", emoji: "🍷" },
  { value: "outdoor", label: "Outdoor", emoji: "🥾" },
  { value: "culture", label: "Arte & cultura", emoji: "🎨" },
  { value: "wellness", label: "Wellness", emoji: "🧖" },
  { value: "travel", label: "Viaggi", emoji: "✈️" },
  { value: "music", label: "Musica", emoji: "🎵" },
];

const CITIES = ["Roma", "Milano", "Firenze", "Venezia", "Napoli", "Lucca"];

export default async function DiscoverPage({ searchParams }: Props) {
  if (process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP !== "true") {
    notFound();
  }

  const admin = createSupabaseAdmin();
  let q = admin
    .from("experiences")
    .select("*, partner:experience_partners(slug, display_name)")
    .eq("active", true)
    .order("rating", { ascending: false, nullsFirst: false })
    .order("reviews_count", { ascending: false })
    .limit(30);

  if (searchParams.city) q = q.ilike("city", `%${searchParams.city}%`);
  if (searchParams.category) q = q.eq("category", searchParams.category);
  const pmax = parseInt(searchParams.priceMax || "", 10);
  if (Number.isFinite(pmax)) q = q.lte("price_min_cents", pmax * 100);

  const { data } = await q;
  // Normalizza partner (Supabase tipa FK come array anche se 1-1)
  const items = ((data || []) as unknown as Array<Record<string, unknown>>).map(
    (row) => {
      const rawPartner = row.partner;
      const partner = Array.isArray(rawPartner) ? rawPartner[0] : rawPartner;
      return { ...row, partner } as unknown as ExperienceWithPartner;
    }
  );

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
        {/* Back link al picker /start — sempre presente.
            Se l'utente e' arrivato qui da /start con ?for=NOME, lo
            preserviamo nel link cosi' /start riapre direttamente lo
            step 1 (intent picker) col destinatario gia' scelto, invece
            di farlo ricominciare da step 0 (input nome).
            Fix UX feedback Luca 2026-05-16. */}
        <div style={{ marginBottom: 12 }}>
          <Link
            href={
              searchParams.for
                ? `/start?for=${encodeURIComponent(searchParams.for)}`
                : "/start"
            }
            style={{
              fontSize: 13,
              color: MUTED,
              textDecoration: "none",
            }}
          >
            ← Cambia idea
          </Link>
        </div>
        <header style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: INK,
              margin: "0 0 8px",
              letterSpacing: "-0.3px",
            }}
          >
            Esperienze da regalare
          </h1>
          <p style={{ fontSize: 14, color: MUTED, margin: "0 0 12px", lineHeight: 1.5 }}>
            Tour, cene, weekend, attività. Scegli cosa regalare in due click.
          </p>
          {/* Mini-guida del flusso: l'utente deve capire che acquista
              sul partner, poi torna su BeGift via mail forward */}
          <div
            style={{
              fontSize: 12,
              color: MUTED,
              background: "#fbf9f5",
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: "10px 14px",
              lineHeight: 1.5,
            }}
          >
            🎁 <strong style={{ color: INK }}>Come funziona:</strong> scegli
            un'esperienza qui sotto → ti portiamo dal partner (GetYourGuide) per
            l'acquisto → quando ricevi la conferma via mail, la inoltri a
            BeGift e prepariamo il pacco regalo emozionale.
          </div>
        </header>

        {/* Filtri città */}
        <section style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 12,
              color: MUTED,
              margin: "0 0 6px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Città
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <FilterPill
              href={buildUrl({ ...searchParams, city: undefined })}
              active={!searchParams.city}
              label="Tutte"
            />
            {CITIES.map((c) => (
              <FilterPill
                key={c}
                href={buildUrl({ ...searchParams, city: c })}
                active={searchParams.city === c}
                label={c}
              />
            ))}
          </div>
        </section>

        {/* Filtri categoria */}
        <section style={{ marginBottom: 24 }}>
          <p
            style={{
              fontSize: 12,
              color: MUTED,
              margin: "0 0 6px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Categoria
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <FilterPill
              href={buildUrl({ ...searchParams, category: undefined })}
              active={!searchParams.category}
              label="Tutte"
            />
            {CATEGORIES.map((c) => (
              <FilterPill
                key={c.value}
                href={buildUrl({ ...searchParams, category: c.value })}
                active={searchParams.category === c.value}
                label={`${c.emoji} ${c.label}`}
              />
            ))}
          </div>
        </section>

        {/* Risultati */}
        {items.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <h2 style={{ fontSize: 18, color: INK, margin: "0 0 8px" }}>
              Nessuna esperienza con questi filtri
            </h2>
            <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
              Prova a togliere qualche filtro.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {items.map((it) => (
              <ExperienceCard key={it.id} experience={it} />
            ))}
          </div>
        )}

        {/* Disclosure footer */}
        <p
          style={{
            fontSize: 11,
            color: MUTED,
            marginTop: 32,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          BeGift mostra esperienze offerte dal partner GetYourGuide.
          Potremmo ricevere una piccola commissione sui regali finalizzati,
          senza alcun costo aggiuntivo per te.{" "}
          <Link href="/privacy" style={{ color: ACCENT }}>
            Privacy & partner
          </Link>
        </p>
      </div>
    </main>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "8px 14px",
        borderRadius: 50,
        background: active ? ACCENT : "#fff",
        color: active ? "#fff" : INK,
        border: `1px solid ${active ? ACCENT : BORDER}`,
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Link>
  );
}

function buildUrl(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) usp.set(k, v);
  }
  const qs = usp.toString();
  return `/discover${qs ? `?${qs}` : ""}`;
}
