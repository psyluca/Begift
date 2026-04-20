"use client";

/**
 * CreditWallet — UI minima del wallet di crediti per il dashboard utente.
 *
 * Mostra:
 *   - Saldo grande in alto
 *   - Moltiplicatore tier corrente (chip colorato)
 *   - Lifetime earned / spent (piccolo, discreto)
 *   - Lista delle ultime transazioni
 *   - Modale "Come guadagnare" con le regole
 *
 * La UI è volutamente semplice (MVP). Polish visivo + animazioni toast
 * arrivano in una pass successiva.
 *
 * Visibile solo se `NEXT_PUBLIC_ENABLE_CREDITS_WALLET=true`.
 * Mostra un piccolo teaser "Sblocca il wallet" per utenti free senza
 * gift creati (moltiplicatore 0), altrimenti mostra saldo vero.
 */

import { useState } from "react";
import { useCredits } from "@/hooks/useCredits";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const SURFACE = "#fff";
const BORDER = "#e0dbd5";

export function CreditWallet({ userId }: { userId: string | null }) {
  const { balance, lifetimeEarned, lifetimeSpent, transactions, rules, multiplier, loading, error } = useCredits(userId);
  const [showEarnModal, setShowEarnModal] = useState(false);

  if (!userId) return null;

  if (loading) {
    return (
      <WalletShell>
        <div style={{ textAlign: "center", padding: 20, color: MUTED, fontSize: 13 }}>
          Caricamento wallet…
        </div>
      </WalletShell>
    );
  }

  if (error) {
    return (
      <WalletShell>
        <div style={{ textAlign: "center", padding: 20, color: "#c44", fontSize: 13 }}>
          Errore caricamento wallet: {error}
        </div>
      </WalletShell>
    );
  }

  const isLocked = multiplier === 0;

  return (
    <WalletShell>
      {/* Header: saldo + moltiplicatore */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Saldo crediti
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: DEEP, lineHeight: 1 }}>
            {balance}
            <span style={{ fontSize: 14, color: MUTED, fontWeight: 400, marginLeft: 6 }}>crediti</span>
          </div>
        </div>
        <MultiplierChip value={multiplier} />
      </div>

      {/* Lifetime stats */}
      {!isLocked && (lifetimeEarned > 0 || lifetimeSpent > 0) && (
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: MUTED, marginTop: 10 }}>
          <span>Guadagnati in totale: <strong style={{ color: DEEP }}>{lifetimeEarned}</strong></span>
          <span>Spesi: <strong style={{ color: DEEP }}>{lifetimeSpent}</strong></span>
        </div>
      )}

      {/* Teaser per utenti locked */}
      {isLocked && (
        <div style={{
          marginTop: 12,
          padding: "10px 12px",
          background: "rgba(212, 83, 126, 0.08)",
          border: `1px solid rgba(212, 83, 126, 0.25)`,
          borderRadius: 10,
          fontSize: 12,
          color: DEEP,
          lineHeight: 1.5,
        }}>
          <strong>Il wallet si sblocca col primo regalo.</strong><br/>
          Crea un regalo (anche quello base) e inizia a guadagnare crediti ogni volta che un destinatario lo apre o lo condivide.
        </div>
      )}

      {/* CTA: come guadagnare */}
      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => setShowEarnModal(true)}
          style={{
            background: "transparent",
            border: `1px solid ${BORDER}`,
            color: ACCENT,
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Come guadagnare crediti →
        </button>
      </div>

      {/* Storico transazioni (ultime 5 per non affollare) */}
      {transactions.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Movimenti recenti
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {transactions.slice(0, 5).map((t) => (
              <li key={t.id} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: `1px solid ${BORDER}`,
                fontSize: 13,
              }}>
                <span style={{ color: DEEP }}>
                  {reasonLabel(t.reason)}
                </span>
                <span style={{
                  color: t.delta > 0 ? "#2c8a4a" : "#c44",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {t.delta > 0 ? `+${t.delta}` : t.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modale "Come guadagnare" */}
      {showEarnModal && (
        <EarnModal
          rules={rules}
          multiplier={multiplier}
          onClose={() => setShowEarnModal(false)}
        />
      )}
    </WalletShell>
  );
}

// ── Sottocomponenti ──

function WalletShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderRadius: 16,
      padding: "16px 18px",
      fontFamily: "system-ui, sans-serif",
    }}>
      {children}
    </div>
  );
}

