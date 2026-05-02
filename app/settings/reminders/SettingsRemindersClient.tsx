"use client";

/**
 * /settings/reminders
 *
 * Lista ricorrenze dell'utente + form per aggiungerne nuove.
 * Ogni ricorrenza mostra: nome, data (GG/MM), tipo, giorni prima
 * del promemoria. Ogni riga ha un cestino per cancellare.
 *
 * Stato attuale: funziona con fetch/refresh semplice dopo ogni
 * mutation. Se in futuro la lista cresce (20+ ricorrenze), si
 * potrebbe introdurre una libreria di data fetching come SWR.
 */

import { useEffect, useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const LIGHT = "#f7f5f2";
const BORDER = "#e0dbd5";
const ERR_RED = "#B71C1C";

interface Reminder {
  id: string;
  recipient_name: string;
  month: number;
  day: number;
  year: number | null;
  occasion_type: string;
  notify_days_before: number;
  last_notified_at: string | null;
}

const OCCASION_TYPE_DEFS: { value: string; emoji: string; key: string }[] = [
  { value: "birthday",    emoji: "🎂", key: "type_birthday" },
  { value: "anniversary", emoji: "💍", key: "type_anniversary" },
  { value: "name_day",    emoji: "🎊", key: "type_name_day" },
  { value: "graduation",  emoji: "🎓", key: "type_graduation" },
  { value: "other",       emoji: "✨", key: "type_other" },
];

export default function SettingsRemindersClient() {
  const { t } = useI18n();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [dateStr, setDateStr] = useState(""); // HTML date input (YYYY-MM-DD)
  const [type, setType] = useState("birthday");
  const [daysBefore, setDaysBefore] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    setNeedsLogin(false);
    try {
      const res = await fetchAuthed("/api/reminders");
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!res.ok) {
        setError(t("settings_reminders.error_load"));
        return;
      }
      setReminders(await res.json());
    } catch (e) {
      console.error("[reminders] load failed", e);
      setError(t("settings_reminders.error_network"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const addReminder = async () => {
    if (!name.trim() || !dateStr) return;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      setError(t("settings_reminders.error_invalid_date"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchAuthed("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_name: name.trim(),
          month: parsed.getMonth() + 1,
          day: parsed.getDate(),
          year: parsed.getFullYear(),
          occasion_type: type,
          notify_days_before: daysBefore,
        }),
      });
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!res.ok) {
        setError(t("settings_reminders.error_save"));
        return;
      }
      track("reminder_added", { occasion_type: type, source: "settings" });
      // Reset form + reload
      setName("");
      setDateStr("");
      setType("birthday");
      setDaysBefore(3);
      await load();
    } catch (e) {
      console.error("[reminders] add failed", e);
      setError(t("settings_reminders.error_network"));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm(t("settings_reminders.delete_confirm"))) return;
    try {
      const res = await fetchAuthed(`/api/reminders?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) await load();
    } catch (e) {
      console.error("[reminders] delete failed", e);
    }
  };

  const occasionLabel = (value: string) => {
    const def = OCCASION_TYPE_DEFS.find((o) => o.value === value) ?? OCCASION_TYPE_DEFS[OCCASION_TYPE_DEFS.length - 1];
    return { emoji: def.emoji, label: t(`settings_reminders.${def.key}`) };
  };

  const daysLabelFor = (n: number) => {
    if (n === 0) return t("settings_reminders.row_notify_same_day");
    if (n === 1) return t("settings_reminders.row_notify_one_day");
    return t("settings_reminders.row_notify_n_days", { n: String(n) });
  };

  const formNotifyLabel = () => {
    if (daysBefore === 0) return t("settings_reminders.notify_label_same_day");
    if (daysBefore === 1) return t("settings_reminders.notify_label_day_before");
    return t("settings_reminders.notify_label_days_before", { n: String(daysBefore) });
  };

  const INP: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    fontSize: 15,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 11,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    color: DEEP,
    fontFamily: "inherit",
  };

  if (needsLogin) {
    return (
      <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔔</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 10px" }}>{t("settings_reminders.needs_login_title")}</h1>
        <p style={{ fontSize: 14, color: MUTED, marginBottom: 24, lineHeight: 1.55, maxWidth: 340 }}>
          {t("settings_reminders.needs_login_subtitle")}
        </p>
        <a href="/auth/login?next=/settings/reminders" style={{ background: ACCENT, color: "#fff", borderRadius: 40, padding: "13px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
          {t("settings_reminders.login_cta")}
        </a>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "32px 24px 80px" }}>
        <a href="/dashboard" style={{ color: MUTED, fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 12 }}>
          {t("settings_reminders.back_dashboard")}
        </a>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: DEEP, margin: "0 0 6px" }}>
          {t("settings_reminders.title")}
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 24px", lineHeight: 1.5 }}
           dangerouslySetInnerHTML={{ __html: t("settings_reminders.description") }} />

        {/* ── Add form ─────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.04)", marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: DEEP, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".06em" }}>
            {t("settings_reminders.new_section_title")}
          </h2>

          <label style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 4, fontWeight: 600 }}>{t("settings_reminders.field_who")}</div>
            <input
              style={INP}
              placeholder={t("settings_reminders.ph_who")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoCapitalize="words"
            />
          </label>

          <label style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 4, fontWeight: 600 }}>{t("settings_reminders.field_date")}</div>
            <input
              type="date"
              style={INP}
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </label>

          <label style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 600 }}>{t("settings_reminders.field_type")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 6 }}>
              {OCCASION_TYPE_DEFS.map((o) => {
                const active = type === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setType(o.value)}
                    style={{
                      background: active ? `${ACCENT}18` : "#fff",
                      border: `1.5px solid ${active ? ACCENT : BORDER}`,
                      color: active ? ACCENT : DEEP,
                      borderRadius: 12,
                      padding: "8px 6px",
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      lineHeight: 1.2,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{o.emoji}</span>
                    <span>{t(`settings_reminders.${o.key}`)}</span>
                  </button>
                );
              })}
            </div>
          </label>

          <label style={{ display: "block", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 4, fontWeight: 600 }}>
              {t("settings_reminders.notify_prefix")} <strong>{formNotifyLabel()}</strong>
            </div>
            <input
              type="range"
              min={0}
              max={14}
              step={1}
              value={daysBefore}
              onChange={(e) => setDaysBefore(Number(e.target.value))}
              style={{ width: "100%", accentColor: ACCENT }}
            />
          </label>

          {error && (
            <div style={{ fontSize: 12, color: ERR_RED, marginBottom: 10 }}>{error}</div>
          )}

          <button
            onClick={addReminder}
            disabled={submitting || !name.trim() || !dateStr}
            style={{
              width: "100%",
              background: (!submitting && name.trim() && dateStr) ? ACCENT : "#e0dbd5",
              color: "#fff",
              border: "none",
              borderRadius: 40,
              padding: "13px",
              fontSize: 14,
              fontWeight: 800,
              cursor: (!submitting && name.trim() && dateStr) ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}
          >
            {submitting ? t("settings_reminders.submit_adding") : t("settings_reminders.submit_add")}
          </button>
        </div>

        {/* ── Lista ────────────────────────────────────── */}
        <h2 style={{ fontSize: 14, fontWeight: 800, color: DEEP, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: ".06em" }}>
          {t("settings_reminders.list_title")}
        </h2>
        {loading ? (
          <div style={{ color: MUTED, fontSize: 14, padding: 16 }}>{t("settings_reminders.loading")}</div>
        ) : reminders.length === 0 ? (
          <div style={{ color: MUTED, fontSize: 14, padding: "14px 0", textAlign: "center" }}>
            {t("settings_reminders.empty")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reminders.map((r) => {
              const meta = occasionLabel(r.occasion_type);
              const dd = String(r.day).padStart(2, "0");
              const mm = String(r.month).padStart(2, "0");
              return (
                <div
                  key={r.id}
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{meta.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: DEEP }}>
                      {r.recipient_name}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                      {t("settings_reminders.row_meta_format", {
                        type: meta.label,
                        date: `${dd}/${mm}`,
                        days: daysLabelFor(r.notify_days_before),
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReminder(r.id)}
                    aria-label={t("settings_reminders.delete_aria")}
                    style={{
                      background: "transparent",
                      border: `1.5px solid #ffd0d0`,
                      borderRadius: 18,
                      padding: "6px 10px",
                      fontSize: 14,
                      color: "#E24B4A",
                      cursor: "pointer",
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
