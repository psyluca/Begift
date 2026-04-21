"use client";

/**
 * WhatsAppShareButton — bottone verde WhatsApp con deep link
 * `wa.me/?text=...` pre-compilato che apre (su mobile) direttamente
 * l'app WhatsApp col messaggio pronto da inoltrare al destinatario,
 * oppure (su desktop) il contact picker di WhatsApp Web.
 *
 * Il messaggio pre-compilato usa la stringa i18n `share.whatsapp_notify`
 * con i placeholder {name} + {url}, es.:
 *   "Maria, ho preparato un regalo per te su BeGift 🎁
 *    Aprilo qui: https://begift.app/gift/abc123"
 *
 * Design: bottone pieno colore WhatsApp brand green (#25D366) con
 * logo SVG inline + testo "Condividi via WhatsApp". Full-width di
 * default; il caller può sovrascriver via prop `variant`.
 */

import { useI18n } from "@/lib/i18n";

export interface WhatsAppShareButtonProps {
  /** URL completo del gift (es. https://begift.app/gift/abc123) */
  giftUrl: string;
  /** Nome del destinatario da inserire nel messaggio */
  recipientName: string;
  /** "full" (default, full-width pieno) | "compact" (padding minore,
   *  adatto a dashboard card) | "pill" (arrotondato tondo) */
  variant?: "full" | "compact" | "pill";
  /** Testo custom del bottone; default da i18n (`create.send_whatsapp`) */
  label?: string;
}

const BRAND_GREEN = "#25D366";
const BRAND_GREEN_DARK = "#128C7E";

export function WhatsAppShareButton({
  giftUrl,
  recipientName,
  variant = "full",
  label,
}: WhatsAppShareButtonProps) {
  const { t } = useI18n();

  const text = t("share.whatsapp_notify", {
    name: recipientName || "",
    url: giftUrl,
  });
  const href = `https://wa.me/?text=${encodeURIComponent(text)}`;

  const padding = variant === "full"    ? "14px 22px"
                 : variant === "compact" ? "8px 14px"
                 : "10px 18px";
  const fontSize = variant === "full" ? 15 : variant === "compact" ? 12 : 13;
  const fullWidth = variant === "full";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : "auto",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: BRAND_GREEN,
        color: "#fff",
        border: "none",
        borderRadius: 40,
        padding,
        fontSize,
        fontWeight: 700,
        textDecoration: "none",
        boxShadow: variant === "full" ? "0 6px 18px rgba(37,211,102,.35)" : undefined,
        transition: "transform .15s, background .15s",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
      onMouseDown={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(.97)"; }}
      onMouseUp={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"; }}
    >
      <WhatsAppGlyph size={variant === "full" ? 22 : 18} />
      <span>{label ?? t("create.send_whatsapp")}</span>
    </a>
  );
}

/** Logo WhatsApp ufficiale SVG (monocromo bianco per stare su sfondo brand) */
function WhatsAppGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#fff"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}
