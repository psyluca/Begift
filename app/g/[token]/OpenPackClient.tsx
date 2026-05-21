"use client";

/**
 * Client component per /g/[token]. 4 stati visivi:
 *  1. loading
 *  2. closed   — pacco statico che galleggia + CTA "Apri il regalo"
 *  3. opening  — animazione ~1.4s: coperchio+fiocco volano via, base
 *                svanisce, contenuto appare in fade-in
 *  4. opened   — contenuto visibile (messaggio + preview + coupon +
 *                bottone scarica + reazioni)
 *
 * NO topbar/bottomnav/footer globali (gestiti via path-based gating
 * nei wrapper).
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
    mime: string | null;
  };
  business: {
    name: string;
    logo_url: string | null;
    brand_color: string | null;
  } | null;
  opened_at: string | null;
  created_at: string;
}

type Phase = "closed" | "opening" | "opened";
type ViewState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: OpenPackData; phase: Phase };

const REACTION_EMOJI = ["❤️", "🙏", "✨", "😍", "🥰", "🎁"];
const OPENING_MS = 1400;

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
      setState({ kind: "ready", data, phase: "closed" });
    } catch (e) {
      setState({ kind: "error", message: (e as Error).message });
    }
  }

  function startOpening() {
    if (state.kind !== "ready" || state.phase !== "closed") return;
    setState({ ...state, phase: "opening" });
    setTimeout(() => {
      setState((prev) =>
        prev.kind === "ready" ? { ...prev, phase: "opened" } : prev
      );
    }, OPENING_MS);
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
    }
  }

  if (state.kind === "loading") {
    return (
      <Shell>
        <div style={{ color: MUTED, padding: 40, textAlign: "center" }}>
          Apertura del pacco…
        </div>
      </Shell>
    );
  }
  if (state.kind === "not_found") {
    return (
      <Shell>
        <div style={{ padding: 40, textAlign: "center", color: INK }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤔</div>
          <p style={{ fontSize: 14, marginBottom: 6 }}>
            Questo pacco non esiste più o il link è errato.
          </p>
          <p style={{ fontSize: 12, color: MUTED }}>
            Chiedi a chi te l&apos;ha mandato di rinviartelo.
          </p>
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

  return (
    <Shell accent={accent}>
      {state.phase === "closed" && (
        <ClosedView
          data={state.data}
          accent={accent}
          onOpen={startOpening}
          animating={false}
        />
      )}
      {state.phase === "opening" && (
        <ClosedView
          data={state.data}
          accent={accent}
          onOpen={() => {}}
          animating={true}
        />
      )}
      {state.phase === "opened" && (
        <OpenedView
          data={state.data}
          accent={accent}
          onReact={sendReaction}
          reactionSent={reactionSent}
        />
      )}
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
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
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
          Impacchettato da{" "}
          <a
            href="/"
            style={{
              fontWeight: 800,
              textDecoration: "none",
              color: INK,
            }}
          >
            Be<span style={{ color: ACCENT_DEFAULT }}>Gift</span>
          </a>
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
  animating,
}: {
  data: OpenPackData;
  accent: string;
  onOpen: () => void;
  animating: boolean;
}) {
  const paper = data.packaging?.paperColor || "#F4C0D1";
  const ribbon = data.packaging?.ribbonColor || accent;
  // tonalita' piu' scura per i lati 3D / interno scatola — derivata
  // mescolando il colore carta con nero al 22%.
  const paperShade = shadeColor(paper, -0.22);
  const inside = shadeColor(paper, -0.55);

  return (
    <div style={{ textAlign: "center" }}>
      {!animating && (
        <>
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
        </>
      )}

      {/* PACCO 3D in SVG. 2 gruppi raggruppati: lid (coperchio + fiocco)
          e box (corpo della scatola). Il lid si stacca animato verso
          l'alto, lasciando vedere il box "aperto". */}
      <button
        type="button"
        onClick={onOpen}
        disabled={animating}
        aria-label="Apri il regalo"
        style={{
          background: "transparent",
          border: "none",
          cursor: animating ? "default" : "pointer",
          padding: 20,
          margin: "16px auto",
          display: "block",
          animation: animating ? "none" : "begiftBoxFloat 2.8s ease-in-out infinite",
        }}
      >
        <svg
          width="260"
          height="260"
          viewBox="0 0 260 260"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: "visible", filter: `drop-shadow(0 14px 28px ${accent}33)` }}
        >
          {/* BOX (corpo scatola) — visibile sempre */}
          <g
            style={{
              animation: animating
                ? `begiftBoxFade ${OPENING_MS}ms ease-out forwards`
                : "none",
              transformOrigin: "130px 200px",
            }}
          >
            {/* Lato destro (prospettiva) */}
            <polygon
              points="210,90 240,70 240,210 210,230"
              fill={paperShade}
            />
            {/* Faccia frontale */}
            <polygon
              points="50,90 210,90 210,230 50,230"
              fill={paper}
            />
            {/* Lato superiore aperto (interno scatola, visibile quando il
                lid e' via) */}
            <polygon
              points="50,90 210,90 240,70 80,70"
              fill={inside}
            />
            {/* Nastro verticale (sul fronte) */}
            <rect x="118" y="90" width="24" height="140" fill={ribbon} />
            {/* Nastro verticale (sul lato) */}
            <polygon
              points="210,160 240,140 240,156 210,176"
              fill={shadeColor(ribbon, -0.18)}
            />
          </g>

          {/* LID (coperchio + fiocco) — vola via in animazione */}
          <g
            style={{
              animation: animating
                ? `begiftLidFly ${OPENING_MS}ms cubic-bezier(0.4, 0.0, 0.6, 1) forwards`
                : "none",
              transformOrigin: "130px 60px",
            }}
          >
            {/* Lato destro coperchio */}
            <polygon
              points="218,55 248,35 248,75 218,95"
              fill={paperShade}
            />
            {/* Faccia frontale coperchio */}
            <polygon
              points="42,55 218,55 218,95 42,95"
              fill={paper}
            />
            {/* Top coperchio */}
            <polygon
              points="42,55 218,55 248,35 72,35"
              fill={shadeColor(paper, 0.08)}
            />
            {/* Nastro verticale sul coperchio (continuo del nastro box) */}
            <rect x="118" y="55" width="24" height="40" fill={ribbon} />
            <polygon
              points="118,55 142,55 154,45 130,45"
              fill={shadeColor(ribbon, 0.06)}
            />
            <polygon
              points="142,55 142,95 154,85 154,45"
              fill={shadeColor(ribbon, -0.18)}
            />
            {/* Fiocco — 2 ovali laterali + nodo centrale */}
            <g transform="translate(130, 38)">
              {/* loop sinistro */}
              <ellipse cx="-18" cy="0" rx="20" ry="14" fill={ribbon} />
              <ellipse cx="-18" cy="0" rx="10" ry="7" fill={shadeColor(ribbon, -0.25)} />
              {/* loop destro */}
              <ellipse cx="18" cy="0" rx="20" ry="14" fill={ribbon} />
              <ellipse cx="18" cy="0" rx="10" ry="7" fill={shadeColor(ribbon, -0.25)} />
              {/* nodo centrale */}
              <rect x="-6" y="-9" width="12" height="18" rx="3" fill={shadeColor(ribbon, 0.1)} />
              {/* code del fiocco che cadono */}
              <polygon
                points="-3,8 -12,28 -4,24 0,12"
                fill={ribbon}
              />
              <polygon
                points="3,8 12,28 4,24 0,12"
                fill={ribbon}
              />
            </g>
          </g>
        </svg>
      </button>

      {!animating && (
        <>
          <p
            style={{
              fontSize: 13,
              color: MUTED,
              marginTop: 8,
              marginBottom: 16,
            }}
          >
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
        </>
      )}

      <style>{`
        @keyframes begiftBoxFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes begiftLidFly {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          25% {
            transform: translateY(-30px) rotate(-6deg) scale(1.02);
            opacity: 1;
          }
          100% {
            transform: translateY(-280px) rotate(28deg) scale(0.7);
            opacity: 0;
          }
        }
        @keyframes begiftBoxFade {
          0%, 70% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(4px) scale(0.92); }
        }
      `}</style>
    </div>
  );
}

