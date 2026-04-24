"use client";

/**
 * SaveReminderPrompt — card mostrata nella schermata di successo
 * post-creazione gift, solo se l'occasione ha senso come ricorrenza
 * annuale (compleanno, anniversario, onomastico, laurea).
 *
 * UX pattern: il momento migliore per chiedere all'utente di salvare
 * una ricorrenza e' subito dopo che ha appena speso energia a
 * confezionare un regalo per quella persona. La sensazione emotiva
 * e' fresca, il nome e' gia' sotto gli occhi, e l'offerta e' onesta:
 * "l'anno prossimo ti ricordo io".
 *
 * Flusso:
 * 1. Mostra prompt con nome + tipo di occasione
 * 2. Chiede la data (HTML date input) — pre-compilato a oggi
 * 3. Al submit: POST /api/reminders
 * 4. Su successo: transizione a stato "saved" (verde + messaggio)
 * 5. Utente puo' anche dismissare cliccando X o "non ora"
 *
 * Analytics: track reminder_added on success.
 */

import { useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";
import { track } from "@/lib/analytics";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const OK_GREEN = "#3B8C5A";

const OCCASION_LABEL: Record<string, { emoji: string; noun: string }> = {
  birthday:    { emoji: "🎂", noun: "compleanno" },
  anniversary: { emoji: "💍", noun: "anniversario" },
  name_day:    { emoji: "🎊", noun: "onomastico" },
  graduation:  { emoji: "🎓", noun: "laurea" },
};

interface Props {
  recipientName: string;
  occasionType: string;
}

export function SaveReminderPrompt({ recipientName, occasionType }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [dateStr, setDateStr] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = OCCASION_LABEL[occasionType] ?? { emoji: "✨", noun: "ricorrenza" };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      if (!m || !d) {
        setError("Data non valida");
        setSaving(false);
        return;
      }
      const res = await fetchAuthed("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_name: recipientName,
          month: m,
          day: d,
          year: y || null,
          occasion_type: occasionType,
          notify_days_before: 3,
        }),
      });
      if (res.ok) {
        setSaved(true);
        track("reminder_added", { occasion_type: occasionType, source: "post_create" });
      } else {
        setError("Non sono riuscito a salvare — riprova");
      }
    } catch {
      setError("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  if (dismissed) return null;

  if (saved) {
    return (
      <div style={{
        background: "#f0f9f0",
        border: "1.5px solid #c5e5c5",
        borderRadius: 16,
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{ fontSize: 20 }} aria-hidden>✅</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: OK_GREEN }}>
            Ricorrenza salvata
          </div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>
            Ti avviseremo 3 giorni prima del prossimo {label.noun} di {recipientName}.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #fff5f8 0%, #fff 100%)",
      border: "1.5px solid #fadce7",
      borderRadius: 16,
      padding: 14,
      position: "relative",
    }}>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Chiudi"
        style={{
          position: "absolute", top: 8, right: 10,
          background: "transparent", border: "none",
          fontSize: 18, color: MUTED, cursor: "pointer", lineHeight: 1,
        }}
      >×</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }} aria-hidden>{label.emoji}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: DEEP }}>
            Salva il {label.noun} di {recipientName}
          </div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>
            Ti avviseremo qualche giorno prima, l'anno prossimo.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: MUTED }}>Data</label>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          style={{
            flex: 1,
            padding: "7px 10px",
            fontSize: 13,
            border: "1px solid #e0dbd5",
            borderRadius: 8,
            fontFamily: "inherit",
          }}
        />
      </div>

      {error && <div style={{ fontSize: 11, color: "#B71C1C", marginBottom: 6 }}>{error}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            flex: "1 1 auto",
            background: ACCENT,
            color: "#fff",
            border: "none",
            borderRadius: 20,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Salvataggio…" : "Sì, salva"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: "transparent",
            color: MUTED,
            border: "1px solid #e0dbd5",
            borderRadius: 20,
            padding: "8px 14px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Non ora
        </button>
      </div>
    </div>
  );
}
