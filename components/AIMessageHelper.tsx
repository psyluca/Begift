"use client";

/**
 * AIMessageHelper — bottone + modale per generare proposte di
 * messaggio via Claude (Haiku).
 *
 * Uso:
 *   <AIMessageHelper
 *     recipientName={name}
 *     senderName={senderAlias}
 *     onPick={(text) => setMsg(text)}
 *   />
 *
 * Il bottone è visibile sempre (anche senza feature flag — la UI è
 * un wrapper minimale che non rompe se l'API fallisce). Al click:
 *   1) Apre modale con selettori tono + occasione
 *   2) "Genera proposte" → POST /api/ai/suggest-message
 *   3) Mostra loader (~2-4 secondi tipico per Haiku)
 *   4) Lista 3 proposte cliccabili; click popola il textarea del
 *      caller via onPick + chiude la modale
 *
 * Errori comuni gestiti:
 *   401 not_authenticated → "Accedi per usare l'assistente AI"
 *   429 rate_limited      → "Troppe richieste, riprova tra qualche minuto"
 *   502 ai_unavailable    → "Servizio AI temporaneamente non disponibile"
 *
 * i18n: usa useI18n per le stringhe UI. Le proposte stesse tornano
 * nella locale corrente via parametro `locale` passato all'API.
 */

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { createSupabaseClient } from "@/lib/supabase/client";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const BORDER = "#e0dbd5";

type Tone = "affettuoso" | "formale" | "scherzoso" | "poetico";

export interface AIMessageHelperProps {
  recipientName: string;
  senderName?: string;
  /** Callback invocato quando l'utente clicca su una proposta */
  onPick: (text: string) => void;
  /** Label del bottone — default "✨ Aiutami a scrivere" */
  buttonLabel?: string;
}

