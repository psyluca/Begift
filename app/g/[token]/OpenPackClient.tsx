"use client";

/**
 * Client component per /g/[token]. Gestisce 3 stati:
 *  1. closed — pacco non ancora "scartato": mostra l'immagine del
 *     pacco animata + CTA "Apri il regalo"
 *  2. opened — dopo il tap: rivela messaggio + coupon + reazioni
 *  3. not_found / error — token invalido o gift inesistente
 *
 * NO topbar/bottomnav/footer globali (gestiti via path-based gating
 * nei wrapper).
 *
 * Branding: il pacco e' "da Centro Massaggi Aurora" (dal business),
 * BeGift compare solo nel footer minimo "impacchettato da BeGift —
 * pacchetti regalo digitali".
 */

import { useEffect, useState } from "react";

const ACCENT_DEFAULT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#fff5f8";
const BORDER = "#e8e4de";

interface OpenPackData {
  recipient_name: string;
  message: string | null;
  packaging: {
    paperColor?: string;
    ribbonColor?: string;
    bowColor?: string;
  } | null;
  coupon: {
    title: string | null;
    validity: string | null;
    file_url: string | null;
  };
  business: {
    name: string;
    logo_url: string | null;
    brand_color: string | null;
  } | null;
  opened_at: string | null;
  created_at: string;
}

type ViewState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: OpenPackData; opened: boolean };

const REACTION_EMOJI = ["❤️", "🙏", "✨", "😍", "🥰", "🎁"];

