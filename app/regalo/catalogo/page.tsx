/**
 * /regalo/catalogo
 *
 * Catalogo unificato: GetYourGuide (esperienze, tour) + VivaTicket (concerti,
 * sport, opera, parchi divertimento) in un unico browse. Diversamente da
 * /discover, questa vista NON divide per partner — il sender pensa
 * "voglio regalare qualcosa", non "GetYourGuide vs VivaTicket".
 *
 * Filtri:
 *  - Tipo (chip): Tutto | Concerti & Musical | Sport | Cultura & Arte |
 *                 Esperienze | Famiglia | Per due
 *  - Città (chip): Roma | Milano | Firenze | Venezia | Lucca | Verona | …
 *  - Budget (chip): qualunque | <50€ | <100€ | <200€
 *
 * Server component. Query Supabase admin diretta (legge tutto active=true).
 *
 * Ogni card → /experiences/[id] dove c'e' il bottone "Acquista sul partner"
 * che genera il tracking URL affiliate. Niente cambio rispetto a oggi —
 * confermato che il flusso buy → email forward → draft funziona.
 *
 * In basso un floating CTA "Aiutami a scegliere" → apre /picker come
 * fallback per chi non sa cosa cercare.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { ExperienceWithPartner } from "@/types/experiences";
import CatalogCardImage from "./CatalogCardImage";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#7a7a7a";
const SOFT_BG = "#f7f5f2";
const BORDER = "#e8e4de";
const CARD = "#fff";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Catalogo regali · BeGift",
  description:
    "Concerti, sport, esperienze, tour, opera, parchi divertimento. Scegli cosa regalare e BeGift lo trasforma in un pacco digitale emozionale.",
};

// ──────────────────────────────────────────────────────────────
// Filtri lato URL: chip tipo / città / budget
// ──────────────────────────────────────────────────────────────

interface Props {
  searchParams: {
    tipo?: string;
    citta?: string;
    budget?: string;
  };
}

/**
 * Filtri "tipo" sono macro-categorie editoriali (non = DB category esatta).
 * Mappano a (categories[], tags[]) reali nel DB. Esempio: "Famiglia" filtra
 * per tag 'family' indipendentemente dalla category. Cosi' VivaTicket
 * eventi calcio con tag family + GYG tour family appaiono insieme.
 */
const TIPO_FILTERS: {
  slug: string;
  label: string;
  emoji: string;
  categories?: string[];
  tags?: string[];
}[] = [
  { slug: "tutto", label: "Tutto", emoji: "✨" },
  { slug: "concerti", label: "Concerti & Musical", emoji: "🎵", categories: ["music", "show"] },
  { slug: "sport", label: "Sport", emoji: "⚽", categories: ["sport"] },
  { slug: "cultura", label: "Cultura & Arte", emoji: "🎨", categories: ["culture"], tags: ["art", "history"] },
  { slug: "esperienze", label: "Esperienze & Tour", emoji: "🥾", categories: ["food", "outdoor", "travel"] },
  { slug: "famiglia", label: "Famiglia", emoji: "👨‍👩‍👧", tags: ["family"] },
  { slug: "perdue", label: "Per due", emoji: "💞", tags: ["couples", "romantic", "date-night"] },
  { slug: "relax", label: "Relax", emoji: "🧖", categories: ["wellness"], tags: ["relax"] },
];

const CITIES = ["Roma", "Milano", "Firenze", "Venezia", "Verona", "Lucca", "Bologna", "Napoli"];

const BUDGETS: { slug: string; label: string; maxCents?: number }[] = [
  { slug: "all", label: "Qualunque" },
  { slug: "low", label: "Fino a 50 €", maxCents: 5000 },
  { slug: "mid", label: "Fino a 100 €", maxCents: 10000 },
  { slug: "high", label: "Fino a 200 €", maxCents: 20000 },
];

