"use client";

/**
 * Footer globale montato in layout.tsx. Contiene:
 * - Link a Privacy Policy e Termini di servizio (obbligatori)
 * - Email contatto e abuse
 * - Copyright e info titolare minimo necessario
 *
 * Nascosto sulla pagina /gift/[id] (esperienza immersiva regalo)
 * per non disturbare il momento di apertura.
 *
 * Stile discreto, grigio chiaro, non invadente. Si posiziona in
 * fondo al body, sopra la BottomNav (che è fixed, quindi il footer
 * ha paddingBottom per non finire sotto).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const MUTED = "#888";
const LIGHT_BORDER = "#e8e4de";

export default function Footer() {
  const pathname = usePathname();

  // Nascondi su gift-opening (esperienza immersiva)
  // e su create (ha il suo flow dedicato)
  if (pathname.startsWith("/gift/")) return null;
  if (pathname === "/create") return null;

  const year = new Date().getFullYear();

  return (
    <footer style={{
      marginTop: 40,
      padding: "24px 20px 80px", // paddingBottom extra per BottomNav fixed
      borderTop: `0.5px solid ${LIGHT_BORDER}`,
      background: "transparent",
      fontSize: 12,
      color: MUTED,
      textAlign: "center",
      lineHeight: 1.7,
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
          <Link href="/privacy" style={{ color: MUTED, textDecoration: "none" }}>Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" style={{ color: MUTED, textDecoration: "none" }}>Termini</Link>
          <span aria-hidden="true">·</span>
          <a href="mailto:hello@begift.app" style={{ color: MUTED, textDecoration: "none" }}>Contatti</a>
          <span aria-hidden="true">·</span>
          <a href="mailto:abuse@begift.app" style={{ color: MUTED, textDecoration: "none" }}>Segnalazioni</a>
        </div>
        <div style={{ fontSize: 11, color: "#b0b0b0" }}>
          © {year} BeGift · Titolare: Luca Galli · <a href="mailto:privacy@begift.app" style={{ color: "#b0b0b0", textDecoration: "none" }}>privacy@begift.app</a>
        </div>
      </div>
    </footer>
  );
}
