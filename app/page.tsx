"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

export default function HomePage() {
  const { t } = useI18n();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Mostra banner solo se non è già PWA installata
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    const dismissed = localStorage.getItem("begift_install_dismissed");
    if (!isStandalone && !dismissed) setShowBanner(true);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const at = params.get("at");
    const rt = params.get("rt");
    if (at && rt) {
      // Rimuovi i token dall'URL
      window.history.replaceState({}, "", "/");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      supabase.auth.setSession({ access_token: decodeURIComponent(at), refresh_token: decodeURIComponent(rt) }).then(({ error }) => {
        if (!error) window.location.href = "/dashboard";
      });
    }
  }, []);
  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      {showBanner && (
        <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", zIndex:50, width:"calc(100% - 32px)", maxWidth:440 }}>
          <div style={{ background:"#1a1a1a", borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 4px 24px #00000040" }}>
            <span style={{ fontSize:24, flexShrink:0 }}>📲</span>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#fff" }}>{t("home.install_banner_title")}</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"rgba(255,255,255,.6)" }}>{t("home.install_banner_subtitle")}</p>
            </div>
            <a href="/install" style={{ background:ACCENT, color:"#fff", borderRadius:20, padding:"7px 14px", fontSize:12, fontWeight:700, textDecoration:"none", flexShrink:0 }}>{t("home.install_banner_cta")}</a>
            <button onClick={()=>{ localStorage.setItem("begift_install_dismissed","1"); setShowBanner(false); }} style={{ background:"none", border:"none", color:"rgba(255,255,255,.5)", fontSize:18, cursor:"pointer", flexShrink:0, padding:0 }}>×</button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px 100px", textAlign: "center" }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>🎁</div>
        <h1 style={{ fontSize: "clamp(32px,8vw,56px)", fontWeight: 800, letterSpacing: "-2px", color: DEEP, margin: "0 0 16px", lineHeight: 1.05 }}>
          {t("home.hero_title")}<br/><span style={{ color: ACCENT }}>{t("home.hero_title_accent")}</span>
        </h1>
        <p style={{ fontSize: 17, color: MUTED, maxWidth: 380, margin: "0 auto 32px", lineHeight: 1.65 }}>
          {t("home.hero_subtitle")}
        </p>
        <Link href="/create" style={{ background: ACCENT, color: "#fff", borderRadius: 50, padding: "16px 42px", fontSize: 16, fontWeight: 700, textDecoration: "none", display: "inline-block", boxShadow: "0 8px 28px #D4537E44" }}>{t("home.cta_create")}</Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, padding: "0 24px 100px", maxWidth: 820, margin: "0 auto" }}>
        {[
          { e: "🎨", tk: "home.feature1_title", dk: "home.feature1_desc" },
          { e: "⚡", tk: "home.feature2_title", dk: "home.feature2_desc" },
          { e: "🔗", tk: "home.feature3_title", dk: "home.feature3_desc" },
          { e: "💝", tk: "home.feature4_title", dk: "home.feature4_desc" },
        ].map(f => (
          <div key={f.tk} style={{ background: "#fff", borderRadius: 18, padding: "22px 18px", boxShadow: "0 2px 14px #0000000a" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{f.e}</div>
            <div style={{ fontWeight: 700, color: DEEP, fontSize: 14, marginBottom: 4 }}>{t(f.tk)}</div>
            <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.55 }}>{t(f.dk)}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
