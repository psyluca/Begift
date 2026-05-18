"use client";

/**
 * SupportConcierge — Floating Action Button + chat panel.
 *
 * - FAB sempre visibile in basso-destra
 * - Click apre pannello chat (desktop: 380x520, mobile: fullscreen)
 * - sessionStorage 'begift_support_session_id' per persistere conversazione
 * - history in memoria (state) + persistita server-side via /api/support/chat
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_SUPPORT_CONCIERGE
 * Gating: se !flag → render null (nessun FAB)
 */

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { track } from "@/lib/analytics";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const BORDER = "#e8e4de";
const SOFT_BG = "#f7f5f2";
const CARD = "#fff";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  actions?: Array<{ type: "link"; label: string; href: string }>;
  escalated?: boolean;
}

const WELCOME: ChatTurn = {
  role: "assistant",
  content:
    "Ciao! Sono qui per aiutarti a usare BeGift. Cosa ti serve sapere?",
};

const QUICK_REPLIES = [
  "Come funziona BeGift?",
  "Ho inoltrato una mail, dove la vedo?",
  "Come personalizzo il pacco?",
];

export default function SupportConcierge() {
  const flagEnabled =
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_CONCIERGE === "true";
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<ChatTurn[]>([WELCOME]);
  const [sessionId, setSessionId] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Init session_id (sessionStorage cross-tab, no localStorage per privacy)
  useEffect(() => {
    if (!flagEnabled) return;
    try {
      let sid = sessionStorage.getItem("begift_support_session_id");
      if (!sid) {
        sid = generateSessionId();
        sessionStorage.setItem("begift_support_session_id", sid);
      }
      setSessionId(sid);
    } catch {
      // sessionStorage non disponibile (rare, es. private browsing su Safari)
      setSessionId(generateSessionId());
    }
  }, [flagEnabled]);

  // Auto-scroll a fondo chat quando arrivano nuovi messaggi
  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, open, sending]);

  if (!flagEnabled) return null;

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    const userTurn: ChatTurn = { role: "user", content: text };
    setChat((prev) => [...prev, userTurn]);
    setInput("");
    setSending(true);
    track("concierge_message_sent");

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          history: chat
            .filter((c) => c.role === "user" || c.role === "assistant")
            .slice(-10)
            .map((c) => ({ role: c.role, content: c.content })),
          context: { current_url: pathname },
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        escalate?: boolean;
        actions?: ChatTurn["actions"];
        error?: string;
      };

      if (data.error) {
        setChat((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Ops, problema tecnico. Riprova fra un secondo. Se persiste scrivi a psyluca@gmail.com",
          },
        ]);
      } else {
        const reply: ChatTurn = {
          role: "assistant",
          content: data.reply || "Non sono sicuro di aver capito. Riprova?",
          actions: data.actions,
          escalated: data.escalate,
        };
        setChat((prev) => [...prev, reply]);
        if (data.escalate) track("concierge_escalated");
      }
    } catch {
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Ops, problema di rete. Riprova fra un secondo.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (q: string) => {
    track("concierge_quick_reply_clicked", { reply: q });
    void sendMessage(q);
  };

  const toggleOpen = () => {
    setOpen((v) => {
      const next = !v;
      if (next) track("concierge_opened");
      return next;
    });
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          type="button"
          onClick={toggleOpen}
          aria-label="Apri chat di aiuto"
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: ACCENT,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(212,83,126,.4)",
            fontSize: 28,
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          💬
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Aiuto BeGift"
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: "min(380px, calc(100vw - 20px))",
            height: "min(560px, calc(100vh - 40px))",
            background: CARD,
            borderRadius: 18,
            boxShadow: "0 16px 48px rgba(0,0,0,.18)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "system-ui, sans-serif",
            border: `1px solid ${BORDER}`,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: ACCENT,
              color: "#fff",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <strong style={{ fontSize: 15 }}>✨ Aiuto BeGift</strong>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                Rispondiamo in italiano in pochi secondi
              </div>
            </div>
            <button
              type="button"
              onClick={toggleOpen}
              aria-label="Chiudi"
              style={{
                background: "transparent",
                color: "#fff",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                padding: 0,
                width: 32,
                height: 32,
              }}
            >
              ✕
            </button>
          </div>

          {/* Chat messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 14px",
              background: SOFT_BG,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {chat.map((turn, idx) => (
              <ChatBubble key={idx} turn={turn} />
            ))}

            {/* Loading indicator */}
            {sending && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontSize: 18,
                  color: MUTED,
                }}
              >
                <TypingDots />
              </div>
            )}

            {/* Quick replies — solo se chat ha solo welcome */}
            {chat.length === 1 && !sending && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickReply(q)}
                    style={{
                      background: CARD,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 50,
                      padding: "8px 14px",
                      fontSize: 13,
                      color: INK,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            style={{
              borderTop: `1px solid ${BORDER}`,
              padding: 12,
              background: CARD,
              display: "flex",
              gap: 8,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi qualcosa…"
              disabled={sending}
              style={{
                flex: 1,
                padding: "10px 14px",
                fontSize: 14,
                border: `1px solid ${BORDER}`,
                borderRadius: 50,
                outline: "none",
                background: SOFT_BG,
              }}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              style={{
                padding: "10px 16px",
                background: input.trim() && !sending ? ACCENT : "#ddd",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                borderRadius: 50,
                cursor: sending ? "wait" : "pointer",
              }}
            >
              Invia
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────

function ChatBubble({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === "user";
  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "85%",
      }}
    >
      <div
        style={{
          background: isUser ? ACCENT : CARD,
          color: isUser ? "#fff" : INK,
          border: isUser ? "none" : `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: "10px 14px",
          fontSize: 14,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
        }}
      >
        {turn.content}
      </div>
      {turn.actions && turn.actions.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 6,
          }}
        >
          {turn.actions.map((a, i) => (
            <Link
              key={i}
              href={a.href}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: ACCENT,
                background: "#fff",
                border: `1px solid ${ACCENT}`,
                borderRadius: 50,
                padding: "5px 12px",
                textDecoration: "none",
              }}
            >
              {a.label} →
            </Link>
          ))}
        </div>
      )}
      {turn.escalated && (
        <div
          style={{
            fontSize: 11,
            color: MUTED,
            marginTop: 6,
            fontStyle: "italic",
          }}
        >
          ✉️ Ho aperto una nota a Luca, ti risponderà entro 24h
        </div>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      <Dot delay={0} />
      <Dot delay={0.2} />
      <Dot delay={0.4} />
      <style>{`
        @keyframes concierge-dot-bounce {
          0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </span>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: MUTED,
        display: "inline-block",
        animation: `concierge-dot-bounce 1.2s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

/** Genera session_id pseudo-random 16 hex chars (browser-safe). */
function generateSessionId(): string {
  const arr = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 8; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
