"use client";

/**
 * MilestoneToast — toast/banner mostrato nella schermata di successo
 * post-creazione gift quando l'utente raggiunge un numero "tondo" di
 * regali totali creati (3, 5, 10, 25, 50, 100).
 *
 * Filosofia: NON gamification (no punti, no badge, no classifiche).
 * Il riconoscimento e' costruito su IDENTITA': "sei una persona che
 * pensa agli altri". Frase positiva, un emoji caldo, niente CTA
 * commerciale. La leva e' interna, non esterna.
 *
 * Si auto-nasconde dopo 8 secondi o al click.
 */

import { useEffect, useState } from "react";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const GOLD = "#D4A340";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";

interface Milestone {
  count: number;
  emoji: string;
  title: string;
  body: string;
}

const MILESTONES: Milestone[] = [
  {
    count: 3,
    emoji: "💌",
    title: "Tre pensieri.",
    body: "Hai mandato il tuo terzo regalo. Stai costruendo l'abitudine di pensare agli altri.",
  },
  {
    count: 5,
    emoji: "✨",
    title: "Cinque persone si sono sentite pensate.",
    body: "Sei tra le persone piu' affettuose di BeGift. Continua cosi'.",
  },
  {
    count: 10,
    emoji: "🌱",
    title: "Dieci pensieri impacchettati.",
    body: "Hai trasformato BeGift in un'abitudine. Le persone intorno a te se ne accorgono — anche quando non lo dicono.",
  },
  {
    count: 25,
    emoji: "🌳",
    title: "Venticinque regali. Sei una rarita'.",
    body: "Sei tra il 5% di persone piu' affettuose della comunita'. Le persone che pensi sono fortunate.",
  },
  {
    count: 50,
    emoji: "🪴",
    title: "Cinquanta volte.",
    body: "Cinquanta gesti di cura. Non e' poco — e' tantissimo.",
  },
  {
    count: 100,
    emoji: "💫",
    title: "Cento regali.",
    body: "Hai un super-potere: ti accorgi delle persone. Grazie di esserci.",
  },
];

export function MilestoneToast() {
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAuthed("/api/profile/gift-count");
        if (!res.ok) return;
        const data = await res.json();
        const total: number = data?.count ?? 0;
        if (cancelled) return;

        // Trova la milestone esatta. Solo se l'utente ha appena
        // raggiunto un numero esatto MILESTONE viene mostrato.
        const m = MILESTONES.find((mi) => mi.count === total);
        if (!m) return;

        // Dedupe lato client: per non far riapparire la stessa
        // milestone se l'utente fa /create -> cancella il gift -> /create
        // di nuovo (ricreando il count). Salva in localStorage la lista
        // di milestone gia' mostrate.
        const SHOWN_KEY = "begift_milestones_shown";
        let shown: number[] = [];
        try { shown = JSON.parse(localStorage.getItem(SHOWN_KEY) || "[]"); } catch { /* ignore */ }
        if (shown.includes(m.count)) return;
        shown.push(m.count);
        localStorage.setItem(SHOWN_KEY, JSON.stringify(shown));

        setMilestone(m);
        setVisible(true);
        setTimeout(() => setVisible(false), 8000);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!milestone || !visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      style={{
        position: "fixed",
        top: "max(env(safe-area-inset-top), 12px)",
        left: 12, right: 12,
        zIndex: 1000,
        maxWidth: 420,
        margin: "0 auto",
        background: "linear-gradient(135deg, #fffaf0 0%, #fff 100%)",
        border: `1.5px solid ${GOLD}`,
        borderRadius: 16,
        padding: "16px 20px",
        boxShadow: "0 16px 48px rgba(212,163,64,.25)",
        cursor: "pointer",
        animation: "milestonePop .5s cubic-bezier(.34,1.56,.64,1)",
        display: "flex", gap: 14, alignItems: "flex-start",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @keyframes milestonePop {
          from { opacity: 0; transform: translateY(-20px) scale(.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }} aria-hidden>{milestone.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 800, color: DEEP, lineHeight: 1.3,
          margin: "0 0 4px",
        }}>
          {milestone.title}
        </div>
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
          {milestone.body}
        </div>
      </div>
      <div style={{ fontSize: 16, color: ACCENT, marginLeft: 4 }} aria-hidden>×</div>
    </div>
  );
}
