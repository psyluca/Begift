"use client";

/**
 * Dashboard admin Support Concierge.
 *
 * Tab strutturato:
 *   - Stats card (3 numeri principali)
 *   - Toggle "Solo escalation"
 *   - Lista sessioni con preview ultimo user/assistant msg
 *   - Click sessione → drawer fullscreen con cronologia completa
 *
 * Pattern uguale a /admin/stats e /admin/catalog (fetchAuthed con
 * gestione 403 → "Accesso negato", loading state, error state).
 */

import { useEffect, useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT = "#f7f5f2";
const CARD = "#fff";
const BORDER = "#e8e4de";
const WARN_BG = "#fff8e1";
const WARN_BORDER = "#d97706";
const OK = "#3b8c5a";
const ERR = "#dc2626";

interface SessionSummary {
  session_id: string;
  user_id: string | null;
  first_at: string;
  last_at: string;
  turn_count: number;
  has_escalation: boolean;
  last_user_message: string | null;
  last_assistant_reply: string | null;
  last_url: string | null;
}

interface SessionsResp {
  sessions: SessionSummary[];
  stats: {
    total_sessions: number;
    total_escalations: number;
    total_turns_in_window: number;
    window_size: number;
  };
}

interface Turn {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: { current_url?: string } | null;
  escalated: boolean;
  created_at: string;
  user_id: string | null;
}

export default function AdminSupportClient() {
  const [data, setData] = useState<SessionsResp | null>(null);
  const [state, setState] = useState<"loading" | "forbidden" | "ready" | "error">("loading");
  const [onlyEscalated, setOnlyEscalated] = useState(false);
  const [openSession, setOpenSession] = useState<string | null>(null);
  const [openTurns, setOpenTurns] = useState<Turn[] | null>(null);
  const [openLoading, setOpenLoading] = useState(false);

  async function load() {
    try {
      setState("loading");
      const url = onlyEscalated
        ? "/api/admin/support/sessions?onlyEscalated=1"
        : "/api/admin/support/sessions";
      const res = await fetchAuthed(url);
      if (res.status === 403) {
        setState("forbidden");
        return;
      }
      if (!res.ok) {
        setState("error");
        return;
      }
      setData(await res.json());
      setState("ready");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyEscalated]);

  async function openDrawer(sessionId: string) {
    setOpenSession(sessionId);
    setOpenTurns(null);
    setOpenLoading(true);
    try {
      const res = await fetchAuthed(
        `/api/admin/support/sessions/${encodeURIComponent(sessionId)}`
      );
      if (res.ok) {
        const body = (await res.json()) as { turns: Turn[] };
        setOpenTurns(body.turns);
      }
    } finally {
      setOpenLoading(false);
    }
  }

  if (state === "loading") {
    return (
      <Wrap>
        <p style={{ color: MUTED }}>Caricamento…</p>
      </Wrap>
    );
  }
  if (state === "forbidden") {
    return (
      <Wrap>
        <h1 style={{ color: ERR }}>Accesso negato</h1>
        <p>Solo gli admin (whitelist ADMIN_EMAILS) possono vedere questa pagina.</p>
      </Wrap>
    );
  }
  if (state === "error" || !data) {
    return (
      <Wrap>
        <p style={{ color: ERR }}>Errore nel caricamento.</p>
        <button onClick={load}>Riprova</button>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <h1
        style={{
          color: INK,
          fontSize: 26,
          fontWeight: 800,
          margin: "0 0 6px",
        }}
      >
        Support Concierge
      </h1>
      <p style={{ color: MUTED, margin: "0 0 22px", fontSize: 14 }}>
        Sessioni recenti del chatbot AI di supporto. Escalation in evidenza.
      </p>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Sessioni totali"
          value={data.stats.total_sessions}
          color={INK}
        />
        <StatCard
          label="Escalation"
          value={data.stats.total_escalations}
          color={data.stats.total_escalations > 0 ? WARN_BORDER : MUTED}
        />
        <StatCard
          label="Turn nel range"
          value={data.stats.total_turns_in_window}
          color={MUTED}
          hint={`max ${data.stats.window_size}`}
        />
      </div>

      {/* Filter */}
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          fontSize: 13,
          color: INK,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={onlyEscalated}
          onChange={(ev) => setOnlyEscalated(ev.target.checked)}
        />
        Solo sessioni con escalation
      </label>

      {/* Sessions list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.sessions.length === 0 ? (
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: "32px 20px",
              textAlign: "center",
              color: MUTED,
              fontSize: 13,
            }}
          >
            {onlyEscalated
              ? "Nessuna sessione con escalation."
              : "Nessuna sessione recente."}
          </div>
        ) : (
          data.sessions.map((s) => (
            <SessionRow
              key={s.session_id}
              session={s}
              onClick={() => openDrawer(s.session_id)}
            />
          ))
        )}
      </div>

      {/* Drawer cronologia sessione */}
      {openSession && (
        <SessionDrawer
          sessionId={openSession}
          turns={openTurns}
          loading={openLoading}
          onClose={() => {
            setOpenSession(null);
            setOpenTurns(null);
          }}
        />
      )}
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT,
        padding: "32px 16px 80px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>{children}</div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: number | string;
  color: string;
  hint?: string;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: MUTED,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "0 0 6px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 26,
          fontWeight: 800,
          color,
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {hint && (
        <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0" }}>{hint}</p>
      )}
    </div>
  );
}

function SessionRow({
  session,
  onClick,
}: {
  session: SessionSummary;
  onClick: () => void;
}) {
  const ts = new Date(session.last_at).toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <button
      onClick={onClick}
      style={{
        background: session.has_escalation ? WARN_BG : CARD,
        border: `1px solid ${session.has_escalation ? WARN_BORDER : BORDER}`,
        borderRadius: 12,
        padding: "12px 16px",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 6,
          flexWrap: "wrap",
        }}
      >
        {session.has_escalation && (
          <span
            style={{
              background: WARN_BORDER,
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            🆘 escalata
          </span>
        )}
        <span style={{ fontSize: 12, color: MUTED }}>{ts}</span>
        <span style={{ fontSize: 12, color: MUTED }}>·</span>
        <span style={{ fontSize: 12, color: MUTED }}>
          {session.turn_count} {session.turn_count === 1 ? "turn" : "turn"}
        </span>
        {session.user_id ? (
          <span
            style={{
              fontSize: 11,
              padding: "2px 7px",
              borderRadius: 999,
              background: "#ecfdf5",
              color: OK,
              fontWeight: 700,
            }}
          >
            loggato
          </span>
        ) : (
          <span
            style={{
              fontSize: 11,
              padding: "2px 7px",
              borderRadius: 999,
              background: "#f0f0f0",
              color: MUTED,
              fontWeight: 700,
            }}
          >
            anon
          </span>
        )}
      </div>
      {session.last_user_message && (
        <p
          style={{
            fontSize: 13,
            color: INK,
            margin: "0 0 4px",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: ACCENT }}>U:</strong>{" "}
          {session.last_user_message}
        </p>
      )}
      {session.last_assistant_reply && (
        <p
          style={{
            fontSize: 12.5,
            color: MUTED,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          <strong>A:</strong> {session.last_assistant_reply}
        </p>
      )}
      {session.last_url && (
        <p
          style={{
            fontSize: 11,
            color: MUTED,
            margin: "6px 0 0",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {session.last_url}
        </p>
      )}
    </button>
  );
}

function SessionDrawer({
  sessionId,
  turns,
  loading,
  onClose,
}: {
  sessionId: string;
  turns: Turn[] | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 640,
          background: CARD,
          padding: "20px 22px 60px",
          overflowY: "auto",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            gap: 10,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                color: MUTED,
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 700,
              }}
            >
              Cronologia sessione
            </p>
            <p
              style={{
                fontSize: 13,
                margin: "2px 0 0",
                color: INK,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {sessionId}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: `1px solid ${BORDER}`,
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 13,
              cursor: "pointer",
              color: INK,
            }}
          >
            Chiudi
          </button>
        </div>

        {loading && <p style={{ color: MUTED }}>Caricamento…</p>}
        {turns && turns.length === 0 && (
          <p style={{ color: MUTED }}>Nessun turn in questa sessione.</p>
        )}
        {turns && turns.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {turns.map((t) => (
              <TurnBubble key={t.id} turn={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TurnBubble({ turn }: { turn: Turn }) {
  const isUser = turn.role === "user";
  const isSystem = turn.role === "system";
  const ts = new Date(turn.created_at).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div
      style={{
        background: isUser ? "#fff5f8" : isSystem ? "#f0f0f0" : CARD,
        border: `1px solid ${turn.escalated ? WARN_BORDER : BORDER}`,
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 13.5,
        lineHeight: 1.55,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: MUTED,
          marginBottom: 5,
          display: "flex",
          gap: 8,
          alignItems: "center",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        <span style={{ color: isUser ? ACCENT : isSystem ? MUTED : INK }}>
          {turn.role}
        </span>
        <span>· {ts}</span>
        {turn.escalated && (
          <span
            style={{
              color: WARN_BORDER,
              fontWeight: 800,
            }}
          >
            🆘 ESCALATED
          </span>
        )}
      </div>
      <p style={{ margin: 0, color: INK, whiteSpace: "pre-wrap" }}>
        {turn.content}
      </p>
      {turn.metadata?.current_url && (
        <p
          style={{
            fontSize: 11,
            color: MUTED,
            margin: "6px 0 0",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {turn.metadata.current_url}
        </p>
      )}
    </div>
  );
}
