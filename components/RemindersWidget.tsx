"use client";

/**
 * RemindersWidget — card in dashboard che mostra le prossime 3
 * ricorrenze dell'utente + CTA.
 *
 * Scopo: discoverability. Il sistema reminders era "nascosto" in
 * /settings/reminders e quasi nessuno lo trovava. Spostando un
 * teaser in dashboard lo rendiamo visibile nel flusso principale.
 *
 * Stati:
 *  - Loading: skeleton leggero
 *  - Vuoto (nessuna reminder): CTA "Non perdere piu' un compleanno —
 *    aggiungi la prima ricorrenza"
 *  - Popolato: lista delle prossime 3 con nome, data, giorni rimanenti,
 *    e bottone rapido "Crea regalo" che deep-linka /create con
 *    recipient e occasion pre-compilati.
 *
 * Il widget si auto-nasconde se l'utente non e' loggato (gestisce 401).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAuthed } from "@/lib/clientAuth";
import { useI18n } from "@/lib/i18n";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";

interface Reminder {
  id: string;
  recipient_name: string;
  month: number;
  day: number;
  year: number | null;
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

/** Calcola quanti giorni mancano alla prossima occorrenza di
 *  month/day (considera che se e' passata, prossima e' l'anno dopo). */
function daysUntil(month: number, day: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = new Date(now.getFullYear(), month - 1, day);
  if (target.getTime() < today.getTime()) {
    target = new Date(now.getFullYear() + 1, month - 1, day);
  }
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function relativeLabel(days: number): string {
  if (days === 0) return "oggi";
  if (days === 1) return "domani";
  if (days < 7) return `tra ${days} giorni`;
  if (days < 14) return "la prossima settimana";
  if (days < 31) return `tra ${Math.round(days / 7)} settimane`;
  if (days < 60) return "il mese prossimo";
  return `tra ${Math.round(days / 30)} mesi`;
}

export function RemindersWidget() {
  const { t } = useI18n();
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAuthed("/api/reminders");
        if (res.status === 401) {
          setNeedsLogin(true);
          return;
        }
        if (!res.ok) return;
        const data: Reminder[] = await res.json();
        if (cancelled) return;
        // Ordina per prossima occorrenza crescente
        const sorted = [...data].sort((a, b) =>
          daysUntil(a.month, a.day) - daysUntil(b.month, b.day)
        );
        setReminders(sorted);
      } catch {
        /* silenzioso: il widget e' opzionale */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (needsLogin) return null;
  if (reminders === null) {
    // Skeleton leggero
    return (
      <div style={{
        background: "#fff",
        border: "0.5px solid #e8e4de",
        borderRadius: 16,
        padding: 16,
        margin: "10px 0",
        minHeight: 60,
      }}>
        <div style={{ fontSize: 13, color: MUTED }}>{t("reminders_widget.loading")}</div>
      </div>
    );
  }

  // Stato vuoto → CTA di attivazione
  if (reminders.length === 0) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #fff5f8 0%, #fff 100%)",
        border: "1.5px solid #fadce7",
        borderRadius: 16,
        padding: 16,
        margin: "10px 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }} aria-hidden>📅</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: DEEP }}>
              {t("reminders_widget.empty_title")}
            </div>
            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>
              {t("reminders_widget.empty_subtitle")}
            </div>
          </div>
        </div>
        <Link
          href="/settings/reminders"
          style={{
            display: "inline-block",
            background: ACCENT,
            color: "#fff",
            border: "none",
            borderRadius: 20,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {t("reminders_widget.empty_cta")}
        </Link>
      </div>
    );
  }

  // Popolato → lista prossime 3
  const upcoming = reminders.slice(0, 3);
  return (
    <div style={{
      background: "#fff",
      border: "0.5px solid #e8e4de",
      borderRadius: 16,
      padding: 16,
      margin: "10px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: DEEP }}>
          {t("reminders_widget.title")}
        </div>
        <Link
          href="/settings/reminders"
          style={{ fontSize: 12, color: ACCENT, textDecoration: "none", fontWeight: 600 }}
        >
          {t("reminders_widget.see_all")} →
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {upcoming.map((r) => {
          const days = daysUntil(r.month, r.day);
          const label = relativeLabel(days);
          const emoji = OCCASION_EMOJI[r.occasion_type] ?? "✨";
          const dateStr = `${String(r.day).padStart(2, "0")}/${String(r.month).padStart(2, "0")}`;
          // Quando e' oggi o domani evidenziamo in rosa, altrimenti grigio
          const urgent = days <= 1;
          return (
            <Link
              key={r.id}
              href={`/create?recipient=${encodeURIComponent(r.recipient_name)}&occasion=${encodeURIComponent(r.occasion_type)}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: urgent ? "#fff5f8" : "#fafaf7",
                border: `1px solid ${urgent ? "#fadce7" : "#eadfd5"}`,
                borderRadius: 10,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span style={{ fontSize: 18 }} aria-hidden>{emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: DEEP, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.recipient_name}
                </div>
                <div style={{ fontSize: 11, color: urgent ? ACCENT : MUTED, fontWeight: urgent ? 600 : 400 }}>
                  {dateStr} · {label}
                </div>
              </div>
              <span style={{ fontSize: 11, color: ACCENT, fontWeight: 700, flexShrink: 0 }}>
                {t("reminders_widget.create")} →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