/**
 * Shade a hex color toward black (negative percent) or white (positive percent).
 * Es: shadeColor('#F4C0D1', -0.2) → ~20% piu' scuro.
 */
function shadeColor(hex: string, percent: number): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
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

      {/* Coupon card */}
      <div
        style={{
          border: `2px dashed ${accent}`,
          borderRadius: 10,
          padding: "16px 14px",
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
            textAlign: "center",
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
              textAlign: "center",
            }}
          >
            {data.coupon.title}
          </p>
        )}
        {data.coupon.validity && (
          <p
            style={{
              fontSize: 12,
              color: MUTED,
              margin: "0 0 14px",
              textAlign: "center",
            }}
          >
            Validità: {data.coupon.validity}
          </p>
        )}

        {/* Preview inline del file coupon (PDF iframe / img) */}
        <CouponPreview
          fileUrl={data.coupon.file_url}
          mime={data.coupon.mime}
        />
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

function CouponPreview({
  fileUrl,
  mime,
}: {
  fileUrl: string | null;
  mime: string | null;
}) {
  if (!fileUrl) return null;

  const lowerMime = (mime || "").toLowerCase();
  const lowerUrl = fileUrl.toLowerCase().split("?")[0];

  const isPdf = lowerMime.includes("pdf") || lowerUrl.endsWith(".pdf");
  const isImage =
    lowerMime.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif)$/i.test(lowerUrl);

  if (isImage) {
    return (
      <img
        src={fileUrl}
        alt="Coupon"
        style={{
          width: "100%",
          maxHeight: 360,
          objectFit: "contain",
          borderRadius: 6,
          border: `1px solid ${BORDER}`,
          background: "#fafafa",
          display: "block",
        }}
      />
    );
  }

  if (isPdf) {
    return (
      <iframe
        src={fileUrl}
        title="Anteprima coupon"
        style={{
          width: "100%",
          height: 380,
          border: `1px solid ${BORDER}`,
          borderRadius: 6,
          background: "#fafafa",
        }}
      />
    );
  }

  // Fallback: file format non riconosciuto, mostra solo un placeholder
  return (
    <div
      style={{
        padding: "20px 14px",
        textAlign: "center",
        background: SOFT_BG,
        border: `1px dashed ${BORDER}`,
        borderRadius: 6,
        color: MUTED,
        fontSize: 12,
      }}
    >
      File coupon allegato. Usa il bottone qui sotto per scaricarlo.
    </div>
  );
}
