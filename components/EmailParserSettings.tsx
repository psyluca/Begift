"use client";

/**
 * Sezione per /settings: opt-in al parsing automatico mail.
 *
 * Mostra:
 *   - Toggle on/off per attivare/disattivare la feature
 *   - Indirizzo email da forwardare (copy-to-clipboard)
 *   - Link a /forward-mail (come funziona)
 *   - Link a /drafts (lista bozze utente)
 *
 * Da inserire in SettingsHubClient.tsx come <EmailParserSettings />.
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_EMAIL_PARSER (server-side check
 * + render condizionale qui).
 */

import { useEffect, useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";
import Link from "next/link";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const BORDER = "#e8e4de";
const OK_GREEN = "#3B8C5A";

const FORWARD_ADDRESS =
  process.env.NEXT_PUBLIC_EMAIL_PARSER_ADDRESS || "plans@begift.app";

export default function EmailParserSettings() {
  const [optedIn, setOptedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feature flag check
  const featureEnabled =
    process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER === "true";

  // Carica stato attuale opt-in dal profilo
  useEffect(() => {
    if (!featureEnabled) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetchAuthed("/api/settings/email-parser-optin");
        if (!res.ok) {
          // Se l'endpoint non risponde (es. feature flag off lato server),
          // restiamo in stato disattivato senza crash.
          setOptedIn(false);
          setLoading(false);
          return;
        }
        const j = await res.json();
        setOptedIn(!!j.opted_in);
      } catch {
        setOptedIn(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [featureEnabled]);

  if (!featureEnabled) return null;

  const toggle = async () => {
    if (saving || optedIn === null) return;
    setSaving(true);
    setError(null);
    const newValue = !optedIn;
    try {
      const res = await fetchAuthed("/api/settings/email-parser-optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opted_in: newValue }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Errore salvataggio");
        return;
      }
      setOptedIn(newValue);
    } catch {
      setError("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(FORWARD_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text via prompt
      alert("Copia manualmente: " + FORWARD_ADDRESS);
    }
  };

  return (
    <section
      id="email-parser"
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "20px 18px",
        border: `1px solid ${BORDER}`,
        marginBottom: 16,
      }}
    >
      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: INK,
          margin: "0 0 4px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>📧</span>
        Inoltro mail → regalo automatico
      </h2>
      <p
        style={{
          fontSize: 13,
          color: MUTED,
          margin: "0 0 16px",
          lineHeight: 1.5,
        }}
      >
        Inoltra mail di conferma (concerti, esperienze, viaggi). BeGift estrae
        i dati e prepara un pacco gia&apos; popolato.{" "}
        <Link href="/forward-mail" style={{ color: ACCENT }}>
          Come funziona
        </Link>
      </p>

      {loading ? (
        <p style={{ fontSize: 13, color: MUTED }}>Caricamento…</p>
      ) : (
        <>
          {/* Toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: optedIn ? `1px solid ${BORDER}` : "none",
            }}
          >
            <span style={{ fontSize: 14, color: INK }}>
              {optedIn ? "Attivo" : "Disattivato"}
            </span>
            <button
              onClick={toggle}
              disabled={saving}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                background: optedIn ? ACCENT : "#ddd",
                border: "none",
                position: "relative",
                cursor: saving ? "wait" : "pointer",
                transition: "background .2s",
              }}
              aria-label={optedIn ? "Disattiva" : "Attiva"}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: optedIn ? 23 : 3,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left .2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              />
            </button>
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#a02020", marginTop: 8 }}>
              {error}
            </p>
          )}

          {/* Info quando attivo */}
          {optedIn && (
            <div style={{ marginTop: 12 }}>
              <p
                style={{
                  fontSize: 12,
                  color: MUTED,
                  margin: "0 0 6px",
                }}
              >
                Inoltra le mail a questo indirizzo:
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#fbf9f5",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${BORDER}`,
                }}
              >
                <code
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, monospace",
                    color: INK,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {FORWARD_ADDRESS}
                </code>
                <button
                  onClick={copyAddress}
                  style={{
                    background: copied ? OK_GREEN : ACCENT,
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {copied ? "✓ Copiato" : "Copia"}
                </button>
              </div>
              <Link
                href="/drafts"
                style={{
                  display: "inline-block",
                  fontSize: 13,
                  color: ACCENT,
                  marginTop: 12,
                  textDecoration: "underline",
                }}
              >
                Vedi le tue bozze →
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
