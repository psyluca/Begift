"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { getStoredUser } from "@/hooks/useAuth";

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
  const pathname  = usePathname();
  const router    = useRouter();
  const { t } = useI18n();
  const [loggedIn,      setLoggedIn]      = useState(false);
  const [checking,      setChecking]      = useState(true);
  const [reactionBadge, setReactionBadge] = useState(0);
  const [giftBadge,     setGiftBadge]     = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const stored = getStoredUser();
    if (stored) {
      setLoggedIn(true);
      setChecking(false);
    } else {
      supabase.auth.getUser().then(({ data }) => {
        setLoggedIn(!!data.user);
        setChecking(false);
      });
    }

    // Badge reazioni — carica dopo aver ottenuto l'utente
    const loadBadges = async () => {
      const authStored = localStorage.getItem("sb-acoettfsxcfpvhjzreoy-auth-token");
      if (!authStored) return;
      let token: string | null = null;
      try { token = JSON.parse(authStored).access_token; } catch(_) {}
      if (!token) return;
      const reactionsSeen = localStorage.getItem("begift_reactions_seen_at") ?? "1970-01-01";
      const res = await fetch(`/api/reactions/count?since=${encodeURIComponent(reactionsSeen)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const d = await res.json();
      setReactionBadge(d.count ?? 0);

      // Badge regali ricevuti
      const giftsSeen = localStorage.getItem("begift_gifts_seen_at") ?? "1970-01-01";
      const res2 = await fetch(`/api/gifts/received-count?since=${encodeURIComponent(giftsSeen)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const d2 = await res2.json();
      setGiftBadge(d2.count ?? 0);
    };
    // Prova subito, poi riprova dopo 1 e 2 secondi se necessario
    loadBadges();
    setTimeout(loadBadges, 1000);
    setTimeout(loadBadges, 2500);

    // Realtime reazioni
    // Salva userId per il filtro realtime
    let currentUserId: string | null = null;
    try {
      const s = localStorage.getItem("sb-acoettfsxcfpvhjzreoy-auth-token");
      if (s) currentUserId = JSON.parse(s).user?.id ?? null;
    } catch(_) {}

    const channel = supabase
      .channel("nav-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reactions" }, async (payload) => {
        // Verifica che la reazione sia per un regalo dell'utente corrente
        if (!currentUserId) return;
        const giftId = (payload.new as any).gift_id;
        const { data } = await supabase.from("gifts").select("creator_id").eq("id", giftId).single();
        if (data?.creator_id === currentUserId) setReactionBadge(b => b + 1);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        if (!currentUserId) return;
        if ((payload.new as any).user_id === currentUserId) setGiftBadge(b => b + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const clearReactionBadge = () => {
    localStorage.setItem("begift_reactions_seen_at", new Date().toISOString());
    setReactionBadge(0);
  };



  const clearGiftBadge = () => {
    localStorage.setItem("begift_gifts_seen_at", new Date().toISOString());
    setGiftBadge(0);
  };

  const handleGiftClick = () => {
    if (checking) return;
    if (loggedIn) { clearGiftBadge(); router.push("/dashboard"); }
    else setShowLoginPrompt(true);
  };

  const handleReactionsClick = () => {
    if (checking) return;
    if (loggedIn) { clearReactionBadge(); router.push("/reactions"); }
    else setShowLoginPrompt(true);
  };

  const items = [
    { id: "home",      label: t("nav.home"),      onClick: () => router.push("/"),             icon: (a: boolean) => <HomeIcon active={a}/>,     active: pathname === "/" },
    { id: "create",    label: t("nav.create"),    onClick: () => router.push("/create"),       icon: (a: boolean) => <PlusIcon active={a}/>,     active: pathname === "/create" },
    { id: "dashboard", label: t("nav.gifts"),     onClick: handleGiftClick,                    icon: (a: boolean) => <GiftIcon active={a}/>,     active: pathname === "/dashboard",  giftBadge: true },
    { id: "reactions", label: t("nav.reactions"), onClick: handleReactionsClick,               icon: (a: boolean) => <BellIcon active={a}/>,     active: pathname === "/reactions",   reactionBadge: true },
    { id: "settings",  label: t("nav.settings"),  onClick: () => router.push("/settings"),     icon: (a: boolean) => <SettingsIcon active={a}/>, active: pathname.startsWith("/settings") },
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
