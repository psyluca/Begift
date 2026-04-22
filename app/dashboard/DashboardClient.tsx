"use client";
import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import GiftSVG from "@/components/GiftSVG";
import { createBrowserClient } from "@supabase/ssr";
import { createSupabaseClient, getSessionUser } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Gift, Reaction } from "@/types";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { PushPermissionCard } from "@/components/PushPermissionCard";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

function adj(hex: string, amt: number) {
  try {
    const n = parseInt(hex.replace("#",""),16);
    const c = (v:number) => Math.min(255,Math.max(0,v+Math.round(255*amt)));
    const r=c(n>>16),g=c((n>>8)&255),b=c(n&255);
    return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
  } catch { return hex; }
}

function GiftMini({ gift }: { gift: Gift }) {
  const pkg = gift.packaging;
  return (
    <div style={{width:52,height:57,flexShrink:0}}>
      <GiftSVG
        paper={pkg?.paperColor||"#D85A5A"}
        ribbon={pkg?.ribbonColor||"#E8C84A"}
        bow={pkg?.bowColor||"#E8C84A"}
        bowType={pkg?.bowType||"classic"}
        theme={(pkg as any)?.theme||"standard"}
        animated={false}
      />
    </div>
  );
}

interface GiftWithReactions extends Gift { reactions?: Reaction[]; }

