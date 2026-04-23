"use client";

/**
 * CookieBanner con consenso opt-in granulare conforme al
 * Provvedimento del Garante Privacy (n. 231/2021) e al GDPR.
 *
 * 3 categorie:
 *   1. Necessari — sempre attivi, non disabilitabili (sessione, auth,
 *      preferenze linguistiche, device ID per tracking aperture).
 *      Base giuridica: esecuzione contratto / legittimo interesse.
 *   2. Analytics — opt-in. Cookie/storage per statistiche uso.
 *      Attualmente BeGift non ne usa (abbiamo /admin/stats interno)
 *      ma la categoria è pronta per futuro.
 *   3. Marketing — opt-in. Placeholder per futuro. BeGift
 *      esplicitamente non usa advertising nè tracking cross-site.
 *
 * UI: 3 bottoni equivalenti visivamente (Garante richiede che
 * "Rifiuta tutti" sia prominente quanto "Accetta tutti" —
 * NO dark pattern) + "Personalizza" che apre il panel dettagliato
 * con toggle per categoria.
 *
 * Persistenza: localStorage 'begift_cookie_consent_v2' JSON
 *   { necessary: true, analytics: bool, marketing: bool,
 *     timestamp: ... }
 * Versione v2 per forzare ri-prompt degli utenti che avevano
 * accettato con la versione precedente (banner solo-accetta).
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const BORDER = "#e0dbd5";
const LIGHT = "#f7f5f2";

const CONSENT_KEY = "begift_cookie_consent_v2";

interface Consent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (consent: Omit<Consent, "timestamp">) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        ...consent,
        timestamp: Date.now(),
      }));
    } catch { /* ignore */ }
    setVisible(false);
  };

  const acceptAll = () => save({ necessary: true, analytics: true, marketing: true });
  const rejectAll = () => save({ necessary: true, analytics: false, marketing: false });
  const saveCustom = () => save({ necessary: true, analytics, marketing });

  if (!visible) return null;
  if (pathname.startsWith("/auth/")) return null;
  if (pathname.startsWith("/gift/")) return null; // no banner durante apertura regalo

  return (
    <>
      <style>{`
        @keyframes cookieSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .cookie-v2{animation:cookieSlideUp .4s cubic-bezier(.34,1.56,.64,1)}
      `}</style>
      <div
        className="cookie-v2"
        role="dialog"
        aria-labelledby="cookie-title"
        style={{
          position: "fixed", bottom: 72, left: 12, right: 12, zIndex: 150,
          background: "#fff",
          borderRadius: 18,
          padding: detailOpen ? "20px 22px 18px" : "16px 18px",
          boxShadow: "0 12px 36px rgba(0,0,0,.15)",
          border: `1px solid ${BORDER}`,
          maxWidth: 520,
          margin: "0 auto",
          fontFamily: "system-ui, sans-serif",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {!detailOpen ? (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>🍪</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p id="cookie-title" style={{ fontSize: 14, color: DEEP, fontWeight: 800, margin: "0 0 4px" }}>
                  Cookie e preferenze
                </p>
                <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.55 }}>
                  BeGift usa cookie tecnici necessari al funzionamento del servizio. Con il tuo consenso, possiamo attivare anche categorie opzionali.{" "}
                  <Link href="/privacy" style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}>
                    Maggiori informazioni
                  </Link>
                </p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
              <button onClick={rejectAll} style={{
                background: "#fff", color: DEEP,
                border: `1.5px solid ${BORDER}`, borderRadius: 40,
                padding: "10px 14px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Rifiuta tutti
              </button>
              <button onClick={acceptAll} style={{
                background: ACCENT, color: "#fff",
                border: "none", borderRadius: 40,
                padding: "10px 14px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Accetta tutti
              </button>
            </div>
            <button
              onClick={() => setDetailOpen(true)}
              style={{
                background: "transparent", color: MUTED,
                border: "none", marginTop: 10,
                padding: "6px 0", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                display: "block", width: "100%", textAlign: "center",
                textDecoration: "underline",
              }}
            >
              Personalizza le preferenze
            </button>
          </>
        ) : (
          <>
            <p id="cookie-title" style={{ fontSize: 15, color: DEEP, fontWeight: 800, margin: "0 0 14px" }}>
              Preferenze cookie
            </p>

            <CategoryRow
              title="Necessari"
              desc="Cookie di sessione, autenticazione, preferenze linguistiche. Indispensabili al funzionamento del servizio."
              alwaysOn
            />
            <CategoryRow
              title="Analytics"
              desc="Statistiche anonime d'uso per migliorare il servizio. Attualmente non utilizziamo strumenti di analytics."
              checked={analytics}
              onToggle={() => setAnalytics(v => !v)}
            />
            <CategoryRow
              title="Marketing"
              desc="Cookie per finalità pubblicitarie o di tracking cross-site. BeGift non ne utilizza e si impegna a non introdurli senza previo consenso."
              checked={marketing}
              onToggle={() => setMarketing(v => !v)}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
              <button onClick={() => setDetailOpen(false)} style={{
                background: "#fff", color: MUTED,
                border: `1.5px solid ${BORDER}`, borderRadius: 40,
                padding: "10px 14px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Indietro
              </button>
              <button onClick={saveCustom} style={{
                background: ACCENT, color: "#fff",
                border: "none", borderRadius: 40,
                padding: "10px 14px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Salva preferenze
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function CategoryRow({
  title, desc, alwaysOn = false, checked = false, onToggle,
}: {
  title: string;
  desc: string;
  alwaysOn?: boolean;
  checked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div style={{
      padding: "10px 0",
      borderTop: `1px solid ${BORDER}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: DEEP }}>{title}</span>
        {alwaysOn ? (
          <span style={{
            fontSize: 10, fontWeight: 700,
            background: LIGHT, color: MUTED,
            padding: "3px 8px", borderRadius: 10,
            textTransform: "uppercase", letterSpacing: ".04em",
          }}>
            sempre attivi
          </span>
        ) : (
          <button
            onClick={onToggle}
            aria-label={`${title}: ${checked ? "disattiva" : "attiva"}`}
            style={{
              width: 38, height: 22, borderRadius: 12,
              background: checked ? ACCENT : "#d5d0c8",
              position: "relative", border: "none",
              cursor: "pointer", transition: "background .18s",
              flexShrink: 0, padding: 0,
            }}
          >
            <span style={{
              position: "absolute", top: 2,
              left: checked ? 18 : 2,
              width: 18, height: 18, borderRadius: "50%",
              background: "#fff", transition: "left .18s",
              boxShadow: "0 1px 3px rgba(0,0,0,.2)",
            }}/>
          </button>
        )}
      </div>
      <p style={{ fontSize: 11, color: MUTED, margin: 0, lineHeight: 1.5 }}>
        {desc}
      </p>
    </div>
  );
}
