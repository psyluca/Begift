"use client";
import { Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import CreateGiftClient from "./CreateGiftClient";

function CreatePageInner() {
  const { t } = useI18n();
  // Uso useAuth invece di getStoredUser diretto: useAuth gestisce
  // il refresh proattivo della session quando il token sta per
  // scadere (entro 5 min). Senza refresh, il vecchio codice vedeva
  // token scaduti come "non loggato" e mostrava il login anche a
  // utenti con session valida (refresh token ancora buono).
  // Questo causava l'incoerenza "TopBar mostra avatar ma /create
  // chiede login" che confondeva gli utenti.
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return (
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

  return <CreateGiftClient userId={user.id ?? ""}/>;
}

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreatePageInner/>
    </Suspense>
  );
}
