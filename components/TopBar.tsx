"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import LangSwitcher from "@/components/LangSwitcher";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888";

export default function TopBar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const loggedIn = !!user;
  const email = user?.email ?? null;

  // Handle univoco dal profilo. Se non ancora settato (= modal
  // onboarding dovrebbe apparire), fallback a email.split. Il
  // listener 'begift:username-set' aggiorna immediatamente la
  // TopBar dopo il submit del modal senza bisogno di reload.
  const [handle, setHandle] = useState<string | null>(null);
  // Flag admin (email in ADMIN_EMAILS env). Solo se true
  // mostriamo il bottoncino 📊 verso /admin/stats. Server-computed
  // via /api/profile/me, quindi il client non vede la lista degli
  // admin (niente leak nel bundle).
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!loggedIn) {
      setHandle(null);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAuthed("/api/profile/me");
        if (!res.ok) return;
        const p = await res.json();
        if (cancelled) return;
        if (p?.username) setHandle(p.username);
        if (p?.is_admin) setIsAdmin(true);
      } catch { /* ignore */ }
    })();
    const onSet = (e: Event) => {
      const u = (e as CustomEvent<{ username: string }>).detail?.username;
      if (u) setHandle(u);
    };
    window.addEventListener("begift:username-set", onSet);
    return () => { cancelled = true; window.removeEventListener("begift:username-set", onSet); };
  }, [loggedIn]);

  // Stringa da mostrare: preferisci @handle se impostato, altrimenti
  // fallback troncato dell'email (caso transitorio pre-onboarding).
  const displayName = handle
    ? `@${handle.length > 14 ? handle.slice(0, 14) + "…" : handle}`
    : email
    ? (() => {
        const u = email.split("@")[0];
        return u.length > 14 ? u.slice(0, 14) + "…" : u;
      })()
    : null;
  const avatarLetter = (handle?.[0] ?? email?.[0] ?? "?").toUpperCase();

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
      // iOS PWA: rispetta safe-area (notch + rounded corner) sul
      // padding laterale del wrapper sticky. Senza questo, su
      // iPhone installato come PWA il bottone Esci finiva a metà
      // fuori dal bordo curvo dello schermo.
      paddingLeft: "env(safe-area-inset-left, 0px)",
      paddingRight: "env(safe-area-inset-right, 0px)",
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
            {/* Bottone 📊 admin-only (email in ADMIN_EMAILS env):
                shortcut verso /admin/stats, visibile solo a chi
                è admin. Server-computed via /api/profile/me. */}
            {isAdmin && (
              <a
                href="/admin/stats"
                title="Admin stats"
                aria-label="Admin stats"
                style={{
                  background: "transparent",
                  border: "1.5px solid #e0dbd5",
                  borderRadius: 20,
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, textDecoration: "none",
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                📊
              </a>
            )}
            {/* Avatar circolare con iniziale — sempre visibile (anche
                su mobile) così l'utente ha conferma visiva di essere
                loggato. Il title attribute mostra l'email completa
                al long-press / hover, utile per chi ha più account. */}
            {/* Avatar + handle cliccabili → /settings/profile per
                modificare lo username. */}
            <a
              href="/settings/profile"
              title={email ?? undefined}
              aria-label={email ? `Loggato come ${handle ? "@" + handle : email}` : "Loggato"}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
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
                {avatarLetter}
              </div>
              {displayName && (
                <span style={{
                  fontSize: 13, color: DEEP, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  maxWidth: 140,
                }}>
                  {displayName}
                </span>
              )}
            </a>
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
