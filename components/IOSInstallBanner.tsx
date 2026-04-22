"use client";

/**
 * IOSInstallBanner
 *
 * Banner inferiore mostrato solo su iPhone/iPad con Safari in
 * modalità NON standalone (cioè: browser normale, non installato
 * come PWA). Istruzioni rapide "Condividi → Aggiungi alla Home"
 * perché su iOS le Web Push funzionano SOLO da PWA installata
 * (vincolo Apple >= 16.4).
 *
 * Nascosto se:
 *  - Non è iOS
 *  - È già installato standalone (navigator.standalone === true)
 *  - L'utente ha dismissato (cooldown 7 giorni)
 *
 * Non appare su Android/Desktop perché non necessario: lì le
 * Web Push funzionano anche da browser normale.
 */

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const DISMISS_KEY = "begift_ios_install_dismissed_at";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 giorni

export function IOSInstallBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    // Detect iOS (iPhone, iPad, iPod). iPad Pro moderno può sembrare
    // Mac; includiamo anche il check su maxTouchPoints.
    const ua = navigator.userAgent;
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && (navigator as { maxTouchPoints?: number }).maxTouchPoints! > 1);
    if (!isIOS) return;

    // Standalone mode = già installato come PWA
    const nav = navigator as { standalone?: boolean };
    const isStandalone =
      nav.standalone === true ||
      window.matchMedia?.("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // Cooldown
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const ts = parseInt(raw, 10);
        if (!isNaN(ts) && Date.now() - ts < DISMISS_COOLDOWN_MS) return;
      }
    } catch { /* ignore */ }

    // Delay piccolo per non disturbare il primo caricamento
    const id = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(id);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 84, // sopra la BottomNav (se presente)
        zIndex: 9_500,
        background: "#fff",
        border: `1.5px solid ${ACCENT}`,
        borderRadius: 18,
        padding: "14px 16px",
        boxShadow: "0 10px 36px rgba(0,0,0,0.14)",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        animation: "iosInstallIn .45s cubic-bezier(.34,1.56,.64,1) both",
      }}
    >
      <style>{`
        @keyframes iosInstallIn {
          from { opacity: 0; transform: translateY(20px) scale(.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div style={{ fontSize: 30, flexShrink: 0, lineHeight: 1 }}>📲</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: DEEP, marginBottom: 4 }}>
          {t("ios_install.title")}
        </div>
        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.45, marginBottom: 8 }}>
          {/* Descrizione con icona inline + CTA in bold. Splittiamo
              la copy sul placeholder {icon} per inserire il componente
              SVG, e sul {addCta} per il testo in bold. */}
          <IosInstallDesc
            template={t("ios_install.desc")}
            addCtaLabel={t("ios_install.add_cta")}
          />
        </div>
        <button
          onClick={dismiss}
          style={{
            background: "transparent",
            color: "#999",
            border: "none",
            padding: 0,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {t("ios_install.not_now")}
        </button>
      </div>
      <button
        onClick={dismiss}
        aria-label={t("ios_install.close")}
        style={{
          background: "transparent",
          border: "none",
          fontSize: 20,
          color: "#bbb",
          cursor: "pointer",
          padding: 4,
          lineHeight: 1,
          flexShrink: 0,
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ×
      </button>
    </div>
  );
}

/** Piccola icona inline "share" tipo iOS (quadrato con freccia su) */
/**
 * Renderizza la descrizione sostituendo:
 *   {icon}  → componente InlineSquareShare (SVG icona share iOS)
 *   {addCta} → addCtaLabel in <strong>
 * Lavora su stringa singola con 2 placeholder, quindi split in
 * parti. Niente innerHTML — tutto JSX safe.
 */
function IosInstallDesc({ template, addCtaLabel }: { template: string; addCtaLabel: string }) {
  // Split sul primo placeholder {icon}
  const [before, rest] = template.split("{icon}");
  // Poi split sul secondo placeholder {addCta}
  const [between, after] = (rest ?? "").split("{addCta}");
  return (
    <>
      {before}
      <InlineSquareShare />
      {between}
      <strong>{addCtaLabel}</strong>
      {after}
    </>
  );
}

function InlineSquareShare() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        width: 18,
        height: 22,
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 3,
          right: 3,
          bottom: 0,
          height: 12,
          border: "1.4px solid #555",
          borderRadius: 2,
          boxSizing: "border-box",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          transform: "translateX(-50%)",
          width: 1.4,
          height: 12,
          background: "#555",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          transform: "translateX(-50%) rotate(45deg)",
          transformOrigin: "top left",
          width: 1.4,
          height: 5,
          background: "#555",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          transform: "translateX(-50%) rotate(-45deg)",
          transformOrigin: "top right",
          width: 1.4,
          height: 5,
          background: "#555",
        }}
      />
    </span>
  );
}
