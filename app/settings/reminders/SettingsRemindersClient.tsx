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

const OCCASION_TYPES: { value: string; emoji: string; labelIt: string }[] = [
  { value: "birthday",    emoji: "🎂", labelIt: "Compleanno" },
  { value: "anniversary", emoji: "💍", labelIt: "Anniversario" },
  { value: "name_day",    emoji: "🎊", labelIt: "Onomastico" },
  { value: "graduation",  emoji: "🎓", labelIt: "Laurea" },
  { value: "other",       emoji: "✨", labelIt: "Altra ricorrenza" },
];

export default function SettingsRemindersClient() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [dateStr, setDateStr] = useState(""); // HTML date input (YYYY-MM-DD)
  const [type, setType] = useState("birthday");
  const [daysBefore, setDaysBefore] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuthed("/api/reminders");
      if (!res.ok) {
        setError("Errore nel caricamento");
        return;
      }
      setReminders(await res.json());
    } catch (e) {
      console.error("[reminders] load failed", e);
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addReminder = async () => {
    if (!name.trim() || !dateStr) return;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      setError("Data non valida");
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
      if (!res.ok) {
        setError("Errore nel salvataggio");
        return;
      }
      // Reset form + reload
      setName("");
      setDateStr("");
      setType("birthday");
      setDaysBefore(3);
      await load();
    } catch (e) {
      console.error("[reminders] add failed", e);
      setError("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm("Eliminare questa ricorrenza?")) return;
    try {
      const res = await fetchAuthed(`/api/reminders?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) await load();
    } catch (e) {
      console.error("[reminders] delete failed", e);
    }
  };

  const occasionMeta = (value: string) =>
    OCCASION_TYPES.find((o) => o.value === value) ?? OCCASION_TYPES[OCCASION_TYPES.length - 1];

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

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "32px 24px 80px" }}>
        <a href="/dashboard" style={{ color: MUTED, fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 12 }}>
          ← Dashboard
        </a>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: DEEP, margin: "0 0 6px" }}>
          🔔 Ricorrenze
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 24px", lineHeight: 1.5 }}>
          Aggiungi compleanni e anniversari delle persone importanti. Ti avviseremo con una notifica <strong>N giorni prima</strong> così hai tempo di preparare un regalo.
        </p>

        {/* ── Add form ─────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.04)", marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: DEEP, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Nuova ricorrenza
          </h2>

          <label style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 4, fontWeight: 600 }}>Chi?</div>
            <input
              style={INP}
              placeholder="Marta, Papà, Mamma…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoCapitalize="words"
            />
          </label>

          <label style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 4, fontWeight: 600 }}>Data della ricorrenza</div>
            <input
              type="date"
              style={INP}
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </label>

          <label style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 600 }}>Tipo</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 6 }}>
              {OCCASION_TYPES.map((o) => {
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
                    <span>{o.labelIt}</span>
                  </button>
                );
              })}
            </div>
          </label>

          <label style={{ display: "block", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 4, fontWeight: 600 }}>
              Avvisami <strong>{daysBefore === 0 ? "lo stesso giorno" : daysBefore === 1 ? "il giorno prima" : `${daysBefore} giorni prima`}</strong>
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
            {submitting ? "Aggiungo…" : "+ Aggiungi ricorrenza"}
          </button>
        </div>

        {/* ── Lista ────────────────────────────────────── */}
        <h2 style={{ fontSize: 14, fontWeight: 800, color: DEEP, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: ".06em" }}>
          Le tue ricorrenze
        </h2>
        {loading ? (
          <div style={{ color: MUTED, fontSize: 14, padding: 16 }}>Caricamento…</div>
        ) : reminders.length === 0 ? (
          <div style={{ color: MUTED, fontSize: 14, padding: "14px 0", textAlign: "center" }}>
            Ancora nessuna ricorrenza. Aggiungine una sopra per non dimenticare mai più un compleanno.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reminders.map((r) => {
              const meta = occasionMeta(r.occasion_type);
              const dd = String(r.day).padStart(2, "0");
              const mm = String(r.month).padStart(2, "0");
              const daysLabel = r.notify_days_before === 0
                ? "lo stesso giorno"
                : r.notify_days_before === 1
                ? "1 giorno prima"
                : `${r.notify_days_before} giorni prima`;
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
                      {meta.labelIt} · {dd}/{mm} · avviso {daysLabel}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReminder(r.id)}
                    aria-label="Elimina"
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