function MultiplierChip({ value }: { value: number }) {
  const label = value === 0 ? "Bloccato" :
                value <= 0.5 ? `${value}×` :
                value === 1   ? `1×` :
                                `${value}× Pro`;
  const bg = value === 0 ? "#efe8e2" :
             value < 1   ? "#f8e4ce" :
             value === 1 ? "#e6efdb" :
                           "#fde0ea";
  const fg = value === 0 ? MUTED :
             value < 1   ? "#a57035" :
             value === 1 ? "#4a6a2c" :
                           ACCENT;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      background: bg,
      color: fg,
      fontSize: 11,
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: 12,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

interface Rule {
  reason: string;
  base_value: number;
  description: string | null;
}

function EarnModal({ rules, multiplier, onClose }: { rules: Rule[]; multiplier: number; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: SURFACE,
          borderRadius: 20,
          padding: "24px 22px",
          maxWidth: 420,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: DEEP }}>
            Come guadagnare crediti
          </h2>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", fontSize: 24, color: MUTED, cursor: "pointer" }}
            aria-label="Chiudi"
          >
            ×
          </button>
        </div>
        <p style={{ fontSize: 12, color: MUTED, marginTop: 0, marginBottom: 18, lineHeight: 1.5 }}>
          Il tuo moltiplicatore corrente è <strong style={{ color: DEEP }}>{multiplier}×</strong>.
          Ogni credito base viene moltiplicato in base al tuo tier.
          {multiplier === 0 && " Crea il tuo primo regalo per sbloccare il wallet."}
        </p>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rules.map((r) => {
            const effective = Math.floor(r.base_value * multiplier);
            return (
              <li key={r.reason} style={{ padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 13, color: DEEP, flex: 1 }}>
                    {r.description ?? reasonLabel(r.reason)}
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: multiplier === 0 ? MUTED : "#2c8a4a",
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}>
                    {multiplier === 0 ? `+${r.base_value}` : `+${effective || r.base_value}`}
                    {multiplier > 0 && multiplier !== 1 && effective !== r.base_value && (
                      <span style={{ fontSize: 10, color: MUTED, fontWeight: 400, marginLeft: 4 }}>
                        (base {r.base_value})
                      </span>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <p style={{ fontSize: 10, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
          I crediti scadono 12 mesi dopo essere stati guadagnati. Alcune azioni hanno un cooldown per coppia mittente-destinatario per evitare abusi.
        </p>
      </div>
    </div>
  );
}

// Traduzione italiana leggibile delle reason tecniche del ledger.
function reasonLabel(reason: string): string {
  switch (reason) {
    case "open_gift":          return "Il tuo regalo è stato aperto";
    case "share_gift":         return "Il tuo regalo è stato condiviso";
    case "referral_converted": return "Un destinatario è diventato mittente";
    case "first_gift":         return "Primo regalo creato";
    case "weekly_streak":      return "Streak settimanale (4 settimane)";
    case "feedback_received":  return "Feedback ricevuto dal destinatario";
    case "invite_installed":   return "Un invito ha generato un account pagante";
    case "profile_complete":   return "Profilo completato";
    case "gift_received":      return "Regalo ricevuto da un amico";
    case "gift_shared_rcvd":   return "Regalo ricevuto e condiviso";
    case "spend_pro_gift":          return "Sblocco: regalo Pro";
    case "spend_custom_paper":      return "Sblocco: carta personalizzata";
    case "spend_custom_song":       return "Sblocco: canzone personalizzata";
    case "spend_ai_pattern":        return "Sblocco: pattern AI";
    case "spend_24h_pro":           return "Sblocco: 24h Pro";
    case "spend_month_pro":         return "Sblocco: 1 mese Pro";
    case "spend_skin_preview":      return "Sblocco: skin in anteprima";
    case "spend_cosmetic":          return "Sblocco: cosmetico";
    default:                   return reason;
  }
}
