"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const ROSE = "#F4DCD8";
const GOLD = "#D4A340";
const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";

export default function FestaMammaClient() {
  const { t } = useI18n();
  const steps = [
    { n: "1", t: t("festa_mamma.step1_title"), d: t("festa_mamma.step1_desc") },
    { n: "2", t: t("festa_mamma.step2_title"), d: t("festa_mamma.step2_desc") },
    { n: "3", t: t("festa_mamma.step3_title"), d: t("festa_mamma.step3_desc") },
    { n: "4", t: t("festa_mamma.step4_title"), d: t("festa_mamma.step4_desc") },
    { n: "5", t: t("festa_mamma.step5_title"), d: t("festa_mamma.step5_desc") },
    { n: "+", t: t("festa_mamma.step_plus_title"), d: t("festa_mamma.step_plus_desc") },
  ];
  return (
    <main style={{ minHeight: "100vh", background: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* Hero */}
      <section style={{
        padding: "60px 24px 50px",
        background: `linear-gradient(135deg, ${ROSE} 0%, #FFFFFF 100%)`,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 42, marginBottom: 16 }} aria-hidden>💐</div>
          <h1 style={{
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: 900,
            color: DEEP,
            letterSpacing: "-1.5px",
            margin: "0 0 16px",
            lineHeight: 1.1,
          }}>
            {t("festa_mamma.hero_title_1")}<br/>
            <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 700 }}>{t("festa_mamma.hero_title_2")}</span>
          </h1>
          <p style={{
            fontSize: 18,
            color: MUTED,
            lineHeight: 1.6,
            margin: "0 auto 32px",
            maxWidth: 560,
          }}>
            {t("festa_mamma.hero_subtitle")}
          </p>
          <Link
            href="/festa-mamma/crea"
            style={{
              display: "inline-block",
              background: ACCENT,
              color: "#fff",
              borderRadius: 50,
              padding: "18px 44px",
              fontSize: 17,
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 10px 32px rgba(212,83,126,.35)",
            }}
          >
            {t("festa_mamma.cta_create")}
          </Link>
          <p style={{ fontSize: 13, color: MUTED, margin: "16px 0 0" }}>
            {t("festa_mamma.hero_meta")}
          </p>
        </div>
      </section>

      {/* Cosa contiene */}
      <section style={{ padding: "60px 24px", maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: DEEP, margin: "0 0 16px", textAlign: "center", letterSpacing: "-.5px" }}>
          {t("festa_mamma.section2_title")}
        </h2>
        <p style={{ fontSize: 15, color: MUTED, textAlign: "center", margin: "0 0 36px", lineHeight: 1.6 }}>
          {t("festa_mamma.section2_subtitle")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {steps.map((item) => (
            <div
              key={item.n}
              style={{
                display: "flex",
                gap: 16,
                padding: "18px 20px",
                background: "#fafaf7",
                border: "1px solid #eadfd5",
                borderRadius: 14,
                alignItems: "flex-start",
              }}
            >
              <div style={{
                flexShrink: 0,
                width: 36, height: 36,
                borderRadius: "50%",
                background: GOLD,
                color: "#fff",
                fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>{item.n}</div>
              <div>
                <div style={{ fontWeight: 700, color: DEEP, fontSize: 16, marginBottom: 4 }}>
                  {item.t}
                </div>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
                  {item.d}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Anteprima visiva */}
      <section style={{ padding: "40px 24px 60px", background: ROSE }}>
        <div style={{ maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: DEEP, margin: "0 0 12px" }}>
            {t("festa_mamma.preview_title")}
          </h2>
          <p style={{ fontSize: 14, color: MUTED, margin: "0 0 24px", lineHeight: 1.6 }}>
            {t("festa_mamma.preview_subtitle")}
          </p>

          {/* Mock pacco */}
          <div style={{
            background: "#fff",
            borderRadius: 24,
            padding: "36px 28px",
            boxShadow: "0 16px 48px rgba(0,0,0,.08)",
            margin: "0 auto",
            maxWidth: 360,
          }}>
            <div style={{
              fontSize: "clamp(34px, 8vw, 48px)",
              color: GOLD,
              fontWeight: 700,
              fontStyle: "italic",
              fontFamily: "Georgia, serif",
              margin: "0 0 16px",
              lineHeight: 1,
            }}>
              {t("festa_mamma.preview_word_example")}
            </div>
            <div style={{
              width: 140, height: 140,
              background: "#f0e8e0",
              margin: "0 auto 16px",
              transform: "rotate(-3deg)",
              boxShadow: "0 6px 16px rgba(0,0,0,.1)",
              padding: 8,
              border: "8px solid #fff",
            }}>
              <div style={{ width: "100%", height: "100%", background: "#d8c8c0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }} aria-hidden>👩‍👧</div>
            </div>
            <p style={{ fontSize: 14, color: DEEP, fontStyle: "italic", lineHeight: 1.5, margin: "0 0 12px" }}>
              {t("festa_mamma.preview_memory_example")}
            </p>
            <div style={{ fontSize: 13, color: MUTED, fontStyle: "italic" }}>
              {t("festa_mamma.preview_song_example")}
            </div>
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section style={{ padding: "60px 24px", textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: DEEP, margin: "0 0 12px", letterSpacing: "-.5px" }}>
          {t("festa_mamma.final_title")}
        </h2>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 28px", lineHeight: 1.6 }}>
          {t("festa_mamma.final_subtitle")}
        </p>
        <Link
          href="/festa-mamma/crea"
          style={{
            display: "inline-block",
            background: ACCENT,
            color: "#fff",
            borderRadius: 50,
            padding: "18px 46px",
            fontSize: 17,
            fontWeight: 800,
            textDecoration: "none",
            boxShadow: "0 10px 32px rgba(212,83,126,.35)",
          }}
        >
          {t("festa_mamma.final_cta")}
        </Link>
      </section>

      {/* Footer attribution leggera */}
      <div style={{ padding: "0 24px 40px", textAlign: "center" }}>
        <Link href="/" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>
          {t("festa_mamma.back_home")}
        </Link>
      </div>
    </main>
  );
}
