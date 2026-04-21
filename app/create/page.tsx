"use client";
import { useEffect, useState, Suspense } from "react";
import { getStoredUser } from "@/hooks/useAuth";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import CreateGiftClient from "./CreateGiftClient";

function CreatePageInner() {
  const { t } = useI18n();
  const [checked, setChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setLoggedIn(true);
      setChecked(true);
    } else {
      const supabase = createSupabaseClient();
      supabase.auth.getUser().then(({ data }) => {
        setLoggedIn(!!data.user);
        setChecked(true);
      });
    }
  }, []);

  if (!checked) return null;

  if (!loggedIn) return (
    <main style={{ minHeight:"100vh", background:"#f7f5f2", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, textAlign:"center", fontFamily:"system-ui,sans-serif", position:"relative" }}>
      <div style={{ fontSize:52, marginBottom:16 }}>🎁</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:"#1a1a1a", margin:"0 0 8px" }}>{t("create.login_title")}</h2>
      <p style={{ fontSize:14, color:"#888", lineHeight:1.6, maxWidth:320, margin:"0 0 24px" }}>
        {t("create.login_desc")}
      </p>
      <a href="/auth/login?next=/create" style={{ background:"#D4537E", color:"#fff", borderRadius:40, padding:"15px 32px", fontSize:15, fontWeight:700, textDecoration:"none", display:"inline-block", marginBottom:10 }}>
        {t("auth.sign_in_magic")}
      </a>
      <p style={{ fontSize:12, color:"#bbb", margin:0 }}>{t("auth.no_password")}</p>
    </main>
  );

  return <CreateGiftClient userId=""/>;
}

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreatePageInner/>
    </Suspense>
  );
}
