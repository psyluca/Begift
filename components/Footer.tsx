"use client";

/**
 * Footer globale montato in layout.tsx. Contiene:
 * - Link a Privacy Policy e Termini di servizio (obbligatori)
 * - Email contatto e abuse
 * - Copyright e info titolare minimo necessario
 *
 * Nascosto su /create (ha il suo flow dedicato).
 *
 * Su /gift/[id] (apertura regalo) era nascosto fino al 04/05/2026
 * perché considerato disturbo all'esperienza immersiva. Riportato in
 * versione "discreta" (font ridotto, opacity attenuata) come trust
 * signal sempre disponibile per il destinatario che dubita
 * dell'autenticità del link. Senza questo, chi atterra dal link
 * WhatsApp non ha modo di verificare /chi-siamo dal footer.
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

  // Nascondi su create (ha il suo flow dedicato).
  if (pathname === "/create") return null;

  const year = new Date().getFullYear();

  // Modalità "discreta" sulla pagina di apertura regalo: stesso footer
  // strutturalmente, ma font più piccolo e opacity attenuata per non
  // rubare attenzione al pacco. Il destinatario diffidente lo trova
  // scrollando in fondo, senza che disturbi a colpo d'occhio.
  const isGiftOpening = pathname.startsWith("/gift/");
  const linkSize = isGiftOpening ? 11 : 12;
  const copySize = isGiftOpening ? 10 : 11;
  const wrapperOpacity = isGiftOpening ? 0.7 : 1;
  const wrapperPaddingTop = isGiftOpening ? 18 : 24;

  return (
    <footer style={{
      marginTop: 40,
      padding: `${wrapperPaddingTop}px 20px 80px`,
      borderTop: `0.5px solid ${LIGHT_BORDER}`,
      background: "transparent",
      fontSize: linkSize,
      color: MUTED,
      textAlign: "center",
      lineHeight: 1.7,
      fontFamily: "system-ui, sans-serif",
      opacity: wrapperOpacity,
    }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          <Link href="/per-chi" style={{ color: MUTED, textDecoration: "none" }}>Per chi è</Link>
          <span aria-hidden="true">·</span>
          <Link href="/faq" style={{ color: MUTED, textDecoration: "none" }}>FAQ</Link>
          <span aria-hidden="true">·</span>
          <Link href="/press" style={{ color: MUTED, textDecoration: "none" }}>Press</Link>
          <span aria-hidden="true">·</span>
          <Link href="/chi-siamo" style={{ color: MUTED, textDecoration: "none" }}>Chi siamo</Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacy" style={{ color: MUTED, textDecoration: "none" }}>Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" style={{ color: MUTED, textDecoration: "none" }}>Termini</Link>
          <span aria-hidden="true">·</span>
          <Link href="/security" style={{ color: MUTED, textDecoration: "none" }}>Sicurezza</Link>
          <span aria-hidden="true">·</span>
          <a href="mailto:info@begift.app" style={{ color: MUTED, textDecoration: "none" }}>Contatti</a>
          <span aria-hidden="true">·</span>
          <a href="mailto:abuse@begift.app" style={{ color: MUTED, textDecoration: "none" }}>Segnalazioni</a>
        </div>
        <div style={{ fontSize: copySize, color: "#b0b0b0" }}>
          © {year} BeGift · Titolare: Luca Galli · <a href="mailto:privacy@begift.app" style={{ color: "#b0b0b0", textDecoration: "none" }}>privacy@begift.app</a>
        </div>
      </div>
    </footer>
  );
}
