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
import { ensurePushSubscription } from "@/lib/pushSubscribe";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const [permission, setPermission] = useState<PermState>("default");
  const [pwaStandalone, setPwaStandalone] = useState(false);
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectResult, setReconnectResult] = useState<string | null>(null);
  // Flag che abilita il bottone test per qualche secondo dopo una
  // riconnessione riuscita, anche se il refetch server-side dello
  // stato non e' ancora arrivato/non vede ancora la sub appena salvata.
  const [justReconnected, setJustReconnected] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<string | null>(null);
  const [debug, setDebug] = useState<Record<string, unknown> | null>(null);

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
        setDebug(data.debug ?? null);
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

  const reloadStatus = async () => {
    try {
      const res = await fetchAuthed("/api/push/status");
      if (res.ok) {
        const data = await res.json();
        setSubs(data.subscriptions ?? []);
        setDebug(data.debug ?? null);
      }
    } catch { /* ignore */ }
  };

  const cleanup = async () => {
    if (!confirm(t("settings_notif_test.cleanup_confirm"))) return;
    setCleaning(true);
    setCleanResult(null);
    try {
      // Step 1: cancella TUTTE le sub server-side
      const res = await fetchAuthed("/api/push/cleanup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setCleanResult(t("settings_notif_test.cleanup_error", { error: String(data.error || res.status) }));
        return;
      }
      // Step 2: crea una sub fresca con forceRefresh per evitare di
      // riusare la stale che il SW potrebbe avere ancora in cache.
      const sub = await ensurePushSubscription({ forceRefresh: true });
      if (sub.ok) {
        setCleanResult(t("settings_notif_test.cleanup_success", { deleted: String(data.deleted) }));
        setJustReconnected(true);
        // Dai tempo al DB di propagare l'upsert prima di rileggere lo stato.
        setTimeout(() => { reloadStatus(); }, 1500);
        setTimeout(() => { reloadStatus(); }, 4500);
      } else {
        setCleanResult(t("settings_notif_test.cleanup_partial", { deleted: String(data.deleted), reason: sub.reason }));
        await reloadStatus();
      }
    } catch (e) {
      console.error("[cleanup] failed", e);
      setCleanResult(t("settings_notif_test.test_network_error"));
    } finally {
      setCleaning(false);
    }
  };

  const reconnect = async () => {
    setReconnecting(true);
    setReconnectResult(null);
    try {
      // forceRefresh: butta via la subscription stale del SW e ne crea
      // una fresca. Risolve il drift "endpoint stale" tipico di iOS
      // dove il browser pensa di avere una sub valida ma il push
      // service la rifiuta (410 Gone), il server cancella la riga e
      // l'utente resta fantasma.
      const result = await ensurePushSubscription({ forceRefresh: true });
      if (result.ok) {
        const action = result.refreshed
          ? t("settings_notif_test.reconnect_action_refreshed")
          : (result.created ? t("settings_notif_test.reconnect_action_created") : t("settings_notif_test.reconnect_action_realigned"));
        setReconnectResult(t("settings_notif_test.reconnect_success", { action }));
        // Abilita subito il bottone test anche se il fetch dello stato
        // potrebbe non riflettere ancora la nuova subscription (race
        // possibile con il DB su Supabase region remota).
        setJustReconnected(true);
        // Reload con piccolo ritardo per dare tempo al DB di propagare
        // l'upsert. Su iPhone iOS PWA puo' essere ancora piu' lento.
        setTimeout(() => { reloadStatus(); }, 1500);
        // Secondo retry dopo altri 3 secondi se ancora 0 (resilienza).
        setTimeout(() => { reloadStatus(); }, 4500);
      } else {
        const reasonKey: Record<string, string> = {
          unsupported: "settings_notif_test.reconnect_err_unsupported",
          permission: "settings_notif_test.reconnect_err_permission",
          vapid: "settings_notif_test.reconnect_err_vapid",
          save_failed: "settings_notif_test.reconnect_err_save_failed",
          subscribe_failed: "settings_notif_test.reconnect_err_subscribe_failed",
          auth: "settings_notif_test.reconnect_err_auth",
        };
        const msg = reasonKey[result.reason] ? t(reasonKey[result.reason]) : t("settings_notif_test.reconnect_err_generic", { reason: result.reason });
        setReconnectResult(msg);
      }
    } catch (e) {
      console.error("[notifiche-test] reconnect failed", e);
      setReconnectResult(t("settings_notif_test.reconnect_network_error"));
    } finally {
      setReconnecting(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    setTestResult(null);
    try {
      const res = await fetchAuthed("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setTestResult(t("settings_notif_test.test_error", { error: String(data.error || res.status) }));
      } else if (data.skipped) {
        setTestResult(t("settings_notif_test.test_skipped"));
      } else if (data.sent === 0) {
        setTestResult(t("settings_notif_test.test_no_devices"));
      } else {
        const key = data.sent === 1 ? "settings_notif_test.test_sent_one" : "settings_notif_test.test_sent_many";
        setTestResult(t(key, { n: String(data.sent) }));
      }
    } catch (e) {
      setTestResult(t("settings_notif_test.test_network_error"));
    } finally {
      setBusy(false);
      // Dopo il test, refresh dello stato per aggiornare la lista
      // device (utile per mostrare last_used_at nuovo).
      setTimeout(() => { reloadStatus(); }, 800);
    }
  };

  if (needsLogin) {
    return (
      <main style={{ minHeight: "100vh", background: LIGHT, padding: 40, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🔔</div>
        <Link href="/auth/login?next=/settings/notifiche-test" style={{ color: ACCENT, textDecoration: "none" }}>
          {t("settings_notif_test.needs_login")}
        </Link>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px 80px" }}>
        <Link href="/settings" style={{ color: MUTED, fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
          {t("settings_notif_test.back_settings")}
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: DEEP, margin: "0 0 8px", letterSpacing: "-.5px" }}>
          {t("settings_notif_test.title")}
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 28px", lineHeight: 1.6 }}>
          {t("settings_notif_test.subtitle")}
        </p>

        {/* STATO permesso browser */}
        <Card>
          <CardHeader>{t("settings_notif_test.card_browser_perm")}</CardHeader>
          <PermBadge permission={permission} t={t} />
          {permission === "default" && (
            <Hint>{t("settings_notif_test.hint_perm_default")}</Hint>
          )}
          {permission === "denied" && (
            <Hint><span dangerouslySetInnerHTML={{ __html: t("settings_notif_test.hint_perm_denied") }} /></Hint>
          )}
          {permission === "unsupported" && (
            <Hint>{t("settings_notif_test.hint_perm_unsupported")}</Hint>
          )}
        </Card>

        {/* iOS PWA install status */}
        <Card>
          <CardHeader>{t("settings_notif_test.card_pwa_install")}</CardHeader>
          <Row label={t("settings_notif_test.row_status")}>
            {pwaStandalone ? (
              <Badge color={OK}>{t("settings_notif_test.pwa_installed")}</Badge>
            ) : (
              <Badge color={WARN}>{t("settings_notif_test.pwa_not_installed")}</Badge>
            )}
          </Row>
          {!pwaStandalone && (
            <Hint><span dangerouslySetInnerHTML={{ __html: t("settings_notif_test.hint_pwa_not_installed") }} /></Hint>
          )}
        </Card>

        {/* Subscriptions */}
        <Card>
          <CardHeader>{t("settings_notif_test.card_devices")}</CardHeader>
          {subs === null && <Hint>{t("settings_notif_test.loading")}</Hint>}
          {subs && subs.length === 0 && (
            <>
              {permission === "granted" ? (
                <>
                  <Hint><span dangerouslySetInnerHTML={{ __html: t("settings_notif_test.hint_anomalous") }} /></Hint>
                  <button
                    onClick={reconnect}
                    disabled={reconnecting}
                    style={{
                      marginTop: 12,
                      width: "100%",
                      background: ACCENT, color: "#fff", border: "none",
                      borderRadius: 40, padding: "11px 22px",
                      fontSize: 14, fontWeight: 700,
                      cursor: reconnecting ? "wait" : "pointer",
                      opacity: reconnecting ? 0.7 : 1,
                      fontFamily: "inherit",
                    }}
                  >
                    {reconnecting ? t("settings_notif_test.btn_reconnecting") : t("settings_notif_test.btn_reconnect")}
                  </button>
                  {reconnectResult && (
                    <div style={{
                      marginTop: 10, padding: "10px 12px",
                      background: reconnectResult.startsWith("✓") ? "#f0f9f0" : "#fff5f5",
                      border: `1px solid ${reconnectResult.startsWith("✓") ? "#c5e5c5" : "#f5c6c6"}`,
                      borderRadius: 8,
                      fontSize: 13, color: reconnectResult.startsWith("✓") ? OK : ERR,
                      lineHeight: 1.5,
                    }}>
                      {reconnectResult}
                    </div>
                  )}
                </>
              ) : (
                <Hint>{t("settings_notif_test.hint_no_devices")}</Hint>
              )}
            </>
          )}
          {/* Cleanup duplicati: visibile sempre se ci sono >1 sub, o se
              il backend dice che ce ne sono ma il client non le vede. */}
          {(() => {
            // FIX: usiamo SOLO subs.length (length effettiva dell'array
            // SELECT) per decidere se mostrare il banner duplicati.
            // Il count "exact" di Supabase JS puo' usare statistiche
            // stimate da pg_stats che restano stale anche dopo le
            // cancellazioni — non e' affidabile.
            const realCount = subs?.length ?? 0;
            if (realCount <= 1) return null;
            return (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#fffaf0", border: "1px solid #f0e1c5", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: DEEP, fontWeight: 600, marginBottom: 6 }}>
                {t("settings_notif_test.duplicates_warning", { count: String(realCount) })}
              </div>
              <button
                onClick={cleanup}
                disabled={cleaning}
                style={{
                  background: WARN, color: "#fff", border: "none",
                  borderRadius: 20, padding: "6px 14px",
                  fontSize: 12, fontWeight: 700,
                  cursor: cleaning ? "wait" : "pointer", opacity: cleaning ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {cleaning ? t("settings_notif_test.btn_cleaning") : t("settings_notif_test.btn_cleanup")}
              </button>
              {cleanResult && (
                <div style={{ marginTop: 8, fontSize: 12, color: cleanResult.startsWith("✓") ? OK : ERR }}>
                  {cleanResult}
                </div>
              )}
            </div>
            );
          })()}
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
                    {t("settings_notif_test.label_token", { suffix: s.token_suffix })}
                  </div>
                  <div style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>
                    {t("settings_notif_test.label_added", { date: new Date(s.created_at).toLocaleDateString() })}
                    {s.last_used_at && ` · ${t("settings_notif_test.label_last_used", { date: new Date(s.last_used_at).toLocaleDateString() })}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notifiche non lette (storico) */}
        {unread > 0 && (
          <Card>
            <CardHeader>{t("settings_notif_test.card_pending_notifs")}</CardHeader>
            <Row label={t("settings_notif_test.row_unread")}>
              <Badge color={ACCENT}>{t(unread === 1 ? "settings_notif_test.unread_one" : "settings_notif_test.unread_other", { n: String(unread) })}</Badge>
            </Row>
            <Hint>{t("settings_notif_test.hint_pending")}</Hint>
            <Link href="/notifiche" style={{
              display: "inline-block", marginTop: 10,
              color: ACCENT, fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}>
              {t("settings_notif_test.open_notif_center")}
            </Link>
          </Card>
        )}

        {/* Manda push di test */}
        <Card>
          <CardHeader>{t("settings_notif_test.card_send_test")}</CardHeader>
          <Hint>{t("settings_notif_test.hint_send_test")}</Hint>
          <button
            onClick={sendTest}
            disabled={busy || permission !== "granted" || ((subs?.length ?? 0) === 0 && !justReconnected)}
            style={{
              marginTop: 12,
              width: "100%",
              background: ACCENT, color: "#fff", border: "none",
              borderRadius: 40, padding: "12px 24px",
              fontSize: 14, fontWeight: 700,
              cursor: busy ? "wait" : "pointer",
              opacity: (permission !== "granted" || ((subs?.length ?? 0) === 0 && !justReconnected)) ? 0.5 : 1,
              fontFamily: "inherit",
            }}
          >
            {busy ? t("settings_notif_test.btn_sending") : t("settings_notif_test.btn_send_test")}
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

        {/* Debug — visibile sempre per ora finche' non risolviamo il
            mismatch "backend dice X, client vede Y". */}
        {debug && (
          <Card>
            <CardHeader>{t("settings_notif_test.card_diag")}</CardHeader>
            <Hint>{t("settings_notif_test.hint_diag")}</Hint>
            <pre style={{
              fontSize: 10, color: DEEP, fontFamily: "ui-monospace,Menlo,monospace",
              marginTop: 8, lineHeight: 1.6,
              background: "#fafaf7", padding: 10, borderRadius: 8,
              border: "1px solid #e0dbd5",
              whiteSpace: "pre-wrap", wordBreak: "break-all",
              maxHeight: 240, overflow: "auto",
            }}>
              {JSON.stringify(debug, null, 2)}
            </pre>
          </Card>
        )}
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

function PermBadge({ permission, t }: { permission: PermState; t: (k: string, p?: Record<string, string>) => string }) {
  const map: Record<PermState, { labelKey: string; color: string }> = {
    default: { labelKey: "settings_notif_test.perm_default", color: WARN },
    granted: { labelKey: "settings_notif_test.perm_granted", color: OK },
    denied: { labelKey: "settings_notif_test.perm_denied", color: ERR },
    unsupported: { labelKey: "settings_notif_test.perm_unsupported", color: MUTED },
  };
  const m = map[permission];
  return (
    <Row label={t("settings_notif_test.row_status")}>
      <Badge color={m.color}>{t(m.labelKey)}</Badge>
    </Row>
  );
}
