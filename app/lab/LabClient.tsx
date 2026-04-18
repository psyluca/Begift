"use client";

import { useState } from "react";
import {
  ExperienceThemeProvider,
  useExperienceTheme,
  AVAILABLE_ENVIRONMENTS,
} from "@/components/experience/themes/ThemeProvider";
import type { EnvironmentId, GiftMetadata } from "@/components/experience/themes/types";
import { GiftOpenScene } from "@/components/experience/scenes/GiftOpenScene";

/**
 * Client entry for /lab. Wraps the scene in the ExperienceThemeProvider
 * and shows dev-only controls (theme picker, personalization form) so Luca
 * can test combinations quickly from a phone or desktop.
 */
export default function LabClient() {
  return (
    <ExperienceThemeProvider initialEnvironment="candy">
      <LabInner />
    </ExperienceThemeProvider>
  );
}

function LabInner() {
  const { theme, setEnvironment } = useExperienceTheme();
  const [gift, setGift] = useState<GiftMetadata>({
    recipientName: "",
    senderAlias: "",
    message: "",
    seed: "demo-1",
  });
  const [controlsOpen, setControlsOpen] = useState(true);

  return (
    <div style={{ position: "relative", minHeight: "100dvh" }}>
      {/* The scene fills the viewport */}
      <GiftOpenScene gift={cleanGift(gift)} />

      {/* ─── Dev controls: theme picker + personalization form ─── */}
      <div
        className="dev-controls"
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          right: 16,
          maxWidth: 420,
          margin: "0 auto",
          background: "rgba(20, 10, 30, 0.85)",
          backdropFilter: "blur(14px)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff",
          padding: controlsOpen ? "14px 16px" : "10px 16px",
          zIndex: 50,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: controlsOpen ? 12 : 0,
          }}
        >
          <span style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1 }}>
            LAB · EXPERIENCE v2 — dev only
          </span>
          <button
            onClick={() => setControlsOpen((o) => !o)}
            style={pillButton}
            aria-label={controlsOpen ? "Nascondi controlli" : "Mostra controlli"}
          >
            {controlsOpen ? "Nascondi" : "Mostra"}
          </button>
        </div>

        {controlsOpen && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {AVAILABLE_ENVIRONMENTS.map((env) => {
                const active = theme.environment.id === env.id;
                return (
                  <button
                    key={env.id}
                    onClick={() => setEnvironment(env.id as EnvironmentId)}
                    style={{
                      ...pillButton,
                      flex: 1,
                      background: active ? env.palette.primary : "rgba(255,255,255,0.08)",
                      color: active ? "#fff" : "rgba(255,255,255,0.7)",
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {env.displayName}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <Field
                label="Destinatario"
                value={gift.recipientName ?? ""}
                onChange={(v) => setGift((g) => ({ ...g, recipientName: v }))}
                placeholder="Es. Maria"
              />
              <Field
                label="Mittente"
                value={gift.senderAlias ?? ""}
                onChange={(v) => setGift((g) => ({ ...g, senderAlias: v }))}
                placeholder="Es. Luca"
              />
              <Field
                label="Messaggio"
                value={gift.message ?? ""}
                onChange={(v) => setGift((g) => ({ ...g, message: v }))}
                placeholder="Es. Buon compleanno! 🎉"
              />
            </div>

            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                fontSize: 11,
                opacity: 0.55,
                lineHeight: 1.4,
              }}
            >
              Tocca il pacco per avviare la scena. I cambi di tema e testo si
              applicano al prossimo replay.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.3 }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8,
          padding: "8px 10px",
          fontSize: 13,
          color: "#fff",
          outline: "none",
        }}
      />
    </label>
  );
}

const pillButton: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.85)",
  borderRadius: 20,
  padding: "6px 12px",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "inherit",
};

/** Strip empty strings so the scene uses its defaults. */
function cleanGift(g: GiftMetadata): GiftMetadata {
  return {
    recipientName: g.recipientName || undefined,
    senderAlias: g.senderAlias || undefined,
    message: g.message || undefined,
    seed: g.seed,
  };
}
