"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";
const LIGHT = "#fafaf7";

export default function GrazieClient() {
  const { t } = useI18n();
  return (
    <main style={{
      minHeight: "100vh", background: LIGHT,
      fontFamily: "system-ui, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        maxWidth: 460, width: "100%", textAlign: "center",
        background: "#fff", border: "1px solid #e0dbd5",
        borderRadius: 18, padding: "44px 28px",
        boxShadow: "0 6px 24px rgba(0,0,0,.04)",
      }}>
        <div style={{ fontSize: 56, marginBottom: 14 }} aria-hidden>💝</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: DEEP, margin: "0 0 12px", lineHeight: 1.25 }}>
          {t("survey_thanks.title")}
        </h1>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, margin: "0 0 6px" }}>
          {t("survey_thanks.line1")}
        </p>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: "0 0 28px" }}>
          {t("survey_thanks.line2")}
        </p>

        <Link href="/" style={{
          display: "inline-block",
          background: ACCENT, color: "#fff",
          borderRadius: 40, padding: "12px 28px",
          fontSize: 14, fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 6px 18px rgba(212,83,126,.3)",
        }}>
          {t("survey_thanks.cta")}
        </Link>
      </div>
    </main>
  );
}
