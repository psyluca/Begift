"use client";

/**
 * SettingsHubClient — pagina unica con tutte le impostazioni utente.
 * Progettata per sostituire /settings/profile e /settings/reminders
 * (che ora redirectano qui con scroll all'anchor relativa).
 *
 * Struttura a sezioni card. Ogni sezione è autonoma (può ricaricarsi)
 * e usa fetchAuthed per robust auth.
 */

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { fetchAuthed } from "@/lib/clientAuth";
import { useAuth } from "@/hooks/useAuth";
import LangSwitcher from "@/components/LangSwitcher";
import Link from "next/link";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const LIGHT = "#f7f5f2";
const BORDER = "#e8e4de";
const OK_GREEN = "#3B8C5A";
const ERR_RED = "#B71C1C";

interface Profile {
  id: string;
  email: string;
  username: string | null;
  notify_gift_received: boolean;
  notify_gift_opened: boolean;
  notify_reaction: boolean;
}

interface Reminder {
  id: string;
  recipient_name: string;
  month: number;
  day: number;
  occasion_type: string;
  notify_days_before: number;
}

const OCCASION_EMOJI: Record<string, string> = {
  birthday: "🎂",
  anniversary: "💍",
  name_day: "🎊",
  graduation: "🎓",
  other: "✨",
};

