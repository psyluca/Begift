"use client";

/**
 * SondaggioClient — wizard a 5 sezioni per il sondaggio post-gift.
 *
 * Pattern simile a /festa-mamma/crea: progress bar in cima, una
 * sezione per volta, navigazione avanti/indietro, persistenza
 * localStorage, submit finale a /api/survey/submit.
 *
 * Sezioni:
 *   1. Esperienza (UX qualitativa) — 7 domande
 *   2. Modello business + Van Westendorp — 6 domande
 *   3. Validazione mail-forward — 2 domande
 *   4. NPS + ritorno — 3 domande
 *   5. Demografico opzionale — 4 domande
 *
 * Required fields minimi: solo Q1, Q2, Q3 (chi/occasione/rating) +
 * Q8 (pagheresti) + Van Westendorp se Q8 != "no" + Q14 + Q16 + Q17.
 * Le altre tutte opzionali. Friction bassa, abbandono ridotto.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";
const LIGHT = "#fafaf7";
const BORDER = "#e0dbd5";
const ERR_RED = "#B71C1C";

// ── Tipo delle risposte ──────────────────────────────────────────────

interface Answers {
  recipient_type?: string;
  occasion?: string;
  experience_rating?: number;
  liked_most?: string;
  frustrated?: string;
  would_add?: string;
  recipient_feedback?: string;
  would_pay?: string;
  price_too_expensive?: number | null;
  price_expensive_but_worth?: number | null;
  price_good_deal?: number | null;
  price_too_cheap?: number | null;
  preferred_pricing?: string[];
  voucher_interest?: string;
  online_purchase_sites?: string[];
  reuse?: string;
  nps_score?: number;
  nps_reason?: string;
  age_range?: string;
  gender?: string;
  willing_to_call?: string;
  contact_email?: string;
}

const DRAFT_KEY = "begift_survey_draft_v1";

interface Props {
  giftIdFromQuery: string | null;
  userIdFromQuery: string | null;
}

export default function SondaggioClient({ giftIdFromQuery, userIdFromQuery }: Props) {
  const router = useRouter();
  const [section, setSection] = useState(0); // 0..4
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Carico draft al mount (se esiste e contiene roba)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          setAnswers(parsed);
        }
      }
    } catch { /* ignore */ }
    setDraftLoaded(true);
  }, []);

  // Auto-save (debounced 400ms) ad ogni modifica answers
  useEffect(() => {
    if (!draftLoaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
      } catch { /* quota / private mode → skip */ }
    }, 400);
    return () => clearTimeout(t);
  }, [answers, draftLoaded]);

  // Helper update field
  const update = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };
  const toggleMulti = (key: "preferred_pricing" | "online_purchase_sites", value: string, max?: number) => {
    setAnswers((prev) => {
      const current = (prev[key] as string[] | undefined) ?? [];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((v) => v !== value) };
      }
      if (max && current.length >= max) return prev;
      return { ...prev, [key]: [...current, value] };
    });
  };

  // ── Validation per sezione ─────────────────────────────────────────
  const sectionValid = (s: number): boolean => {
    switch (s) {
      case 0:
        return !!answers.recipient_type && !!answers.occasion && typeof answers.experience_rating === "number";
      case 1:
        if (!answers.would_pay) return false;
        // Van Westendorp obbligatorio solo se NON ha detto "vorrei sempre gratis"
        if (answers.would_pay !== "no_free") {
          return [
            answers.price_too_expensive,
            answers.price_expensive_but_worth,
            answers.price_good_deal,
            answers.price_too_cheap,
          ].every((v) => typeof v === "number" && v >= 0);
        }
        return true;
      case 2:
        return !!answers.voucher_interest;
      case 3:
        return !!answers.reuse && typeof answers.nps_score === "number";
      case 4:
        return true; // tutta opzionale
      default:
        return false;
    }
  };

  const sectionTitles = [
    "La tua esperienza",
    "Modello di business",
    "Una nuova idea",
    "Ti va di tornare?",
    "Su di te (opzionale)",
  ];
  const totalSections = sectionTitles.length;

  const next = () => {
    if (!sectionValid(section)) return;
    if (section < totalSections - 1) setSection(section + 1);
  };
  const prev = () => { if (section > 0) setSection(section - 1); };

  // ── Submit finale ──────────────────────────────────────────────────
  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "internal",
          formId: "post_gift_v1",
          giftId: giftIdFromQuery,
          userId: userIdFromQuery,
          answers,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError((data as { error?: string }).error || `Errore ${res.status}`);
        return;
      }
      // Pulisco il draft e vado alla pagina di ringraziamento
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      router.push("/sondaggio/grazie");
    } catch (e) {
      console.error("[sondaggio] submit error", e);
      setSubmitError("Errore di rete. Verifica la connessione e riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "32px 20px 80px" }}>
        {/* Progress bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {Array.from({ length: totalSections }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 3,
              background: i <= section ? ACCENT : "#e0d0c8",
              transition: "background .3s",
            }}/>
          ))}
        </div>

        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 6 }}>
            Sezione {section + 1} di {totalSections}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: DEEP, margin: 0, letterSpacing: "-.4px", lineHeight: 1.2 }}>
            {sectionTitles[section]}
          </h1>
          {section === 0 && (
            <p style={{ fontSize: 13.5, color: MUTED, marginTop: 8, lineHeight: 1.55 }}>
              Sono Luca, founder di BeGift. Le tue risposte arrivano direttamente a me — max 3 minuti, e mi servono per decidere come BeGift si evolve nei prossimi mesi.
            </p>
          )}
        </div>

        {/* Sezioni */}
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
          {section === 0 && <Section1 answers={answers} update={update} />}
          {section === 1 && <Section2 answers={answers} update={update} toggleMulti={toggleMulti} />}
          {section === 2 && <Section3 answers={answers} update={update} toggleMulti={toggleMulti} />}
          {section === 3 && <Section4 answers={answers} update={update} />}
          {section === 4 && <Section5 answers={answers} update={update} />}
        </div>

        {submitError && (
          <div style={{ background: "#fff0f0", color: ERR_RED, border: `1px solid #f5c6c6`, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginTop: 14 }}>
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          {section > 0 && (
            <button onClick={prev} disabled={submitting} style={{
              flex: "0 0 auto", background: "transparent", color: MUTED,
              border: `1.5px solid ${BORDER}`, borderRadius: 40,
              padding: "12px 20px", fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>← Indietro</button>
          )}
          {section < totalSections - 1 ? (
            <button onClick={next} disabled={!sectionValid(section)} style={{
              flex: 1,
              background: sectionValid(section) ? ACCENT : "#e0d0c8",
              color: "#fff", border: "none", borderRadius: 40,
              padding: "13px 24px", fontSize: 15, fontWeight: 800,
              cursor: sectionValid(section) ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}>Avanti →</button>
          ) : (
            <button onClick={submit} disabled={submitting} style={{
              flex: 1, background: ACCENT, color: "#fff", border: "none",
              borderRadius: 40, padding: "13px 24px", fontSize: 15, fontWeight: 800,
              cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1,
              boxShadow: "0 8px 22px rgba(212,83,126,.35)", fontFamily: "inherit",
            }}>{submitting ? "Invio..." : "Invia sondaggio →"}</button>
          )}
        </div>

        <p style={{ fontSize: 11, color: MUTED, textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>
          🔒 Le risposte sono usate solo per migliorare BeGift. Email opzionale solo se vuoi un follow-up.
        </p>
      </div>
    </main>
  );
}

// ════════════════════════════════════════════════════════════════════
// Sezioni
// ════════════════════════════════════════════════════════════════════

function Section1({ answers, update }: { answers: Answers; update: <K extends keyof Answers>(k: K, v: Answers[K]) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Q label="Per chi era il regalo?" required>
        <Radio name="recipient_type" value={answers.recipient_type} options={[
          "Mamma","Papà","Partner","Sorella/fratello","Figlia/o","Amica/amico","Zia/zio o cugina/o","Altra persona",
        ]} onChange={(v) => update("recipient_type", v)} />
      </Q>

      <Q label="Per quale occasione?" required>
        <Radio name="occasion" value={answers.occasion} options={[
          "Festa della Mamma","Compleanno","Anniversario","Un grazie","Un pensiero senza occasione precisa","Altro",
        ]} onChange={(v) => update("occasion", v)} />
      </Q>

      <Q label="Quanto ti è piaciuta l'esperienza di creare il regalo?" required>
        <Scale value={answers.experience_rating} min={1} max={5} leftLabel="Per niente" rightLabel="Tantissimo" onChange={(v) => update("experience_rating", v)} />
      </Q>

      <Q label="Cos'è la prima cosa che ti è piaciuta?">
        <LongText value={answers.liked_most} maxLength={200} placeholder="Anche solo una frase..." onChange={(v) => update("liked_most", v)} />
      </Q>

      <Q label="Cos'è la prima cosa che ti ha frustrato o confuso?">
        <LongText value={answers.frustrated} maxLength={200} placeholder="Tieni pure il tono diretto..." onChange={(v) => update("frustrated", v)} />
      </Q>

      <Q label="Cosa aggiungeresti che oggi non c'è?">
        <LongText value={answers.would_add} maxLength={300} placeholder="Una funzione che ti sarebbe servita..." onChange={(v) => update("would_add", v)} />
      </Q>

      <Q label="La persona che ha ricevuto il regalo cosa ti ha detto/scritto?">
        <LongText value={answers.recipient_feedback} maxLength={300} placeholder="Anche una frase. Se non ha detto nulla, salta pure." onChange={(v) => update("recipient_feedback", v)} />
      </Q>
    </div>
  );
}

function Section2({ answers, update, toggleMulti }: { answers: Answers; update: <K extends keyof Answers>(k: K, v: Answers[K]) => void; toggleMulti: (k: "preferred_pricing" | "online_purchase_sites", v: string, max?: number) => void }) {
  const showVW = answers.would_pay && answers.would_pay !== "no_free";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Q label="Pagheresti per usare BeGift?" required>
        <Radio name="would_pay" value={answers.would_pay} options={[
          { value: "yes_worth_it", label: "Sì, mi sembra valga il prezzo" },
          { value: "yes_low",       label: "Sì, ma solo a un prezzo basso" },
          { value: "maybe",         label: "Forse, dipende dal prezzo e dalle funzioni" },
          { value: "no_free",       label: "No, vorrei usarlo sempre gratis" },
        ]} onChange={(v) => update("would_pay", v)} />
      </Q>

      {showVW && (
        <>
          <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, margin: "0 0 -6px", padding: "10px 12px", background: "#fff8ec", border: "1px solid #f0e0c0", borderRadius: 10 }}>
            🧮 <strong>Quattro domande sul prezzo (Van Westendorp).</strong> Indica un prezzo in <strong>€/anno</strong>. Anche zero se ti viene così.
          </p>

          <Q label='A che prezzo penseresti "troppo caro, non lo userei"?' required>
            <NumberE value={answers.price_too_expensive} onChange={(v) => update("price_too_expensive", v)} />
          </Q>

          <Q label='A che prezzo penseresti "caro, ma forse vale"?' required>
            <NumberE value={answers.price_expensive_but_worth} onChange={(v) => update("price_expensive_but_worth", v)} />
          </Q>

          <Q label='A che prezzo penseresti "buon affare"?' required>
            <NumberE value={answers.price_good_deal} onChange={(v) => update("price_good_deal", v)} />
          </Q>

          <Q label='A che prezzo penseresti "troppo economico, non mi fido della qualità"?' required>
            <NumberE value={answers.price_too_cheap} onChange={(v) => update("price_too_cheap", v)} />
          </Q>
        </>
      )}

      <Q label="Per quale formula pagheresti più volentieri?">
        <p style={{ fontSize: 12, color: MUTED, margin: "-4px 0 8px" }}>Massimo 2 selezioni</p>
        <MultiCheck name="preferred_pricing" values={answers.preferred_pricing ?? []} options={[
          "Abbonamento mensile (es. 2-5€/mese)",
          "Abbonamento annuale (es. 20-30€/anno)",
          "Pagamento singolo per regalo (es. 1€ ogni regalo)",
          "Premium packaging (animazioni, palette uniche) come 'in-app purchase'",
          "Storage illimitato foto/video",
          "Niente, vorrei tutto gratis",
        ]} max={2} onToggle={(v) => toggleMulti("preferred_pricing", v, 2)} />
      </Q>
    </div>
  );
}

function Section3({ answers, update, toggleMulti }: { answers: Answers; update: <K extends keyof Answers>(k: K, v: Answers[K]) => void; toggleMulti: (k: "preferred_pricing" | "online_purchase_sites", v: string, max?: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: 0 }}>
        Stiamo valutando una funzione: invece di creare un regalo da zero, potresti <strong>inoltrare a BeGift una mail di acquisto</strong> (un voucher, un biglietto, un'esperienza) e BeGift lo impacchetta automaticamente.
      </p>

      <Q label="Hai mai pensato di trasformare in regalo un voucher, biglietto o esperienza che hai comprato online?" required>
        <Radio name="voucher_interest" value={answers.voucher_interest} options={[
          { value: "very_useful",   label: "Sì, sarebbe utilissimo" },
          { value: "would_try",     label: "Mi piacerebbe provarlo" },
          { value: "not_for_me",    label: "No, non mi serve" },
          { value: "never_thought", label: "Non avevo mai pensato a questa possibilità" },
        ]} onChange={(v) => update("voucher_interest", v)} />
      </Q>

      <Q label="Se compri regali online, da quali siti tipicamente?">
        <p style={{ fontSize: 12, color: MUTED, margin: "-4px 0 8px" }}>Massimo 5 selezioni</p>
        <MultiCheck name="online_purchase_sites" values={answers.online_purchase_sites ?? []} options={[
          "Booking, Airbnb, Hotels (viaggi)",
          "Trenitalia, Italo, Ryanair, easyJet (trasporti)",
          "Vivaticket, Ticketone, Eventbrite (eventi/concerti)",
          "Smartbox, Wonderbox, Cofanetti (esperienze)",
          "TheFork, Groupon (cene/ristoranti)",
          "Amazon (voucher / gift card)",
          "Decathlon, Zalando, Sephora (shopping)",
          "Spotify, Netflix, Audible (abbonamenti / gift card)",
          "Treatwell, Spa (beauty/wellness)",
          "Altro",
        ]} max={5} onToggle={(v) => toggleMulti("online_purchase_sites", v, 5)} />
      </Q>
    </div>
  );
}

function Section4({ answers, update }: { answers: Answers; update: <K extends keyof Answers>(k: K, v: Answers[K]) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Q label="Userai di nuovo BeGift?" required>
        <Radio name="reuse" value={answers.reuse} options={[
          { value: "yes_for_sure",  label: "Sì, sicuramente" },
          { value: "maybe",         label: "Forse, dipende dall'occasione" },
          { value: "no",            label: "No, è stata un'esperienza una-tantum" },
        ]} onChange={(v) => update("reuse", v)} />
      </Q>

      <Q label="Da 0 a 10, quanto è probabile che consigli BeGift a un amico?" required>
        <Scale value={answers.nps_score} min={0} max={10} leftLabel="Per niente probabile" rightLabel="Sicuramente" onChange={(v) => update("nps_score", v)} />
      </Q>

      <Q label="Perché hai dato questo voto?">
        <LongText value={answers.nps_reason} maxLength={300} placeholder="Una riga basta..." onChange={(v) => update("nps_reason", v)} />
      </Q>
    </div>
  );
}

function Section5({ answers, update }: { answers: Answers; update: <K extends keyof Answers>(k: K, v: Answers[K]) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: 0 }}>
        Tutte queste sono opzionali. Se preferisci non rispondere a nulla, va bene così — clicca direttamente "Invia sondaggio" sotto.
      </p>

      <Q label="Età">
        <Radio name="age_range" value={answers.age_range} options={[
          "18-24","25-34","35-44","45-54","55-64","65+","Preferisco non dire",
        ]} onChange={(v) => update("age_range", v)} />
      </Q>

      <Q label="Genere">
        <Radio name="gender" value={answers.gender} options={[
          "Donna","Uomo","Altro / non binario","Preferisco non dire",
        ]} onChange={(v) => update("gender", v)} />
      </Q>

      <Q label="Vuoi che ti contatti per un breve confronto telefonico (10 minuti)?">
        <Radio name="willing_to_call" value={answers.willing_to_call} options={[
          { value: "yes", label: "Sì" },
          { value: "no",  label: "No, grazie" },
        ]} onChange={(v) => update("willing_to_call", v)} />
      </Q>

      {answers.willing_to_call === "yes" && (
        <Q label="La tua email">
          <input
            type="email"
            value={answers.contact_email ?? ""}
            onChange={(e) => update("contact_email", e.target.value)}
            placeholder="es. mario@email.com"
            style={inputStyle}
          />
        </Q>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Componenti riusabili (locali, no over-engineering)
// ════════════════════════════════════════════════════════════════════

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", fontSize: 15,
  border: `1.5px solid ${BORDER}`, borderRadius: 11,
  outline: "none", boxSizing: "border-box",
  background: "#fff", color: DEEP, fontFamily: "inherit",
};

function Q({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: DEEP, marginBottom: 8, lineHeight: 1.45 }}>
        {label}{required && <span style={{ color: ACCENT, marginLeft: 4 }}>*</span>}
      </div>
      {children}
    </div>
  );
}

interface RadioOption { value: string; label: string }
function Radio({ name, value, options, onChange }: {
  name: string;
  value: string | undefined;
  options: (string | RadioOption)[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {options.map((opt) => {
        const optValue = typeof opt === "string" ? opt : opt.value;
        const optLabel = typeof opt === "string" ? opt : opt.label;
        const active = value === optValue;
        return (
          <label key={optValue} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px",
            background: active ? `${ACCENT}10` : "#fff",
            border: `1.5px solid ${active ? ACCENT : BORDER}`,
            borderRadius: 10,
            cursor: "pointer",
            transition: "all .12s",
          }}>
            <input
              type="radio" name={name} value={optValue} checked={active}
              onChange={() => onChange(optValue)}
              style={{ accentColor: ACCENT, cursor: "pointer" }}
            />
            <span style={{ fontSize: 14, color: DEEP, lineHeight: 1.4 }}>{optLabel}</span>
          </label>
        );
      })}
    </div>
  );
}

function MultiCheck({ name, values, options, max, onToggle }: {
  name: string;
  values: string[];
  options: string[];
  max?: number;
  onToggle: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {options.map((opt) => {
        const active = values.includes(opt);
        const reachedMax = !active && max !== undefined && values.length >= max;
        return (
          <label key={opt} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px",
            background: active ? `${ACCENT}10` : "#fff",
            border: `1.5px solid ${active ? ACCENT : BORDER}`,
            borderRadius: 10,
            cursor: reachedMax ? "not-allowed" : "pointer",
            opacity: reachedMax ? 0.5 : 1,
            transition: "all .12s",
          }}>
            <input
              type="checkbox" name={name} checked={active}
              disabled={reachedMax}
              onChange={() => onToggle(opt)}
              style={{ accentColor: ACCENT, cursor: reachedMax ? "not-allowed" : "pointer" }}
            />
            <span style={{ fontSize: 14, color: DEEP, lineHeight: 1.4 }}>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function Scale({ value, min, max, leftLabel, rightLabel, onChange }: {
  value: number | undefined;
  min: number; max: number;
  leftLabel: string; rightLabel: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: 4, justifyContent: "space-between", marginBottom: 6 }}>
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const n = min + i;
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              style={{
                flex: 1, minWidth: 28, height: 38,
                background: active ? ACCENT : "#fff",
                color: active ? "#fff" : DEEP,
                border: `1.5px solid ${active ? ACCENT : BORDER}`,
                borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all .12s",
              }}
            >{n}</button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MUTED }}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function LongText({ value, maxLength, placeholder, onChange }: {
  value: string | undefined;
  maxLength: number;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  const len = (value ?? "").length;
  return (
    <div>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        style={{
          ...inputStyle,
          resize: "vertical",
          fontSize: 14, lineHeight: 1.5,
        }}
      />
      <div style={{ fontSize: 11, color: MUTED, textAlign: "right", marginTop: 4 }}>
        {len} / {maxLength}
      </div>
    </div>
  );
}

function NumberE({ value, onChange }: { value: number | null | undefined; onChange: (v: number) => void }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type="number"
        min={0} max={500}
        value={value ?? ""}
        onChange={(e) => {
          const n = e.target.value === "" ? NaN : Number(e.target.value);
          if (!isNaN(n)) onChange(n);
        }}
        placeholder="0"
        inputMode="numeric"
        style={{ ...inputStyle, paddingRight: 48 }}
      />
      <span style={{
        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
        fontSize: 13, color: MUTED, fontWeight: 600,
        pointerEvents: "none",
      }}>€/anno</span>
    </div>
  );
}
