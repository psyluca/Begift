"use client";

/**
 * DraftsClient — lista bozze email parser, fetch via fetchAuthed.
 *
 * Stato:
 *   - loading | unauth | ready
 *   - drafts: lista bozze (vuota se ready ma utente senza bozze)
 *
 * Gestisce 3 casi visivamente:
 *   1. loading: spinner sobrio
 *   2. unauth (401): CTA 'Accedi'
 *   3. ready: lista oppure empty state
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const CARD = "#fff";
const BORDER = "#e8e4de";

interface Draft {
  id: string;
  status: string;
  detected_merchant: string | null;
  parsed_content: Record<string, unknown> | null;
  parser_confidence: number | null;
  source_email_from: string;
  source_email_subject: string | null;
  source_email_received_at: string;
  expires_at: string;
}

type State =
  | { kind: "loading" }
  | { kind: "unauth" }
  | { kind: "ready"; drafts: Draft[] }
  | { kind: "error"; message: string };

export default function DraftsClient() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuthed("/api/drafts");
        if (res.status === 401) {
          setState({ kind: "unauth" });
          return;
        }
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setState({
            kind: "error",
            message: j.error || `HTTP ${res.status}`,
          });
          return;
        }
        const data = (await res.json()) as { drafts: Draft[] };
        setState({ kind: "ready", drafts: data.drafts || [] });
      } catch (e) {
        setState({
          kind: "error",
          message: (e as Error).message || "errore di rete",
        });
      }
    })();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, sans-serif",
        padding: "32px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Breadcrumb / back nav */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/settings#email-parser"
            style={{
              fontSize: 13,
              color: MUTED,
              textDecoration: "none",
            }}
          >
            ← Impostazioni
          </Link>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: INK,
              margin: "0 0 6px",
              letterSpacing: "-0.3px",
            }}
          >
            I tuoi pacchi in bozza
          </h1>
          <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
            Mail inoltrate, pacchi pre-popolati pronti da personalizzare e
            inviare.
          </p>
        </div>

        {state.kind === "loading" && (
          <p style={{ textAlign: "center", color: MUTED, padding: 40 }}>
            Caricamento…
          </p>
        )}

        {state.kind === "unauth" && <UnauthState />}

        {state.kind === "error" && (
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: "24px 22px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#a02020", margin: 0 }}>
              Errore: {state.message}
            </p>
          </div>
        )}

        {state.kind === "ready" &&
          (state.drafts.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {state.drafts.map((d) => (
                <DraftCard key={d.id} draft={d} />
              ))}
            </div>
          ))}

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link
            href="/forward-mail"
            style={{
              fontSize: 13,
              color: ACCENT,
              textDecoration: "underline",
            }}
          >
            Come funziona &amp; indirizzo da inoltrare →
          </Link>
        </div>
      </div>
    </main>
  );
}

function UnauthState() {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 20,
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: INK,
          margin: "0 0 8px",
        }}
      >
        Accedi per vedere le tue bozze
      </h2>
      <p style={{ fontSize: 14, color: MUTED, margin: "0 0 20px" }}>
        Ti serve un account BeGift per gestire le mail inoltrate.
      </p>
      <Link
        href="/auth/login?next=/drafts"
        style={{
          display: "inline-block",
          background: ACCENT,
          color: "#fff",
          padding: "12px 24px",
          borderRadius: 50,
          fontSize: 14,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Accedi
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 20,
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: INK,
          margin: "0 0 8px",
        }}
      >
        Nessuna bozza ancora
      </h2>
      <p
        style={{
          fontSize: 14,
          color: MUTED,
          lineHeight: 1.6,
          margin: "0 0 20px",
          maxWidth: 380,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Inoltra una mail di conferma acquisto (concerto, cofanetto, esperienza)
        e BeGift creera&apos; per te un pacco regalo gia&apos; pronto.
      </p>
      <Link
        href="/forward-mail"
        style={{
          display: "inline-block",
          background: ACCENT,
          color: "#fff",
          padding: "12px 24px",
          borderRadius: 50,
          fontSize: 14,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Scopri come funziona →
      </Link>
      <div style={{ marginTop: 16 }}>
        <Link
          href="/settings#email-parser"
          style={{
            fontSize: 13,
            color: MUTED,
            textDecoration: "underline",
          }}
        >
          Vai a Impostazioni
        </Link>
      </div>
    </div>
  );
}

function DraftCard({ draft }: { draft: Draft }) {
  const parsed = draft.parsed_content || {};
  const title = (parsed.title as string) || "(Pacco in lavorazione)";
  const merchant = draft.detected_merchant || "merchant";
  const eventDate = parsed.event_date as string | null;
  const location = parsed.location as string | null;

  const statusBadge = (() => {
    switch (draft.status) {
      case "pending":
        return { text: "In lavorazione…", bg: "#fef0d4", color: "#8a5b00" };
      case "ready":
        return { text: "Pronto", bg: "#e8f5d4", color: "#2d6a00" };
      case "failed":
        return { text: "Errore di lettura", bg: "#fce4e4", color: "#a02020" };
      default:
        return { text: draft.status, bg: "#f0f0f0", color: "#666" };
    }
  })();

  const dateFormatted = eventDate
    ? new Date(eventDate).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const receivedAt = new Date(draft.source_email_received_at).toLocaleDateString(
    "it-IT",
    { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
  );

  return (
    <Link
      href={`/draft/${draft.id}`}
      style={{
        display: "block",
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "16px 18px",
        textDecoration: "none",
        color: INK,
        transition: "transform .14s, box-shadow .14s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 6,
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: INK,
            margin: 0,
            flex: 1,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>
        <span
          style={{
            background: statusBadge.bg,
            color: statusBadge.color,
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 12,
            whiteSpace: "nowrap",
          }}
        >
          {statusBadge.text}
        </span>
      </div>
      <p style={{ fontSize: 13, color: MUTED, margin: "0 0 8px" }}>
        Da <strong style={{ color: INK }}>{merchant}</strong>
        {dateFormatted && (
          <>
            {" "}
            · <span style={{ color: INK }}>{dateFormatted}</span>
          </>
        )}
        {location && (
          <>
            {" "}
            · {location}
          </>
        )}
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <span style={{ fontSize: 11, color: MUTED }}>
          Inoltrata {receivedAt}
        </span>
        {draft.status === "ready" && (
          <span style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>
            Completa →
          </span>
        )}
      </div>
    </Link>
  );
}
