"use client";
import { useI18n } from "@/lib/i18n";
import { useState, Suspense, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";
import { useFeatureFlag } from "@/lib/featureFlags";
import { createSupabaseOAuthClient } from "@/lib/supabase/client";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

import LangSwitcher from "@/components/LangSwitcher";

function LoginForm() {
  const { t } = useI18n();
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [otp,     setOtp]     = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<"google" | null>(null);
  const refs = useRef<(HTMLInputElement|null)[]>([]);
  const params = useSearchParams();
  const socialLoginEnabled = useFeatureFlag("ENABLE_SOCIAL_LOGIN");

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

  const signInWithGoogle = async () => {
    setSocialLoading("google");
    setError(null);
    const next = params.get("next") ?? "/dashboard";
    // Uses the OAuth client with flowType=implicit (see
    // lib/supabase/client.ts for the rationale). With implicit flow
    // tokens come back in the URL hash, so we point `redirectTo`
    // directly at our client-side /auth/finalize bridge — it lets
    // supabase-js auto-parse the hash + establish the session in
    // localStorage, then forwards to `next`. No server-side code
    // exchange involved.
    const oauth = createSupabaseOAuthClient();
    const { error: err } = await oauth.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/finalize?next=${encodeURIComponent(next)}`,
      },
    });
    if (err) {
      setSocialLoading(null);
      setError(err.message);
    }
    // On success the browser redirects to Google; no need to clear state.
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

      {/* Social login — shown when NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true.
          Google is offered above the email OTP form because it's the
          fastest path (1 tap vs. 30-60s OTP cycle). OTP stays visible
          below as the always-available fallback. */}
      {socialLoginEnabled && (
        <>
          <button
            onClick={signInWithGoogle}
            disabled={socialLoading !== null}
            style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              width:"100%", background:"#fff", color:DEEP,
              border:"1.5px solid #e0dbd5", borderRadius:40, padding:"13px 24px",
              fontSize:15, fontWeight:600, cursor: socialLoading ? "wait" : "pointer",
              marginBottom:12, fontFamily:"inherit",
              transition:"background .15s",
            }}
            onMouseEnter={(e) => { if (!socialLoading) (e.currentTarget as HTMLButtonElement).style.background = "#faf8f5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
          >
            <GoogleGlyph />
            {socialLoading === "google" ? t("auth.connecting") : t("auth.continue_with_google")}
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"10px 0 14px" }}>
            <div style={{ flex:1, height:1, background:"#e0dbd5" }} />
            <span style={{ fontSize:11, color:MUTED, letterSpacing:1, textTransform:"uppercase" }}>
              {t("auth.or")}
            </span>
            <div style={{ flex:1, height:1, background:"#e0dbd5" }} />
          </div>
        </>
      )}

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

/**
 * Google "G" glyph — 4-colour official mark, inlined as SVG so we don't
 * need a network asset. Size tracks the surrounding font size so the
 * button reads balanced.
 */
function GoogleGlyph() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
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
