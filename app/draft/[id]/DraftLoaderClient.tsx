"use client";

/**
 * DraftLoaderClient — fetcha il singolo draft via fetchAuthed,
 * gestisce 401/404/already-completed, e poi renderizza
 * DraftCompletionClient con i props derivati.
 *
 * Stati visivi:
 *   - loading: spinner sobrio
 *   - unauth: CTA Accedi (con next=/draft/[id] per tornare)
 *   - not_found: pagina "questa bozza non esiste o non e' tua"
 *   - already_completed: redirect immediato a /gift/[gift_id]
 *   - error: messaggio errore generico
 *   - ready: render DraftCompletionClient
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAuthed } from "@/lib/clientAuth";
import DraftCompletionClient from "./DraftCompletionClient";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const CARD = "#fff";
const BORDER = "#e8e4de";

interface DraftRow {
  id: string;
  status: string;
  detected_merchant: string | null;
  parsed_content: Record<string, unknown> | null;
  parser_confidence: number | null;
  source_email_from: string;
  source_email_subject: string | null;
}

type State =
  | { kind: "loading" }
  | { kind: "unauth" }
  | { kind: "not_found" }
  | { kind: "error"; message: string }
  | { kind: "ready"; draft: DraftRow };

export default function DraftLoaderClient({ draftId }: { draftId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuthed(`/api/draft/${draftId}`);
        if (res.status === 401) {
          setState({ kind: "unauth" });
          return;
        }
        if (res.status === 404) {
          setState({ kind: "not_found" });
          return;
        }
        if (res.status === 409) {
          // Gia' completato: redirect al gift creato
          const data = (await res.json().catch(() => ({}))) as {
            gift_id?: string;
          };
          if (data.gift_id) {
            router.replace(`/gift/${data.gift_id}`);
            return;
          }
          setState({ kind: "not_found" });
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
        const data = (await res.json()) as { draft: DraftRow };
        setState({ kind: "ready", draft: data.draft });
      } catch (e) {
        setState({
          kind: "error",
          message: (e as Error).message || "errore di rete",
        });
      }
    })();
  }, [draftId, router]);

  if (state.kind === "loading") {
    return <CenteredMessage emoji="⏳" title="Caricamento…" subtitle="" />;
  }

  if (state.kind === "unauth") {
    return (
      <CenteredMessage
        emoji="🔒"
        title="Accedi per vedere il pacco"
        subtitle="Devi essere loggato per personalizzare e inviare il regalo."
        cta={{ href: `/auth/login?next=/draft/${draftId}`, label: "Accedi" }}
      />
    );
  }

  if (state.kind === "not_found") {
    return (
      <CenteredMessage
        emoji="🎁"
        title="Pacco non trovato"
        subtitle="Questo draft non esiste o è già stato completato."
        cta={{ href: "/drafts", label: "Vai alle tue bozze" }}
      />
    );
  }

  if (state.kind === "error") {
    return (
      <CenteredMessage
        emoji="⚠️"
        title="Errore di caricamento"
        subtitle={state.message}
        cta={{ href: "/drafts", label: "Torna alle bozze" }}
      />
    );
  }

  // ready
  const d = state.draft;
  return (
    <DraftCompletionClient
      draftId={d.id}
      status={d.status}
      detectedMerchant={d.detected_merchant}
      parsedContent={d.parsed_content}
      sourceEmailFrom={d.source_email_from}
      sourceEmailSubject={d.source_email_subject}
      parserConfidence={d.parser_confidence}
    />
  );
}

function CenteredMessage({
  emoji,
  title,
  subtitle,
  cta,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  cta?: { href: string; label: string };
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, sans-serif",
        padding: "48px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: INK,
            margin: "0 0 8px",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontSize: 14,
              color: MUTED,
              margin: "0 0 20px",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
        {cta && (
          <Link
            href={cta.href}
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
            {cta.label}
          </Link>
        )}
      </div>
    </main>
  );
}
