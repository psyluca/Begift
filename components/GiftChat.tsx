"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useI18n } from "@/lib/i18n";

const ACCENT = "#D4537E", DEEP = "#1a1a1a", MUTED = "#888", LIGHT = "#f7f5f2";

interface Message {
  id: string;
  gift_id: string;
  sender_id: string | null;
  sender_name: string;
  text: string;
  created_at: string;
  read_by_creator: boolean;
  read_by_recipient: boolean;
}

function GiftTick({ read, isMine }: { read: boolean; isMine: boolean }) {
  if (!isMine) return null;
  return (
    <span style={{ display:"inline-flex", gap:1, marginLeft:4, verticalAlign:"middle" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M4 12l5 5L20 7" stroke={read ? "#2196F3" : "#aaa"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {read && <path d="M9 12l5 5L20 7" stroke="#2196F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(3,0)"/>}
      </svg>
    </span>
  );
}

// Mini gift icon for ticks
function GiftTickIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{display:"inline-block",verticalAlign:"middle"}}>
      <rect x="3" y="9" width="14" height="9" rx="1.5" fill={color}/>
      <rect x="2" y="7" width="16" height="3" rx="1" fill={color} opacity=".8"/>
      <path d="M10 7 C10 5 8 3 7 4 C6 5 7 7 10 7Z" fill={color}/>
      <path d="M10 7 C10 5 12 3 13 4 C14 5 13 7 10 7Z" fill={color}/>
      <rect x="9" y="7" width="2" height="11" fill="white" opacity=".4"/>
      <rect x="2" y="11" width="16" height="2" fill="white" opacity=".2"/>
    </svg>
  );
}

function MessageTicks({ msg, isCreator }: { msg: Message; isCreator: boolean }) {
  // Determine if this message was sent by current viewer
  const isMine = isCreator ? msg.sender_id !== null && msg.read_by_creator !== undefined : msg.sender_id === null;
  if (!isMine) return null;

  const isRead = isCreator ? msg.read_by_recipient : msg.read_by_creator;
  const color = isRead ? "#2196F3" : "#bbb";

  return (
    <span style={{ display:"inline-flex", gap:1, marginLeft:3, verticalAlign:"middle" }}>
      <GiftTickIcon color={color}/>
      <GiftTickIcon color={color}/>
    </span>
  );
}

const CHAT_EMOJIS = ["❤️","🎁","🎉","😍","🥳","😊","🤗","😘","💖","✨","🌟","🙏","👏","😂","🥹","💪","🤩","🫶","💝","🎂","🎊","🌹","💌","🔥","⭐","🌈","🦋","🌸","🍾","🥂"];

function timeStr(d: string, locale: string) {
  return new Date(d).toLocaleTimeString(locale === "en" ? "en-GB" : "it-IT", { hour:"2-digit", minute:"2-digit" });
}

