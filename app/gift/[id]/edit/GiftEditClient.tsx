"use client";

/**
 * GiftEditClient — packaging picker per gift creati dal draft email parser.
 *
 * Flusso:
 *  1. Fetch del gift via /api/gifts/[id] (Bearer/cookies)
 *  2. Stato locale del packaging (inizializzato dal gift attuale)
 *  3. UI: anteprima live GiftSVG + 6 preset card + selettori per
 *     bowType/openAnimation/sound + color swatches per paper/ribbon/bow
 *  4. Bottone Salva → PATCH /api/gifts/[id] → redirect /gift/[id]
 *
 * Design: re-impacchettamento semplificato del flusso CreateGiftClient
 * esistente. Non riusa il file (1200 righe), invece duplica i preset
 * principali + swatch tipici per scelta veloce.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAuthed } from "@/lib/clientAuth";
import { track } from "@/lib/analytics";
import GiftSVG from "@/components/GiftSVG";
import type { Packaging } from "@/types";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const CARD = "#fff";
const BORDER = "#e8e4de";

// ──────────────────────────────────────────────────────────────
// Preset packaging (subset di quelli in CreateGiftClient)
// ──────────────────────────────────────────────────────────────

interface Preset {
  id: string;
  label: string;
  emoji: string;
  pkg: Packaging;
}

const PRESETS: Preset[] = [
  {
    id: "classico",
    label: "Classico",
    emoji: "🎁",
    pkg: {
      paperColor: "#D85A5A",
      ribbonColor: "#E8C84A",
      bowColor: "#E8C84A",
      bowType: "classic",
      openAnimation: "lift",
      sound: "bells",
    },
  },
  {
    id: "festoso",
    label: "Festoso",
    emoji: "🎉",
    pkg: {
      paperColor: "#E8C84A",
      ribbonColor: "#D85A5A",
      bowColor: "#D85A5A",
      bowType: "rosette",
      openAnimation: "explode",
      sound: "pop",
    },
  },
  {
    id: "romantico",
    label: "Romantico",
    emoji: "🌹",
    pkg: {
      paperColor: "#E8A0A0",
      ribbonColor: "#E8C84A",
      bowColor: "#E8C84A",
      bowType: "classic",
      openAnimation: "lift",
      sound: "chime",
    },
  },
  {
    id: "elegante",
    label: "Elegante",
    emoji: "✨",
    pkg: {
      paperColor: "#1A3A6B",
      ribbonColor: "#E8C84A",
      bowColor: "#E8C84A",
      bowType: "star",
      openAnimation: "unfold",
      sound: "magic",
    },
  },
  {
    id: "kawaii",
    label: "Kawaii",
    emoji: "🌸",
    pkg: {
      paperColor: "#F5C6C6",
      ribbonColor: "#F8F5ED",
      bowColor: "#F8F5ED",
      bowType: "pompom",
      openAnimation: "unfold",
      sound: "kawaii",
    },
  },
  {
    id: "natura",
    label: "Natura",
    emoji: "🌿",
    pkg: {
      paperColor: "#3B8C5A",
      ribbonColor: "#D85A5A",
      bowColor: "#E8C84A",
      bowType: "classic",
      openAnimation: "unfold",
      sound: "bells",
    },
  },
];

// Swatch colori comuni per pickers
const COLOR_SWATCHES = [
  "#D85A5A", "#E8C84A", "#3B8C5A", "#1A3A6B", "#6B5BCC",
  "#D4537E", "#F5C6C6", "#8EC49A", "#E8A0A0", "#F5E8D5",
  "#1a1a1a", "#FFFFFF",
];

const BOW_TYPES: { id: Packaging["bowType"]; label: string }[] = [
  { id: "classic", label: "Classico" },
  { id: "star", label: "Stella" },
  { id: "rosette", label: "Rosetta" },
  { id: "simple", label: "Semplice" },
  { id: "pompom", label: "Pompom" },
];

const ANIMATIONS: { id: Packaging["openAnimation"]; label: string }[] = [
  { id: "lift", label: "Solleva" },
  { id: "unfold", label: "Apri" },
  { id: "explode", label: "Esplodi" },
  { id: "spin", label: "Ruota" },
  { id: "shatter", label: "Frantuma" },
];

const SOUNDS: { id: Packaging["sound"]; label: string }[] = [
  { id: "bells", label: "🔔 Campanelle" },
  { id: "pop", label: "💥 Pop" },
  { id: "magic", label: "✨ Magia" },
  { id: "woosh", label: "💨 Woosh" },
  { id: "chime", label: "🎐 Chime" },
  { id: "kawaii", label: "🌸 Kawaii" },
  { id: "none", label: "🔇 Silenzio" },
];

const DEFAULT_PACKAGING: Packaging = {
  paperColor: "#D85A5A",
  ribbonColor: "#E8C84A",
  bowColor: "#E8C84A",
  bowType: "classic",
  openAnimation: "lift",
  sound: "bells",
};

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

type State =
  | { kind: "loading" }
  | { kind: "unauth" }
  | { kind: "error"; message: string }
  | { kind: "ready"; pkg: Packaging };

export default function GiftEditClient({ giftId }: { giftId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load gift
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuthed(`/api/gifts/${giftId}`);
        if (res.status === 401) {
          setState({ kind: "unauth" });
          return;
        }
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setState({
            kind: "error",
            message: j.error || `HTTP ${res.status}`,
          });
          return;
        }
        const data = (await res.json()) as {
          gift: { packaging: Packaging | null };
        };
        setState({
          kind: "ready",
          pkg: data.gift.packaging || DEFAULT_PACKAGING,
        });
      } catch (e) {
        setState({
          kind: "error",
          message: (e as Error).message || "errore di rete",
        });
      }
    })();
  }, [giftId]);

  const updatePkg = (patch: Partial<Packaging>) => {
    if (state.kind !== "ready") return;
    setState({ ...state, pkg: { ...state.pkg, ...patch } });
  };

  const applyPreset = (preset: Preset) => {
    if (state.kind !== "ready") return;
    setState({ ...state, pkg: preset.pkg });
  };

  const save = async () => {
    if (state.kind !== "ready") return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetchAuthed(`/api/gifts/${giftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packaging: state.pkg }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setSaveError(j.error || `HTTP ${res.status}`);
        return;
      }
      track("packaging_saved", {
        bowType: state.pkg.bowType,
        sound: state.pkg.sound,
      });
      router.push(`/gift/${giftId}`);
    } catch (e) {
      setSaveError((e as Error).message || "errore di rete");
    } finally {
      setSaving(false);
    }
  };

  // ─── Rendering states ───────────────────────────────────────

  if (state.kind === "loading") {
    return (
      <CenterMsg
        emoji="⏳"
        title="Caricamento pacchetto…"
      />
    );
  }

  if (state.kind === "unauth") {
    return (
      <CenterMsg
        emoji="🔒"
        title="Devi accedere"
        subtitle="Solo chi ha creato il regalo puo' personalizzarne il pacchetto."
        cta={{
          href: `/auth/login?next=/gift/${giftId}/edit`,
          label: "Accedi",
        }}
      />
    );
  }

  if (state.kind === "error") {
    return (
      <CenterMsg
        emoji="⚠️"
        title="Errore di caricamento"
        subtitle={state.message}
        cta={{ href: `/gift/${giftId}`, label: "Vai al regalo" }}
      />
    );
  }

  const pkg = state.pkg;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, sans-serif",
        padding: "24px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: INK,
            margin: "0 0 6px",
            letterSpacing: "-0.3px",
            textAlign: "center",
          }}
        >
          Personalizza il pacco
        </h1>
        <p
          style={{
            fontSize: 13,
            color: MUTED,
            margin: "0 0 20px",
            textAlign: "center",
          }}
        >
          Scegli colori, fiocco e suono. L'anteprima si aggiorna in tempo reale.
        </p>

        {/* Preview live */}
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            padding: "20px 18px 14px",
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          <div style={{ width: 180, height: 180, margin: "0 auto" }}>
            <GiftSVG
              paper={pkg.paperColor}
              ribbon={pkg.ribbonColor}
              bow={pkg.bowColor}
              bowType={pkg.bowType}
              animated
            />
          </div>
        </div>

        {/* Preset rapidi */}
        <Section title="Preset rapidi">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                style={{
                  background: CARD,
                  border: `1.5px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: "10px 8px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: INK,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 22 }}>{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Color pickers */}
        <Section title="Colore carta">
          <SwatchRow
            value={pkg.paperColor}
            onPick={(c) => updatePkg({ paperColor: c })}
          />
        </Section>
        <Section title="Colore nastro">
          <SwatchRow
            value={pkg.ribbonColor}
            onPick={(c) => updatePkg({ ribbonColor: c })}
          />
        </Section>
        <Section title="Colore fiocco">
          <SwatchRow
            value={pkg.bowColor}
            onPick={(c) => updatePkg({ bowColor: c })}
          />
        </Section>

        {/* Bow type */}
        <Section title="Tipo di fiocco">
          <PillRow
            options={BOW_TYPES}
            value={pkg.bowType}
            onPick={(v) => updatePkg({ bowType: v as Packaging["bowType"] })}
          />
        </Section>

        {/* Animation */}
        <Section title="Apertura">
          <PillRow
            options={ANIMATIONS}
            value={pkg.openAnimation}
            onPick={(v) =>
              updatePkg({ openAnimation: v as Packaging["openAnimation"] })
            }
          />
        </Section>

        {/* Sound */}
        <Section title="Suono">
          <PillRow
            options={SOUNDS}
            value={pkg.sound}
            onPick={(v) => updatePkg({ sound: v as Packaging["sound"] })}
          />
        </Section>

        {saveError && (
          <p
            style={{
              color: "#a02020",
              fontSize: 13,
              textAlign: "center",
              margin: "12px 0 0",
            }}
          >
            Errore salvataggio: {saveError}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            marginTop: 24,
            width: "100%",
            padding: "16px 18px",
            background: ACCENT,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            border: "none",
            borderRadius: 50,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
            boxShadow: "0 10px 28px rgba(212,83,126,.28)",
          }}
        >
          {saving ? "Salvataggio…" : "Salva e condividi →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Link
            href={`/gift/${giftId}`}
            style={{
              fontSize: 13,
              color: MUTED,
              textDecoration: "underline",
            }}
          >
            Salta personalizzazione
          </Link>
        </div>
      </div>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom: 18,
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <h3
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: MUTED,
          margin: "0 0 10px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function SwatchRow({
  value,
  onPick,
}: {
  value: string;
  onPick: (c: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {COLOR_SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          aria-label={c}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: c,
            border:
              value.toLowerCase() === c.toLowerCase()
                ? `3px solid ${ACCENT}`
                : `1px solid ${BORDER}`,
            cursor: "pointer",
            padding: 0,
          }}
        />
      ))}
      {/* Custom color via native picker */}
      <label
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: `conic-gradient(red, orange, yellow, green, blue, purple, red)`,
          border: `1px solid ${BORDER}`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: "#fff",
          textShadow: "0 0 2px #000",
        }}
        title="Colore custom"
      >
        +
        <input
          type="color"
          value={value}
          onChange={(e) => onPick(e.target.value)}
          style={{
            opacity: 0,
            position: "absolute",
            width: 0,
            height: 0,
          }}
        />
      </label>
    </div>
  );
}

function PillRow({
  options,
  value,
  onPick,
}: {
  options: { id: string; label: string }[];
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o.id)}
            style={{
              padding: "8px 14px",
              borderRadius: 50,
              border: `1.5px solid ${active ? ACCENT : BORDER}`,
              background: active ? ACCENT : CARD,
              color: active ? "#fff" : INK,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function CenterMsg({
  emoji,
  title,
  subtitle,
  cta,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, sans-serif",
        padding: "48px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: INK,
            margin: "0 0 8px",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontSize: 14,
              color: MUTED,
              margin: "0 0 20px",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
        {cta && (
          <Link
            href={cta.href}
            style={{
              display: "inline-block",
              background: ACCENT,
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 50,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {cta.label}
          </Link>
        )}
      </div>
    </main>
  );
}
