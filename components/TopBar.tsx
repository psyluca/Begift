"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import LangSwitcher from "@/components/LangSwitcher";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888";

export default function TopBar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const loggedIn = !!user;
  const email = user?.email ?? null;

  // Nascondi sulla pagina regalo (esperienza immersiva)
  if (pathname.startsWith("/gift/")) return null;

  // Su /create mostra solo email+esci, senza logo (la barra di creazione ha il suo)
  const isCreate = pathname === "/create";

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 90,
      background: "rgba(255,255,255,0.96)",
      backdropFilter: "blur(14px)",
      borderBottom: isCreate ? "none" : "0.5px solid #e8e4de",
      padding: isCreate ? "10px 24px" : "14px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: isCreate ? "flex-end" : "space-between",
    }}>
      {!isCreate && (
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: DEEP }}>
            Be<span style={{ color: ACCENT }}>Gift</span>
          </span>
        </a>
      )}

      {loggedIn ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontSize: 13, color: MUTED,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            maxWidth: 180,
          }}>
            {email}
          </span>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <LangSwitcher/>
            <button
              onClick={signOut}
              style={{
                background: "none", border: "1.5px solid #e0dbd5",
                borderRadius: 20, padding: "5px 12px",
                fontSize: 12, cursor: "pointer", color: MUTED,
                whiteSpace: "nowrap",
              }}
            >
                {t("common.sign_out")}
            </button>
          </div>
        </div>
      ) : (
        !isCreate && (
          <a
            href="/auth/login"
            style={{
              background: DEEP, color: "#fff",
              borderRadius: 40, padding: "8px 18px",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}
          >
            {t("auth.sign_in")}
          </a>
        )
      )}
    </div>
  );
}
