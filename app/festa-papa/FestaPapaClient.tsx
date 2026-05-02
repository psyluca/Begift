"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const PAPER = "#E8DCC4";
const ACCENT_DAD = "#5C7A4A";
const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";

export default function FestaPapaClient() {
  const { t } = useI18n();
  const steps = [
    { n: "1", t: t("festa_papa.step1_title"), d: t("festa_papa.step1_desc") },
    { n: "2", t: t("festa_papa.step2_title"), d: t("festa_papa.step2_desc") },
    { n: "3", t: t("festa_papa.step3_title"), d: t("festa_papa.step3_desc") },
    { n: "4", t: t("festa_papa.step4_title"), d: t("festa_papa.step4_desc") },
    { n: "5", t: t("festa_papa.step5_title"), d: t("festa_papa.step5_desc") },
    { n: "+", t: t("festa_papa.step_plus_title"), d: t("festa_papa.step_plus_desc") },
  ];
  return (
    <main style={{ minHeight: "100vh", background: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <section style={{
        padding: "60px 24px 50px",
        background: `linear-gradient(135deg, ${PAPER} 0%, #FFFFFF 100%)`,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 42, marginBottom: 16 }} aria-hidden>🌳</div>
          <h1 style={{
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: 900, color: DEEP, letterSpacing: "-1.5px",
            margin: "0 0 16px", lineHeight: 1.1,
          }}>
            {t("festa_papa.hero_title_1")}<br/>
            <span style={{ color: ACCENT_DAD, fontStyle: "italic", fontWeight: 700 }}>{t("festa_papa.hero_title_2")}</span>
          </h1>
          <p style={{
            fontSize: 18, color: MUTED, lineHeight: 1.6,
            margin: "0 auto 32px", maxWidth: 560,
          }}>
            {t("festa_papa.hero_subtitle")}
          </p>
          <Link
            href="/festa-papa/crea"
            style={{
              display: "inline-block",
              background: ACCENT, color: "#fff", borderRadius: 50,
              padding: "18px 44px", fontSize: 17, fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 10px 32px rgba(212,83,126,.35)",
            }}
          >
            {t("festa_papa.cta_create")}
          </Link>
          <p style={{ fontSize: 13, color: MUTED, margin: "16px 0 0" }}>
            {t("festa_papa.hero_meta")}
          </p>
        </div>
      </section>

      <section style={{ padding: "60px 24px", maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: DEEP, margin: "0 0 16px", textAlign: "center", letterSpacing: "-.5px" }}>
          {t("festa_papa.section2_title")}
        </h2>
        <p style={{ fontSize: 15, color: MUTED, textAlign: "center", margin: "0 0 36px", lineHeight: 1.6 }}>
          {t("festa_papa.section2_subtitle")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {steps.map((item) => (
            <div key={item.n} style={{
              display: "flex", gap: 16,
              padding: "18px 20px",
              background: "#fafaf7",
              border: "1px solid #eadfd5", borderRadius: 14,
              alignItems: "flex-start",
            }}>
              <div style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
                background: ACCENT_DAD, color: "#fff", fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>{item.n}</div>
              <div>
                <div style={{ fontWeight: 700, color: DEEP, fontSize: 16, marginBottom: 4 }}>{item.t}</div>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.55 }}>{item.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "60px 24px", textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: DEEP, margin: "0 0 12px", letterSpacing: "-.5px" }}>
          {t("festa_papa.final_title")}
        </h2>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 28px", lineHeight: 1.6 }}>
          {t("festa_papa.final_subtitle")}
        </p>
        <Link
          href="/festa-papa/crea"
          style={{
            display: "inline-block",
            background: ACCENT, color: "#fff", borderRadius: 50,
            padding: "18px 46px", fontSize: 17, fontWeight: 800,
            textDecoration: "none",
            boxShadow: "0 10px 32px rgba(212,83,126,.35)",
          }}
        >
          {t("festa_papa.final_cta")}
        </Link>
      </section>

      <div style={{ padding: "0 24px 40px", textAlign: "center" }}>
        <Link href="/" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>
          {t("festa_papa.back_home")}
        </Link>
      </div>
    </main>
  );
}
