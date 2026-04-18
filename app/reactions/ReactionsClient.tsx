"use client";
import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { createBrowserClient } from "@supabase/ssr";
import type { Reaction } from "@/types";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

type ReactionWithGift = Reaction & { gifts?: { recipient_name: string; id: string; creator_id?: string } | null };

function timeAgo(d: string, t: (key: string) => string, locale: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60)    return t("common.now");
  if (s < 3600)  return `${Math.floor(s/60)} ${t("common.min_ago")}`;
  if (s < 86400) return `${Math.floor(s/3600)}${t("common.h_ago")}`;
  return new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "it-IT");
}

function ReactionModal({ r, onClose, t, locale }: { r: ReactionWithGift; onClose: () => void; t: (key: string, params?: Record<string, string>) => string; locale: string }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"28px 24px 48px", width:"100%", maxWidth:560, animation:"slideUp .3s cubic-bezier(.34,1.56,.64,1)" }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Handle */}
        <div style={{ width:36, height:4, borderRadius:2, background:"#e0dbd5", margin:"0 auto 20px" }}/>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:"#FBF0F4", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>
            {r.reaction_type === "emoji" ? r.emoji || "❤️" : r.reaction_type === "text" ? "💌" : r.reaction_type === "photo" ? "📸" : r.reaction_type === "video" ? "🎬" : "🎁"}
          </div>
          <div>
            <p style={{ margin:0, fontWeight:700, color:DEEP, fontSize:16 }}>{r.sender_name}</p>
            {r.gifts?.recipient_name && <p style={{ margin:0, fontSize:13, color:MUTED }}>{t("reactions.gift_for")} {r.gifts.recipient_name}</p>}
            <p style={{ margin:0, fontSize:12, color:"#bbb" }}>{timeAgo(r.created_at, t, locale)}</p>
          </div>
        </div>

        {/* Content */}
        {r.reaction_type === "emoji" && (
          <div style={{ textAlign:"center", fontSize:96, lineHeight:1, marginBottom:20 }}>{r.emoji}</div>
        )}
        {r.reaction_type === "text" && r.text && (
          <div style={{ background:"#fff5f8", borderRadius:16, padding:"20px", marginBottom:20 }}>
            <p style={{ margin:0, fontSize:16, lineHeight:1.7, color:DEEP, fontStyle:"italic" }}>"{r.text}"</p>
          </div>
        )}
        {r.reaction_type === "photo" && r.media_url && (
          <div style={{ borderRadius:16, overflow:"hidden", marginBottom:20 }}>
            <img src={r.media_url} alt="" style={{ width:"100%", maxHeight:400, objectFit:"cover", display:"block" }}/>
          </div>
        )}
        {r.reaction_type === "video" && r.media_url && (
          <div style={{ borderRadius:16, overflow:"hidden", marginBottom:20 }}>
            <video src={r.media_url} controls style={{ width:"100%", display:"block", borderRadius:16 }}/>
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:10 }}>
          {r.gifts?.id && (
            <a href={`/gift/${r.gifts.id}`} style={{ flex:1, display:"block", textAlign:"center", background:ACCENT, color:"#fff", borderRadius:40, padding:"13px", fontSize:14, fontWeight:700, textDecoration:"none" }}>
              {t("reactions.see_gift")}
            </a>
          )}
          <button onClick={onClose} style={{ flex:1, background:"#fff", color:MUTED, border:"1.5px solid #e0dbd5", borderRadius:40, padding:"13px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReactionsClient({ initialReactions }: { initialReactions: ReactionWithGift[] }) {
  const { t, locale } = useI18n();
  const [reactions, setReactions] = useState<ReactionWithGift[]>(initialReactions);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [activeReaction, setActiveReaction] = useState<ReactionWithGift | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("reactions")
        .select("*, gifts(recipient_name, id, creator_id)")
        .order("created_at", { ascending: false })
        .then(({ data: all }) => {
          if (!all) return;
          const mine = all.filter((r: any) => r.gifts?.creator_id === data.user!.id);
          if (mine.length > 0) setReactions(mine as any);
        });
    });
    // Il timestamp viene aggiornato solo quando si clicca su Reazioni nella nav
  }, []);

  const addReaction = useCallback((r: ReactionWithGift) => {
    setReactions(prev => [r, ...prev]);
  }, []);

  useEffect(() => {
    let userId: string | null = null;
    supabase.auth.getUser().then(({ data }) => { userId = data.user?.id ?? null; });
    const channel = supabase.channel("reactions-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reactions" },
        async (payload) => {
          const r = payload.new as any;
          const { data: gift } = await supabase.from("gifts").select("creator_id, recipient_name, id").eq("id", r.gift_id).single();
          if (gift?.creator_id === userId) addReaction({ ...r, gifts: { recipient_name: gift.recipient_name, id: gift.id } });
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [addReaction]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === reactions.length) setSelected(new Set());
    else setSelected(new Set(reactions.map(r => r.id)));
  };

  const deleteSelected = async () => {
    if (!confirm(t("reactions.confirm_delete", { count: String(selected.size), label: selected.size === 1 ? t("reactions.reaction_singular") : t("reactions.reaction_plural") }))) return;
    setDeleting(true);
    const ids = Array.from(selected);
    await supabase.from("reactions").delete().in("id", ids);
    setReactions(prev => prev.filter(r => !selected.has(r.id)));
    setSelected(new Set());
    setSelecting(false);
    setDeleting(false);
  };

  const deleteSingle = async (id: string) => {
    if (!confirm(t("reactions.confirm_delete_single"))) return;
    await supabase.from("reactions").delete().eq("id", id);
    setReactions(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div style={{ minHeight:"100vh", background:LIGHT, fontFamily:"system-ui, sans-serif", paddingBottom:80 }}>
      <style>{`@keyframes nI{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.ni{animation:nI .3s ease both}`}</style>

      {activeReaction && <ReactionModal r={activeReaction} onClose={() => setActiveReaction(null)} t={t} locale={locale}/>}

      {/* Header */}
      <div style={{ padding:"20px 24px", borderBottom:"1px solid #ede8e0", background:"#fff", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:DEEP, margin:0 }}>{t("reactions.title")}</h2>
        {reactions.length > 0 && (
          <div style={{ display:"flex", gap:8 }}>
            {selecting ? (
              <>
                {selected.size > 0 && (
                  <button onClick={deleteSelected} disabled={deleting} style={{ background:"#E24B4A", color:"#fff", border:"none", borderRadius:20, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    {deleting ? "…" : `${t("common.delete")} (${selected.size})`}
                  </button>
                )}
                <button onClick={toggleAll} style={{ background:"#fff", color:DEEP, border:"1.5px solid #e0dbd5", borderRadius:20, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  {selected.size === reactions.length ? t("reactions.deselect_all") : t("reactions.select_all")}
                </button>
                <button onClick={() => { setSelecting(false); setSelected(new Set()); }} style={{ background:"transparent", color:MUTED, border:"none", fontSize:13, cursor:"pointer" }}>
                  {t("common.cancel")}
                </button>
              </>
            ) : (
              <button onClick={() => setSelecting(true)} style={{ background:"#fff", color:MUTED, border:"1.5px solid #e0dbd5", borderRadius:20, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                {t("common.select")}
              </button>
            )}
          </div>
        )}
      </div>

      {reactions.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>💌</div>
          <p style={{ fontWeight:700, color:DEEP, fontSize:16, margin:"0 0 8px" }}>{t("reactions.none_title")}</p>
          <p style={{ color:MUTED, fontSize:14, lineHeight:1.6 }}>{t("reactions.none_subtitle")}</p>
        </div>
      ) : (
        <div style={{ maxWidth:560, margin:"0 auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:10 }}>
          {reactions.map((r, i) => {
            const isSelected = selected.has(r.id);
            return (
              <div key={r.id} className="ni" onClick={() => selecting ? toggleSelect(r.id) : setActiveReaction(r)} style={{
                animationDelay: `${i * 0.04}s`,
                background: isSelected ? "#fff5f8" : "#fff",
                borderRadius:16, padding:"16px",
                boxShadow:"0 2px 12px #0000000a",
                border: `1.5px solid ${isSelected ? ACCENT : "transparent"}`,
                display:"flex", gap:14, alignItems:"flex-start",
                cursor:"pointer",
                transition:"all .15s",
              }}>
                {selecting && (
                  <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${isSelected ? ACCENT : "#ddd"}`, background:isSelected ? ACCENT : "#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:11 }}>
                    {isSelected && <span style={{ color:"#fff", fontSize:13, fontWeight:800 }}>✓</span>}
                  </div>
                )}

                <div style={{ width:44, height:44, borderRadius:"50%", flexShrink:0, background:"#FBF0F4", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                  {r.reaction_type === "emoji" ? r.emoji || "❤️" : r.reaction_type === "text" ? "💌" : r.reaction_type === "photo" ? "📸" : r.reaction_type === "video" ? "🎬" : "🎁"}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 3px", fontWeight:700, color:DEEP, fontSize:14 }}>
                    {r.reaction_type === "emoji" ? `${r.sender_name} ${t("reactions.reacted_with")} ${r.emoji}`
                    : r.reaction_type === "text"  ? `${r.sender_name} ${t("reactions.sent_message")}`
                    : r.reaction_type === "photo" ? `${r.sender_name} ${t("reactions.sent_photo")}`
                    : r.reaction_type === "video" ? `${r.sender_name} ${t("reactions.sent_video")}`
                    : `${r.sender_name} ${t("reactions.sent_gift")}`}
                  </p>
                  {r.gifts?.recipient_name && <p style={{ margin:"0 0 4px", fontSize:12, color:MUTED }}>{t("reactions.gift_for")} {r.gifts.recipient_name}</p>}
                  {r.reaction_type === "text" && r.text && (
                    <p style={{ margin:"0 0 4px", fontSize:13, color:MUTED, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>"{r.text}"</p>
                  )}
                  {r.reaction_type === "emoji" && r.emoji && (
                    <p style={{ margin:"0 0 4px", fontSize:28, lineHeight:1 }}>{r.emoji}</p>
                  )}
                  {(r.reaction_type === "photo" || r.reaction_type === "video") && r.media_url && (
                    <div style={{ marginTop:8, marginBottom:4, borderRadius:10, overflow:"hidden", maxWidth:120, position:"relative" }}>
                      {r.reaction_type === "photo"
                        ? <img src={r.media_url} alt="" style={{ width:"100%", height:80, objectFit:"cover", display:"block" }}/>
                        : <div style={{ width:"100%", height:80, background:"#1a1a1a", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:10 }}>
                            <span style={{ fontSize:28 }}>▶</span>
                          </div>
                      }
                    </div>
                  )}
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                    <span style={{ fontSize:11, color:"#bbb" }}>{timeAgo(r.created_at, t, locale)}</span>
                    {!selecting && <span style={{ fontSize:11, color:ACCENT, fontWeight:600 }}>{t("reactions.tap_to_open")}</span>}
                  </div>
                </div>

                {!selecting && (
                  <button onClick={e => { e.stopPropagation(); deleteSingle(r.id); }} style={{ background:"transparent", border:"1.5px solid #ffd0d0", borderRadius:18, padding:"6px 8px", fontSize:13, cursor:"pointer", color:"#E24B4A", flexShrink:0 }}>
                    🗑
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
