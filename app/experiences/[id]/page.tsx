/**
 * /experiences/[id]
 *
 * Pagina dettaglio singola esperienza con flusso "pay-first":
 *   1. Sender vede l'esperienza su BeGift (discovery + curatela)
 *   2. Clicca CTA "Acquista su GetYourGuide" → redirect tramite /r/[token]
 *      che logga il click affiliate + 302 redirect al partner
 *   3. Sender paga sul partner (BeGift riceve commissione affiliate)
 *   4. Partner manda mail di conferma → sender la forwarda a
 *      plans@plans.begift.app → email parser POC crea draft
 *   5. Sender apre /drafts/[id] e personalizza pacchetto + messaggio +
 *      musica/video di apertura, poi invia al destinatario
 *
 * Questa pagina NON crea piu' un gift placeholder. Il gift nasce nel
 * flusso email parser dopo l'acquisto reale, perche':
 *   - prima di pagare l'esperienza non e' garantita (disponibilita',
 *     pagamento, payout)
 *   - le info reali (codice prenotazione, data, location) arrivano
 *     dalla mail di conferma, non dal nostro catalogo
 *   - il wrap personalizzato e' un atto separato che richiede tempo
 *
 * Spec: docs/vendita-esperienze/SPEC.md
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { randomBytes } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { ExperienceWithPartner } from "@/types/experiences";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const BORDER = "#e8e4de";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
  searchParams?: { from?: string };
}

export default async function ExperiencePage({ params, searchParams }: Props) {
  if (process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP !== "true") {
    notFound();
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("experiences")
    .select("*, partner:experience_partners(slug, display_name)")
    .eq("id", params.id)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) notFound();

  // Normalizza partner (Supabase FK array → object)
  const rawPartner = (data as { partner?: unknown }).partner;
  const partner = Array.isArray(rawPartner) ? rawPartner[0] : rawPartner;
  const e = {
    ...(data as Record<string, unknown>),
    partner,
  } as unknown as ExperienceWithPartner;

  // Query "esperienze simili" — P2 #11 UX audit 2026-05-22.
  // Strategia: stesso category + stesso country IT, ordina per rating
  // desc + reviews_count desc, escludendo il record corrente, limit 4.
  // Se city corrisponde aggiunge boost (preferenza geografica).
  // Server-side query, costo trascurabile (catalog totale <300 record).
  let similar: ExperienceWithPartner[] = [];
  try {
    const { data: simData } = await admin
      .from("experiences")
      .select("*, partner:experience_partners(slug, display_name)")
      .eq("active", true)
      .eq("category", e.category)
      .neq("id", params.id)
      .order("rating", { ascending: false, nullsFirst: false })
      .order("reviews_count", { ascending: false })
      .limit(8); // fetch piu' del necessario, poi sort lato JS con city boost

    similar = ((simData || []) as Array<Record<string, unknown>>).map((row) => {
      const rp = row.partner;
      const pp = Array.isArray(rp) ? rp[0] : rp;
      return { ...row, partner: pp } as unknown as ExperienceWithPartner;
    });

    // City boost: se city corrisponde, l'esperienza sale in cima
    if (e.city) {
      similar = similar.sort((a, b) => {
        const aMatch = a.city?.toLowerCase() === e.city?.toLowerCase() ? 1 : 0;
        const bMatch = b.city?.toLowerCase() === e.city?.toLowerCase() ? 1 : 0;
        return bMatch - aMatch;
      });
    }
    similar = similar.slice(0, 4);
  } catch {
    similar = []; // fallback silente, la sezione non si renderizza
  }

  // Genera un tracking_id univoco per questo render della pagina.
  // Pattern: anon_{8hex}_{ts36}. Se l'utente clicca, /r/[token] logga
  // con questo id e redirige al partner. Stesso utente che ricarica
  // genera un nuovo token: ok per il POC, l'attribution lato partner
  // si basa sul cookie window di 31gg, non sul singolo click ID.
  const tracking = `anon_${randomBytes(4).toString("hex")}_${Date.now().toString(36)}`;
  const trackingUrl = `/r/${tracking}?exp=${e.id}&src=pre_purchase`;

  const priceLabel = (() => {
    if (!e.price_min_cents) return null;
    const min = (e.price_min_cents / 100).toFixed(2).replace(".", ",");
    const max = e.price_max_cents
      ? (e.price_max_cents / 100).toFixed(2).replace(".", ",")
      : null;
    if (max && max !== min) return `€${min} – €${max}`;
    return `€${min}`;
  })();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, sans-serif",
        padding: "32px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 12 }}>
          {/* Back link: torna al catalogo unificato /regalo/catalogo
              (entry point primario). Se l'utente e' arrivato da
              /discover (legacy) torna comunque al nuovo catalogo,
              che contiene le stesse esperienze + VVT in piu'.
              Update 2026-05-21 — flow coerente con il nuovo hub /regalo. */}
          <Link
            href={
              searchParams?.from === "discover"
                ? "/discover"
                : "/regalo/catalogo"
            }
            style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}
          >
            ← Esperienze
          </Link>
        </div>

        {e.image_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            // URL relativo (es. /img/juventus-stripes.svg) → uso diretto.
            // URL esterno (CDN partner) → passa per /api/img-proxy che
            // bypassa l'hotlinking block. Vedi app/api/img-proxy/route.ts.
            src={
              e.image_url.startsWith("/")
                ? e.image_url
                : `/api/img-proxy?u=${encodeURIComponent(e.image_url)}`
            }
            alt={e.title}
            referrerPolicy="no-referrer"
            style={{
              width: "100%",
              maxHeight: 420,
              objectFit: "cover",
              borderRadius: 16,
              marginBottom: 20,
              background: "#f0ece6",
              display: "block",
            }}
          />
        )}

        <div
          style={{
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "24px 22px",
          }}
        >
          <p style={{ fontSize: 12, color: MUTED, margin: "0 0 6px" }}>
            {[e.city, e.country !== "IT" ? e.country : null]
              .filter(Boolean)
              .join(" · ")}{" "}
            · {e.partner.display_name}
          </p>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: INK,
              margin: "0 0 8px",
              letterSpacing: "-0.3px",
              lineHeight: 1.2,
            }}
          >
            {e.title}
          </h1>
          {e.subtitle && (
            <p style={{ fontSize: 15, color: MUTED, margin: "0 0 16px" }}>
              {e.subtitle}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            {priceLabel && (
              <span style={{ fontSize: 24, fontWeight: 800, color: ACCENT, letterSpacing: "-0.5px" }}>
                {priceLabel}
              </span>
            )}
            {e.duration_minutes && (
              <span style={{ fontSize: 13, color: MUTED }}>
                ⏱ {formatDuration(e.duration_minutes)}
              </span>
            )}
          </div>

          {/* Social proof prominente: stelle gialle + rating + reviews_count.
              P2 #12 UX audit 2026-05-22. Prima il rating era sussurrato
              accanto al prezzo, ora occupa il suo spazio. Le stelle sono
              SVG inline, oro per le piene, grigie per le vuote. */}
          {e.rating != null && e.reviews_count > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
                padding: "8px 14px",
                background: "#fff8e1",
                border: "1px solid #f5e7c8",
                borderRadius: 999,
              }}
            >
              <RatingStars value={e.rating} />
              <span style={{ fontSize: 14, fontWeight: 700, color: INK }}>
                {e.rating.toFixed(1)}
              </span>
              <span style={{ fontSize: 13, color: MUTED }}>
                {e.reviews_count.toLocaleString("it-IT")} recensioni verificate
              </span>
            </div>
          )}

          {e.description && (
            <p
              style={{
                fontSize: 15,
                color: INK,
                lineHeight: 1.6,
                margin: "0 0 24px",
                whiteSpace: "pre-line",
              }}
            >
              {e.description}
            </p>
          )}

          {/* Banner regalo fisico — se is_physical_gift=true, comunica
              chiaramente al sender che (a) il regalo verra' SPEDITO al
              destinatario, (b) i tempi stimati di consegna, (c) il
              pacco digitale BeGift mostrera' immagine + data al
              destinatario prima che il pacco fisico arrivi.
              Aggiunto 2026-05-21 per integrazione 24Bottles. */}
          {e.is_physical_gift && (
            <div
              style={{
                background: "linear-gradient(135deg,#FFF8E1 0%,#FCE4EC 100%)",
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: "14px 18px",
                marginBottom: 24,
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }} aria-hidden>
                📦
              </span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: INK, margin: 0, lineHeight: 1.35 }}>
                  Regalo fisico — spedito direttamente al destinatario
                </p>
                <p style={{ fontSize: 13, color: MUTED, margin: "4px 0 0", lineHeight: 1.5 }}>
                  Compri sul partner, BeGift impacchetta il pacco digitale con immagine prodotto + data consegna stimata.
                  Il destinatario apre BeGift e scopre cosa sta arrivando per posta
                  {e.shipping_estimated_days ? `, entro circa ${e.shipping_estimated_days} giorni dall'acquisto.` : "."}
                </p>
              </div>
            </div>
          )}

          <hr
            style={{
              border: "none",
              borderTop: `1px solid ${BORDER}`,
              margin: "24px 0",
            }}
          />

          {/* CTA principale: vai al partner per acquistare */}
          <a
            href={trackingUrl}
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "16px 18px",
              background: ACCENT,
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 50,
              textDecoration: "none",
              boxShadow: "0 10px 28px rgba(212,83,126,.28)",
            }}
          >
            Acquista su {e.partner.display_name} →
          </a>

          {/* Trust strip sotto CTA — P2 #12 UX audit 2026-05-22.
              Rassicura il sender sui dubbi tipici: "non e' una truffa?",
              "BeGift mi costa qualcosa?", "il prezzo cambia se passo da qui?".
              Tre punti minimi, icona check verde + testo. */}
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "14px 0 0",
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
              fontSize: 12,
            }}
          >
            {[
              "Stesso prezzo del sito ufficiale",
              "Pacco BeGift incluso gratis",
              "Pagamento sicuro sul partner",
            ].map((t) => (
              <li
                key={t}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  color: MUTED,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b8c5a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t}
              </li>
            ))}
          </ul>

          {/* 3-step explanation: il sender deve sapere cosa lo aspetta */}
          <div
            style={{
              marginTop: 28,
              padding: "20px 18px",
              background: "#fbf9f5",
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
            }}
          >
            <h3
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: INK,
                margin: "0 0 14px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Come funziona
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Step
                n={1}
                title={`Acquista su ${e.partner.display_name}`}
                text={`Il bottone qui sopra ti porta direttamente alla pagina del partner. Completi l'acquisto come al solito${priceLabel ? ` (${priceLabel})` : ""}.`}
              />
              <Step
                n={2}
                title="Inoltra la conferma a BeGift"
                text={`Quando ${e.partner.display_name} ti manda la mail di conferma, inoltrala a plans@plans.begift.app. BeGift legge i dettagli e prepara un pacco regalo automaticamente.`}
              />
              <Step
                n={3}
                title="Personalizza e invia"
                text="Apri il pacco in BeGift, scegli il packaging, scrivi il messaggio per chi lo riceve, eventualmente aggiungi una musica o un video, e poi invia il link."
              />
            </div>
          </div>

          {/* Tags */}
          {e.tags && e.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginTop: 20,
              }}
            >
              {e.tags.slice(0, 8).map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 11,
                    color: MUTED,
                    background: "#fbf9f5",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 50,
                    padding: "4px 10px",
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Esperienze simili — P2 #11 UX audit 2026-05-22.
            Bottom della pagina detail per stimolare cross-discovery:
            l'utente che era venuto per X potrebbe trovare Y interessante
            e tornare al catalogo invece di abbandonare. */}
        {similar.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: INK,
                margin: "0 0 6px",
                letterSpacing: "-0.2px",
              }}
            >
              Potresti regalare anche
            </h2>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 18px" }}>
              Esperienze nella stessa categoria che potrebbero interessarti.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
              }}
            >
              {similar.map((s) => (
                <SimilarCard key={s.id} experience={s} />
              ))}
            </div>
          </section>
        )}

        {/* Disclosure affiliate */}
        <p
          style={{
            fontSize: 11,
            color: MUTED,
            marginTop: 24,
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          Esperienza offerta tramite {e.partner.display_name}. BeGift può
          ricevere una piccola commissione sull'acquisto, senza alcun costo
          aggiuntivo per te.
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
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: ACCENT,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1 }}>
        <h4
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: INK,
            margin: "2px 0 4px",
          }}
        >
          {title}
        </h4>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, margin: 0 }}>
          {text}
        </p>
      </div>
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} ${h === 1 ? "ora" : "ore"}`;
  return `${h}h ${m}m`;
}

/**
 * Card compatta per esperienze simili in fondo alla detail page.
 * Mostra immagine (proxata o placeholder), titolo, citta', prezzo.
 * Click → altra detail page con ?from=similar per analytics.
 */
function SimilarCard({ experience: s }: { experience: ExperienceWithPartner }) {
  const priceLabel = s.price_min_cents
    ? `da €${(s.price_min_cents / 100).toFixed(0)}`
    : null;
  const imgSrc = s.image_url
    ? s.image_url.startsWith("/")
      ? s.image_url
      : `/api/img-proxy?u=${encodeURIComponent(s.image_url)}`
    : null;

  return (
    <Link
      href={`/experiences/${s.id}?from=similar`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        transition: "transform .14s, box-shadow .14s, border-color .14s",
      }}
      className="similar-card"
    >
      {imgSrc ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imgSrc}
          alt={s.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{
            width: "100%",
            height: 110,
            objectFit: "cover",
            background: "#f0ece6",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: 110,
            background: "linear-gradient(135deg,#FCE4EC,#FFE0B2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
          }}
          aria-hidden
        >
          🎁
        </div>
      )}
      <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {s.city && (
          <p style={{ fontSize: 10.5, color: MUTED, margin: 0 }}>{s.city}</p>
        )}
        <h3
          style={{
            fontSize: 13,
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
          {s.title}
        </h3>
        {priceLabel && (
          <span style={{ fontSize: 12, color: ACCENT, fontWeight: 700, marginTop: "auto" }}>
            {priceLabel}
          </span>
        )}
      </div>
      <style>{`
        .similar-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(0,0,0,0.06);
          border-color: ${ACCENT};
        }
      `}</style>
    </Link>
  );
}

/**
 * Stelle rating — SVG inline. Mostra 5 stelle, riempite proporzionalmente
 * al valore (0-5). Es. value=4.7 → 4 stelle piene + 1 a 70%.
 * Usato nel social proof badge della detail page (P2 #12 UX audit).
 */
function RatingStars({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <span
      aria-label={`Voto ${clamped.toFixed(1)} su 5`}
      style={{ display: "inline-flex", gap: 1 }}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fillPct = Math.max(0, Math.min(1, clamped - i)) * 100;
        return (
          <svg
            key={i}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <defs>
              <linearGradient id={`star-fill-${i}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset={`${fillPct}%`} stopColor="#F5A623" />
                <stop offset={`${fillPct}%`} stopColor="#E8E4DE" />
              </linearGradient>
            </defs>
            <polygon
              fill={`url(#star-fill-${i})`}
              stroke="#E8A04A"
              strokeWidth="0.5"
              points="12,2 14.94,8.36 22,9.27 16.91,14.14 18.18,21.02 12,17.77 5.82,21.02 7.09,14.14 2,9.27 9.06,8.36"
            />
          </svg>
        );
      })}
    </span>
  );
}
