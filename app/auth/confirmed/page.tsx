"use client";
import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useI18n } from "@/lib/i18n";
import LangSwitcher from "@/components/LangSwitcher";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

export default function ConfirmedPage() {
  const { t } = useI18n();
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Salva nei cookie — condivisi tra Safari normale e PWA
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `begift_at=${session.access_token}; path=/; expires=${expires}; SameSite=Lax; Secure`;
        document.cookie = `begift_rt=${session.refresh_token}; path=/; expires=${expires}; SameSite=Lax; Secure`;
      }
    });
  }, []);

  return (
    <main style={{ minHeight:"100vh", background:LIGHT, fontFamily:"system-ui,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, textAlign:"center", position:"relative" }}>
      <LangSwitcher style={{ position:"absolute", top:16, right:16 }}/>
      <div style={{ fontSize:64, marginBottom:20 }}>{"✅"}</div>
      <h2 style={{ fontSize:24, fontWeight:800, color:DEEP, margin:"0 0 12px" }}>{t("auth.confirmed_title")}</h2>
      <p style={{ fontSize:15, color:MUTED, lineHeight:1.65, maxWidth:320, margin:"0 0 32px" }}>
        {t("auth.confirmed_desc")}
      </p>
      <div style={{ background:"#fff", borderRadius:20, padding:"20px 24px", maxWidth:340, width:"100%", boxShadow:"0 2px 16px #0000000a", marginBottom:24 }}>
        <div style={{ fontSize:32, marginBottom:8 }}>{"📱"}</div>
        <p style={{ fontSize:13, color:MUTED, margin:0, lineHeight:1.6 }}>
          {t("auth.confirmed_hint", { app: "BeGift" })}
        </p>
      </div>
      <a href="/" style={{ background:ACCENT, color:"#fff", borderRadius:40, padding:"14px 32px", fontSize:15, fontWeight:700, textDecoration:"none" }}>
        {t("auth.open_browser")}
      </a>
    </main>
  );
}
