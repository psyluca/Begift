"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

/**
 * Landing page di BeGift.
 *
 * Obiettivi:
 * 1. Primo impatto emozionale (hero con emoji + claim magia)
 * 2. Ridurre friction/dubbi dei nuovi visitatori ("come funziona?")
 *    con 3 step chiari
 * 3. Mostrare esempi di use-case concreti (template per occasione)
 *    che portano direttamente a /create con query pre-compilata
 * 4. Social proof placeholder (trust)
 * 5. Final CTA chiusa
 *
 * Logica preservata dalla versione originale:
 * - Banner "Installa PWA" sticky (dismissable)
 * - Auth token handling via URL params ?at=&rt= post-OAuth
 */
export default function HomePage() {
  const { t } = useI18n();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Mostra banner solo se non è già PWA installata
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone;
    const dismissed = localStorage.getItem("begift_install_dismissed");
    if (!isStandalone && !dismissed) setShowBanner(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const at = params.get("at");
    const rt = params.get("rt");
    if (at && rt) {
      window.history.replaceState({}, "", "/");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      supabase.auth.setSession({ access_token: decodeURIComponent(at), refresh_token: decodeURIComponent(rt) }).then(({ error }) => {
        if (!error) window.location.href = "/dashboard";
      });
    }

    // Referral tracking: se l'URL contiene ?ref=@handle, salvalo
    // in localStorage + cookie per 30 giorni. Il UsernameOnboarding
    // al primo login (nuovo utente) lo legge e attribuisce via
    // POST /api/profile/referral. Cookie dura 30 gg → finestra di
    // attribuzione ragionevole (Instagram/Facebook usano 28 gg).
    const ref = params.get("ref");
    if (ref && /^@?[a-z0-9_]{3,20}$/i.test(ref)) {
      const normalized = ref.replace(/^@/, "").toLowerCase();
      try {
        localStorage.setItem("begift_ref", normalized);
        const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `begift_ref=${normalized}; path=/; expires=${exp}; SameSite=Lax`;
      } catch { /* ignore */ }
    }
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      {/* Install PWA banner (sticky bottom) */}
      {showBanner && (
        <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", zIndex:50, width:"calc(100% - 32px)", maxWidth:440 }}>
          <div style={{ background:"#1a1a1a", borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 4px 24px #00000040" }}>
            <span style={{ fontSize:24, flexShrink:0 }}>📲</span>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#fff" }}>{t("home.install_banner_title")}</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"rgba(255,255,255,.6)" }}>{t("home.install_banner_subtitle")}</p>
            </div>
            <a href="/install" style={{ background:ACCENT, color:"#fff", borderRadius:20, padding:"7px 14px", fontSize:12, fontWeight:700, textDecoration:"none", flexShrink:0 }}>{t("home.install_banner_cta")}</a>
            <button onClick={()=>{ localStorage.setItem("begift_install_dismissed","1"); setShowBanner(false); }} aria-label="Chiudi" style={{ background:"none", border:"none", color:"rgba(255,255,255,.5)", fontSize:18, cursor:"pointer", flexShrink:0, padding:0 }}>×</button>
          </div>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "40px 24px 60px", textAlign: "center",
      }}>
        <div style={{
          fontSize: 90, marginBottom: 20, lineHeight: 1,
          filter: "drop-shadow(0 12px 32px rgba(212,83,126,.35))",
          animation: "heroFloat 3.2s ease-in-out infinite",
        }}>🎁</div>
        <style>{`
          @keyframes heroFloat {
            0%,100% { transform: translateY(0); }
            50%     { transform: translateY(-8px); }
          }
        `}</style>
        <h1 style={{
          fontSize: "clamp(34px,9vw,60px)", fontWeight: 900,
          letterSpacing: "-2px", color: DEEP, margin: "0 0 18px",
          lineHeight: 1.02,
        }}>
          {t("home.hero_title")}<br/>
          <span style={{ color: ACCENT }}>{t("home.hero_title_accent")}</span>
        </h1>
        {/* Sub con citazione inline valorizzata.
            Il sub i18n contiene {q} come placeholder: splittiamo su
            quello e rendiamo la citazione con italic + colore pieno
            (DEEP contro MUTED del resto) per farla emergere senza
            esagerare. Solo weight 500, niente rosa (il rosa e' gia'
            sull'accent dell'H1). Pattern i18n-friendly: il placeholder
            puo' stare ovunque nella frase, adattandosi alle strutture
            diverse di JA e ZH. */}
        {(() => {
          const parts = t("home.hero_subtitle").split("{q}");
          return (
            <p style={{
              fontSize: 17, color: MUTED, maxWidth: 400,
              margin: "0 auto 32px", lineHeight: 1.65,
            }}>
              {parts[0]}
              <span style={{
                fontStyle: "italic",
                fontWeight: 500,
                color: DEEP,
              }}>
                {t("home.hero_subtitle_quote")}
              </span>
              {parts[1] ?? ""}
            </p>
          );
        })()}
        <Link href="/create" style={{
          background: ACCENT, color: "#fff", borderRadius: 50,
          padding: "16px 42px", fontSize: 16, fontWeight: 700,
          textDecoration: "none", display: "inline-block",
          boxShadow: "0 10px 32px rgba(212,83,126,.35)",
          transition: "transform .15s",
        }}>{t("home.cta_create")}</Link>
      </section>

      {/* ── COME FUNZIONA (3 step) ──────────────────────────── */}
      <section style={{ background: "#fff", padding: "60px 24px 70px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: DEEP, margin: "0 0 8px", letterSpacing: "-.5px" }}>
              {t("home.how_it_works_title")}
            </h2>
            <p style={{ fontSize: 15, color: MUTED, margin: 0 }}>
              {t("home.how_it_works_subtitle")}
            </p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 22,
          }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{
                background: LIGHT, borderRadius: 22,
                padding: "28px 22px 26px",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: -18, left: 22,
                  width: 36, height: 36, borderRadius: "50%",
                  background: ACCENT, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 900,
                  boxShadow: "0 4px 12px rgba(212,83,126,.35)",
                }}>
                  {t(`home.step${n}_num`)}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: DEEP, margin: "10px 0 8px" }}>
                  {t(`home.step${n}_title`)}
                </h3>
                <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.6 }}>
                  {t(`home.step${n}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ESEMPI PER OCCASIONE (deep link a /create) ─────── */}
      <section style={{ padding: "60px 24px 60px", maxWidth: 980, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: DEEP, margin: "0 0 8px", letterSpacing: "-.5px" }}>
            {t("home.examples_title")}
          </h2>
          <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
            {t("home.examples_subtitle")}
          </p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
        }}>
          {[
            { occ: "birthday",    emoji: "🎂", paper: "#E8C84A", ribbon: "#D85A5A" },
            { occ: "anniversary", emoji: "💍", paper: "#E8A0A0", ribbon: "#E8C84A" },
            { occ: "birth",       emoji: "👶", paper: "#F5C6C6", ribbon: "#F8F5ED" },
            { occ: "graduation",  emoji: "🎓", paper: "#1A3A6B", ribbon: "#E8C84A" },
            // "everyday" = template per un pensiero quotidiano, non
            // legato a un'occasione formale. Allineato al nuovo claim
            // della home ("Un regalo ogni volta che pensi a qualcuno").
            { occ: "everyday",    emoji: "💌", paper: "#F5E8D5", ribbon: "#D4537E" },
          ].map((ex) => (
            <Link
              key={ex.occ}
              href={`/create?occasion=${ex.occ}`}
              style={{
                background: "#fff", borderRadius: 18,
                padding: "20px 16px 18px", textAlign: "center",
                textDecoration: "none", color: "inherit",
                border: "1px solid #ede8e0",
                transition: "transform .14s, box-shadow .14s",
                display: "block",
              }}
            >
              <div style={{
                width: 62, height: 62, borderRadius: 12,
                background: `linear-gradient(135deg, ${ex.paper}, ${ex.paper}dd)`,
                margin: "0 auto 12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                boxShadow: "0 4px 12px rgba(0,0,0,.08)",
              }}>
                {/* Nastro orizzontale */}
                <div style={{
                  position: "absolute", left: 0, right: 0, top: "50%",
                  height: 8, background: ex.ribbon,
                  transform: "translateY(-50%)",
                }}/>
                {/* Nastro verticale */}
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: "50%",
                  width: 8, background: ex.ribbon,
                  transform: "translateX(-50%)",
                }}/>
                {/* Fiocchetto emoji sopra */}
                <span style={{ position: "relative", zIndex: 1, fontSize: 26 }}>{ex.emoji}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: DEEP, marginBottom: 4 }}>
                {t(`home.example_${ex.occ}`)}
              </div>
              <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>
                {t("home.example_cta")}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF / TRUST ────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #fff5f8, #ffeef4)",
        borderTop: "1px solid #f9c8d9", borderBottom: "1px solid #f9c8d9",
        padding: "56px 24px",
      }}>
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>💝</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 12px", letterSpacing: "-.3px" }}>
            {t("home.social_proof_title")}
          </h2>
          <p style={{ fontSize: 15, color: "#5a4a50", lineHeight: 1.65, margin: 0 }}>
            {t("home.social_proof_desc")}
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section style={{
        padding: "70px 24px 90px", textAlign: "center",
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: DEEP, margin: "0 0 10px", letterSpacing: "-.5px", lineHeight: 1.15 }}>
          {t("home.final_cta_title")}
        </h2>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 28px", lineHeight: 1.6 }}>
          {t("home.final_cta_desc")}
        </p>
        <Link href="/create" style={{
          background: ACCENT, color: "#fff", borderRadius: 50,
          padding: "17px 46px", fontSize: 17, fontWeight: 800,
          textDecoration: "none", display: "inline-block",
          boxShadow: "0 10px 32px rgba(212,83,126,.4)",
        }}>{t("home.final_cta_button")}</Link>
      </section>

      {/* Footer rimosso: e' presente il componente Footer globale
          renderizzato dal layout root (components/Footer.tsx). Tenere
          due footer sovrapposti causava duplicazione di link legali +
          ridondanza visiva (vedi feedback Luca 2026-04-23). */}
    </main>
  );
}
