"use client";

/**
 * PickerFlowClient — flusso 3 step in-memory.
 *
 * Step 0: nome destinatario + multi-select interessi (musica/food/viaggi/
 *         cultura/relax/sport)
 * Step 1: occasione (8 chip) + budget tier (3 fasce)
 * Step 2: chiama POST /api/experiences/picker, mostra 4 suggerimenti
 *
 * Quando l'utente clicca su una card va al dettaglio /experiences/[id]
 * dove e' presente il bottone "Acquista su partner" che genera il
 * tracking URL affiliate (clickref = gift_draft.id).
 *
 * Stato gestito con useState (niente router state machine pesante).
 * Recently-shown ids salvati in localStorage cosi' che a navigare di
 * nuovo nel picker non riveda gli stessi 4 elementi.
 */

import { useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import type { ExperienceWithPartner } from "@/types/experiences";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const BORDER = "#e8e4de";
const CARD = "#fff";

type Interest = "music" | "food" | "travel" | "culture" | "wellness" | "sport";
type Occasion =
  | "anniversary"
  | "birthday"
  | "valentine"
  | "graduation"
  | "thanks"
  | "mothers_day"
  | "fathers_day"
  | "just_because";

interface InterestOption {
  value: Interest;
  emoji: string;
  label: string;
  gradient: string;
}

interface OccasionOption {
  value: Occasion;
  emoji: string;
  label: string;
}

interface BudgetTier {
  cents: number;
  label: string;
  hint: string;
}

const INTERESTS: InterestOption[] = [
  { value: "music",    emoji: "🎵", label: "Musica & concerti",  gradient: "linear-gradient(135deg,#c4407a,#e87ba8)" },
  { value: "food",     emoji: "🍷", label: "Food & vino",         gradient: "linear-gradient(135deg,#d4537e,#f4a04a)" },
  { value: "travel",   emoji: "✈️", label: "Viaggi & weekend",   gradient: "linear-gradient(135deg,#3a78c2,#7eb3ed)" },
  { value: "culture",  emoji: "🎭", label: "Cultura & teatro",    gradient: "linear-gradient(135deg,#6b5bcc,#a484e8)" },
  { value: "wellness", emoji: "🧖", label: "Relax & benessere",   gradient: "linear-gradient(135deg,#5fb8c4,#9ad6df)" },
  { value: "sport",    emoji: "⚽", label: "Sport & avventura",  gradient: "linear-gradient(135deg,#3b8c5a,#7dbf63)" },
];

const OCCASIONS: OccasionOption[] = [
  { value: "anniversary",  emoji: "💍", label: "Anniversario" },
  { value: "birthday",     emoji: "🎂", label: "Compleanno" },
  { value: "valentine",    emoji: "💝", label: "San Valentino" },
  { value: "graduation",   emoji: "🎓", label: "Laurea" },
  { value: "thanks",       emoji: "🙏", label: "Grazie" },
  { value: "mothers_day",  emoji: "💐", label: "Festa Mamma" },
  { value: "fathers_day",  emoji: "🌳", label: "Festa Papà" },
  { value: "just_because", emoji: "💌", label: "Solo perché" },
];

const BUDGETS: BudgetTier[] = [
  { cents: 5000,  label: "fino a 50 €",  hint: "Un pensiero affettuoso" },
  { cents: 10000, label: "fino a 100 €", hint: "Una sorpresa memorabile" },
  { cents: 20000, label: "fino a 200 €", hint: "Un regalo importante" },
];

const RECENT_KEY = "begift_picker_recent_ids";

interface ApiItem {
  experience: ExperienceWithPartner;
  score: number;
  reasons: string[];
}

export default function PickerFlowClient() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [recipientName, setRecipientName] = useState("");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [budget, setBudget] = useState<number>(10000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ApiItem[]>([]);

  const safeName = recipientName.trim();
  const canAdvanceStep0 = safeName.length > 0 && interests.length > 0;
  const canAdvanceStep1 = occasion !== null;

  const toggleInterest = (i: Interest) => {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const recentRaw = typeof window !== "undefined"
        ? window.localStorage.getItem(RECENT_KEY) || "[]"
        : "[]";
      let recent: string[] = [];
      try {
        const parsed = JSON.parse(recentRaw);
        if (Array.isArray(parsed)) recent = parsed.filter((v) => typeof v === "string");
      } catch { /* ignore */ }

      const res = await fetch("/api/experiences/picker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipientName: safeName,
          interests,
          occasion,
          budgetCents: budget,
          targetCount: 4,
          recentlyShown: recent,
        }),
      });
      if (!res.ok) {
        if (res.status === 503) {
          setError("Il catalogo non e' ancora pubblico, riprova fra qualche giorno.");
        } else {
          setError("Non riusciamo a generare i suggerimenti. Riprova fra un momento.");
        }
        return;
      }
      const data = (await res.json()) as { items: ApiItem[] };
      setItems(data.items || []);
      // Aggiorna recently-shown (rolling buffer 20)
      const newIds = data.items.map((it) => it.experience.id);
      const merged = Array.from(new Set([...newIds, ...recent])).slice(0, 20);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(merged));
      }
      track("picker_results_shown", {
        interests: interests.join(","),
        occasion: occasion || "",
        budget_cents: budget,
        results: data.items.length,
      });
    } catch (e) {
      setError("Errore di rete. Controlla la connessione e riprova.");
      console.error("[picker] fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStep0Continue = () => {
    if (!canAdvanceStep0) return;
    track("picker_step1_completed", { interests: interests.join(",") });
    setStep(1);
  };

  const handleStep1Continue = async () => {
    if (!canAdvanceStep1) return;
    track("picker_step2_completed", { occasion: occasion || "", budget_cents: budget });
    setStep(2);
    await fetchSuggestions();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, sans-serif",
        padding: "40px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <ProgressDots step={step} />

        {step === 0 && (
          <Step0
            recipientName={recipientName}
            onNameChange={setRecipientName}
            interests={interests}
            onToggleInterest={toggleInterest}
            canContinue={canAdvanceStep0}
            onContinue={handleStep0Continue}
          />
        )}

        {step === 1 && (
          <Step1
            recipientName={safeName}
            occasion={occasion}
            onOccasionChange={setOccasion}
            budget={budget}
            onBudgetChange={setBudget}
            canContinue={canAdvanceStep1}
            onBack={() => setStep(0)}
            onContinue={handleStep1Continue}
          />
        )}

        {step === 2 && (
          <Step2
            recipientName={safeName}
            items={items}
            loading={loading}
            error={error}
            onRetry={fetchSuggestions}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────
// Progress dots
// ──────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: 0 | 1 | 2 }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 8,
        marginBottom: 28,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: i === step ? 28 : 8,
            height: 8,
            borderRadius: 999,
            background: i <= step ? ACCENT : "#e8e4de",
            transition: "all .2s",
          }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 0 — nome + interessi
// ──────────────────────────────────────────────────────────────

function Step0({
  recipientName,
  onNameChange,
  interests,
  onToggleInterest,
  canContinue,
  onContinue,
}: {
  recipientName: string;
  onNameChange: (v: string) => void;
  interests: Interest[];
  onToggleInterest: (i: Interest) => void;
  canContinue: boolean;
  onContinue: () => void;
}) {
  return (
    <div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: INK,
          margin: "0 0 10px",
          letterSpacing: "-0.4px",
          lineHeight: 1.15,
          textAlign: "center",
        }}
      >
        A chi pensi?
      </h1>
      <p
        style={{
          fontSize: 14,
          color: MUTED,
          textAlign: "center",
          margin: "0 0 26px",
        }}
      >
        Un nome o un soprannome, e cosa gli piace fare.
      </p>

      <input
        type="text"
        value={recipientName}
        onChange={(e) => onNameChange(e.target.value)}
        autoFocus
        placeholder="Mamma, Lucia, il mio compagno, papà…"
        name="begift-picker-nickname"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore="true"
        style={{
          width: "100%",
          padding: "15px 18px",
          fontSize: 17,
          border: `1.5px solid ${BORDER}`,
          borderRadius: 14,
          background: CARD,
          boxSizing: "border-box",
          outline: "none",
          marginBottom: 22,
        }}
        onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
        onBlur={(e) => { e.target.style.borderColor = BORDER; }}
      />

      <p
        style={{
          fontSize: 13,
          color: MUTED,
          margin: "0 0 12px",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        Cosa gli piace? (puoi sceglierne più di uno)
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 10,
          marginBottom: 28,
        }}
      >
        {INTERESTS.map((it) => {
          const active = interests.includes(it.value);
          return (
            <button
              key={it.value}
              type="button"
              onClick={() => onToggleInterest(it.value)}
              style={{
                background: active ? "#fff" : CARD,
                border: `1.5px solid ${active ? ACCENT : BORDER}`,
                borderRadius: 14,
                padding: "12px 12px 10px",
                cursor: "pointer",
                textAlign: "center",
                transition: "all .14s",
                boxShadow: active ? "0 6px 18px rgba(212,83,126,.18)" : "none",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: it.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  margin: "0 auto 8px",
                }}
                aria-hidden
              >
                {it.emoji}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: active ? 700 : 600,
                  color: INK,
                  lineHeight: 1.25,
                }}
              >
                {it.label}
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        style={{
          width: "100%",
          padding: "16px 18px",
          background: canContinue ? ACCENT : "#ddd",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          border: "none",
          borderRadius: 50,
          cursor: canContinue ? "pointer" : "not-allowed",
          boxShadow: canContinue ? "0 10px 28px rgba(212,83,126,.28)" : "none",
        }}
      >
        Continua →
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 1 — occasione + budget
// ──────────────────────────────────────────────────────────────

function Step1({
  recipientName,
  occasion,
  onOccasionChange,
  budget,
  onBudgetChange,
  canContinue,
  onBack,
  onContinue,
}: {
  recipientName: string;
  occasion: Occasion | null;
  onOccasionChange: (v: Occasion) => void;
  budget: number;
  onBudgetChange: (v: number) => void;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: MUTED,
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Indietro
      </button>

      <h1
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: INK,
          margin: "0 0 10px",
          letterSpacing: "-0.3px",
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        Che occasione, per{" "}
        <span style={{ color: ACCENT }}>{recipientName}</span>?
      </h1>
      <p
        style={{
          fontSize: 13,
          color: MUTED,
          textAlign: "center",
          margin: "0 0 22px",
        }}
      >
        Scegli quella più vicina. Se nessuna calza, "solo perché" va sempre bene.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 8,
          marginBottom: 28,
        }}
      >
        {OCCASIONS.map((o) => {
          const active = occasion === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onOccasionChange(o.value)}
              style={{
                background: active ? "#fff" : CARD,
                border: `1.5px solid ${active ? ACCENT : BORDER}`,
                borderRadius: 12,
                padding: "11px 8px",
                cursor: "pointer",
                textAlign: "center",
                transition: "all .14s",
                boxShadow: active ? "0 4px 14px rgba(212,83,126,.18)" : "none",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }} aria-hidden>
                {o.emoji}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: active ? 700 : 600, color: INK }}>
                {o.label}
              </div>
            </button>
          );
        })}
      </div>

      <p
        style={{
          fontSize: 13,
          color: MUTED,
          margin: "0 0 12px",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        Budget orientativo
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {BUDGETS.map((b) => {
          const active = budget === b.cents;
          return (
            <button
              key={b.cents}
              type="button"
              onClick={() => onBudgetChange(b.cents)}
              style={{
                background: active ? "#fff" : CARD,
                border: `1.5px solid ${active ? ACCENT : BORDER}`,
                borderRadius: 14,
                padding: "14px 16px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all .14s",
                boxShadow: active ? "0 4px 14px rgba(212,83,126,.18)" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>
                {b.label}
              </span>
              <span style={{ fontSize: 12.5, color: MUTED }}>{b.hint}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        style={{
          width: "100%",
          padding: "16px 18px",
          background: canContinue ? ACCENT : "#ddd",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          border: "none",
          borderRadius: 50,
          cursor: canContinue ? "pointer" : "not-allowed",
          boxShadow: canContinue ? "0 10px 28px rgba(212,83,126,.28)" : "none",
        }}
      >
        Mostra le idee →
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 2 — risultati
// ──────────────────────────────────────────────────────────────

function Step2({
  recipientName,
  items,
  loading,
  error,
  onRetry,
  onBack,
}: {
  recipientName: string;
  items: ApiItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: MUTED,
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Cambia criteri
      </button>

      <h1
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: INK,
          margin: "0 0 8px",
          letterSpacing: "-0.3px",
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        4 idee per <span style={{ color: ACCENT }}>{recipientName}</span>
      </h1>
      <p
        style={{
          fontSize: 13,
          color: MUTED,
          textAlign: "center",
          margin: "0 0 24px",
        }}
      >
        Scegli una, l'acquisti sul partner, poi BeGift la impacchetta come regalo.
      </p>

      {loading && <SkeletonGrid />}

      {!loading && error && (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: "22px 18px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: INK, margin: "0 0 14px" }}>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: "10px 24px",
              background: ACCENT,
              color: "#fff",
              border: "none",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Riprova
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: "22px 18px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: INK, margin: "0 0 8px" }}>
            Non abbiamo ancora niente che calzi alla perfezione.
          </p>
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
            Prova ad allargare il budget o a scegliere un'occasione diversa.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 14,
              marginBottom: 28,
            }}
          >
            {items.map((it) => (
              <SuggestionCard key={it.experience.id} item={it} />
            ))}
          </div>

          <div
            style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              padding: "16px 18px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 10px" }}>
              Hai già comprato qualcosa? Inoltra la mail di conferma e ti
              prepariamo subito il pacco regalo.
            </p>
            <Link
              href="/forward-mail"
              style={{
                fontSize: 14,
                color: ACCENT,
                fontWeight: 700,
                textDecoration: "underline",
              }}
            >
              Inoltra una mail →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SuggestionCard — card editoriale uniforme per GYG + VVT
// ──────────────────────────────────────────────────────────────

function SuggestionCard({ item }: { item: ApiItem }) {
  const e = item.experience;
  const partnerLabel = e.partner?.display_name || "Partner";
  const partnerSlug = e.partner?.slug;

  const priceLabel = (() => {
    if (!e.price_min_cents) return null;
    const min = (e.price_min_cents / 100).toFixed(0);
    const max = e.price_max_cents ? (e.price_max_cents / 100).toFixed(0) : null;
    if (max && max !== min) return `€${min}–€${max}`;
    return `da €${min}`;
  })();

  const topReason = item.reasons[0];

  return (
    <Link
      href={`/experiences/${e.id}?from=picker`}
      onClick={() => track("picker_card_clicked", { experience_id: e.id, partner: partnerSlug })}
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        transition: "transform .14s, box-shadow .14s",
      }}
    >
      <div style={{ position: "relative" }}>
        {e.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={e.image_url}
            alt={e.title}
            style={{
              width: "100%",
              height: 160,
              objectFit: "cover",
              display: "block",
              background: "#f0ece6",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 160,
              background: categoryGradient(e.category),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 50,
            }}
          >
            {categoryEmoji(e.category)}
          </div>
        )}
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "rgba(255,255,255,.92)",
            color: INK,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            padding: "4px 9px",
            borderRadius: 999,
            backdropFilter: "blur(4px)",
          }}
        >
          {partnerLabel}
        </span>
      </div>

      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
          {[e.city, e.country !== "IT" ? e.country : null].filter(Boolean).join(" · ")}
        </p>
        <h3
          style={{
            fontSize: 15.5,
            fontWeight: 700,
            color: INK,
            margin: 0,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {e.title}
        </h3>
        {topReason && (
          <p style={{ fontSize: 12, color: ACCENT, margin: 0, fontWeight: 600 }}>
            ✦ {topReason}
          </p>
        )}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 13,
            color: MUTED,
            paddingTop: 8,
          }}
        >
          {priceLabel ? (
            <span style={{ color: INK, fontWeight: 700 }}>{priceLabel}</span>
          ) : (
            <span></span>
          )}
          {e.rating != null && e.reviews_count > 0 && (
            <span>★ {e.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 14,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div style={{ width: "100%", height: 160, background: "#efeae3" }} />
          <div style={{ padding: 14 }}>
            <div style={{ height: 10, width: "60%", background: "#efeae3", borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 14, width: "90%", background: "#efeae3", borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: 14, width: "70%", background: "#efeae3", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function categoryGradient(cat: string): string {
  const map: Record<string, string> = {
    food: "linear-gradient(135deg,#d4537e,#f4a04a)",
    outdoor: "linear-gradient(135deg,#3b8c5a,#7dbf63)",
    culture: "linear-gradient(135deg,#6b5bcc,#a484e8)",
    wellness: "linear-gradient(135deg,#5fb8c4,#9ad6df)",
    travel: "linear-gradient(135deg,#3a78c2,#7eb3ed)",
    music: "linear-gradient(135deg,#c4407a,#e87ba8)",
    show: "linear-gradient(135deg,#a04a8c,#d97cb8)",
    gear: "linear-gradient(135deg,#888,#bbb)",
  };
  return map[cat] || map.gear;
}

function categoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    food: "🍷", outdoor: "🥾", culture: "🎨", wellness: "🧖",
    travel: "✈️", music: "🎵", show: "🎭", gear: "🎁",
  };
  return map[cat] || "🎁";
}
