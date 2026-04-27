"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { track } from "@/lib/analytics";
import { SeasonalBanner } from "@/components/SeasonalBanner";

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
        track("referral_landing", { ref: normalized });
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
        {/* Beta badge sopra al claim: comunica posizionamento prudente
            (servizio in evoluzione) e abbassa l'aspettativa legale degli
            utenti early adopters. Pre-launch & primi mesi del lancio. */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(212,83,126,.10)",
          border: `1px solid ${ACCENT}33`,
          color: ACCENT,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          borderRadius: 999,
          padding: "5px 12px",
          marginBottom: 14,
        }}>
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, display: "inline-block" }}/>
          Beta pubblica
        </div>
        <h1 style={{
          fontSize: "clamp(34px,9vw,60px)", fontWeight: 900,
          letterSpacing: "-2px", color: DEEP, margin: "0 0 18px",
          lineHeight: 1.02,
        }}>
          {t("home.hero_title")}<br/>
          <span style={{ color: ACCENT }}>{t("home.hero_title_accent")}</span>
        </h1>
        {/* Sub principale (no quote inline).
            Il quote "ti penso, ora" e' renderizzato sotto come blocco
            autonomo su una sola riga: cosi' resta intero senza wrap a
            meta' (es. "ti penso," / "ora" che spezza la cadenza). */}
        <p style={{
          fontSize: 17, color: MUTED, maxWidth: 420,
          margin: "0 auto 12px", lineHeight: 1.65,
        }}>
          {t("home.hero_subtitle")}
        </p>
        {/* Tagline quote: italic, weight 500, color DEEP per emergere
            sopra il MUTED del sub. white-space: nowrap garantisce che
            la frase resti intera anche su mobile stretto; il font-size
            in clamp riduce automaticamente se non sta in larghezza. */}
        <p style={{
          fontSize: "clamp(15px, 4.2vw, 19px)",
          fontStyle: "italic",
          fontWeight: 500,
          color: DEEP,
          margin: "0 auto 32px",
          whiteSpace: "nowrap",
          letterSpacing: "-0.2px",
        }}>
          {t("home.hero_subtitle_quote")}
        </p>
        <Link href="/create" style={{
          background: ACCENT, color: "#fff", borderRadius: 50,
          padding: "16px 42px", fontSize: 16, fontWeight: 700,
          textDecoration: "none", display: "inline-block",
          boxShadow: "0 10px 32px rgba(212,83,126,.35)",
          transition: "transform .15s",
        }}>{t("home.cta_create")}</Link>
        {/* Disclaimer "beta": il servizio e' lanciato come anteprima
            pubblica. Riduce le aspettative implicite e rende esplicito
            che il prodotto puo' evolvere — utile sia legalmente sia
            come patto di onesta' con gli early users. */}
        <p style={{
          marginTop: 14, fontSize: 11.5, color: MUTED,
          maxWidth: 360, marginLeft: "auto", marginRight: "auto",
          lineHeight: 1.5,
        }}>
          Servizio in beta pubblica · funzionalità in evoluzione · gratis durante la beta
        </p>
      </section>

      {/* ── BANNER STAGIONALE ───────────────────────────────────
          Si auto-mostra solo nella finestra di una festivita' attiva
          (es. 14 giorni prima di Festa della Mamma o del Papa').
          Fuori dalla finestra ritorna null e non occupa spazio. */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>
        <SeasonalBanner variant="spacious" />
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
          {(() => {
            // Tile dinamica per occasioni stagionali in finestra di
            // notice. Identica logica del SeasonalBanner ma renderizzata
            // come tile con priorita' visiva (badge urgenza). Fuori
            // finestra la tile non compare e si vedono solo gli
            // evergreen sotto.
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const seasonal = [
              { occ: "mothers_day", month: 5, day: 11, label: "Festa della Mamma", emoji: "💐", paper: "#F4DCD8", ribbon: "#D4537E", href: "/festa-mamma", noticeWindow: 28 },
              { occ: "fathers_day", month: 3, day: 19, label: "Festa del Papà",   emoji: "🌳", paper: "#E8DCC4", ribbon: "#5C7A4A", href: "/festa-papa",  noticeWindow: 28 },
            ];
            const active = seasonal.find((s) => {
              const target = new Date(now.getFullYear(), s.month - 1, s.day);
              const days = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return days >= 0 && days <= s.noticeWindow;
            });
            const evergreen = [
              { occ: "birthday",    emoji: "🎂", paper: "#E8C84A", ribbon: "#D85A5A" },
              { occ: "anniversary", emoji: "💍", paper: "#E8A0A0", ribbon: "#E8C84A" },
              { occ: "birth",       emoji: "👶", paper: "#F5C6C6", ribbon: "#F8F5ED" },
              { occ: "graduation",  emoji: "🎓", paper: "#1A3A6B", ribbon: "#E8C84A" },
              { occ: "name_day",    emoji: "🎊", paper: "#C9B6E8", ribbon: "#E8C84A" },
              { occ: "everyday",    emoji: "💌", paper: "#F5E8D5", ribbon: "#D4537E" },
            ];

            const tiles: { href: string; emoji: string; paper: string; ribbon: string; label: string; isSeasonal?: boolean; daysLeft?: number }[] = [];
            if (active) {
              const target = new Date(now.getFullYear(), active.month - 1, active.day);
              const days = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              tiles.push({
                href: active.href,
                emoji: active.emoji,
                paper: active.paper,
                ribbon: active.ribbon,
                label: active.label,
                isSeasonal: true,
                daysLeft: days,
              });
            }
            for (const ex of evergreen) {
              tiles.push({
                href: `/create?occasion=${ex.occ}`,
                emoji: ex.emoji,
                paper: ex.paper,
                ribbon: ex.ribbon,
                label: t(`home.example_${ex.occ}`),
              });
            }

            return tiles.map((tile, idx) => (
              <Link
                key={`${tile.label}-${idx}`}
                href={tile.href}
                style={{
                  background: "#fff", borderRadius: 18,
                  padding: "20px 16px 18px", textAlign: "center",
                  textDecoration: "none", color: "inherit",
                  border: tile.isSeasonal ? `2px solid ${ACCENT}` : "1px solid #ede8e0",
                  transition: "transform .14s, box-shadow .14s",
                  display: "block",
                  position: "relative",
                  boxShadow: tile.isSeasonal ? "0 6px 22px rgba(212,83,126,.18)" : undefined,
                }}
              >
                {/* Badge urgenza solo sulla tile stagionale */}
                {tile.isSeasonal && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    background: ACCENT, color: "#fff",
                    fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.05em", borderRadius: 20, padding: "2px 7px",
                  }}>
                    {tile.daysLeft === 0 ? "Oggi!" : tile.daysLeft === 1 ? "Domani" : `Tra ${tile.daysLeft}gg`}
                  </div>
                )}
                <div style={{
                  width: 62, height: 62, borderRadius: 12,
                  background: `linear-gradient(135deg, ${tile.paper}, ${tile.paper}dd)`,
                  margin: "0 auto 12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                }}>
                  <div style={{
                    position: "absolute", left: 0, right: 0, top: "50%",
                    height: 8, background: tile.ribbon,
                    transform: "translateY(-50%)",
                  }}/>
                  <div style={{
                    position: "absolute", top: 0, bottom: 0, left: "50%",
                    width: 8, background: tile.ribbon,
                    transform: "translateX(-50%)",
                  }}/>
                  <span style={{ position: "relative", zIndex: 1, fontSize: 26 }}>{tile.emoji}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: DEEP, marginBottom: 4 }}>
                  {tile.label}
                </div>
                <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>
                  {t("home.example_cta")}
                </div>
              </Link>
            ));
          })()}
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