export default function DashboardClient({ user: initialUser, initialSentGifts, initialReceivedGifts }: {
  user: User | null;
  initialSentGifts: GiftWithReactions[];
  initialReceivedGifts: GiftWithReactions[];
}) {
  const [user,     setUser]     = useState(initialUser);
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef<number>(0);
  const [gifts,    setGifts]    = useState<GiftWithReactions[]>(initialSentGifts);
  const [received, setReceived] = useState<GiftWithReactions[]>(initialReceivedGifts);
  const [tab, setTab] = useState<"sent"|"received">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") === "received" ? "received" : "sent";
    }
    return "sent";
  });
  const [deleting, setDeleting] = useState<string|null>(null);
  const [copied,   setCopied]   = useState<string|null>(null);

  // Multi-select state
  const [selecting,     setSelecting]     = useState(false);
  const [selectedSent,  setSelectedSent]  = useState<Set<string>>(new Set());
  const [selectedRecv,  setSelectedRecv]  = useState<Set<string>>(new Set());
  const [bulkDeleting,  setBulkDeleting]  = useState(false);

  const selected    = tab === "sent" ? selectedSent  : selectedRecv;
  const setSelected = tab === "sent" ? setSelectedSent : setSelectedRecv;
  const currentList = tab === "sent" ? gifts : received;

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === currentList.length) setSelected(new Set());
    else setSelected(new Set(currentList.map(g => g.id)));
  };

  const cancelSelect = () => {
    setSelecting(false);
    setSelectedSent(new Set());
    setSelectedRecv(new Set());
  };

  const sb = createBrowserClient(
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

  const deleteSelectedBulk = async () => {
    const ids = Array.from(selected);
    if (!confirm(t("dashboard.confirm_delete_bulk", { count: String(ids.length), label: ids.length === 1 ? t("dashboard.gift_singular") : t("dashboard.gift_plural") }))) return;
    setBulkDeleting(true);

    if (tab === "sent") {
      const { data } = await sb.auth.refreshSession();
      const token = data.session?.access_token ?? "";
      await Promise.all(ids.map(id =>
        fetch(`/api/gifts/${id}`, {
          method: "DELETE",
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
        })
      ));
      setGifts(prev => prev.filter(g => !ids.includes(g.id)));
      setSelectedSent(new Set());
    } else {
      const { data: userData } = await sb.auth.getUser();
      if (userData.user) {
        await sb.from("gift_opens").delete().in("gift_id", ids).eq("user_id", userData.user.id);
        await sb.from("notifications").delete().in("gift_id", ids).eq("user_id", userData.user.id);
      }
      setReceived(prev => prev.filter(g => !ids.includes(g.id)));
      setSelectedRecv(new Set());
    }

    setBulkDeleting(false);
    if (selectedSent.size === 0 && selectedRecv.size === 0) setSelecting(false);
  };

  const loadGifts = async (userId: string) => {
    // Carica regali inviati
    const { data: gifts } = await sb.from("gifts")
      .select("*, reactions(id, reaction_type, emoji, text, media_url, sender_name, created_at), gift_opens(opened_at, user_id)")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (gifts) setGifts(gifts as any);

    // Carica regali ricevuti da notifiche
    const { data: notifs } = await sb.from("notifications")
      .select("gift_id, created_at, gifts(*)")
      .eq("user_id", userId)
      .eq("type", "gift_received")
      .order("created_at", { ascending: false });

    if (notifs) {
      const { data: openedIds } = await sb.from("gift_opens").select("gift_id").eq("user_id", userId);
      const openedSet = new Set((openedIds ?? []).map((o: any) => o.gift_id));
      const recv = notifs.filter((n: any) => n.gifts).map((n: any) => ({
        ...(n.gifts as any),
        receivedAt: n.created_at,
        isOpened: openedSet.has((n.gifts as any).id)
      }));
      const creatorIds = Array.from(new Set(recv.map((g: any) => g.creator_id).filter(Boolean)));
      let profiles: any[] = [];
      if (creatorIds.length > 0) {
        const { data: p } = await sb.from("profiles").select("id, display_name, email").in("id", creatorIds as string[]);
        profiles = p ?? [];
      }
      setReceived(recv.map((g: any) => ({
        ...g,
        sender_name: (g as any).sender_alias
          || profiles.find((p: any) => p.id === g.creator_id)?.display_name
          || profiles.find((p: any) => p.id === g.creator_id)?.email
          || t("dashboard.sender_fallback"),
      })));
    }

    // Carica regali aperti (gift_opens)
    const { data: opens } = await sb.from("gift_opens")
      .select("gift_id, opened_at")
      .eq("user_id", userId)
      .order("opened_at", { ascending: false });

    if (opens && opens.length > 0) {
      const giftIds = opens.map((o: any) => o.gift_id);
      const { data: openedGifts } = await sb.from("gifts").select("*").in("id", giftIds).neq("creator_id", userId);
      if (openedGifts) {
        const creatorIds = Array.from(new Set(openedGifts.map((g: any) => g.creator_id).filter(Boolean)));
        let profiles: any[] = [];
        if (creatorIds.length > 0) {
          const { data: p } = await sb.from("profiles").select("id, display_name, email").in("id", creatorIds as string[]);
          profiles = p ?? [];
        }
        const withNames = openedGifts.map((g: any) => ({
          ...g,
          isOpened: true,
          receivedAt: opens.find((o: any) => o.gift_id === g.id)?.opened_at,
          sender_name: (g as any).sender_alias
            || profiles.find((p: any) => p.id === g.creator_id)?.display_name
            || profiles.find((p: any) => p.id === g.creator_id)?.email
            || t("dashboard.sender_fallback"),
        }));
        setReceived(prev => {
          const ids = new Set(prev.map(g => g.id));
          const newOnes = withNames.filter(g => !ids.has(g.id));
          return [...prev, ...newOnes];
        });
      }
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      let user = null;
      try {
        const stored = localStorage.getItem("sb-acoettfsxcfpvhjzreoy-auth-token");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.user) user = parsed.user;
        }
      } catch(_) {}
      if (!user) {
        for (let i = 0; i < 5; i++) {
          const { data } = await sb.auth.getUser();
          if (data.user) { user = data.user; break; }
          await new Promise(r => setTimeout(r, 400));
        }
      }
      if (!user) return;
      setUser(user as any);
      const data = { user };
      loadGifts(user.id);
    };

    loadUser();

    // Ricarica dati quando si torna sulla pagina
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const stored = localStorage.getItem("sb-acoettfsxcfpvhjzreoy-auth-token");
        if (stored) {
          try { const p = JSON.parse(stored); if (p.user) loadGifts(p.user.id); } catch(_) {}
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const channel = sb.channel("dashboard-reactions")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reactions" },
        (payload: any) => {
          const r = payload.new as Reaction;
          setGifts(prev => prev.map(g =>
            g.id === r.gift_id ? { ...g, reactions: [r, ...(g.reactions||[])] } : g
          ));
        }
      ).subscribe();
    return () => { sb.removeChannel(channel); document.removeEventListener("visibilitychange", handleVisibility); };
  }, []);

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/gift/${id}`).catch(()=>{});
    setCopied(id); setTimeout(()=>setCopied(null), 2000);
  };

  const deleteGift = async (id: string) => {
    if (!confirm(t("dashboard.confirm_delete_gift"))) return;
    setDeleting(id);
    const { data } = await sb.auth.refreshSession();
    const token = data.session?.access_token ?? "";
    await fetch(`/api/gifts/${id}`, {
      method: "DELETE",
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
    });
    setGifts(prev => prev.filter(g => g.id !== id));
    setDeleting(null);
  };

  const deleteReceived = async (id: string) => {
    if (!confirm(t("dashboard.confirm_delete_received"))) return;
    setReceived(prev => prev.filter(g => g.id !== id));
    const { data: userData } = await sb.auth.getUser();
    if (!userData.user) return;
    await sb.from("gift_opens").delete().eq("gift_id", id).eq("user_id", userData.user.id);
    await sb.from("notifications").delete().eq("gift_id", id).eq("user_id", userData.user.id);
  };

  const signOut = async () => {
    await sb.auth.signOut();
    window.location.href = "/";
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 60 && !refreshing) {
      setRefreshing(true);
    }
  };

  const handleTouchEnd = async () => {
    if (refreshing) {
      const stored = localStorage.getItem("sb-acoettfsxcfpvhjzreoy-auth-token");
      if (stored) {
        try {
          const p = JSON.parse(stored);
          if (p.user) await loadGifts(p.user.id);
        } catch(_) {}
      }
      setRefreshing(false);
    }
  };

  if (!user) return (
    <div style={{minHeight:"100vh",background:"#f7f5f2",fontFamily:"system-ui,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:16}}>🔐</div>
      <h2 style={{fontSize:22,fontWeight:800,color:DEEP,margin:"0 0 10px"}}>{t("dashboard.login_title")}</h2>
      <p style={{fontSize:14,color:MUTED,marginBottom:24,lineHeight:1.6}}>{t("dashboard.free_account")}</p>
      <a href="/auth/login" style={{background:ACCENT,color:"#fff",borderRadius:40,padding:"14px 32px",fontSize:15,fontWeight:700,textDecoration:"none"}}>{t("auth.sign_in_magic")}</a>
    </div>
  );

  const GiftCard = ({ gift, isSent }: { gift: GiftWithReactions; isSent: boolean }) => {
    const reactions = gift.reactions || [];
    const lastReaction = reactions[0];
    const isSelected = (isSent ? selectedSent : selectedRecv).has(gift.id);

    return (
      <div
        onClick={() => selecting && toggleSelect(gift.id)}
        style={{background: isSelected ? "#fff5f8" : "#fff", borderRadius:16, boxShadow:"0 2px 10px #0000000a", overflow:"hidden", border: `1.5px solid ${isSelected ? ACCENT : "transparent"}`, cursor: selecting ? "pointer" : "default", transition: "all .15s"}}
      >
        <div className="gift-card-row" style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
          {/* Checkbox */}
          {selecting && (
            <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${isSelected ? ACCENT : "#ddd"}`, background: isSelected ? ACCENT : "#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {isSelected && <span style={{ color:"#fff", fontSize:13, fontWeight:800 }}>✓</span>}
            </div>
          )}
          <GiftMini gift={gift}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:1}}>
              <span style={{fontWeight:700,color:DEEP,fontSize:14}}>
                {isSent ? `${t("dashboard.for")} ${gift.recipient_name}` : `${t("dashboard.from")} ${(gift as any).sender_alias || (gift as any).sender_name || t("dashboard.sender")}`}
              </span>
              {!isSent && (gift as any).isOpened === false && (
                <span style={{background:"#D4537E",color:"#fff",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{t("dashboard.new")}</span>
              )}
            </div>
            <div style={{color:MUTED,fontSize:11,marginBottom:2}}>
              {isSent
                ? `${t("dashboard.sent_on")} ${new Date(gift.created_at).toLocaleDateString()}`
                : `${t("dashboard.received_on")} ${new Date((gift as any).receivedAt || gift.created_at).toLocaleDateString()}`}
            </div>
            {/* Badge per gift programmati nel futuro: solo lato mittente,
                solo se scheduled_at è valorizzato e ancora nel futuro. */}
            {isSent && (gift as any).scheduled_at && new Date((gift as any).scheduled_at).getTime() > Date.now() && (
              <div style={{display:"inline-flex",alignItems:"center",gap:4,background:"#fff5e1",border:"1px solid #f4d88a",borderRadius:20,padding:"2px 9px",marginBottom:4,fontSize:10,color:"#8a6520",fontWeight:700}}>
                <span>⏰</span>
                <span>Programmato: {new Date((gift as any).scheduled_at).toLocaleString("it-IT",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
              </div>
            )}
            {isSent && (() => {
              const opens = (gift as any).gift_opens;
              if (!opens || opens.length === 0) return <div style={{fontSize:11,color:"#bbb",marginBottom:lastReaction?4:0}}>{t("dashboard.not_opened")}</div>;
              const firstOpen = opens[0];
              return <div style={{fontSize:11,color:"#3B8C5A",marginBottom:lastReaction?4:0}}>{t("dashboard.opened_on")} {new Date(firstOpen.opened_at).toLocaleDateString()}</div>;
            })()}
            {lastReaction && (
              <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"#fff5f8",borderRadius:20,padding:"3px 9px"}}>
                <span style={{fontSize:13}}>
                  {lastReaction.reaction_type==="emoji"?lastReaction.emoji||"❤️":lastReaction.reaction_type==="text"?"💌":lastReaction.reaction_type==="photo"?"📸":"🎬"}
                </span>
                <span style={{fontSize:11,color:ACCENT,fontWeight:600}}>
                  {reactions.length} {reactions.length===1?t("dashboard.reaction"):t("dashboard.reactions")}
                </span>
              </div>
            )}
          </div>
          {!selecting && (
            <div className="gift-card-actions" style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
              {isSent && typeof window !== "undefined" && (
                <WhatsAppShareButton
                  giftUrl={`${window.location.origin}/gift/${gift.id}`}
                  recipientName={gift.recipient_name}
                  variant="compact"
                  label="WhatsApp"
                />
              )}
              {isSent && (
                <button onClick={()=>copyLink(gift.id)} style={{background:copied===gift.id?"#3CB371":"transparent",color:copied===gift.id?"#fff":DEEP,border:"1.5px solid #e0dbd5",borderRadius:18,padding:"6px 11px",fontSize:11,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap"}}>
                  {copied===gift.id?t("dashboard.link_copied"):t("dashboard.copy_link")}
                </button>
              )}
              <a href={`/gift/${gift.id}`} target="_blank" onClick={async () => {
                if(!isSent && !(gift as any).isOpened) {
                  setReceived(prev => prev.map(g => g.id === gift.id ? {...g, isOpened: true} : g));
                  // Salva in gift_opens così resta aperto al reload
                  const { data: userData } = await sb.auth.getUser();
                  if (userData.user) {
                    // Controlla se esiste già
                    const { data: existing } = await sb.from("gift_opens")
                      .select("id").eq("gift_id", gift.id).eq("user_id", userData.user.id).single();
                    if (!existing) {
                      await sb.from("gift_opens").insert({
                        gift_id: gift.id,
                        user_id: userData.user.id,
                        opened_at: new Date().toISOString(),
                      });
                    }
                  }
                }
              }} style={{background:"transparent",color:DEEP,border:"1.5px solid #e0dbd5",borderRadius:18,padding:"6px 11px",fontSize:11,textDecoration:"none",display:"flex",alignItems:"center"}}>{t("dashboard.open")}</a>
              <button
                onClick={() => isSent ? deleteGift(gift.id) : deleteReceived(gift.id)}
                disabled={deleting===gift.id}
                style={{background:"transparent",border:"1.5px solid #ffd0d0",borderRadius:18,padding:"6px 8px",fontSize:12,cursor:"pointer",color:"#E24B4A",lineHeight:1}}>
                {deleting===gift.id?"…":"🗑"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{minHeight:"100vh",background:LIGHT,fontFamily:"system-ui,sans-serif",overscrollBehavior:"none"}} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {refreshing && (
        <div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",background:"#fff",borderRadius:40,padding:"8px 20px",boxShadow:"0 2px 12px #0000001a",zIndex:100,fontSize:13,color:MUTED,display:"flex",alignItems:"center",gap:8}}>
          <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>↻</span> {t("dashboard.refreshing")}
        </div>
      )}
      <style>{`@keyframes tI{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.tbi{animation:tI .28s ease both}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <div style={{padding:"12px 24px 0",borderBottom:"1px solid #ede8e0",background:"#fff"}}>
        <div style={{display:"flex",justifyContent:"flex-end",maxWidth:640,margin:"0 auto 12px"}}>
          <a href="/create" style={{background:ACCENT,color:"#fff",border:"none",borderRadius:40,padding:"8px 14px",fontSize:13,fontWeight:600,textDecoration:"none",whiteSpace:"nowrap"}}>{t("dashboard.new_gift")}</a>
        </div>

        <div style={{display:"flex",maxWidth:640,margin:"0 auto"}}>
          {[
            {id:"sent",     label:t("dashboard.sent"),  count:gifts.length},
            {id:"received", label:t("dashboard.received"), count:received.length},
          ].map(tab_item=>(
            <button key={tab_item.id} onClick={()=>{ setTab(tab_item.id as any); cancelSelect(); }}
              style={{flex:1,padding:"10px 8px",fontSize:14,fontWeight:600,cursor:"pointer",border:"none",background:"transparent",color:tab===tab_item.id?ACCENT:MUTED,borderBottom:`2.5px solid ${tab===tab_item.id?ACCENT:"transparent"}`,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {tab_item.label}
              {tab_item.count>0&&<span style={{background:tab===tab_item.id?ACCENT:"#e0dbd5",color:tab===tab_item.id?"#fff":MUTED,borderRadius:20,fontSize:10,fontWeight:700,padding:"1px 7px"}}>{tab_item.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Push permission card — appare solo se il browser supporta
          Web Push, utente loggato, permesso ancora default (non
          dismissato). Dopo "Attiva" si auto-nasconde. */}
      <div style={{maxWidth:640,margin:"0 auto",padding:"0 20px"}}>
        <PushPermissionCard/>
      </div>

      {/* Multi-select toolbar */}
      {(
        <div style={{maxWidth:640,margin:"0 auto",padding:"10px 20px 0",display:"flex",gap:8,alignItems:"center",justifyContent:"flex-end"}}>
          {selecting ? (
            <>
              {selected.size > 0 && (
                <button onClick={deleteSelectedBulk} disabled={bulkDeleting} style={{background:"#E24B4A",color:"#fff",border:"none",borderRadius:20,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {bulkDeleting ? "…" : `${t("dashboard.delete_selected")} (${selected.size})`}
                </button>
              )}
              <button onClick={toggleAll} style={{background:"#fff",color:DEEP,border:"1.5px solid #e0dbd5",borderRadius:20,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                {selected.size === currentList.length ? t("dashboard.deselect_all") : t("dashboard.select_all")}
              </button>
              <button onClick={cancelSelect} style={{background:"transparent",color:MUTED,border:"none",fontSize:13,cursor:"pointer"}}>
                {t("dashboard.cancel")}
              </button>
            </>
          ) : (
            <button onClick={() => setSelecting(true)} style={{background:"#fff",color:MUTED,border:"1.5px solid #e0dbd5",borderRadius:20,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              {t("dashboard.select")}
            </button>
          )}
        </div>
      )}

      <div key={tab} className="tbi" style={{maxWidth:640,margin:"0 auto",padding:"12px 20px 100px",display:"flex",flexDirection:"column",gap:9}}>

        {tab==="sent"&&(gifts.length===0?(
          <div style={{textAlign:"center",padding:"48px 24px",color:MUTED}}>
            <div style={{fontSize:52,marginBottom:14}}>🎁</div>
            <p style={{fontWeight:700,color:DEEP,fontSize:15,margin:"0 0 6px"}}>{t("dashboard.no_sent")}</p>
            <p style={{fontSize:13,color:MUTED,margin:"0 0 16px"}}>{t("dashboard.no_sent_subtitle")}</p>
            <a href="/create" style={{background:ACCENT,color:"#fff",borderRadius:40,padding:"12px 28px",fontSize:14,fontWeight:600,textDecoration:"none",display:"inline-block"}}>{t("dashboard.create_gift")}</a>
          </div>
        ):gifts.map(g=><GiftCard key={g.id} gift={g} isSent={true}/>))}

        {tab==="received"&&(received.length===0?(
          <div style={{textAlign:"center",padding:"48px 24px",color:MUTED}}>
            <div style={{fontSize:52,marginBottom:14}}>📬</div>
            <p style={{fontWeight:700,color:DEEP,fontSize:15,margin:"0 0 6px"}}>{t("dashboard.no_received")}</p>
            <p style={{fontSize:13,color:MUTED,lineHeight:1.6}}>{t("dashboard.no_received_subtitle")}</p>
          </div>
        ):received.map(g=><GiftCard key={g.id} gift={g} isSent={false}/>))}

      </div>
    </div>
  );
}
