"use client";

/**
 * /chi-siamo — pagina trust/about minima.
 *
 * Pensata per essere il landing del link "Chi siamo →" del trust banner
 * sulla pagina /gift/[id] (introdotto 03/05/2026 per ridurre la friction
 * "sembra una truffa" che impattava il 47% di non-aperture). Deve dare
 * al destinatario abbastanza informazioni umane per decidere se fidarsi:
 *   - nome reale
 *   - sede fisica
 *   - email diretta non automatizzata
 *   - link a Privacy/Terms/Security già presenti
 *
 * Versione minima v1: tutto in una colonna, no foto (se Luca vuole
 * aggiungere una foto, è banale aggiungere un <img> sopra il nome).
 * Volutamente sobrio e non promozionale: l'obiettivo è "questa persona
 * esiste e si prende la responsabilità", non vendere il prodotto.
 */

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";
const LIGHT = "#fafaf7";
const BORDER = "#e8e2d8";

export default function AboutClient() {
  const { t } = useI18n();
  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 22px 80px" }}>
        <Link href="/" style={{
          color: MUTED, fontSize: 13, textDecoration: "none",
          display: "inline-block", marginBottom: 24,
        }}>
          {t("about.back")}
        </Link>

        <h1 style={{
          fontSize: 32, fontWeight: 900, color: DEEP,
          margin: "0 0 24px", letterSpacing: "-.5px",
        }}>
          {t("about.title")}
        </h1>

        {/* Identità + ruolo */}
        <div style={{
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
          padding: "20px 22px", marginBottom: 18,
          display: "flex", gap: 16, alignItems: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: `linear-gradient(135deg, ${ACCENT}, #f4a8c0)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 26, fontWeight: 800,
            flexShrink: 0,
          }} aria-hidden>LG</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: DEEP }}>Luca Galli</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{t("about.founder_role")}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>📍 {t("about.lucca_label")}</div>
          </div>
        </div>

        {/* Intro */}
        <div style={{
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
          padding: "20px 22px", marginBottom: 18,
          fontSize: 14.5, lineHeight: 1.65, color: "#3d3d3d",
        }}>
          <p style={{ margin: "0 0 14px" }}>{t("about.intro_1")}</p>
          <p style={{ margin: 0 }}>{t("about.intro_2")}</p>
        </div>

        {/* Trust block — il cuore della pagina, parla direttamente al
            destinatario diffidente. */}
        <div style={{
          background: "#fff8ec", border: "1px solid #f0e0c0", borderRadius: 14,
          padding: "20px 22px", marginBottom: 18,
          fontSize: 14, lineHeight: 1.6, color: "#3d3d3d",
        }}>
          <h2 style={{
            fontSize: 15, fontWeight: 800, color: DEEP,
            margin: "0 0 8px",
          }}>
            🛡️ {t("about.trust_title")}
          </h2>
          <p style={{ margin: 0 }}>{t("about.trust_body")}</p>
        </div>

        {/* Contatti */}
        <div style={{
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
          padding: "20px 22px", marginBottom: 18,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: DEEP, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".05em" }}>
            ✉️ {t("about.contact_title")}
          </h2>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
            <div>
              {t("about.contact_email")}{" "}
              <a href="mailto:ciao@begift.app" style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}>
                ciao@begift.app
              </a>
            </div>
            <div style={{ marginTop: 6 }}>
              {t("about.contact_legal")} {t("about.lucca_label")}
            </div>
          </div>
        </div>

        {/* Links */}
        <div style={{
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
          padding: "20px 22px",
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: DEEP, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".05em" }}>
            🔗 {t("about.links_title")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5 }}>
            <Link href="/privacy" style={{ color: ACCENT, textDecoration: "none" }}>{t("about.link_privacy")}</Link>
            <Link href="/terms" style={{ color: ACCENT, textDecoration: "none" }}>{t("about.link_terms")}</Link>
            <Link href="/security" style={{ color: ACCENT, textDecoration: "none" }}>{t("about.link_security")}</Link>
            <Link href="/" style={{ color: ACCENT, textDecoration: "none" }}>{t("about.link_home")}</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