export default async function CatalogoPage({ searchParams }: Props) {
  if (process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP !== "true") {
    notFound();
  }

  const tipoSlug = searchParams.tipo || "tutto";
  const tipoFilter =
    TIPO_FILTERS.find((t) => t.slug === tipoSlug) || TIPO_FILTERS[0];
  const city = searchParams.citta || undefined;
  const budgetSlug = searchParams.budget || "all";
  const budgetFilter =
    BUDGETS.find((b) => b.slug === budgetSlug) || BUDGETS[0];

  // ── Query catalogo ────────────────────────────────────────────
  const admin = createSupabaseAdmin();
  let q = admin
    .from("experiences")
    .select("*, partner:experience_partners(slug, display_name)")
    .eq("active", true)
    .limit(60);

  // Applica filtro tipo (categoria OR tag) lato SQL quando possibile
  if (tipoFilter.categories?.length) {
    q = q.in("category", tipoFilter.categories);
  }
  if (city) q = q.ilike("city", `%${city}%`);
  if (budgetFilter.maxCents) {
    q = q.lte("price_min_cents", budgetFilter.maxCents);
  }

  // Ordina per popolarita' come default sensato
  q = q
    .order("rating", { ascending: false, nullsFirst: false })
    .order("reviews_count", { ascending: false });

  const { data, error } = await q;

  if (error) {
    console.error("[catalogo] DB error:", error.message);
  }

  let items = ((data || []) as Array<Record<string, unknown>>).map((row) => {
    const rawPartner = row.partner;
    const partner = Array.isArray(rawPartner) ? rawPartner[0] : rawPartner;
    return { ...row, partner } as unknown as ExperienceWithPartner;
  });

  // Diagnostica per Vercel Logs: vediamo immediatamente quanti record
  // per partner ci sono nel DB (utile se /regalo/catalogo torna vuoto).
  // Se uno dei due partner ha 0 record, lo script seed corrispondente
  // (supabase/seed_vivaticket_events.sql) non e' stato lanciato in prod.
  {
    const counts = items.reduce<Record<string, number>>((acc, it) => {
      const slug = it.partner?.slug || "unknown";
      acc[slug] = (acc[slug] || 0) + 1;
      return acc;
    }, {});
    console.log(
      `[catalogo] tipo=${tipoSlug} citta=${city || "—"} budget=${budgetSlug} → ` +
        `${items.length} items, partner=${JSON.stringify(counts)}`
    );
  }

  // Filtro tag lato JS (Supabase array overlap richiede sintassi
  // .overlaps() che non sempre indicizza bene; per cataloghi <100
  // record il filtro JS e' triviale e leggibile).
  if (tipoFilter.tags?.length && !tipoFilter.categories?.length) {
    items = items.filter((it) =>
      (it.tags || []).some((t) => tipoFilter.tags!.includes(t))
    );
  } else if (tipoFilter.tags?.length) {
    // Categoria E tag insieme: ammettiamo OR (broader, evita over-restriction)
    // Lascia tutto, gia' filtrato per categoria sopra.
  }

  // ── Mix-quota visivo: se i primi 8 sono tutti dello stesso partner ─
  // (ma esiste l'altro partner nel pool full) interleave i risultati.
  items = interleaveByPartner(items);

  // ── Stats per UI ──
  const totalItems = items.length;
  const partnerCounts = items.reduce<Record<string, number>>((acc, it) => {
    const slug = it.partner?.slug || "unknown";
    acc[slug] = (acc[slug] || 0) + 1;
    return acc;
  }, {});

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
        <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href="/regalo"
            style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}
          >
            ← Indietro
          </Link>
          <span style={{ fontSize: 11, color: BORDER }}>·</span>
          <span style={{ fontSize: 13, color: MUTED }}>
            {totalItems} idee disponibili
          </span>
        </div>

        {/* Header */}
        <header style={{ marginBottom: 22, maxWidth: 720 }}>
          <h1
            style={{
              fontSize: "clamp(26px, 5vw, 36px)",
              fontWeight: 900,
              color: INK,
              margin: "0 0 10px",
              letterSpacing: "-0.6px",
              lineHeight: 1.15,
            }}
          >
            Scegli cosa regalare
          </h1>
          <p style={{ fontSize: 15, color: MUTED, margin: 0, lineHeight: 1.55 }}>
            Concerti, partite, esperienze, tour, musical. Una volta scelto, ti
            portiamo dal partner per l'acquisto — poi BeGift lo impacchetta
            come un regalo da aprire.
          </p>
        </header>

        {/* Filtri tipo (chip orizzontali scrollable) */}
        <FilterRow
          label="Tipo di regalo"
          options={TIPO_FILTERS.map((t) => ({
            slug: t.slug,
            label: `${t.emoji} ${t.label}`,
          }))}
          activeSlug={tipoSlug}
          buildHref={(slug) =>
            buildUrl({ ...searchParams, tipo: slug === "tutto" ? undefined : slug })
          }
        />

        {/* Filtri città */}
        <FilterRow
          label="Città"
          options={[
            { slug: "all", label: "Tutte" },
            ...CITIES.map((c) => ({ slug: c, label: c })),
          ]}
          activeSlug={city || "all"}
          buildHref={(slug) =>
            buildUrl({ ...searchParams, citta: slug === "all" ? undefined : slug })
          }
        />

        {/* Filtri budget */}
        <FilterRow
          label="Budget"
          options={BUDGETS.map((b) => ({ slug: b.slug, label: b.label }))}
          activeSlug={budgetSlug}
          buildHref={(slug) =>
            buildUrl({ ...searchParams, budget: slug === "all" ? undefined : slug })
          }
        />

        {/* Risultati */}
        <section style={{ marginTop: 28 }}>
          {totalItems === 0 ? (
            <EmptyState searchParams={searchParams} />
          ) : (
            <>
              {/* Mini-stat di mix partner per trasparenza */}
              <div
                style={{
                  fontSize: 12,
                  color: MUTED,
                  marginBottom: 14,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  Visualizzati {totalItems} {totalItems === 1 ? "regalo" : "regali"}:
                </span>
                {Object.entries(partnerCounts).map(([slug, count]) => (
                  <span
                    key={slug}
                    style={{
                      background: CARD,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 999,
                      padding: "3px 9px",
                      fontSize: 11.5,
                    }}
                  >
                    {partnerHuman(slug)} · {count}
                  </span>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 16,
                }}
              >
                {items.map((it) => (
                  <CatalogCard key={it.id} experience={it} />
                ))}
              </div>
            </>
          )}
        </section>

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
          BeGift mostra esperienze e biglietti dei partner ufficiali GetYourGuide
          (tour ed esperienze) e VivaTicket (concerti, sport, musical, parchi
          divertimento) tramite la rete affiliate Awin. Puoi ricevere una piccola
          commissione sui regali finalizzati, senza alcun costo aggiuntivo per
          te.{" "}
          <Link href="/privacy" style={{ color: ACCENT, textDecoration: "underline" }}>
            Privacy & partner
          </Link>
        </p>
      </div>

      {/* Floating CTA "Aiutami a scegliere" → /picker RIMOSSO 2026-05-21
          (feedback Luca: creava confusione perche' l'utente era gia' nel
          catalogo a scegliere — un altro bottone permanente che porta
          a un altro flusso di scelta era ridondante).
          La rotta /picker resta funzionante e raggiungibile via URL
          diretto se serve in futuro reintrodurla come link discreto
          in cima al catalogo (es. "Non sai cosa scegliere? Prova il
          consiglio guidato"). */}
    </main>
  );
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Interleave per partner per garantire varietà visiva:
 * raccogli per partner, poi alterna round-robin. Mantiene l'ordine
 * relativo all'interno di ogni partner (rating-based).
 */
function interleaveByPartner(items: ExperienceWithPartner[]): ExperienceWithPartner[] {
  const byPartner: Record<string, ExperienceWithPartner[]> = {};
  for (const it of items) {
    const slug = it.partner?.slug || "unknown";
    if (!byPartner[slug]) byPartner[slug] = [];
    byPartner[slug].push(it);
  }
  const slugs = Object.keys(byPartner);
  if (slugs.length <= 1) return items;
  const result: ExperienceWithPartner[] = [];
  let idx = 0;
  while (true) {
    let added = false;
    for (const slug of slugs) {
      const next = byPartner[slug][idx];
      if (next) {
        result.push(next);
        added = true;
      }
    }
    if (!added) break;
    idx += 1;
  }
  return result;
}

function partnerHuman(slug: string): string {
  if (slug === "getyourguide") return "GetYourGuide";
  if (slug === "awin") return "VivaTicket";
  return slug;
}

function buildUrl(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) usp.set(k, v);
  }
  const qs = usp.toString();
  return `/regalo/catalogo${qs ? `?${qs}` : ""}`;
}

