"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Suspense } from "react";
import { useI18n } from "@/lib/i18n";

function getCookie(name: string) {
  return document.cookie.split("; ").find(r => r.startsWith(name + "="))?.split("=")[1] ?? null;
}

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax; Secure`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function ConfirmInner() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token_hash = params.get("token_hash");
    const type       = params.get("type") as any;
    const next       = params.get("next") ?? "/dashboard";

    if (!token_hash || !type) {
      router.push("/auth/login?error=noparams");
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return document.cookie.split("; ").filter(Boolean).map(c => {
              const [name, ...rest] = c.split("=");
              return { name, value: rest.join("=") };
            });
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
              document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax; Secure`;
            });
          },
        },
      }
    );

    supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
      if (error) {
        router.push("/auth/login?error=" + error.code);
        return;
      }
      // Hard reload per far leggere i cookie al server
      window.location.href = next;
    });
  }, []);

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>{"✨"}</div>
        <p style={{ color:"#888", fontSize:15 }}>{t("auth.signing_in")}</p>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return <Suspense><ConfirmInner/></Suspense>;
}
