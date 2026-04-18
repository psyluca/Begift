"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    const consent = localStorage.getItem("begift_cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("begift_cookie_consent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;
  if (pathname.startsWith("/auth/")) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .cookie-banner{animation:slideUp .4s cubic-bezier(.34,1.56,.64,1)}
      `}</style>
      <div
        className="cookie-banner"
        style={{
          position: "fixed", bottom: 72, left: 12, right: 12, zIndex: 150,
          background: "#fff",
          borderRadius: 20,
          padding: "18px 20px",
          boxShadow: "0 8px 32px #00000018",
          border: "1px solid #e8e4de",
          maxWidth: 480,
          margin: "0 auto",
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <div style={{ fontSize: 24, flexShrink: 0 }}>🍪</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: DEEP, fontWeight: 700, margin: "0 0 4px" }}>
            {t("cookie.title")}
          </p>
          <p style={{ fontSize: 12, color: MUTED, margin: "0 0 12px", lineHeight: 1.55 }}>
            {t("cookie.description")}{" "}
            <Link href="/privacy" style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}>
              {t("cookie.privacy_policy")}
            </Link>
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={accept}
              style={{
                background: ACCENT, color: "#fff",
                border: "none", borderRadius: 40,
                padding: "8px 20px", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("cookie.accept")}
            </button>
            <Link
              href="/privacy"
              style={{
                background: "none", color: MUTED,
                border: "1.5px solid #e0dbd5", borderRadius: 40,
                padding: "8px 16px", fontSize: 12, fontWeight: 600,
                cursor: "pointer", textDecoration: "none",
                display: "flex", alignItems: "center",
              }}
            >
              {t("cookie.learn_more")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
