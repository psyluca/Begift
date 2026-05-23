"use client";

/**
 * GiftEditClient — packaging picker per gift creati dal draft email parser.
 *
 * Flusso:
 *  1. Fetch del gift via /api/gifts/[id] (Bearer/cookies)
 *  2. Stato locale del packaging (inizializzato dal gift attuale) +
 *     stato per il suono custom (URL/nome/titolo)
 *  3. UI: PackagingPicker condiviso (stesso visual del /create flow,
 *     uniformato il 2026-05-23) — Preview SVG live + preset rapidi +
 *     swatch colori + pill rows + upload MP3 custom
 *  4. Bottone Salva → PATCH /api/gifts/[id] → redirect /gift/[id]/share
 *
 * Prima del 2026-05-23 il save() faceva redirect a /gift/[id] (la pagina
 * di apertura/anteprima del destinatario). Luca ha chiesto che dopo
 * "Salva e condividi" l'utente arrivi alla schermata di condivisione
 * vera e propria (link copyable + share sheet nativo), non all'anteprima
 * — vedi /gift/[id]/share.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAuthed } from "@/lib/clientAuth";
import { track } from "@/lib/analytics";
import PackagingPicker from "@/components/PackagingPicker";
import type { Packaging } from "@/types";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const CARD = "#fff";
const BORDER = "#e8e4de";

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
  | {
      kind: "ready";
      pkg: Packaging;
      customSoundUrl: string;
      customSoundName: string;
      customSoundTitle: string;
    };

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
        const pkg = data.gift.packaging || DEFAULT_PACKAGING;
        // customSoundUrl/Name/Title sono memorizzati come extra nel JSON
        // di packaging (fuori dall'enum tipizzato Packaging.sound). Vedi
        // /create per il pattern equivalente.
        const extra = pkg as unknown as {
          customSoundUrl?: string;
          customSoundName?: string;
          customSoundTitle?: string;
        };
        setState({
          kind: "ready",
          pkg,
          customSoundUrl: extra.customSoundUrl || "",
          customSoundName: extra.customSoundName || "",
          customSoundTitle: extra.customSoundTitle || "",
        });
      } catch (e) {
        setState({
          kind: "error",
          message: (e as Error).message || "errore di rete",
        });
      }
    })();
  }, [giftId]);

  const updatePkg = (next: Packaging) => {
    if (state.kind !== "ready") return;
    setState({ ...state, pkg: next });
  };

  const setCustomSound = (url: string, name: string) => {
    if (state.kind !== "ready") return;
    setState({ ...state, customSoundUrl: url, customSoundName: name });
  };

  const setCustomSoundTitle = (title: string) => {
    if (state.kind !== "ready") return;
    setState({ ...state, customSoundTitle: title });
  };

  const clearCustomSound = () => {
    if (state.kind !== "ready") return;
    setState({
      ...state,
      customSoundUrl: "",
      customSoundName: "",
      customSoundTitle: "",
    });
  };

  const save = async () => {
    if (state.kind !== "ready") return;
    setSaving(true);
    setSaveError(null);
    try {
      // Inseriamo gli extra (customSoundUrl, etc.) direttamente nel
      // JSON di packaging — la colonna gifts.packaging è jsonb, quindi
      // accetta keys extra oltre quelle tipizzate in Packaging.
      const packagingPayload: Packaging & {
        customSoundUrl?: string;
        customSoundName?: string;
        customSoundTitle?: string;
      } = {
        ...state.pkg,
        ...(state.customSoundUrl
          ? {
              customSoundUrl: state.customSoundUrl,
              customSoundName: state.customSoundName,
              customSoundTitle: state.customSoundTitle,
            }
          : {}),
      };
      const res = await fetchAuthed(`/api/gifts/${giftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packaging: packagingPayload }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setSaveError(j.error || `HTTP ${res.status}`);
        return;
      }
      track("packaging_saved", {
        bowType: state.pkg.bowType,
        sound: state.pkg.sound,
        hasCustomSound: !!state.customSoundUrl,
      });
      // Va alla schermata di condivisione (link copyable + share button
      // nativo), NON all'anteprima — l'utente vuole inviare il regalo,
      // non re-aprirlo. Vedi /gift/[id]/share/page.tsx.
      router.push(`/gift/${giftId}/share`);
    } catch (e) {
      setSaveError((e as Error).message || "errore di rete");
    } finally {
      setSaving(false);
    }
  };

  // ─── Rendering states ───────────────────────────────────────

  if (state.kind === "loading") {
    return <CenterMsg emoji="⏳" title="Caricamento pacchetto…" />;
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

        <PackagingPicker
          pkg={state.pkg}
          onPkgChange={updatePkg}
          customSoundUrl={state.customSoundUrl}
          customSoundName={state.customSoundName}
          customSoundTitle={state.customSoundTitle}
          onCustomSoundChange={setCustomSound}
          onCustomSoundTitleChange={setCustomSoundTitle}
          onCustomSoundClear={clearCustomSound}
        />

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
            href={`/gift/${giftId}/share`}
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
// Helpers
// ──────────────────────────────────────────────────────────────

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
