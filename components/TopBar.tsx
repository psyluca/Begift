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
  // Username derivato dall'email: "psyluca@gmail.com" → "psyluca".
  // Troncato a 14 char per non crescere troppo su mobile stretto.
  // Quando introdurremo il campo `username` univoco su profiles,
  // userà quello in preferenza all'email split.
  const username = email
    ? (() => {
        const u = email.split("@")[0];
        return u.length > 14 ? u.slice(0, 14) + "…" : u;
      })()
    : null;

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
    }}>
      {/* Inner wrapper con maxWidth coerente col body (640px) così
          logo/lingua/esci sono allineati al riquadro centrale sotto
          invece di attaccarsi ai bordi del viewport su desktop. */}
      <div style={{
        maxWidth: 640, margin: "0 auto",
        padding: isCreate ? "10px 16px" : "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: isCreate ? "flex-end" : "space-between",
        gap: 8,
      }}>
      {!isCreate && (
        <a href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: DEEP }}>
            Be<span style={{ color: ACCENT }}>Gift</span>
          </span>
        </a>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {/* Il selezionatore di lingua è sempre visibile, anche ai visitatori anonimi */}
        <LangSwitcher/>

        {loggedIn ? (
          <>
            {/* Avatar circolare con iniziale — sempre visibile (anche
                su mobile) così l'utente ha conferma visiva di essere
                loggato. Il title attribute mostra l'email completa
                al long-press / hover, utile per chi ha più account. */}
            <div
              title={email ?? undefined}
              aria-label={email ? `Loggato come ${email}` : "Loggato"}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: ACCENT, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                flexShrink: 0,
                textTransform: "uppercase",
                letterSpacing: 0,
                lineHeight: 1,
              }}
            >
              {email?.[0] || "?"}
            </div>
            {/* Username compatto (parte prima di @): visibile SEMPRE,
                anche su mobile, così si capisce sempre con quale
                account si è loggati. Troncato a 14 caratteri. */}
            {username && (
              <span style={{
                fontSize: 13, color: DEEP, fontWeight: 600,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                maxWidth: 120,
              }}>
                {username}
              </span>
            )}
            <button
              onClick={signOut}
              style={{
                background: "none", border: "1.5px solid #e0dbd5",
                borderRadius: 20, padding: "5px 12px",
                fontSize: 12, cursor: "pointer", color: MUTED,
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {t("common.sign_out")}
            </button>
          </>
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
      </div>
    </div>
  );
}
