"use client";

/**
 * ShareButton — bottone "Condividi" universale basato su Web Share API.
 *
 * Comportamento:
 *  - Se `navigator.share` e' supportato (iOS Safari, Android Chrome,
 *    gran parte dei mobile moderni): apre lo share sheet nativo del
 *    sistema operativo. L'utente sceglie l'app preferita (iMessage,
 *    WhatsApp, Telegram, Signal, Mail, Instagram DM, ecc.).
 *  - Se non supportato (desktop Chrome/Firefox, browser piu' vecchi):
 *    fallback `window.open('https://wa.me/?text=...')`. Apre WhatsApp
 *    Web col messaggio precompilato, esattamente come il vecchio
 *    WhatsAppShareButton.
 *
 * Questo pattern ("native first, fallback second") e' il canonical
 * per PWA consumer. Vantaggi:
 *  - Rispetta l'app preferita dell'utente (niente "t'ho obbligato
 *    a usare WhatsApp quando in realta' chiatti su Telegram")
 *  - Una sola CTA in UI, niente proliferazione di bottoni per app
 *  - La copy diventa "Condividi" neutra invece di brand-specific
 *
 * Il messaggio condiviso usa i18n `share.whatsapp_notify` con i
 * placeholder {name} e {url} — lo stesso testo del vecchio button
 * per minimizzare regressioni.
 */

import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { track } from "@/lib/analytics";

const ACCENT = "#D4537E";

export interface ShareButtonProps {
  /** URL completo del gift (es. https://begift.app/gift/abc123) */
  giftUrl: string;
  /** Nome del destinatario da inserire nel messaggio */
  recipientName: string;
  /** "full" (default, full-width pieno) | "compact" | "pill" */
  variant?: "full" | "compact" | "pill";
  /** Testo custom del bottone; default da i18n (`share.button_label`) */
  label?: string;
}

export function ShareButton({
  giftUrl,
  recipientName,
  variant = "full",
  label,
}: ShareButtonProps) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  // Testo precompilato. Usa la stessa chiave i18n del vecchio
  // WhatsAppShareButton per evitare duplicazioni e per coerenza.
  const text = t("share.whatsapp_notify", {
    name: recipientName || "",
    url: giftUrl,
  });

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const usedNative = typeof navigator !== "undefined" && typeof navigator.share === "function";
    track("share_clicked", { method: usedNative ? "web_share_api" : "wa_fallback" });
    try {
      // 1. Preferenza: Web Share API nativa.
      // Su iOS Safari questo apre lo share sheet con iMessage in cima,
      // su Android lo share sheet di sistema.
      if (usedNative) {
        try {
          await navigator.share({
            title: t("share.share_title"),
            text,
            url: giftUrl,
          });
          return; // successo: il sistema ha gestito il dispatch
        } catch (err: unknown) {
          // AbortError = utente ha chiuso lo sheet senza scegliere.
          // Non mostriamo errore, restiamo silenti.
          const e = err as { name?: string };
          if (e?.name === "AbortError") return;
          // Qualsiasi altro errore: cadiamo nel fallback wa.me
          // (es. permission denied, not-allowed in iframe, ecc.)
        }
      }
      // 2. Fallback: apri WhatsApp Web/app direttamente.
      const href = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(href, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  };

  const padding = variant === "full"    ? "14px 22px"
                 : variant === "compact" ? "8px 14px"
                 : "10px 18px";
  const fontSize = variant === "full" ? 15 : variant === "compact" ? 12 : 13;
  const fullWidth = variant === "full";

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      aria-label={label ?? t("share.button_label")}
      style={{
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : "auto",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: ACCENT,
        color: "#fff",
        border: "none",
        borderRadius: 40,
        padding,
        fontSize,
        fontWeight: 700,
        boxShadow: variant === "full" ? "0 8px 22px rgba(212,83,126,.35)" : undefined,
        transition: "transform .15s, background .15s, opacity .15s",
        fontFamily: "inherit",
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.7 : 1,
      }}
      onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(.97)"; }}
      onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
    >
      <ShareGlyph size={variant === "full" ? 20 : 16} />
      <span>{label ?? t("share.button_label")}</span>
    </button>
  );
}

/**
 * Icona "share" generica — rectangle con freccia verso l'alto, stile
 * iOS-like che e' universalmente riconosciuto come "condividi" su
 * mobile. Monocromo bianco per stare su sfondo rosa brand.
 */
function ShareGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* Freccia verso l'alto */}
      <path d="M12 16V3"/>
      <path d="M7 8l5-5 5 5"/>
      {/* Base del rectangle (box di uscita) */}
      <path d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8"/>
    </svg>
  );
}
