"use client";

/**
 * RicorrenzeClient — vista top-level delle ricorrenze, raggruppate
 * per tipo + "prossima" in evidenza con countdown.
 *
 * Backend: lo stesso /api/reminders gia' usato da
 * /settings/reminders. Nessun cambio API, solo riorganizzazione UI.
 *
 * Differenze chiave rispetto al vecchio settings client:
 *  - Card "prossima ricorrenza" con countdown, in cima
 *  - Sezioni per occasion_type (compleanni, anniversari, etc.) con
 *    contatore e ordine per giorni-mancanti dentro a ogni gruppo
 *  - Empty state con 4 quick-add buttons (mamma, papa', partner,
 *    fratello/sorella) per ridurre l'ansia da foglio bianco
 *  - Same form add inline in fondo (ridotto, focus su lista)
 */

import { useEffect, useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";
import { track } from "@/lib/analytics";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const LIGHT = "#f7f5f2";
const BORDER = "#e0dbd5";
const ERR_RED = "#B71C1C";
const OK_GREEN = "#3B8C5A";

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

const OCCASION_TYPES: { value: string; emoji: string; labelIt: string; color: string }[] = [
  { value: "birthday",    emoji: "🎂", labelIt: "Compleanni",    color: "#E8C84A" },
  { value: "anniversary", emoji: "💍", labelIt: "Anniversari",   color: "#E8A0A0" },
  { value: "name_day",    emoji: "🎊", labelIt: "Onomastici",    color: "#C9B6E8" },
  { value: "graduation",  emoji: "🎓", labelIt: "Lauree",        color: "#1A3A6B" },
  { value: "birth",       emoji: "👶", labelIt: "Nascite",       color: "#F5C6C6" },
  { value: "other",       emoji: "✨", labelIt: "Altre",         color: "#F5E8D5" },
];

// Quick-add suggestions per stato vuoto: pre-compilano nome + tipo,
// l'utente sceglie solo la data. Pensati per le persone piu' comuni
// nella vita di un utente medio italiano (ottimizzati per il target).
const QUICK_ADDS: { name: string; type: string; emoji: string }[] = [
  { name: "Mamma",            type: "birthday", emoji: "💐" },
  { name: "Papà",             type: "birthday", emoji: "👨" },
  { name: "Partner",          type: "birthday", emoji: "❤️" },
  { name: "Fratello/sorella", type: "birthday", emoji: "🧒" },
  { name: "Zio/zia",          type: "birthday", emoji: "👨‍🦳" },
  { name: "Cugino/a",         type: "birthday", emoji: "👫" },
];

/** Calcola quanti giorni mancano alla prossima occorrenza di MM/GG.
 *  Se la data e' gia' passata in questo anno, salta all'anno prossimo. */
function daysUntil(month: number, day: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = new Date(now.getFullYear(), month - 1, day);
  if (target.getTime() < today.getTime()) {
    target = new Date(now.getFullYear() + 1, month - 1, day);
  }
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyLabel(days: number): string {
  if (days === 0) return "Oggi!";
  if (days === 1) return "Domani";
  if (days <= 7) return `Tra ${days} giorni`;
  if (days <= 30) return `Tra ${days} giorni`;
  if (days <= 90) return `Tra ${days} giorni`;
  return `Tra ${days} giorni`;
}

function urgencyColor(days: number): string {
  if (days <= 7) return ACCENT;
  if (days <= 30) return "#D08F2A";
  return MUTED;
}

export default function RicorrenzeClient() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [type, setType] = useState("birthday");
  const [daysBefore, setDaysBefore] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    setNeedsLogin(false);
    try {
      const res = await fetchAuthed("/api/reminders");
      if (res.status === 401) { setNeedsLogin(true); return; }
      if (!res.ok) { setError("Errore nel caricamento"); return; }
      setReminders(await res.json());
    } catch (e) {
      console.error("[ricorrenze] load failed", e);
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addReminder = async () => {
    if (!name.trim() || !dateStr) return;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) { setError("Data non valida"); return; }
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
      if (res.status === 401) { setNeedsLogin(true); return; }
      if (!res.ok) { setError("Errore nel salvataggio"); return; }
      track("reminder_added", { occasion_type: type, source: "ricorrenze" });
      setName(""); setDateStr(""); setType("birthday"); setDaysBefore(3);
      setShowForm(false);
      await load();
    } catch (e) {
      console.error("[ricorrenze] add failed", e);
      setError("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm("Eliminare questa ricorrenza?")) return;
    try {
      const res = await fetchAuthed(`/api/reminders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) await load();
    } catch (e) {
      console.error("[ricorrenze] delete failed", e);
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

  const handleQuickAdd = (qa: { name: string; type: string }) => {
    setName(qa.name);
    setType(qa.type);
    setShowForm(true);
    // Scroll to form anchor: usiamo setTimeout per dare al DOM il tempo
    // di renderizzare il form prima dello scroll.
    setTimeout(() => {
      document.getElementById("add-reminder-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("add-reminder-date")?.focus();
    }, 50);
  };

  if (needsLogin) {
    return (
      <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔔</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: DEEP, margin: "0 0 10px" }}>Accedi per gestire le ricorrenze</h1>
        <p style={{ fontSize: 14, color: MUTED, marginBottom: 24, lineHeight: 1.55, maxWidth: 340 }}>
          Compleanni, anniversari, onomastici. Non dimenticarli mai piu'.
        </p>
        <a href="/auth/login?next=/ricorrenze" style={{ background: ACCENT, color: "#fff", borderRadius: 40, padding: "13px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
          Accedi
        </a>
      </main>
    );
  }

  // Calcoli derivati: ordina per "giorni mancanti", trova la "prossima",
  // raggruppa per tipo.
  const enriched = reminders.map((r) => ({ ...r, daysLeft: daysUntil(r.month, r.day) }));
  const sorted = [...enriched].sort((a, b) => a.daysLeft - b.daysLeft);
  const next = sorted[0];

  // Raggruppamento per occasion_type, ordinato secondo l'ordine di
  // OCCASION_TYPES (cosi' compleanni vengono prima, "altre" alla fine).
  const grouped = new Map<string, typeof enriched>();
  for (const r of sorted) {
    const list = grouped.get(r.occasion_type) ?? [];
    list.push(r);
    grouped.set(r.occasion_type, list);
  }
  const groups = OCCASION_TYPES
    .map((meta) => ({ meta, items: grouped.get(meta.value) ?? [] }))
    .filter((g) => g.items.length > 0);

  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "32px 24px 100px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: DEEP, margin: "0 0 6px" }}>
          🔔 Ricorrenze
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 22px", lineHeight: 1.5 }}>
          Compleanni, anniversari, onomastici. Ti avviseremo prima cosi' hai tempo di preparare un regalo.
        </p>

        {/* ── Card "prossima ricorrenza" ──────────────────── */}
        {!loading && next && (
          <div style={{
            background: `linear-gradient(135deg, ${occasionMeta(next.occasion_type).color}33, ${occasionMeta(next.occasion_type).color}11)`,
            border: `1.5px solid ${urgencyColor(next.daysLeft)}55`,
            borderRadius: 18,
            padding: "18px 20px",
            marginBottom: 22,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ fontSize: 38, lineHeight: 1, flexShrink: 0 }}>
              {occasionMeta(next.occasion_type).emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 700, marginBottom: 2 }}>
                Prossima ricorrenza
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: DEEP, lineHeight: 1.2 }}>
                {next.recipient_name} · {occasionMeta(next.occasion_type).labelIt.replace(/i$/, "o")}
              </div>
              <div style={{ fontSize: 13, color: urgencyColor(next.daysLeft), fontWeight: 700, marginTop: 2 }}>
                {urgencyLabel(next.daysLeft)} ({String(next.day).padStart(2, "0")}/{String(next.month).padStart(2, "0")})
              </div>
            </div>
            <a
              href={`/create?occasion=${next.occasion_type}&recipient=${encodeURIComponent(next.recipient_name)}`}
              style={{
                background: ACCENT, color: "#fff", textDecoration: "none",
                borderRadius: 30, padding: "9px 14px", fontSize: 12, fontWeight: 700,
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              Crea regalo →
            </a>
          </div>
        )}

        {/* ── Toggle add form ─────────────────────────────── */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: "100%",
              background: ACCENT, color: "#fff",
              border: "none", borderRadius: 40,
              padding: "13px",
              fontSize: 14, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
              marginBottom: 22,
            }}
          >
            + Aggiungi ricorrenza
          </button>
        )}

        {/* ── Add form (toggle) ────────────────────────────── */}
        {showForm && (
          <div id="add-reminder-form" style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.04)", marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: DEEP, margin: 0, textTransform: "uppercase", letterSpacing: ".06em" }}>
                Nuova ricorrenza
              </h2>
              <button
                onClick={() => { setShowForm(false); setError(null); }}
                style={{ background: "none", border: "none", color: MUTED, fontSize: 18, cursor: "pointer", padding: 4 }}
                aria-label="Chiudi"
              >×</button>
            </div>

            <label style={{ display: "block", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 4, fontWeight: 600 }}>Chi?</div>
              <input style={INP} placeholder="Marta, Papà, Mamma…" value={name} onChange={(e) => setName(e.target.value)} autoCapitalize="words"/>
            </label>

            <label style={{ display: "block", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 4, fontWeight: 600 }}>Data della ricorrenza</div>
              <input id="add-reminder-date" type="date" style={INP} value={dateStr} onChange={(e) => setDateStr(e.target.value)}/>
            </label>

            <label style={{ display: "block", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 600 }}>Tipo</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
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
                        fontSize: 11.5, fontWeight: active ? 700 : 500,
                        cursor: "pointer", fontFamily: "inherit",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2, lineHeight: 1.2,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{o.emoji}</span>
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
              <input type="range" min={0} max={14} step={1} value={daysBefore} onChange={(e) => setDaysBefore(Number(e.target.value))} style={{ width: "100%", accentColor: ACCENT }}/>
            </label>

            {error && <div style={{ fontSize: 12, color: ERR_RED, marginBottom: 10 }}>{error}</div>}

            <button
              onClick={addReminder}
              disabled={submitting || !name.trim() || !dateStr}
              style={{
                width: "100%",
                background: (!submitting && name.trim() && dateStr) ? ACCENT : "#e0dbd5",
                color: "#fff", border: "none", borderRadius: 40,
                padding: "13px", fontSize: 14, fontWeight: 800,
                cursor: (!submitting && name.trim() && dateStr) ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              {submitting ? "Aggiungo…" : "Salva ricorrenza"}
            </button>
          </div>
        )}

        {/* ── Stato vuoto + quick adds ─────────────────────── */}
        {!loading && reminders.length === 0 && !showForm && (
          <div style={{ background: "#fff", borderRadius: 18, padding: "24px 22px", textAlign: "center", marginBottom: 22, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>📅</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: DEEP, margin: "0 0 6px" }}>Inizia da chi e' importante</h3>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 18px", lineHeight: 1.5 }}>
              Aggiungi le persone a cui pensi spesso. Ti avviseremo in tempo.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, maxWidth: 420, margin: "0 auto" }}>
              {QUICK_ADDS.map((qa) => (
                <button
                  key={qa.name}
                  onClick={() => handleQuickAdd(qa)}
                  style={{
                    background: "#fff",
                    border: `1.5px dashed ${BORDER}`,
                    borderRadius: 12,
                    padding: "12px 8px",
                    fontSize: 13, color: DEEP, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{qa.emoji}</span>
                  <span>{qa.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Liste raggruppate ────────────────────────────── */}
        {loading && (
          <div style={{ color: MUTED, fontSize: 14, padding: 16, textAlign: "center" }}>Caricamento…</div>
        )}
        {!loading && groups.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {groups.map(({ meta, items }) => (
              <section key={meta.value}>
                <h2 style={{
                  fontSize: 13, fontWeight: 800, color: DEEP,
                  margin: "0 0 10px",
                  textTransform: "uppercase", letterSpacing: ".07em",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span aria-hidden style={{ fontSize: 16 }}>{meta.emoji}</span>
                  <span>{meta.labelIt}</span>
                  <span style={{ background: `${meta.color}33`, color: DEEP, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
                    {items.length}
                  </span>
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((r) => {
                    const dd = String(r.day).padStart(2, "0");
                    const mm = String(r.month).padStart(2, "0");
                    const daysLabel = r.notify_days_before === 0
                      ? "lo stesso giorno"
                      : r.notify_days_before === 1
                      ? "1 giorno prima"
                      : `${r.notify_days_before} giorni prima`;
                    const isImminent = r.daysLeft <= 7;
                    return (
                      <div
                        key={r.id}
                        style={{
                          background: "#fff",
                          borderRadius: 14,
                          padding: "12px 14px",
                          display: "flex", alignItems: "center", gap: 12,
                          border: `1px solid ${isImminent ? ACCENT : BORDER}`,
                          boxShadow: isImminent ? "0 4px 14px rgba(212,83,126,.12)" : undefined,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: DEEP, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span>{r.recipient_name}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              color: urgencyColor(r.daysLeft),
                              background: `${urgencyColor(r.daysLeft)}18`,
                              padding: "2px 8px", borderRadius: 999,
                              textTransform: "uppercase", letterSpacing: ".05em",
                            }}>
                              {urgencyLabel(r.daysLeft)}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
                            {dd}/{mm} · avviso {daysLabel}
                          </div>
                        </div>
                        <a
                          href={`/create?occasion=${r.occasion_type}&recipient=${encodeURIComponent(r.recipient_name)}`}
                          aria-label="Crea regalo"
                          style={{
                            background: "transparent",
                            border: `1.5px solid ${ACCENT}`,
                            color: ACCENT,
                            borderRadius: 18,
                            padding: "6px 11px",
                            fontSize: 11, fontWeight: 700,
                            textDecoration: "none",
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                          }}
                        >
                          🎁 Regalo
                        </a>
                        <button
                          onClick={() => deleteReminder(r.id)}
                          aria-label="Elimina"
                          style={{
                            background: "transparent",
                            border: `1.5px solid #ffd0d0`,
                            borderRadius: 18,
                            padding: "6px 9px",
                            fontSize: 13, color: "#E24B4A",
                            cursor: "pointer", lineHeight: 1, flexShrink: 0,
                          }}
                        >🗑️</button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ── Footer info ──────────────────────────────────── */}
        {!loading && reminders.length > 0 && (
          <p style={{ fontSize: 11.5, color: MUTED, marginTop: 28, textAlign: "center", lineHeight: 1.6 }}>
            🔒 Le tue ricorrenze sono private. Solo tu le vedi.<br/>
            I promemoria arrivano via push (e via email se le hai attive).
          </p>
        )}

        {/* OK toast post-add (fallback senza toast lib) */}
        {!loading && !error && reminders.length > 0 && false && (
          <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: OK_GREEN, color: "#fff", padding: "10px 18px", borderRadius: 30, fontSize: 13, fontWeight: 700, boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}>
            Ricorrenza salvata!
          </div>
        )}
      </div>
    </main>
  );
}
