"use client";

/**
 * NewsletterSignup — form compatto di iscrizione alla newsletter.
 *
 * Pattern: input email inline + bottone "Iscriviti".
 * Stati: idle | submitting | success | error.
 * Success: form sostituito da messaggio di ringraziamento + opzione
 * "Iscriviti con un'altra email" (per chi vuole reset).
 *
 * Prop `source`: viene passato all'endpoint per analytics (footer,
 * post-gift, dashboard, ecc.).
 *
 * Stile compatto. Usa lo stile inline esistente (no design tokens,
 * branch ux-p2 e' da main senza overnight).
 */
import { useState } from "react";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const BORDER = "#e8e4de";
const OK = "#3b8c5a";
const ERR = "#c0392b";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export default function NewsletterSignup({
  source = "footer",
  variant = "footer",
}: {
  source?: string;
  variant?: "footer" | "card";
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        const map: Record<string, string> = {
          invalid_email: "L'email non sembra valida. Controlla.",
          invalid_json: "Errore tecnico.",
          server_error: "Si è verificato un errore. Riprova fra poco.",
        };
        setState({
          kind: "error",
          message: map[body.error || ""] || "Errore di rete. Riprova.",
        });
        return;
      }
      setState({ kind: "success" });
    } catch (err) {
      setState({
        kind: "error",
        message: `Errore: ${(err as Error).message}`,
      });
    }
  }

  if (state.kind === "success") {
    return (
      <div
        style={{
          padding: variant === "card" ? "16px 18px" : "10px 14px",
          background: "#ecfdf5",
          border: `1px solid ${OK}`,
          borderRadius: 10,
          fontSize: 13,
          color: INK,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
        role="status"
      >
        <span style={{ fontSize: 18 }} aria-hidden>✓</span>
        <span>
          Iscritto! Ti scriviamo una volta al mese con idee regalo per le
          ricorrenze in arrivo.
        </span>
      </div>
    );
  }

  const cardPadding = variant === "card" ? "18px 20px" : "0";

  return (
    <div style={{ padding: cardPadding }}>
      {variant === "card" && (
        <>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: INK,
              margin: "0 0 4px",
              lineHeight: 1.3,
            }}
          >
            Ricevi idee regalo via email
          </h3>
          <p style={{ fontSize: 13, color: MUTED, margin: "0 0 14px", lineHeight: 1.5 }}>
            Una volta al mese, idee per le ricorrenze in arrivo (Festa Mamma,
            Natale, San Valentino…). Niente spam, cancellazione con un click.
          </p>
        </>
      )}
      <form
        onSubmit={submit}
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          maxWidth: variant === "card" ? "100%" : 420,
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          placeholder="la-tua@email.it"
          disabled={state.kind === "submitting"}
          style={{
            flex: 1,
            minWidth: 180,
            padding: "10px 14px",
            fontSize: 14,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            background: "#fff",
            color: INK,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={state.kind === "submitting" || !email.trim()}
          style={{
            padding: "10px 18px",
            background: state.kind === "submitting" ? "#aaa" : ACCENT,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            border: "none",
            borderRadius: 8,
            cursor: state.kind === "submitting" ? "wait" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {state.kind === "submitting" ? "Iscrivo…" : "Iscriviti"}
        </button>
      </form>
      {state.kind === "error" && (
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 12.5,
            color: ERR,
          }}
        >
          {state.message}
        </p>
      )}
      {variant === "footer" && (
        <p
          style={{
            fontSize: 11,
            color: MUTED,
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          Una mail al mese. Cancellazione con un click.
        </p>
      )}
    </div>
  );
}
