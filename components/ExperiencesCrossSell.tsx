"use client";

/**
 * ExperiencesCrossSell — sezione "Aggiungi un extra?" mostrata sotto
 * il form del DraftCompletionClient (email parser POC).
 *
 * Logica:
 *   - Fetch /api/experiences?city={city}&limit=3 con la city del draft
 *   - Mostra max 3 card cliccabili
 *   - Click → /experiences/[id] (l'utente puo' creare un secondo gift
 *     bundle con l'esperienza correlata)
 *
 * Visibile solo se feature flag NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP=true.
 * Render condizionale: se 0 risultati → nasconde tutto (no "lista vuota").
 *
 * Spec: docs/vendita-esperienze/SPEC.md sezione "Con il flusso Email Parser POC"
 */

import { useEffect, useState } from "react";
import ExperienceCard from "@/components/ExperienceCard";
import type { ExperienceWithPartner } from "@/types/experiences";

const INK = "#1a1a1a";
const MUTED = "#888";

interface Props {
  /** Citta' estratta dal draft email parser (es. parsed.location ridotta) */
  hintCity?: string | null;
  /** Categoria suggerita (es. "food" se il draft e' un ristorante) */
  hintCategory?: string | null;
}

export default function ExperiencesCrossSell({ hintCity, hintCategory }: Props) {
  const enabled = process.env.NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP === "true";
  const [items, setItems] = useState<ExperienceWithPartner[] | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const usp = new URLSearchParams();
    if (hintCity) usp.set("city", hintCity);
    if (hintCategory) usp.set("category", hintCategory);
    usp.set("limit", "3");

    (async () => {
      try {
        const res = await fetch(`/api/experiences?${usp.toString()}`);
        if (!res.ok) {
          setItems([]);
          return;
        }
        const data = (await res.json()) as {
          items: ExperienceWithPartner[];
        };
        setItems(data.items || []);
      } catch {
        setItems([]);
      }
    })();
  }, [enabled, hintCity, hintCategory]);

  if (!enabled) return null;
  if (items === null) return null;          // loading silenzioso
  if (items.length === 0) return null;      // niente match, niente UI

  return (
    <section style={{ marginTop: 32 }}>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: INK,
          margin: "0 0 4px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Aggiungi un'esperienza correlata?
      </h3>
      <p style={{ fontSize: 12, color: MUTED, margin: "0 0 14px" }}>
        Idee di regali che si abbinano a questa prenotazione.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((it) => (
          <ExperienceCard key={it.id} experience={it} variant="compact" />
        ))}
      </div>
    </section>
  );
}