export default function OpenPackClient({ token }: { token: string }) {
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [reactionSent, setReactionSent] = useState(false);

  useEffect(() => {
    void loadGift();
  }, [token]);

  async function loadGift() {
    try {
      const res = await fetch(`/api/g/${encodeURIComponent(token)}`);
      if (res.status === 404) {
        setState({ kind: "not_found" });
        return;
      }
      if (!res.ok) {
        setState({ kind: "error", message: `HTTP ${res.status}` });
        return;
      }
      const data = (await res.json()) as OpenPackData;
      setState({ kind: "ready", data, opened: false });
    } catch (e) {
      setState({ kind: "error", message: (e as Error).message });
    }
  }

  async function sendReaction(emoji: string) {
    if (reactionSent) return;
    setReactionSent(true);
    try {
      await fetch(`/api/g/${encodeURIComponent(token)}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "emoji", emoji }),
      });
    } catch (e) {
      console.error("[OpenPack] reaction failed", e);
      // Non revert reactionSent: meglio non far cliccare di nuovo
    }
  }

  if (state.kind === "loading") {
    return <Shell><div style={{ color: MUTED, padding: 40, textAlign: "center" }}>Apertura del pacco…</div></Shell>;
  }
  if (state.kind === "not_found") {
    return (
      <Shell>
        <div style={{ padding: 40, textAlign: "center", color: INK }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤔</div>
          <p style={{ fontSize: 14, marginBottom: 6 }}>Questo pacco non esiste più o il link è errato.</p>
          <p style={{ fontSize: 12, color: MUTED }}>Chiedi a chi te l&apos;ha mandato di rinviartelo.</p>
        </div>
      </Shell>
    );
  }
  if (state.kind === "error") {
    return (
      <Shell>
        <div style={{ padding: 40, textAlign: "center", color: "#A32D2D" }}>
          Errore: {state.message}
        </div>
      </Shell>
    );
  }

  const accent = state.data.business?.brand_color || ACCENT_DEFAULT;

  if (!state.opened) {
    // Stato "closed": mostra il pacco animato + CTA per aprire
    return (
      <Shell accent={accent}>
        <ClosedView
          data={state.data}
          accent={accent}
          onOpen={() => setState({ ...state, opened: true })}
        />
      </Shell>
    );
  }

  return (
    <Shell accent={accent}>
      <OpenedView
        data={state.data}
        accent={accent}
        onReact={sendReaction}
        reactionSent={reactionSent}
      />
    </Shell>
  );
}

// ────────────────────────────────────────────────────────────────

function Shell({
  children,
  accent = ACCENT_DEFAULT,
}: {
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "30px 20px 20px",
        background: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: INK,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {children}
      </div>
      <footer
        style={{
          textAlign: "center",
          paddingTop: 20,
          fontSize: 11,
          color: MUTED,
          lineHeight: 1.4,
        }}
      >
        <div>
          impacchettato da{" "}
          <strong style={{ color: accent }}>BeGift</strong>
        </div>
        <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>
          pacchetti regalo digitali
        </div>
      </footer>
    </main>
  );
}

function ClosedView({
  data,
  accent,
  onOpen,
}: {
  data: OpenPackData;
  accent: string;
  onOpen: () => void;
}) {
  const paper = data.packaging?.paperColor || "#F4C0D1";
  const ribbon = data.packaging?.ribbonColor || accent;
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>
        {data.recipient_name}, hai ricevuto un regalo
      </p>
      {data.business && (
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 24 }}>
          da{" "}
          <strong style={{ color: INK, fontSize: 14 }}>
            {data.business.name}
          </strong>
        </p>
      )}
      {/* Pacco "scatola" semplificato con CSS */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="Apri il regalo"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 20,
          margin: "20px auto",
          display: "block",
          animation: "begiftBoxFloat 2.6s ease-in-out infinite",
        }}
      >
        <div
          style={{
            width: 180,
            height: 180,
            background: paper,
            borderRadius: 12,
            position: "relative",
            boxShadow: `0 12px 32px ${accent}33`,
          }}
        >
          {/* Nastro verticale */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: 18,
              transform: "translateX(-50%)",
              background: ribbon,
            }}
          />
          {/* Nastro orizzontale */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 18,
              transform: "translateY(-50%)",
              background: ribbon,
            }}
          />
          {/* Fiocco */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 40,
            }}
          >
            🎀
          </div>
        </div>
      </button>
      <p style={{ fontSize: 13, color: MUTED, marginTop: 20, marginBottom: 16 }}>
        Tocca il pacco per aprirlo
      </p>
      <button
        type="button"
        onClick={onOpen}
        style={{
          background: accent,
          color: "#fff",
          border: "none",
          padding: "12px 28px",
          borderRadius: 50,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Apri il regalo →
      </button>
      <style>{`
        @keyframes begiftBoxFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}

function OpenedView({
  data,
  accent,
  onReact,
  reactionSent,
}: {
  data: OpenPackData;
  accent: string;
  onReact: (emoji: string) => void;
  reactionSent: boolean;
}) {
  return (
    <div style={{ animation: "begiftFadeIn 0.6s ease-out" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 38, marginBottom: 4 }}>🎁</div>
        <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
          {data.recipient_name}, un regalo per te
        </p>
        {data.business && (
          <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
            da{" "}
            <strong style={{ color: INK }}>
              {data.business.name}
            </strong>
          </p>
        )}
      </div>

      {/* Messaggio */}
      {data.message && (
        <div
          style={{
            background: SOFT_BG,
            borderLeft: `3px solid ${accent}`,
            padding: "12px 14px",
            marginBottom: 16,
            borderRadius: "0 6px 6px 0",
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: INK,
              margin: 0,
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            “{data.message}”
          </p>
        </div>
      )}

      {/* Coupon visual */}
      <div
        style={{
          border: `2px dashed ${accent}`,
          borderRadius: 10,
          padding: "20px 16px",
          textAlign: "center",
          marginBottom: 16,
          background: "#fff",
        }}
      >
        <p
          style={{
            fontSize: 10,
            color: MUTED,
            textTransform: "uppercase",
            letterSpacing: 1,
            margin: "0 0 6px",
          }}
        >
          Il tuo coupon
        </p>
        {data.coupon.title && (
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: accent,
              margin: "0 0 4px",
              lineHeight: 1.2,
            }}
          >
            {data.coupon.title}
          </p>
        )}
        {data.coupon.validity && (
          <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
            Validità: {data.coupon.validity}
          </p>
        )}
      </div>

      {/* Download CTA */}
      {data.coupon.file_url && (
        <a
          href={data.coupon.file_url}
          download
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block",
            background: accent,
            color: "#fff",
            textAlign: "center",
            padding: "12px 16px",
            borderRadius: 50,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            marginBottom: 22,
          }}
        >
          ↓ Scarica il coupon
        </a>
      )}

      {/* Reazioni */}
      {!reactionSent ? (
        <div>
          <p
            style={{
              fontSize: 12,
              color: MUTED,
              textAlign: "center",
              margin: "0 0 8px",
            }}
          >
            Manda una reazione
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {REACTION_EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onReact(e)}
                style={{
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  fontSize: 22,
                  cursor: "pointer",
                  padding: 0,
                  transition: "transform 0.15s ease",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: 12,
            background: "#E1F5EE",
            color: "#0F6E56",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          ✓ Reazione inviata
        </div>
      )}

      <style>{`
        @keyframes begiftFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
