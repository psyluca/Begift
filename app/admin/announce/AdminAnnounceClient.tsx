"use client";

/**
 * AdminAnnounceClient — pagina admin per lanciare campagne email
 * "one-shot". Per ora cablato sulla sola campagna festa_mamma_2026.
 *
 * Pattern UX:
 *  1. Header con info campagna (giorni mancanti, copy preview link)
 *  2. Bottone "Anteprima destinatari" (dry-run)
 *  3. Dopo dry-run: card con count + sample emails + bottone "Invia"
 *  4. Dopo invio: card report con sent/skipped/errors
 *
 * Il bottone "Invia" e' disabilitato finche' l'admin non ha visto un
 * dry-run nella sessione corrente. Confirm() JS prima dell'invio.
 */

import { useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const LIGHT = "#f7f5f2";
const BORDER = "#e0dbd5";
const OK_GREEN = "#3B8C5A";
const WARN = "#D08F2A";
const ERR = "#B71C1C";

interface DryRunResp {
  dry_run: true;
  campaign_id: string;
  days_left: number;
  candidates: number;
  will_send_to: number;
  sample: { email: string; name: string | null }[];
}

interface SendResp {
  dry_run: false;
  campaign_id: string;
  days_left: number;
  candidates: number;
  will_send_to: number;
  sent: number;
  skipped: { already_sent: number; opted_out: number; no_email: number; send_failed: number; no_api_key: number };
  errors: { user_id: string; reason?: string }[];
}

export default function AdminAnnounceClient() {
  const [dryRun, setDryRun] = useState<DryRunResp | null>(null);
  const [sendResult, setSendResult] = useState<SendResp | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDryRun = async () => {
    setBusy(true);
    setError(null);
    setSendResult(null);
    try {
      const res = await fetchAuthed("/api/admin/announce/festa-mamma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: false }),
      });
      if (res.status === 403) {
        setError("403: non sei admin (controlla ADMIN_EMAILS env var su Vercel).");
        return;
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setError(`Errore HTTP ${res.status}: ${txt.slice(0, 200)}`);
        return;
      }
      const data = await res.json();
      setDryRun(data as DryRunResp);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di rete");
    } finally {
      setBusy(false);
    }
  };

  const runSend = async () => {
    if (!dryRun) return;
    const ok = window.confirm(
      `Confermi l'invio reale a ${dryRun.will_send_to} destinatari?\n\nUna volta inviata, la mail NON puo' essere ritirata. Verifica il sample prima.`
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetchAuthed("/api/admin/announce/festa-mamma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setError(`Errore HTTP ${res.status}: ${txt.slice(0, 200)}`);
        return;
      }
      const data = await res.json();
      setSendResult(data as SendResp);
      // dryRun ora non e' piu' valido: i candidati sono stati marchiati.
      setDryRun(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di rete");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 80px" }}>
        <a href="/admin/stats" style={{ color: MUTED, fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 12 }}>
          ← Admin
        </a>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: DEEP, margin: "0 0 6px" }}>
          📣 Campagne email
        </h1>
        <p style={{ fontSize: 13, color: MUTED, margin: "0 0 24px", lineHeight: 1.5 }}>
          Invio one-shot a tutti gli utenti registrati che soddisfano i criteri della campagna. Idempotente — ripetere l'invio non rispedisce a chi l'ha gia' ricevuta.
        </p>

        <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px", border: `1px solid ${BORDER}`, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>💐</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: DEEP, margin: "0 0 4px" }}>
                Festa della Mamma 2026
              </h2>
              <p style={{ fontSize: 12.5, color: MUTED, margin: 0, lineHeight: 1.5 }}>
                campaign_id: <code style={{ background: LIGHT, padding: "1px 5px", borderRadius: 4 }}>festa_mamma_2026</code>
              </p>
              <p style={{ fontSize: 12, color: MUTED, margin: "6px 0 0", lineHeight: 1.5 }}>
                Target: utenti con email + <code style={{ background: LIGHT, padding: "1px 5px", borderRadius: 4 }}>notify_email = true</code> + non gia' marchiati.
              </p>
            </div>
          </div>

          {!dryRun && !sendResult && (
            <button
              onClick={runDryRun}
              disabled={busy}
              style={{
                width: "100%",
                background: busy ? "#e0dbd5" : DEEP,
                color: "#fff",
                border: "none",
                borderRadius: 40,
                padding: "12px",
                fontSize: 14,
                fontWeight: 700,
                cursor: busy ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {busy ? "Calcolo destinatari…" : "🔍 Anteprima destinatari (dry-run)"}
            </button>
          )}

          {dryRun && (
            <>
              <div style={{
                background: LIGHT, borderRadius: 12, padding: "14px 16px",
                marginBottom: 14,
              }}>
                <div style={{ fontSize: 13, color: DEEP, marginBottom: 8, fontWeight: 700 }}>
                  Anteprima
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: DEEP, lineHeight: 1.7 }}>
                  <li><strong>{dryRun.candidates}</strong> utent{dryRun.candidates === 1 ? "e" : "i"} nei criteri</li>
                  <li><strong>{dryRun.will_send_to}</strong> verranno effettivamente raggiunti (limite per chiamata)</li>
                  <li>Festa Mamma: <strong>tra {dryRun.days_left} giorni</strong></li>
                </ul>
              </div>

              {dryRun.sample.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginBottom: 6 }}>
                    Sample (primi 5)
                  </div>
                  <div style={{ background: LIGHT, borderRadius: 12, padding: "10px 14px", fontSize: 12, color: DEEP, fontFamily: "ui-monospace, monospace", lineHeight: 1.7 }}>
                    {dryRun.sample.map((s, i) => (
                      <div key={i}>{s.email}{s.name ? ` (${s.name})` : ""}</div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setDryRun(null); setError(null); }}
                  style={{
                    background: "transparent",
                    border: `1.5px solid ${BORDER}`,
                    color: DEEP,
                    borderRadius: 40,
                    padding: "12px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Annulla
                </button>
                <button
                  onClick={runSend}
                  disabled={busy || dryRun.will_send_to === 0}
                  style={{
                    flex: 1,
                    background: busy || dryRun.will_send_to === 0 ? "#e0dbd5" : ACCENT,
                    color: "#fff",
                    border: "none",
                    borderRadius: 40,
                    padding: "12px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: busy || dryRun.will_send_to === 0 ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {busy ? "Invio in corso…" : `📨 Invia per davvero (${dryRun.will_send_to})`}
                </button>
              </div>
              <p style={{ fontSize: 11, color: MUTED, margin: "10px 0 0", textAlign: "center" }}>
                L'invio richiede ~200ms a destinatario (rate-limit Resend). Per {dryRun.will_send_to} utenti: ~{Math.ceil(dryRun.will_send_to * 0.2)}s.
              </p>
            </>
          )}

          {sendResult && (
            <>
              <div style={{
                background: sendResult.sent > 0 ? "#e8f5ee" : "#fff5e8",
                border: `1.5px solid ${sendResult.sent > 0 ? OK_GREEN : WARN}55`,
                borderRadius: 12, padding: "14px 16px", marginBottom: 14,
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: DEEP, marginBottom: 6 }}>
                  {sendResult.sent > 0 ? `✅ Inviata a ${sendResult.sent} utenti` : "⚠️ Nessuna email inviata"}
                </div>
                <div style={{ fontSize: 12, color: DEEP, lineHeight: 1.7 }}>
                  Skipped:{" "}
                  <strong>{sendResult.skipped.already_sent}</strong> gia' ricevute,{" "}
                  <strong>{sendResult.skipped.opted_out}</strong> opt-out,{" "}
                  <strong>{sendResult.skipped.no_email}</strong> no email,{" "}
                  <strong>{sendResult.skipped.send_failed}</strong> errori invio
                  {sendResult.skipped.no_api_key > 0 && (
                    <> · <span style={{ color: ERR, fontWeight: 700 }}>{sendResult.skipped.no_api_key} no_api_key</span></>
                  )}
                </div>
              </div>

              {sendResult.errors.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: ERR, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, marginBottom: 6 }}>
                    Errori ({sendResult.errors.length})
                  </div>
                  <pre style={{ background: "#fff5f5", border: `1px solid ${ERR}33`, padding: "10px 12px", fontSize: 11, color: DEEP, fontFamily: "ui-monospace, monospace", margin: 0, borderRadius: 8, whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 240, overflow: "auto" }}>
                    {JSON.stringify(sendResult.errors, null, 2)}
                  </pre>
                </div>
              )}

              <button
                onClick={() => { setSendResult(null); setDryRun(null); setError(null); }}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: `1.5px solid ${BORDER}`,
                  color: DEEP,
                  borderRadius: 40,
                  padding: "11px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Reset
              </button>
            </>
          )}
        </div>

        {error && (
          <div style={{
            background: "#fff5f5",
            border: `1.5px solid ${ERR}55`,
            borderRadius: 12,
            padding: "12px 14px",
            color: ERR,
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: `1px solid ${BORDER}`, fontSize: 12, color: MUTED, lineHeight: 1.7 }}>
          <strong style={{ color: DEEP }}>Pre-flight check:</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            <li>Migration <code>018_email_campaigns.sql</code> eseguita su Supabase</li>
            <li><code>RESEND_API_KEY</code> settata su Vercel</li>
            <li>Dominio <code>begift.app</code> verificato su Resend</li>
            <li>Hai aperto la <a href="/festa-mamma" target="_blank" rel="noopener" style={{ color: ACCENT }}>landing /festa-mamma</a> e funziona</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
