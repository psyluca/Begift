"use client";
import { useI18n } from "@/lib/i18n";
import { useState, Suspense, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

import LangSwitcher from "@/components/LangSwitcher";

function LoginForm() {
  const { t } = useI18n();
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [otp,     setOtp]     = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement|null)[]>([]);
  const params = useSearchParams();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "sb-acoettfsxcfpvhjzreoy-auth-token",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      }
    }
  );

  const sendOtp = async () => {
    if (!email.trim()) return;
    setLoading(true); setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined,
      },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  const handleOtpChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[i] = v; setOtp(next);
    if (v && i < 5) refs.current[i+1]?.focus();
    if (!v && i > 0) refs.current[i-1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (text.length === 6) {
      setOtp(text.split(""));
      refs.current[5]?.focus();
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setLoading(true); setError(null);
    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "email",
    });
    setLoading(false);
    if (err) { setError(t("auth.wrong_code")); return; }
    // Salva la sessione nei cookie per il server
    if (data.session) {
      const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; expires=${exp}; SameSite=Lax; Secure`;
      document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; expires=${exp}; SameSite=Lax; Secure`;
    }
    const next = params.get("next") ?? "/dashboard";
    if (data.session) {
      // Salva sessione manualmente nel localStorage
      const projectRef = "acoettfsxcfpvhjzreoy";
      const storageKey = `sb-${projectRef}-auth-token`;
      const sessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: data.session.expires_at,
        user: data.session.user,
      };
      localStorage.setItem(storageKey, JSON.stringify(sessionData));
      // Salva anche nei cookie per il server
      const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; expires=${exp}; SameSite=Lax`;
      document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; expires=${exp}; SameSite=Lax`;
    }
    window.location.href = next;
  };

  if (sent) return (
    <div style={{ maxWidth:400, width:"100%" }}>
      <LangSwitcher style={{ justifyContent:"center", marginBottom:20 }}/>
    <div style={{ background:"#fff", borderRadius:24, padding:"40px 32px", width:"100%", boxShadow:"0 4px 32px rgba(0,0,0,0.08)", textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:12 }}>📬</div>
      <h2 style={{ fontSize:20, fontWeight:700, margin:"0 0 8px", color:DEEP }}>{t("auth.check_email")}</h2>
      <p style={{ fontSize:14, color:MUTED, lineHeight:1.6, margin:"0 0 24px" }}>
        {t("auth.code_sent_to")} <strong style={{color:DEEP}}>{email}</strong>
      </p>
      <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:20 }} onPaste={handlePaste}>
        {otp.map((v, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => {
              if (e.key === "Backspace" && !v && i > 0) refs.current[i-1]?.focus();
              if (e.key === "Enter") verifyOtp();
            }}
            style={{
              width:44, height:52, textAlign:"center", fontSize:24, fontWeight:700,
              border:`2px solid ${v ? ACCENT : "#e0dbd5"}`, borderRadius:12,
              outline:"none", color:DEEP, fontFamily:"monospace",
              background: v ? "#fff5f8" : "#fff",
              transition:"all .15s",
            }}
          />
        ))}
      </div>
      {error && <p style={{ color:"#E24B4A", fontSize:13, margin:"0 0 12px" }}>{error}</p>}
      <button
        onClick={verifyOtp}
        disabled={loading || otp.join("").length !== 6}
        style={{ display:"block", width:"100%", background:otp.join("").length===6?ACCENT:"#e0dbd5", color:"#fff", border:"none", borderRadius:40, padding:"14px", fontSize:15, fontWeight:700, cursor:otp.join("").length===6?"pointer":"not-allowed", marginBottom:14, transition:"background .2s" }}
      >
        {loading ? t("auth.verifying") : t("auth.verify")}
      </button>
      <button
        onClick={() => { setSent(false); setOtp(["","","","","",""]); setError(null); }}
        style={{ background:"transparent", color:MUTED, border:"1.5px solid #e0dbd5", borderRadius:40, padding:"10px 24px", fontSize:13, cursor:"pointer" }}
      >
        {t("auth.use_another_email")}
      </button>
    </div>
    </div>
  );

  return (
    <div style={{ maxWidth:400, width:"100%" }}>
      <LangSwitcher style={{ justifyContent:"center", marginBottom:20 }}/>
    <div style={{ background:"#fff", borderRadius:24, padding:"48px 36px", width:"100%", boxShadow:"0 4px 32px rgba(0,0,0,0.08)", textAlign:"center" }}>
      <h1 style={{ fontSize:32, fontWeight:800, margin:"0 0 8px", color:DEEP }}>Be<span style={{ color:ACCENT }}>Gift</span></h1>
      <h2 style={{ fontSize:20, fontWeight:700, margin:"0 0 8px", color:DEEP }}>{t("auth.title")}</h2>
      <p style={{ fontSize:14, color:MUTED, lineHeight:1.6, margin:"0 0 24px" }}>{t("auth.subtitle")}</p>
      <input type="email" placeholder={t("auth.email_placeholder")} value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === "Enter" && sendOtp()}
        style={{ width:"100%", padding:"13px 15px", fontSize:15, border:"1.5px solid #e0dbd5", borderRadius:11, outline:"none", boxSizing:"border-box", marginBottom:14, color:DEEP, fontFamily:"inherit" }}/>
      {error && <p style={{ color:"#E24B4A", fontSize:13, margin:"0 0 10px" }}>{error}</p>}
      <button onClick={sendOtp} disabled={loading}
        style={{ display:"block", width:"100%", background:ACCENT, color:"#fff", border:"none", borderRadius:40, padding:"15px 24px", fontSize:15, fontWeight:700, cursor:"pointer" }}>
        {loading ? t("auth.sending") : t("auth.send_code")}
      </button>
    </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useI18n();
  return (
    <main style={{ minHeight:"100vh", background:LIGHT, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"system-ui,sans-serif" }}>
      <Suspense fallback={<div>{t("common.loading")}</div>}>
        <LoginForm/>
      </Suspense>
    </main>
  );
}
