"use client";

/**
 * InviteFriendWidget
 *
 * Card mostrata nella dashboard che permette a un utente loggato di
 * invitare amici su BeGift. Costruisce un link del tipo:
 *   https://begift.app/?ref=@handle
 * che, quando visitato, salva l'handle in localStorage+cookie (vedi
 * app/page.tsx). Al primo login del nuovo utente, l'attribuzione
 * avviene via POST /api/profile/referral (chiamato da
 * UsernameOnboarding).
 *
 * UX:
 *  - Bottone "Copia link" che copia l'URL negli appunti
 *  - Bottone "WhatsApp" che apre wa.me con messaggio precompilato
 *  - Nessun tracking incentive visibile lato utente (per ora):
 *    l'obiettivo della v1 è misurare il viralità coefficient K,
 *    non premiare. Gli incentivi arriveranno in Fase 3 (wallet).
 *
 * Il componente si auto-nasconde se il profilo non ha ancora uno
 * username impostato (UsernameOnboarding modal si occuperà di
 * richiederlo).
 */

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";

export function InviteFriendWidget() {
  const { t } = useI18n();
  const [handle, setHandle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAuthed("/api/profile/me");
        if (!res.ok) return;
        const p = await res.json();
        if (cancelled) return;
        if (p?.username) setHandle(p.username);
      } catch { /* ignore */ }
    })();
    const onSet = (e: Event) => {
      const u = (e as CustomEvent<{ username: string }>).detail?.username;
      if (u) setHandle(u);
    };
    window.addEventListener("begift:username-set", onSet);
    return () => { cancelled = true; window.removeEventListener("begift:username-set", onSet); };
  }, []);

  // Se non c'è ancora uno handle, non mostriamo il widget: altrimenti
  // l'utente vedrebbe un link rotto o vuoto.
  if (!handle) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://begift.app";
  const link = `${origin}/?ref=@${handle}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: niente clipboard API (es. browser molto vecchio).
      // Selezioniamo il testo in un input invisibile e document.execCommand.
      try {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* ignore */ }
    }
  };

  const shareWhatsApp = () => {
    const msg = t("invite.wa_message", { link });
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #fff5f8 0%, #fff 100%)",
      border: "1.5px solid #fadce7",
      borderRadius: 16,
      padding: 16,
      margin: "10px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }} aria-hidden>🎁</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: DEEP }}>
            {t("invite.title")}
          </div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>
            {t("invite.subtitle")}
          </div>
        </div>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#fff",
        border: "1px solid #eadfd5",
        borderRadius: 10,
        padding: "8px 10px",
        marginBottom: 10,
        overflow: "hidden",
      }}>
        <code style={{
          fontSize: 12,
          color: DEEP,
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
        }}>{link}</code>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={copy}
          style={{
            flex: "1 1 120px",
            background: copied ? "#3CB371" : ACCENT,
            color: "#fff",
            border: "none",
            borderRadius: 20,
            padding: "9px 14px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all .2s",
          }}
        >
          {copied ? t("invite.copied") : t("invite.copy")}
        </button>
        <button
          onClick={shareWhatsApp}
          style={{
            flex: "1 1 120px",
            background: "#25D366",
            color: "#fff",
            border: "none",
            borderRadius: 20,
            padding: "9px 14px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span aria-hidden>📱</span>
          {t("invite.whatsapp")}
        </button>
      </div>
    </div>
  );
}