export function AIMessageHelper({ recipientName, senderName, onPick, buttonLabel }: AIMessageHelperProps) {
  const { t, locale } = useI18n() as unknown as { t: (k: string, params?: Record<string, string>) => string; locale: "it" | "en" | "ja" | "zh" };
  const [open, setOpen] = useState(false);

  const canOpen = recipientName.trim().length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => canOpen && setOpen(true)}
        disabled={!canOpen}
        title={canOpen ? undefined : t("ai_helper.need_recipient")}
        style={{
          background: "transparent",
          border: `1.5px solid ${canOpen ? ACCENT : BORDER}`,
          color: canOpen ? ACCENT : MUTED,
          borderRadius: 20,
          padding: "8px 14px",
          fontSize: 12,
          fontWeight: 600,
          cursor: canOpen ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          transition: "all .15s",
        }}
      >
        <span>✨</span>
        <span>{buttonLabel ?? t("ai_helper.open_button")}</span>
      </button>

      {open && (
        <AIMessageModal
          recipientName={recipientName}
          senderName={senderName}
          locale={locale}
          onClose={() => setOpen(false)}
          onPick={(text) => {
            onPick(text);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

// ── Modale ──

interface ModalProps {
  recipientName: string;
  senderName?: string;
  locale: "it" | "en" | "ja" | "zh";
  onClose: () => void;
  onPick: (text: string) => void;
}

function AIMessageModal({ recipientName, senderName, locale, onClose, onPick }: ModalProps) {
  const { t } = useI18n() as unknown as { t: (k: string, p?: Record<string, string>) => string };
  const [tone, setTone] = useState<Tone>("affettuoso");
  const [occasion, setOccasion] = useState("");
  const [contentHint, setContentHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      // Leggo il Bearer token dalla session Supabase corrente. Uso il
      // client ufficiale (che gestisce auto-refresh, sa dove trovare
      // lo storage key qualunque sia il project ref, e recupera da
      // cookie se localStorage è vuoto). Fallback ad una scansione
      // manuale di tutte le chiavi localStorage `sb-*-auth-token` in
      // caso il client non trovi la session (es. dopo un refresh
      // recente).
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const sb = createSupabaseClient();
        const { data } = await sb.auth.getSession();
        let token = data?.session?.access_token;
        if (!token && typeof window !== "undefined") {
          // Fallback: cerca qualunque chiave sb-*-auth-token
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
              try {
                const raw = localStorage.getItem(key);
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (parsed?.access_token) { token = parsed.access_token; break; }
                }
              } catch { /* skip */ }
            }
          }
        }
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch { /* proceed without auth header, server will 401 */ }

      const res = await fetch("/api/ai/suggest-message", {
        method: "POST",
        headers,
        body: JSON.stringify({
          recipientName,
          senderName,
          occasion: occasion || undefined,
          contentHint: contentHint || undefined,
          tone,
          locale,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(errorLabel(data.error ?? String(res.status), t));
        return;
      }
      const data = await res.json();
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setError(t("ai_helper.net_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 0,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "22px 22px 28px",
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          overflowY: "auto",
          animation: "slideUpModal .22s ease-out both",
        }}
      >
        <style>{`@keyframes slideUpModal { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: DEEP }}>
            {t("ai_helper.modal_title")}
          </h3>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", fontSize: 26, color: MUTED, cursor: "pointer", lineHeight: 1, padding: 4 }}
            aria-label={t("ai_helper.close")}
          >
            ×
          </button>
        </div>
        <p style={{ fontSize: 12, color: MUTED, margin: "0 0 18px", lineHeight: 1.5 }}>
          {suggestions
            ? t("ai_helper.done_intro", { name: recipientName })
            : t("ai_helper.intro", { name: recipientName })}
        </p>

        {/* Tone picker */}
        {!suggestions && (
          <>
            <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              {t("ai_helper.tone_label")}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {([
                { v: "affettuoso", labelKey: "ai_helper.tone_affectionate" },
                { v: "formale",    labelKey: "ai_helper.tone_formal" },
                { v: "scherzoso",  labelKey: "ai_helper.tone_playful" },
                { v: "poetico",    labelKey: "ai_helper.tone_poetic" },
              ] as const).map((opt) => {
                const active = tone === opt.v;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setTone(opt.v)}
                    style={{
                      border: `1.5px solid ${active ? ACCENT : BORDER}`,
                      background: active ? `${ACCENT}18` : "#fff",
                      color: active ? ACCENT : DEEP,
                      borderRadius: 20,
                      padding: "7px 12px",
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {t(opt.labelKey)}
                  </button>
                );
              })}
            </div>

            {/* Occasione */}
            <label style={{ display: "block", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                {t("ai_helper.occasion_label")} <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.8 }}>{t("ai_helper.optional")}</span>
              </div>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder={t("ai_helper.occasion_placeholder")}
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: `1.5px solid ${BORDER}`, borderRadius: 10,
                  padding: "10px 12px", fontSize: 14, color: DEEP, outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </label>

            {/* Contesto */}
            <label style={{ display: "block", marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                {t("ai_helper.context_label")} <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.8 }}>{t("ai_helper.optional")}</span>
              </div>
              <textarea
                value={contentHint}
                onChange={(e) => setContentHint(e.target.value)}
                placeholder={t("ai_helper.context_placeholder")}
                rows={2}
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: `1.5px solid ${BORDER}`, borderRadius: 10,
                  padding: "10px 12px", fontSize: 13, color: DEEP, outline: "none",
                  fontFamily: "inherit", resize: "vertical",
                }}
              />
            </label>

            <button
              type="button"
              onClick={generate}
              disabled={loading}
              style={{
                width: "100%",
                background: ACCENT, color: "#fff",
                border: "none", borderRadius: 40,
                padding: "14px", fontSize: 15, fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? t("ai_helper.thinking") : t("ai_helper.generate")}
            </button>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "20px 0", color: MUTED, fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 6, animation: "spin 1.2s linear infinite" }}>✨</div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            Compongo le proposte…
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: "#fee7e7", border: "1px solid #f4b4b4", borderRadius: 10, padding: "10px 12px", marginTop: 12, fontSize: 13, color: "#8b2626" }}>
            {error}
          </div>
        )}

        {/* Suggestions */}
        {suggestions && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPick(s)}
                style={{
                  textAlign: "left",
                  background: "#fff",
                  border: `1.5px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  fontSize: 14,
                  color: DEEP,
                  lineHeight: 1.5,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "border-color .15s, background .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = "#fff9fb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "#fff"; }}
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setSuggestions(null); setError(null); }}
              style={{
                background: "transparent",
                border: `1px solid ${BORDER}`,
                color: MUTED,
                borderRadius: 20,
                padding: "8px 14px",
                fontSize: 12,
                cursor: "pointer",
                marginTop: 4,
                fontFamily: "inherit",
              }}
            >
              ← Genera altre proposte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function errorLabel(code: string, t: (k: string, p?: Record<string, string>) => string): string {
  switch (code) {
    case "not_authenticated": return t("ai_helper.err_not_authenticated");
    case "rate_limited":      return t("ai_helper.err_rate_limited");
    case "ai_unavailable":    return t("ai_helper.err_ai_unavailable");
    case "missing_recipient": return t("ai_helper.err_missing_recipient");
    case "parse_failed":      return t("ai_helper.err_parse_failed");
    default:                  return `Error (${code})`;
  }
}
