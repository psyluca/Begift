"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useBadges } from "@/hooks/useBadges";

const ACCENT = "#D4537E";
const DEEP   = "#1a1a1a";
const MUTED  = "#aaa";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  );
}

function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}

function GiftIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="14" rx="2"/>
      <path d="M12 8V22"/>
      <path d="M3 13h18"/>
      <path d="M8 8c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
      <path d="M8 8c0-2.2-1.8-4-4-4 0 2.2 1.8 4 4 4z"/>
      <path d="M16 8c0-2.2 1.8-4 4-4 0 2.2-1.8 4-4 4z"/>
    </svg>
  );
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}

/** Calendario con un piccolo cuore: ricorrenze affettive (compleanni,
 *  anniversari, onomastici). Distinto da Bell (reactions) e da Gift. */
function CalendarHeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M8 3v4"/>
      <path d="M16 3v4"/>
      <path d="M3 10h18"/>
      <path d="M12 17.5l-2.4-2.5a1.5 1.5 0 112.4-1.8 1.5 1.5 0 112.4 1.8L12 17.5z" fill={active ? ACCENT : "none"}/>
    </svg>
  );
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="badge-pop" style={{
      position: "absolute", top: -5, right: -7,
      background: ACCENT, color: "#fff",
      borderRadius: "50%", minWidth: 18, height: 18,
      fontSize: 10, fontWeight: 800,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 4px", border: "2px solid #fff", lineHeight: 1,
    }}>
      {count > 99 ? "99+" : count}
    </div>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Tutto il sistema badge e' centralizzato in useBadges (hooks/useBadges.ts).
  // Vedere quel file per dettagli su lifecycle, realtime, polling, e come
  // i timestamp "seen_at" vengono salvati per-user (non globali).
  const {
    giftBadge,
    reactionBadge,
    ready,
    loggedIn,
    clearGiftBadge,
    clearReactionBadge,
  } = useBadges();

  const handleGiftClick = () => {
    if (!ready) return;
    if (loggedIn) {
      clearGiftBadge();
      router.push("/dashboard");
    } else {
      setShowLoginPrompt(true);
    }
  };

  const handleReactionsClick = () => {
    if (!ready) return;
    if (loggedIn) {
      clearReactionBadge();
      router.push("/reactions");
    } else {
      setShowLoginPrompt(true);
    }
  };

  // Bottom nav refresh 2026-04-27: "Settings" rimosso dal primo livello
  // (resta accessibile tappando il proprio handle/avatar in TopBar) e
  // sostituito da "Ricorrenze". Le ricorrenze sono il vero motore di
  // retention per un'app di regali — meritano un tab dedicato. Settings
  // e' configurazione, non flusso quotidiano.
  // Voce SettingsIcon resta importata per uso futuro / TopBar; non
  // viene piu' renderizzata qui.
  void SettingsIcon;
  const items = [
    { id: "home",       label: t("nav.home"),                onClick: () => router.push("/"),            icon: (a: boolean) => <HomeIcon active={a}/>,           active: pathname === "/" },
    { id: "create",     label: t("nav.create"),              onClick: () => router.push("/create"),      icon: (a: boolean) => <PlusIcon active={a}/>,           active: pathname === "/create" },
    { id: "dashboard",  label: t("nav.gifts"),               onClick: handleGiftClick,                   icon: (a: boolean) => <GiftIcon active={a}/>,           active: pathname === "/dashboard",   giftBadge: true },
    { id: "reactions",  label: t("nav.reactions"),           onClick: handleReactionsClick,              icon: (a: boolean) => <BellIcon active={a}/>,           active: pathname === "/reactions",   reactionBadge: true },
    { id: "ricorrenze", label: t("nav.reminders"),  onClick: () => router.push("/ricorrenze"),  icon: (a: boolean) => <CalendarHeartIcon active={a}/>,  active: pathname.startsWith("/ricorrenze") },
  ];

  return (
    <>
      <style>{`
        @keyframes badgePop{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
        .badge-pop{animation:badgePop .35s cubic-bezier(.34,1.56,.64,1)}
        @keyframes promptUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .prompt-up{animation:promptUp .3s cubic-bezier(.34,1.56,.64,1)}
      `}</style>

      {showLoginPrompt && (
        <div onClick={() => setShowLoginPrompt(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:200, display:"flex", alignItems:"flex-end" }}>
          <div className="prompt-up" onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"28px 24px 48px", width:"100%", maxWidth:480, margin:"0 auto", textAlign:"center" }}>
            <div style={{ width:36, height:4, borderRadius:2, background:"#e0dbd5", margin:"0 auto 20px" }}/>
            <div style={{ fontSize:40, marginBottom:12 }}>🎁</div>
            <h3 style={{ fontSize:20, fontWeight:800, color:DEEP, margin:"0 0 8px" }}>{t("login_prompt.title")}</h3>
            <p style={{ fontSize:14, color:MUTED, lineHeight:1.6, margin:"0 0 24px" }}>
              {t("login_prompt.description")}
            </p>
            <a href="/auth/login" style={{ display:"block", background:ACCENT, color:"#fff", borderRadius:40, padding:"15px 24px", fontSize:15, fontWeight:700, textDecoration:"none", marginBottom:10 }}>
              {t("auth.sign_in_magic")}
            </a>
            <button onClick={() => setShowLoginPrompt(false)} style={{ background:"transparent", border:"none", color:MUTED, fontSize:13, cursor:"pointer", padding:"8px" }}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      <nav style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100, background:"rgba(255,255,255,0.96)", backdropFilter:"blur(14px)", borderTop:"0.5px solid #e8e4de", display:"flex", paddingBottom:"env(safe-area-inset-bottom, 0px)" }}>
        {items.map(item => (
          <button key={item.id} onClick={item.onClick} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, padding:"10px 4px 11px", background:"none", border:"none", cursor:"pointer", position:"relative" }}>
            <div style={{ position:"relative", display:"inline-flex" }}>
              {item.icon(item.active)}
              {(item as any).giftBadge     && <Badge count={giftBadge}/>}
              {(item as any).reactionBadge && <Badge count={reactionBadge}/>}
            </div>
            <span style={{ fontSize:10, fontWeight:item.active?700:500, color:item.active?ACCENT:MUTED, letterSpacing:".02em" }}>
              {item.label}
            </span>
            {item.active && <div style={{ position:"absolute", bottom:0, width:28, height:2, borderRadius:2, background:ACCENT }}/>}
          </button>
        ))}
      </nav>
    </>
  );
}