// ──────────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────────

function FilterRow({
  label,
  options,
  activeSlug,
  buildHref,
}: {
  label: string;
  options: { slug: string; label: string }[];
  activeSlug: string;
  buildHref: (slug: string) => string;
}) {
  return (
    <section style={{ marginBottom: 14 }}>
      <p
        style={{
          fontSize: 11,
          color: MUTED,
          margin: "0 0 6px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <div
        style={{
          display: "flex",
          gap: 7,
          overflowX: "auto",
          paddingBottom: 4,
          // Nascondi scrollbar visivamente ma resta touch-scrollable
          scrollbarWidth: "none",
        }}
      >
        {options.map((opt) => {
          const active = opt.slug === activeSlug;
          return (
            <Link
              key={opt.slug}
              href={buildHref(opt.slug)}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                background: active ? ACCENT : CARD,
                color: active ? "#fff" : INK,
                border: `1px solid ${active ? ACCENT : BORDER}`,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all .14s",
              }}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function EmptyState({
  searchParams,
}: {
  searchParams: Props["searchParams"];
}) {
  const hasAnyFilter = !!(searchParams.tipo || searchParams.citta || searchParams.budget);
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
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
      <h2 style={{ fontSize: 18, color: INK, margin: "0 0 8px", fontWeight: 800 }}>
        Nessun regalo con questi filtri
      </h2>
      <p style={{ fontSize: 14, color: MUTED, margin: "0 0 18px", lineHeight: 1.55 }}>
        {hasAnyFilter
          ? "Prova ad allargare i criteri."
          : "Il catalogo si sta popolando. Riprova fra qualche giorno."}
      </p>
      {hasAnyFilter && (
        <Link
          href="/regalo/catalogo"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: ACCENT,
            color: "#fff",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Rimuovi filtri
        </Link>
      )}
    </div>
  );
}

/**
 * Card del catalogo. Visivamente uniforme tra GYG e VVT — l'unico
 * elemento che distingue il partner e' il badge in alto a sinistra
 * sull'immagine. Cosi' il sender percepisce "BeGift catalog", non
 * "GetYourGuide vs VivaTicket marketplace".
 */
function CatalogCard({ experience: e }: { experience: ExperienceWithPartner }) {
  const priceLabel = (() => {
    if (!e.price_min_cents) return null;
    const min = (e.price_min_cents / 100).toFixed(0);
    const max = e.price_max_cents ? (e.price_max_cents / 100).toFixed(0) : null;
    if (max && max !== min) return `€${min}–€${max}`;
    return `da €${min}`;
  })();

  const ratingLabel =
    e.rating != null && e.reviews_count > 0
      ? `★ ${e.rating.toFixed(1)} (${formatReviews(e.reviews_count)})`
      : null;

  const placeholder = categoryPlaceholder(e.category);
  const partnerSlug = e.partner?.slug || "";
  const partnerLabel = partnerHuman(partnerSlug);

  return (
    <Link
      href={`/experiences/${e.id}?from=catalogo`}
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
      className="catalog-card"
    >
      {/*
        Immagine + un solo badge categoria piccolo in alto a destra.
        Il badge partner NON sta piu' sopra l'immagine (si sovrapponeva
        al titolo quando le card collassavano stretta + l'image_url era
        assente o falliva il caricamento). Ora il partner compare come
        label discreta SOTTO il titolo, dove non puo' mai coprire nulla.
      */}
      <div style={{ position: "relative" }}>
        <CatalogCardImage
          src={e.image_url || null}
          alt={e.title}
          placeholderEmoji={placeholder.emoji}
          placeholderGradient={placeholder.gradient}
        />
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(26,26,26,.78)",
            color: "#fff",
            fontSize: 10.5,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 999,
            backdropFilter: "blur(4px)",
            pointerEvents: "none",
          }}
        >
          {categoryHuman(e.category)}
        </span>
      </div>

      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
          {[e.city, e.country !== "IT" ? e.country : null].filter(Boolean).join(" · ") || " "}
        </p>
        <h3
          style={{
            fontSize: 15.5,
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
        {/* Partner come testo discreto SOTTO il titolo, mai sovrapposto. */}
        {partnerLabel && (
          <p
            style={{
              fontSize: 10.5,
              color: MUTED,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            via {partnerLabel}
          </p>
        )}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 13,
            color: MUTED,
          }}
        >
          {priceLabel ? (
            <span style={{ color: INK, fontWeight: 700 }}>{priceLabel}</span>
          ) : (
            <span></span>
          )}
          {ratingLabel && <span>{ratingLabel}</span>}
        </div>
      </div>

      <style>{`
        .catalog-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.06);
          border-color: ${ACCENT};
        }
      `}</style>
    </Link>
  );
}

function formatReviews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function categoryHuman(cat: string): string {
  const map: Record<string, string> = {
    food: "Food",
    outdoor: "Outdoor",
    culture: "Cultura",
    wellness: "Wellness",
    travel: "Viaggio",
    music: "Musica",
    show: "Spettacolo",
    sport: "Sport",
    gear: "Esperienza",
  };
  return map[cat] || "Esperienza";
}

function categoryPlaceholder(cat: string): { emoji: string; gradient: string } {
  const map: Record<string, { emoji: string; gradient: string }> = {
    food:     { emoji: "🍷", gradient: "linear-gradient(135deg,#d4537e,#f4a04a)" },
    outdoor:  { emoji: "🥾", gradient: "linear-gradient(135deg,#3b8c5a,#7dbf63)" },
    culture:  { emoji: "🎨", gradient: "linear-gradient(135deg,#6b5bcc,#a484e8)" },
    wellness: { emoji: "🧖", gradient: "linear-gradient(135deg,#5fb8c4,#9ad6df)" },
    travel:   { emoji: "✈️", gradient: "linear-gradient(135deg,#3a78c2,#7eb3ed)" },
    music:    { emoji: "🎵", gradient: "linear-gradient(135deg,#c4407a,#e87ba8)" },
    show:     { emoji: "🎭", gradient: "linear-gradient(135deg,#a04a8c,#d97cb8)" },
    sport:    { emoji: "⚽", gradient: "linear-gradient(135deg,#2e7d32,#66bb6a)" },
    gear:     { emoji: "🎁", gradient: "linear-gradient(135deg,#888,#bbb)" },
  };
  return map[cat] || { emoji: "🎁", gradient: "linear-gradient(135deg,#888,#bbb)" };
}
