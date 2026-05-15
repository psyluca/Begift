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
}

export default async function ExperiencePage({ params }: Props) {
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
          <Link
            href="/discover"
            style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}
          >
            ← Esperienze
          </Link>
        </div>

        {e.image_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={e.image_url}
            alt={e.title}
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
              alignItems: "baseline",
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            {priceLabel && (
              <span style={{ fontSize: 22, fontWeight: 700, color: ACCENT }}>
                {priceLabel}
              </span>
            )}
            {e.rating != null && e.reviews_count > 0 && (
              <span style={{ fontSize: 13, color: MUTED }}>
                ★ {e.rating.toFixed(1)} ·{" "}
                {e.reviews_count.toLocaleString("it-IT")} recensioni
              </span>
            )}
            {e.duration_minutes && (
              <span style={{ fontSize: 13, color: MUTED }}>
                ⏱ {formatDuration(e.duration_minutes)}
              </span>
            )}
          </div>

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

        {/* Disclosure affiliate */}
        <p
          style={{
            fontSize: 11,
            color: MUTED,
            marginTop: 16,
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
