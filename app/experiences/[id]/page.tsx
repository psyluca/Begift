/**
 * /experiences/[id]
 *
 * Pagina dettaglio singola esperienza. Mostra foto, descrizione,
 * prezzo, rating, e CTA "Regalala" che apre il flusso wrap → invio.
 *
 * Server component. Se non loggato, "Regala" reindirizza a login con
 * next=questa-pagina (l'utente potra' creare il gift dopo login).
 *
 * Spec: docs/vendita-esperienze/SPEC.md
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import GiftFromExperienceForm from "./GiftFromExperienceForm";
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
  const e = data as ExperienceWithPartner;

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

          {/* Pricing & rating row */}
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
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: ACCENT,
                }}
              >
                {priceLabel}
              </span>
            )}
            {e.rating != null && e.reviews_count > 0 && (
              <span style={{ fontSize: 13, color: MUTED }}>
                ★ {e.rating.toFixed(1)} · {e.reviews_count.toLocaleString("it-IT")}{" "}
                recensioni
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
              margin: "20px 0",
            }}
          />

          {/* Tags */}
          {e.tags && e.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 24,
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

          {/* Gift creation form (client component) */}
          <GiftFromExperienceForm
            experienceId={e.id}
            experienceTitle={e.title}
            partnerName={e.partner.display_name}
          />
        </div>

        {/* Disclosure */}
        <p
          style={{
            fontSize: 11,
            color: MUTED,
            marginTop: 16,
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          Questa esperienza è offerta tramite {e.partner.display_name}.
          BeGift può ricevere una piccola commissione sull'acquisto, senza
          alcun costo aggiuntivo per chi riceve.
        </p>
      </div>
    </main>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} ${h === 1 ? "ora" : "ore"}`;
  return `${h}h ${m}m`;
}
