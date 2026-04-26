"use client";

/**
 * NotificheTestClient — pagina diagnostica per le push notifications.
 *
 * Mostra all'utente lo STATO della sua sottoscrizione push:
 *  - Browser permission state (default / granted / denied / unsupported)
 *  - PWA install status (utile su iOS dove le push richiedono PWA installata)
 *  - Lista device registrati con provider (FCM/APNs/Mozilla)
 *  - last_used_at di ogni device
 *
 * E permette di MANDARSI una push di test al volo. Doppio uso:
 *  - utente: verifica che funzioni davvero
 *  - founder: tool di debug quando arrivano segnalazioni
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";
const LIGHT = "#f7f5f2";
const BORDER = "#e0dbd5";
const OK = "#3B8C5A";
const WARN = "#D4A340";
const ERR = "#B71C1C";

interface Subscription {
  id: string;
  provider: string;
  token_suffix: string;
  created_at: string;
  last_used_at: string | null;
  user_agent: string | null;
}

type PermState = "default" | "granted" | "denied" | "unsupported";

export default function NotificheTestClient() {
  const [permission, setPermission] = useState<PermState>("default");
  const [pwaStandalone, setPwaStandalone] = useState(false);
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    // 1. Permission state
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission as PermState);
    } else {
      setPermission("unsupported");
    }
    // 2. PWA standalone (display-mode)
    if (typeof window !== "undefined" && "matchMedia" in window) {
      const mq = window.matchMedia("(display-mode: standalone)").matches
        || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setPwaStandalone(mq);
    }
    // 3. Status backend
    (async () => {
      try {
        const res = await fetchAuthed("/api/push/status");
        if (res.status === 401) { setNeedsLogin(true); return; }
        if (!res.ok) return;
        const data = await res.json();
        setSubs(data.subscriptions ?? []);
      } catch (e) {
        console.error("[notifiche-test] status failed", e);
      }
      // 4. Notifiche non lette (per mostrare badge se push hanno fallito ma DB ha)
      try {
        const res = await fetchAuthed("/api/notifications/list?limit=1");
        if (res.ok) {
          const data = await res.json();
          setUnread(data.unread ?? 0);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const sendTest = async () => {
    setBusy(true);
    setTestResult(null);
    try {
      const res = await fetchAuthed("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setTestResult(`Errore: ${data.error || res.status}`);
      } else if (data.skipped) {
        setTestResult("Notifica saltata (preferenza disattivata).");
      } else if (data.sent === 0) {
        setTestResult("Nessuna notifica inviata. Verifica di aver autorizzato le notifiche dal browser.");
      } else {
        setTestResult(`✓ Inviata su ${data.sent} ${data.sent === 1 ? "device" : "device"}. Dovresti vederla tra qualche secondo.`);
      }
    } catch (e) {
      setTestResult("Errore di rete. Riprova.");
    } finally {
      setBusy(false);
    }
  };

  if (needsLogin) {
    return (
      <main style={{ minHeight: "100vh", background: LIGHT, padding: 40, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🔔</div>
        <Link href="/auth/login?next=/settings/notifiche-test" style={{ color: ACCENT, textDecoration: "none" }}>
          Accedi per usare questa pagina
        </Link>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px 80px" }}>
        <Link href="/settings" style={{ color: MUTED, fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
          ← Impostazioni
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: DEEP, margin: "0 0 8px", letterSpacing: "-.5px" }}>
          Test notifiche
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 28px", lineHeight: 1.6 }}>
          Verifica che le notifiche push arrivino davvero. Se qualcosa non funziona, qui capisci cosa.
        </p>

        {/* STATO permesso browser */}
        <Card>
          <CardHeader>Permesso del browser</CardHeader>
          <PermBadge permission={permission} />
          {permission === "default" && (
            <Hint>Non hai ancora dato il permesso. Vai in dashboard, attiva le notifiche dalla card che appare.</Hint>
          )}
          {permission === "denied" && (
            <Hint>
              Il permesso e' stato <b>negato</b>. Per riattivarlo: nelle impostazioni del browser, alla pagina begift.app, sblocca le notifiche.
            </Hint>
          )}
          {permission === "unsupported" && (
            <Hint>Il tuo browser non supporta le notifiche push.</Hint>
          )}
        </Card>

        {/* iOS PWA install status */}
        <Card>
          <CardHeader>Installazione PWA</CardHeader>
          <Row label="Stato">
            {pwaStandalone ? (
              <Badge color={OK}>Installata come app</Badge>
            ) : (
              <Badge color={WARN}>Non installata (solo browser)</Badge>
            )}
          </Row>
          {!pwaStandalone && (
            <Hint>
              Su <b>iPhone</b> le notifiche push funzionano SOLO se BeGift e' installata come app
              (icona sulla Home). Apri questo sito in Safari, tocca l'icona di condivisione, poi
              "Aggiungi alla schermata Home". Su Android invece le push funzionano anche senza installazione.
            </Hint>
          )}
        </Card>

        {/* Subscriptions */}
        <Card>
          <CardHeader>Device registrati</CardHeader>
          {subs === null && <Hint>Caricamento…</Hint>}
          {subs && subs.length === 0 && (
            <Hint>
              Nessun device registrato. Significa che il tuo browser non ha (ancora) sottoscritto le
              push. Vai in dashboard e attivale dalla card "Notifiche".
            </Hint>
          )}
          {subs && subs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {subs.map((s) => (
                <div key={s.id} style={{
                  padding: "10px 12px",
                  background: "#fafaf7",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  fontSize: 12,
                }}>
                  <div style={{ fontWeight: 700, color: DEEP, marginBottom: 4 }}>{s.provider}</div>
                  <div style={{ color: MUTED, fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11 }}>
                    Token: …{s.token_suffix}
                  </div>
                  <div style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>
                    Aggiunto: {new Date(s.created_at).toLocaleDateString("it-IT")}
                    {s.last_used_at && ` · Ultimo uso: ${new Date(s.last_used_at).toLocaleDateString("it-IT")}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notifiche non lette (storico) */}
        {unread > 0 && (
          <Card>
            <CardHeader>Notifiche in attesa</CardHeader>
            <Row label="Non lette">
              <Badge color={ACCENT}>{unread} {unread === 1 ? "notifica" : "notifiche"}</Badge>
            </Row>
            <Hint>
              Hai notifiche che non hai ancora letto. Se la push del momento non e' arrivata
              (cosa che capita), qui le trovi tutte.
            </Hint>
            <Link href="/notifiche" style={{
              display: "inline-block", marginTop: 10,
              color: ACCENT, fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}>
              Apri il centro notifiche →
            </Link>
          </Card>
        )}

        {/* Manda push di test */}
        <Card>
          <CardHeader>Mandami una notifica di test</CardHeader>
          <Hint>
            Se il permesso e' attivo e c'e' almeno un device registrato, dovresti ricevere
            una push subito.
          </Hint>
          <button
            onClick={sendTest}
            disabled={busy || permission !== "granted" || (subs?.length ?? 0) === 0}
            style={{
              marginTop: 12,
              width: "100%",
              background: ACCENT, color: "#fff", border: "none",
              borderRadius: 40, padding: "12px 24px",
              fontSize: 14, fontWeight: 700,
              cursor: busy ? "wait" : "pointer",
              opacity: (permission !== "granted" || (subs?.length ?? 0) === 0) ? 0.5 : 1,
              fontFamily: "inherit",
            }}
          >
            {busy ? "Invio…" : "🎁 Mandami una notifica"}
          </button>
          {testResult && (
            <div style={{
              marginTop: 10, padding: "10px 12px",
              background: testResult.startsWith("✓") ? "#f0f9f0" : "#fff5f5",
              border: `1px solid ${testResult.startsWith("✓") ? "#c5e5c5" : "#f5c6c6"}`,
              borderRadius: 8,
              fontSize: 13, color: testResult.startsWith("✓") ? OK : ERR,
              lineHeight: 1.5,
            }}>
              {testResult}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section style={{
      background: "#fff",
      border: `1px solid ${BORDER}`,
      borderRadius: 14,
      padding: "16px 18px",
      marginBottom: 14,
    }}>
      {children}
    </section>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 800, color: DEEP, marginBottom: 10, letterSpacing: "-.2px" }}>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: MUTED }}>{label}</span>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, margin: "8px 0 0" }}>
      {children}
    </p>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      background: `${color}20`,
      color,
      border: `1px solid ${color}55`,
      borderRadius: 16,
      padding: "3px 10px",
      fontSize: 11,
      fontWeight: 700,
    }}>{children}</span>
  );
}

function PermBadge({ permission }: { permission: PermState }) {
  const map: Record<PermState, { label: string; color: string }> = {
    default: { label: "Non ancora richiesto", color: WARN },
    granted: { label: "✓ Autorizzato", color: OK },
    denied: { label: "Bloccato", color: ERR },
    unsupported: { label: "Non supportato dal browser", color: MUTED },
  };
  const m = map[permission];
  return (
    <Row label="Stato">
      <Badge color={m.color}>{m.label}</Badge>
    </Row>
  );
}