export default function SettingsHubClient() {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isStandalone, setIsStandalone] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setNeedsLogin(false);
    try {
      const [profileRes, remindersRes] = await Promise.all([
        fetchAuthed("/api/profile/me"),
        fetchAuthed("/api/reminders"),
      ]);
      if (profileRes.status === 401 || remindersRes.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (profileRes.ok) setProfile(await profileRes.json());
      if (remindersRes.ok) setReminders(await remindersRes.json());
    } catch (e) {
      console.error("[settings] load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // Detect PWA + push permission
    if (typeof window !== "undefined") {
      const nav = window.navigator as { standalone?: boolean };
      const standalone = nav.standalone === true || window.matchMedia?.("(display-mode: standalone)").matches;
      setIsStandalone(!!standalone);
      if ("Notification" in window) {
        setPushPermission(Notification.permission);
      } else {
        setPushPermission("unsupported");
      }
    }
  }, []);

  const toggleNotification = async (key: keyof Profile, current: boolean) => {
    if (!profile) return;
    // Optimistic update
    setProfile({ ...profile, [key]: !current } as Profile);
    try {
      const res = await fetchAuthed("/api/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !current }),
      });
      if (!res.ok) {
        // Rollback
        setProfile({ ...profile });
      }
    } catch (e) {
      console.error("[settings] toggle failed", e);
      setProfile({ ...profile }); // rollback
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm(t("settings_hub.delete_reminder_confirm"))) return;
    try {
      const res = await fetchAuthed(`/api/reminders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (e) { console.error("[settings] delete reminder failed", e); }
  };

  if (needsLogin) {
    return (
      <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>⚙️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 10px" }}>{t("settings_hub.needs_login_title")}</h1>
        <a href="/auth/login?next=/settings" style={{ background: ACCENT, color: "#fff", borderRadius: 40, padding: "13px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none", marginTop: 12 }}>
          {t("settings_hub.needs_login_cta")}
        </a>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "28px 20px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: DEEP, margin: "0 0 6px", letterSpacing: "-.5px" }}>
          {t("settings_hub.title")}
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 22px" }}>
          {t("settings_hub.subtitle")}
        </p>

        {/* ── PROFILO ──────────────────────────────────── */}
        <Section title={t("settings_hub.section_profile")} id="profile">
          {loading && !profile ? (
            <div style={{ color: MUTED, fontSize: 13, padding: "6px 0" }}>{t("settings_hub.loading")}</div>
          ) : profile ? (
            <>
              <Row
                label={t("settings_hub.row_username")}
                value={profile.username ? `@${profile.username}` : <em style={{ color: MUTED }}>{t("settings_hub.row_username_unset")}</em>}
              />
              <Row label={t("settings_hub.row_email")} value={<span style={{ fontSize: 12 }}>{profile.email}</span>} />
              <Link href="/settings/profile" style={{
                display: "block", textAlign: "center",
                marginTop: 10, padding: "10px",
                background: "transparent", color: ACCENT,
                border: `1.5px solid ${ACCENT}`, borderRadius: 40,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>
                {t("settings_hub.change_username")}
              </Link>
            </>
          ) : null}
        </Section>

        {/* ── NOTIFICHE ────────────────────────────────── */}
        <Section title={t("settings_hub.section_notifications")} id="notifications">
          {pushPermission === "unsupported" ? (
            <div style={{ fontSize: 13, color: MUTED, padding: "8px 0", lineHeight: 1.5 }}>
              {t("settings_hub.push_unsupported")}
            </div>
          ) : pushPermission === "denied" ? (
            <div style={{ fontSize: 13, color: ERR_RED, padding: "8px 0", lineHeight: 1.5 }}>
              {t("settings_hub.push_denied")}
            </div>
          ) : pushPermission === "default" ? (
            <div style={{ padding: "6px 0" }}>
              <p style={{ fontSize: 13, color: MUTED, margin: "0 0 8px", lineHeight: 1.5 }}>
                {t("settings_hub.push_default_intro")}
              </p>
              <p style={{ fontSize: 11, color: MUTED, margin: "0 0 12px", lineHeight: 1.5, opacity: 0.85 }}>
                {t("settings_hub.push_privacy_note")}
                <a href="/privacy" style={{ color: ACCENT, textDecoration: "none" }}>{t("settings_hub.push_privacy_link")}</a>
                {t("settings_hub.push_privacy_note_end")}
              </p>
              <EnablePushButton onEnabled={() => setPushPermission("granted")} t={t} />
            </div>
          ) : profile ? (
            <>
              <ToggleRow
                label={t("settings_hub.toggle_gift_received")}
                checked={profile.notify_gift_received}
                onToggle={() => toggleNotification("notify_gift_received", profile.notify_gift_received)}
              />
              <ToggleRow
                label={t("settings_hub.toggle_gift_opened")}
                checked={profile.notify_gift_opened}
                onToggle={() => toggleNotification("notify_gift_opened", profile.notify_gift_opened)}
              />
              <ToggleRow
                label={t("settings_hub.toggle_reaction")}
                checked={profile.notify_reaction}
                onToggle={() => toggleNotification("notify_reaction", profile.notify_reaction)}
              />
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}`, fontSize: 11, color: MUTED }}
                   dangerouslySetInnerHTML={{ __html: t("settings_hub.browser_perm_active").replace("<strong>", `<strong style="color:${OK_GREEN}">`) }} />
            </>
          ) : null}
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/notifiche" style={{
              display: "block", textAlign: "center",
              padding: "10px",
              background: "transparent", color: ACCENT,
              border: `1.5px solid ${ACCENT}`, borderRadius: 40,
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}>
              {t("settings_hub.history_notif_cta")}
            </Link>
            <Link href="/settings/notifiche-test" style={{
              display: "block", textAlign: "center",
              padding: "10px",
              background: "transparent", color: MUTED,
              border: `1.5px solid ${BORDER}`, borderRadius: 40,
              fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              {t("settings_hub.test_notif_cta")}
            </Link>
          </div>
        </Section>

        {/* ── RICORRENZE ───────────────────────────────── */}
        <Section title={t("settings_hub.section_reminders")} id="reminders">
          {loading ? (
            <div style={{ color: MUTED, fontSize: 13, padding: "6px 0" }}>{t("settings_hub.loading")}</div>
          ) : reminders.length === 0 ? (
            <p style={{ fontSize: 13, color: MUTED, margin: "4px 0 12px", lineHeight: 1.5 }}>
              {t("settings_hub.reminders_empty")}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {reminders.map((r) => {
                const emoji = OCCASION_EMOJI[r.occasion_type] ?? "✨";
                const dd = String(r.day).padStart(2, "0");
                const mm = String(r.month).padStart(2, "0");
                return (
                  <div key={r.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", background: LIGHT, borderRadius: 10,
                  }}>
                    <span style={{ fontSize: 18 }}>{emoji}</span>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <strong style={{ color: DEEP }}>{r.recipient_name}</strong>
                      <span style={{ color: MUTED, fontSize: 11, marginLeft: 6 }}>
                        {t("settings_hub.reminder_meta_format", { date: `${dd}/${mm}`, days: String(r.notify_days_before) })}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteReminder(r.id)}
                      aria-label={t("settings_hub.delete_aria")}
                      style={{
                        background: "transparent", border: "none",
                        fontSize: 14, color: "#E24B4A", cursor: "pointer",
                        padding: "4px 6px", lineHeight: 1,
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <Link href="/settings/reminders" style={{
            display: "block", textAlign: "center",
            padding: "10px",
            background: "transparent", color: ACCENT,
            border: `1.5px solid ${ACCENT}`, borderRadius: 40,
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            {t("settings_hub.add_reminder_cta")}
          </Link>
        </Section>

        {/* ── LINGUA ───────────────────────────────────── */}
        <Section title={t("settings_hub.section_language")} id="language">
          <div style={{ padding: "4px 0" }}>
            <LangSwitcher />
          </div>
        </Section>

        {/* ── INSTALLAZIONE ───────────────────────────── */}
        <Section title={t("settings_hub.section_install")} id="install">
          {isStandalone ? (
            <div style={{ fontSize: 13, color: OK_GREEN, fontWeight: 600 }}>
              {t("settings_hub.install_done")}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: MUTED, margin: "0 0 10px", lineHeight: 1.5 }}>
                {t("settings_hub.install_intro")}
              </p>
              <Link href="/install" style={{
                display: "block", textAlign: "center",
                padding: "10px",
                background: "transparent", color: ACCENT,
                border: `1.5px solid ${ACCENT}`, borderRadius: 40,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>
                {t("settings_hub.install_cta")}
              </Link>
            </div>
          )}
        </Section>

        {/* ── CONTATTI ─────────────────────────────────── */}
        <Section title={t("settings_hub.section_contacts")} id="contacts">
          <Row
            label={t("settings_hub.row_support")}
            value={<a href="mailto:support@begift.app" style={{ color: ACCENT, textDecoration: "none", fontSize: 12 }}>support@begift.app</a>}
          />
          <Row
            label={t("settings_hub.row_info")}
            value={<a href="mailto:info@begift.app" style={{ color: ACCENT, textDecoration: "none", fontSize: 12 }}>info@begift.app</a>}
          />
          <Row
            label={t("settings_hub.row_abuse")}
            value={<a href="mailto:abuse@begift.app" style={{ color: ACCENT, textDecoration: "none", fontSize: 12 }}>abuse@begift.app</a>}
          />
        </Section>

        {/* ── LEGALE ───────────────────────────────────── */}
        <Section title={t("settings_hub.section_legal")} id="legal">
          <Row
            label={<Link href="/terms" style={{ color: DEEP, textDecoration: "none" }}>{t("settings_hub.row_terms")}</Link>}
            value={<span style={{ color: MUTED }}>›</span>}
          />
          <Row
            label={<Link href="/privacy" style={{ color: DEEP, textDecoration: "none" }}>{t("settings_hub.row_privacy")}</Link>}
            value={<span style={{ color: MUTED }}>›</span>}
          />
          <Row
            label={<Link href="/security" style={{ color: DEEP, textDecoration: "none" }}>{t("settings_hub.row_security")}</Link>}
            value={<span style={{ color: MUTED }}>›</span>}
          />
          <Row
            label={<ExportDataButton t={t} />}
            value={null}
          />
        </Section>

        {/* ── ELIMINAZIONE ACCOUNT ───────────────────────── */}
        <Section title={t("settings_hub.section_delete")} id="delete-account">
          <p style={{ fontSize: 13, color: MUTED, margin: "0 0 12px", lineHeight: 1.5 }}
             dangerouslySetInnerHTML={{ __html: t("settings_hub.delete_intro") }} />
          <DeleteAccountButton t={t} />
        </Section>

        {/* ── LOGOUT ───────────────────────────────────── */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={() => {
              if (confirm(t("settings_hub.logout_confirm"))) signOut();
            }}
            style={{
              background: "transparent",
              color: ERR_RED,
              border: `1.5px solid ${ERR_RED}`,
              borderRadius: 40,
              padding: "12px 28px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("settings_hub.logout_cta")}
          </button>
        </div>
      </div>
    </main>
  );
}

// ── Sub components ─────────────────────────────────────

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{
      background: "#fff", borderRadius: 14,
      border: `1px solid ${BORDER}`,
      padding: "14px 16px", marginBottom: 14,
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, color: DEEP, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: ".05em" }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", padding: "6px 0",
      fontSize: 13, color: MUTED,
    }}>
      <span>{label}</span>
      <span style={{ color: DEEP, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ToggleRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        width: "100%", background: "transparent", border: "none",
        padding: "10px 0", cursor: "pointer", fontFamily: "inherit",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <span style={{ fontSize: 13, color: DEEP, textAlign: "left" }}>{label}</span>
      <span style={{
        width: 40, height: 22, borderRadius: 12,
        background: checked ? ACCENT : "#d5d0c8",
        position: "relative", transition: "background .18s",
        flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", top: 2,
          left: checked ? 20 : 2,
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff", transition: "left .18s",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }}/>
      </span>
    </button>
  );
}

type TFn = (k: string, p?: Record<string, string>) => string;

function EnablePushButton({ onEnabled, t }: { onEnabled: () => void; t: TFn }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enable = async () => {
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        if (perm === "denied") setError(t("settings_hub.enable_push_err_denied"));
        setLoading(false);
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError(t("settings_hub.enable_push_err_config"));
        setLoading(false);
        return;
      }
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
      await fetchAuthed("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      onEnabled();
    } catch (e) {
      console.error("[enable push] failed", e);
      setError(t("settings_hub.enable_push_err_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={enable}
        disabled={loading}
        style={{
          width: "100%",
          background: ACCENT, color: "#fff",
          border: "none", borderRadius: 40,
          padding: "11px 18px", fontSize: 13, fontWeight: 800,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.7 : 1,
          fontFamily: "inherit",
        }}
      >
        {loading ? t("settings_hub.enable_push_loading") : t("settings_hub.enable_push_cta")}
      </button>
      {error && <p style={{ fontSize: 12, color: ERR_RED, margin: "8px 0 0" }}>{error}</p>}
    </div>
  );
}

/**
 * DeleteAccountButton — avvia la cancellazione permanente dell'account
 * con doppia conferma (tipica pattern di sicurezza):
 *   1. Conferma modale "Eliminare?"
 *   2. Input "scrivi ELIMINA per confermare"
 *   3. POST /api/profile/delete con { confirm: true }
 *   4. Redirect a "/" dopo successo
 * Tutto il backend cascade cancella automaticamente via FK ON DELETE.
 */
function DeleteAccountButton({ t }: { t: TFn }) {
  const [deleting, setDeleting] = useState(false);

  const confirm2 = async () => {
    if (!confirm(t("settings_hub.delete_confirm_1"))) return;
    const expected = t("settings_hub.delete_confirm_2_keyword");
    const typed = prompt(t("settings_hub.delete_confirm_2_prompt"));
    if (typed !== expected) {
      alert(t("settings_hub.delete_cancelled"));
      return;
    }
    setDeleting(true);
    try {
      const res = await fetchAuthed("/api/profile/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (res.ok) {
        alert(t("settings_hub.delete_success"));
        try {
          localStorage.clear();
        } catch { /* ignore */ }
        window.location.href = "/";
      } else {
        alert(t("settings_hub.delete_failed"));
      }
    } catch (e) {
      console.error("[delete account] failed", e);
      alert(t("settings_hub.delete_network_error"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={confirm2}
      disabled={deleting}
      style={{
        width: "100%",
        background: "transparent",
        color: ERR_RED,
        border: `1.5px solid ${ERR_RED}`,
        borderRadius: 40,
        padding: "12px",
        fontSize: 13,
        fontWeight: 700,
        cursor: deleting ? "wait" : "pointer",
        opacity: deleting ? 0.6 : 1,
        fontFamily: "inherit",
      }}
    >
      {deleting ? t("settings_hub.delete_btn_processing") : t("settings_hub.delete_btn_label")}
    </button>
  );
}

/**
 * ExportDataButton — attiva il download del bundle GDPR art. 20
 * (portabilita'). Chiama GET /api/profile/export che risponde con
 * Content-Disposition: attachment, quindi il browser scarica il JSON
 * senza bisogno di gestire blob manualmente.
 *
 * Nota: il bundle contiene i dati dell'utente in formato JSON leggibile
 * da macchina. Gli URL ai media sono pubblici ma non indicizzati.
 */
function ExportDataButton({ t }: { t: TFn }) {
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      // Usiamo un link temporaneo con token via Authorization header,
      // il che richiede fetch + blob + download programmatico.
      const res = await fetchAuthed("/api/profile/export");
      if (!res.ok) {
        alert(t("settings_hub.export_failed"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `begift-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error("[export] failed", e);
      alert(t("settings_hub.export_network_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={start}
      disabled={busy}
      style={{
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        padding: 0,
        color: DEEP,
        fontSize: 14,
        fontFamily: "inherit",
        cursor: busy ? "wait" : "pointer",
      }}
    >
      {busy ? t("settings_hub.export_busy") : t("settings_hub.export_label")}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