export default function GiftChat({ giftId, isCreator, recipientName, creatorName }: {
  giftId: string;
  isCreator: boolean;
  recipientName: string;
  creatorName?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState<string|null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { t, locale } = useI18n();
  const [senderName, setSenderName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const myNameRef = useRef<string>("");
  const currentUserIdRef = useRef<string>("");

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadMessages = useCallback(async () => {
    const { data } = await sb.from("messages").select("*").eq("gift_id", giftId).order("created_at", { ascending: true });
    if (data) setMessages(data);
  }, [giftId]);

  useEffect(() => {
    // Get current user
    try {
      const stored = localStorage.getItem("sb-acoettfsxcfpvhjzreoy-auth-token");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.user) {
          setCurrentUser(p.user);
          const name = p.user.email?.split("@")[0] || t("chat.user");
          setSenderName(name);
          myNameRef.current = isCreator ? (creatorName || name) : recipientName;
          currentUserIdRef.current = p.user.id;
        }
      }
    } catch(_) {}
    if (!isCreator) myNameRef.current = recipientName;

    loadMessages();

    console.log("GiftChat mounting, giftId:", giftId);
    // Realtime
    const channel = sb.channel(`chat-${giftId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "typing_indicators" },
        (payload) => {
          const typ = payload.new as any;
          if (typ.gift_id !== giftId) return;
          // Filtra per user_id se disponibile, altrimenti per user_name
          const isMe = currentUserIdRef.current 
            ? typ.user_id === currentUserIdRef.current
            : typ.user_name === (myNameRef.current || (isCreator ? (creatorName || "mittente") : recipientName));
          if (!isMe) {
            setIsTyping(typ.user_name);
            clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setIsTyping(null), 3000);
          }
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "typing_indicators" },
        (payload) => {
          const typ = payload.new as any;
          if (typ.gift_id !== giftId) return;
          const isMe2 = currentUserIdRef.current 
            ? typ.user_id === currentUserIdRef.current
            : typ.user_name === (myNameRef.current || (isCreator ? (creatorName || "mittente") : recipientName));
          if (!isMe2) {
            setIsTyping(typ.user_name);
            clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setIsTyping(null), 3000);
          }
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.gift_id !== giftId) return;
          // Evita duplicati
          setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
          if (!open) setUnread(u => u + 1);
        }
      )
      .subscribe((status) => { console.log("channel status:", status); });

    return () => { sb.removeChannel(channel); };
  }, [giftId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Mark as read when opening chat
  const openChat = async () => {
    setOpen(true);
    setUnread(0);
    loadMessages(); // Ricarica messaggi freschi
    const field = isCreator ? "read_by_creator" : "read_by_recipient";
    console.log("openChat - isCreator:", isCreator, "field:", field, "currentUser:", currentUser?.id);
    const { data: updated, error } = await sb.from("messages")
      .update({ [field]: true })
      .eq("gift_id", giftId)
      .eq(field, false)
      .select();
    if (updated && updated.length > 0) {
      setMessages(prev => prev.map(m => {
        const u = updated.find((u: any) => u.id === m.id);
        return u ? u : m;
      }));
    }
    // Reload to get updated read status
    loadMessages();
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const msgText = text.trim();
    setText("");
    const { data } = await sb.from("messages").insert({
      gift_id: giftId,
      sender_id: currentUser?.id || null,
      sender_name: isCreator ? (creatorName || senderName) : recipientName,
      text: msgText,
    }).select().single();
    if (data) setMessages(prev => [...prev, data]);
    setSending(false);
  };

  const myName = isCreator ? (creatorName || senderName) : recipientName;

  return (
    <>
      {/* Chat button */}
      <button
        onClick={openChat}
        style={{
          position:"fixed", bottom:90, right:20, zIndex:100,
          background:ACCENT, color:"#fff", border:"none", borderRadius:"50%",
          width:54, height:54, fontSize:22, cursor:"pointer",
          boxShadow:"0 4px 16px rgba(212,83,126,.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
      >
        💬
        {unread > 0 && (
          <div style={{
            position:"absolute", top:-4, right:-4,
            background:"#E24B4A", color:"#fff", borderRadius:"50%",
            width:20, height:20, fontSize:11, fontWeight:800,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>{unread}</div>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:200,
          background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end",
        }} onClick={() => setOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:"#fff", borderRadius:"24px 24px 0 0",
              width:"100%", maxWidth:560, margin:"0 auto",
              maxHeight:"75vh", display:"flex", flexDirection:"column",
              animation:"slideUp .3s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes giftBounce{0%,100%{transform:translateY(0) scale(1)}40%{transform:translateY(-6px) scale(1.2)}}.gift-dot{display:inline-block;font-size:14px;margin:0 1px;animation:giftBounce 1.4s infinite}.gift-dot:nth-child(2){animation-delay:.2s}.gift-dot:nth-child(3){animation-delay:.4s}`}</style>

            {/* Header */}
            <div style={{ padding:"16px 20px", borderBottom:"1px solid #f0ece8", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ margin:0, fontWeight:800, color:DEEP, fontSize:16 }}>{t("chat.title")}</p>
                <p style={{ margin:0, fontSize:12, color:MUTED }}>{isCreator ? `${t("chat.with")} ${recipientName}` : (creatorName ? `${t("chat.with")} ${creatorName}` : t("chat.with_sender"))}</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:MUTED }}>×</button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:8 }}>
              {messages.length === 0 && (
                <div style={{ textAlign:"center", padding:"32px 0", color:MUTED }}>
                  <div style={{ fontSize:40, marginBottom:8 }}>💌</div>
                  <p style={{ fontSize:14 }}>{t("chat.no_messages")}</p>
                </div>
              )}
              {messages.map(m => {
                // isMine: confronta sender_id con utente corrente, o sender_name con myName
                const isMine = currentUser
                  ? m.sender_id === currentUser.id
                  : m.sender_name === myName;
                return (
                  <div key={m.id} style={{ display:"flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth:"75%",
                      background: isMine ? ACCENT : "#f0ece8",
                      color: isMine ? "#fff" : DEEP,
                      borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      padding:"10px 14px",
                    }}>
                      {!isMine && <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:700, color:MUTED }}>{m.sender_name}</p>}
                      <p style={{ margin:0, fontSize:14, lineHeight:1.5 }}>{m.text}</p>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:4, marginTop:3 }}>
                        <span style={{ fontSize:10, color: isMine ? "rgba(255,255,255,.7)" : "#bbb" }}>{timeStr(m.created_at, locale)}</span>
                        {isMine && (
                          <span style={{ display:"inline-flex", gap:1 }}>
                            <GiftTickIcon color={isCreator
                              ? (m.read_by_recipient ? "#90CAF9" : "rgba(255,255,255,.4)")
                              : (m.read_by_creator  ? "#90CAF9" : "rgba(255,255,255,.4)")}/>
                            <GiftTickIcon color={isCreator
                              ? (m.read_by_recipient ? "#90CAF9" : "rgba(255,255,255,.4)")
                              : (m.read_by_creator  ? "#90CAF9" : "rgba(255,255,255,.4)")}/>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{ padding:"12px 16px", borderTop:"1px solid #f0ece8" }}>
              {isTyping && (
                <div style={{ padding:"6px 12px", display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ background:"#f0ece8", borderRadius:"18px 18px 18px 4px", padding:"8px 14px", display:"inline-flex", alignItems:"center", gap:4 }}>
                    <span className="gift-dot">🎁</span>
                    <span className="gift-dot">🎁</span>
                    <span className="gift-dot">🎁</span>
                    <span style={{ fontSize:12, color:MUTED, marginLeft:4 }}>{isTyping} {t("chat.typing")}</span>
                  </div>
                </div>
              )}
              {showEmoji && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10, background:"#f7f5f2", borderRadius:16, padding:10 }}>
                  {CHAT_EMOJIS.map(e => (
                    <button key={e} type="button" onClick={()=>{setText(p=>p+e);setShowEmoji(false);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",padding:"4px",borderRadius:8,lineHeight:1}}>{e}</button>
                  ))}
                </div>
              )}
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button type="button" onClick={()=>setShowEmoji(p=>!p)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",flexShrink:0,lineHeight:1,padding:0}}>😊</button>
              <input
                type="text"
                value={text}
                onChange={async e => {
                  setText(e.target.value);
                  if (e.target.value.length > 0) {
                    // Delete then insert to trigger realtime INSERT event
                  await sb.from("typing_indicators").delete().eq("gift_id", giftId).eq("user_name", myName);
                  await sb.from("typing_indicators").insert({ gift_id: giftId, user_name: myName, user_id: currentUserIdRef.current || null, updated_at: new Date().toISOString() });
                  }
                }}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={t("chat.placeholder")}
                style={{
                  flex:1, padding:"11px 16px", fontSize:14,
                  border:"1.5px solid #e0dbd5", borderRadius:40,
                  outline:"none", background:"#fafaf8", color:DEEP,
                  fontFamily:"inherit",
                }}
              />
              <button
                onClick={send}
                disabled={!text.trim() || sending}
                style={{
                  background: text.trim() ? ACCENT : "#e0dbd5",
                  color:"#fff", border:"none", borderRadius:"50%",
                  width:44, height:44, fontSize:18, cursor: text.trim() ? "pointer" : "default",
                  flexShrink:0, transition:"background .2s",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}
              >
                {sending ? "…" : "→"}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
