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
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
    t("survey.section_title_1"),
    t("survey.section_title_2"),
    t("survey.section_title_3"),
    t("survey.section_title_4"),
    t("survey.section_title_5"),
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
        setSubmitError((data as { error?: string }).error || t("survey.error_generic", { status: String(res.status) }));
        return;
      }
      // Pulisco il draft e vado alla pagina di ringraziamento
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      router.push("/sondaggio/grazie");
    } catch (e) {
      console.error("[sondaggio] submit error", e);
      setSubmitError(t("survey.error_network"));
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
            {t("survey.section_label", { current: String(section + 1), total: String(totalSections) })}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: DEEP, margin: 0, letterSpacing: "-.4px", lineHeight: 1.2 }}>
            {sectionTitles[section]}
          </h1>
          {section === 0 && (
            <p style={{ fontSize: 13.5, color: MUTED, marginTop: 8, lineHeight: 1.55 }}>
              {t("survey.intro")}
            </p>
          )}
        </div>

        {/* Sezioni */}
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
          {section === 0 && <Section1 answers={answers} update={update} t={t} />}
          {section === 1 && <Section2 answers={answers} update={update} toggleMulti={toggleMulti} t={t} />}
          {section === 2 && <Section3 answers={answers} update={update} toggleMulti={toggleMulti} t={t} />}
          {section === 3 && <Section4 answers={answers} update={update} t={t} />}
          {section === 4 && <Section5 answers={answers} update={update} t={t} />}
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
            }}>{t("survey.back")}</button>
          )}
          {section < totalSections - 1 ? (
            <button onClick={next} disabled={!sectionValid(section)} style={{
              flex: 1,
              background: sectionValid(section) ? ACCENT : "#e0d0c8",
              color: "#fff", border: "none", borderRadius: 40,
              padding: "13px 24px", fontSize: 15, fontWeight: 800,
              cursor: sectionValid(section) ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}>{t("survey.next")}</button>
          ) : (
            <button onClick={submit} disabled={submitting} style={{
              flex: 1, background: ACCENT, color: "#fff", border: "none",
              borderRadius: 40, padding: "13px 24px", fontSize: 15, fontWeight: 800,
              cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1,
              boxShadow: "0 8px 22px rgba(212,83,126,.35)", fontFamily: "inherit",
            }}>{submitting ? t("survey.submitting") : t("survey.submit")}</button>
          )}
        </div>

        <p style={{ fontSize: 11, color: MUTED, textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>
          {t("survey.footer_privacy")}
        </p>
      </div>
    </main>
  );
}

// ════════════════════════════════════════════════════════════════════
// Sezioni
// ════════════════════════════════════════════════════════════════════

type T = (key: string, params?: Record<string, string>) => string;

function Section1({ answers, update, t }: { answers: Answers; update: <K extends keyof Answers>(k: K, v: Answers[K]) => void; t: T }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Q label={t("survey.q_recipient_type")} required>
        <Radio name="recipient_type" value={answers.recipient_type} options={[
          { value: t("survey.recipient_mom"),         label: t("survey.recipient_mom") },
          { value: t("survey.recipient_dad"),         label: t("survey.recipient_dad") },
          { value: t("survey.recipient_partner"),     label: t("survey.recipient_partner") },
          { value: t("survey.recipient_sibling"),     label: t("survey.recipient_sibling") },
          { value: t("survey.recipient_child"),       label: t("survey.recipient_child") },
          { value: t("survey.recipient_friend"),      label: t("survey.recipient_friend") },
          { value: t("survey.recipient_aunt_cousin"), label: t("survey.recipient_aunt_cousin") },
          { value: t("survey.recipient_other"),       label: t("survey.recipient_other") },
        ]} onChange={(v) => update("recipient_type", v)} />
      </Q>

      <Q label={t("survey.q_occasion")} required>
        <Radio name="occasion" value={answers.occasion} options={[
          { value: t("survey.occasion_mothers_day"), label: t("survey.occasion_mothers_day") },
          { value: t("survey.occasion_birthday"),    label: t("survey.occasion_birthday") },
          { value: t("survey.occasion_anniversary"), label: t("survey.occasion_anniversary") },
          { value: t("survey.occasion_thanks"),      label: t("survey.occasion_thanks") },
          { value: t("survey.occasion_no_reason"),   label: t("survey.occasion_no_reason") },
          { value: t("survey.occasion_other"),       label: t("survey.occasion_other") },
        ]} onChange={(v) => update("occasion", v)} />
      </Q>

      <Q label={t("survey.q_experience_rating")} required>
        <Scale value={answers.experience_rating} min={1} max={5} leftLabel={t("survey.scale_not_at_all")} rightLabel={t("survey.scale_a_lot")} onChange={(v) => update("experience_rating", v)} />
      </Q>

      <Q label={t("survey.q_liked_most")}>
        <LongText value={answers.liked_most} maxLength={200} placeholder={t("survey.ph_liked_most")} onChange={(v) => update("liked_most", v)} />
      </Q>

      <Q label={t("survey.q_frustrated")}>
        <LongText value={answers.frustrated} maxLength={200} placeholder={t("survey.ph_frustrated")} onChange={(v) => update("frustrated", v)} />
      </Q>

      <Q label={t("survey.q_would_add")}>
        <LongText value={answers.would_add} maxLength={300} placeholder={t("survey.ph_would_add")} onChange={(v) => update("would_add", v)} />
      </Q>

      <Q label={t("survey.q_recipient_feedback")}>
        <LongText value={answers.recipient_feedback} maxLength={300} placeholder={t("survey.ph_recipient_feedback")} onChange={(v) => update("recipient_feedback", v)} />
      </Q>
    </div>
  );
}

function Section2({ answers, update, toggleMulti, t }: { answers: Answers; update: <K extends keyof Answers>(k: K, v: Answers[K]) => void; toggleMulti: (k: "preferred_pricing" | "online_purchase_sites", v: string, max?: number) => void; t: T }) {
  const showVW = answers.would_pay && answers.would_pay !== "no_free";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Q label={t("survey.q_would_pay")} required>
        <Radio name="would_pay" value={answers.would_pay} options={[
          { value: "yes_worth_it", label: t("survey.pay_yes_worth_it") },
          { value: "yes_low",       label: t("survey.pay_yes_low") },
          { value: "maybe",         label: t("survey.pay_maybe") },
          { value: "no_free",       label: t("survey.pay_no_free") },
        ]} onChange={(v) => update("would_pay", v)} />
      </Q>

      {showVW && (
        <>
          <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, margin: "0 0 -6px", padding: "10px 12px", background: "#fff8ec", border: "1px solid #f0e0c0", borderRadius: 10 }}
             dangerouslySetInnerHTML={{ __html: t("survey.vw_intro") }} />

          <Q label={t("survey.q_price_too_expensive")} required>
            <NumberE value={answers.price_too_expensive} unit={t("survey.price_unit")} onChange={(v) => update("price_too_expensive", v)} />
          </Q>

          <Q label={t("survey.q_price_expensive_but_worth")} required>
            <NumberE value={answers.price_expensive_but_worth} unit={t("survey.price_unit")} onChange={(v) => update("price_expensive_but_worth", v)} />
          </Q>

          <Q label={t("survey.q_price_good_deal")} required>
            <NumberE value={answers.price_good_deal} unit={t("survey.price_unit")} onChange={(v) => update("price_good_deal", v)} />
          </Q>

          <Q label={t("survey.q_price_too_cheap")} required>
            <NumberE value={answers.price_too_cheap} unit={t("survey.price_unit")} onChange={(v) => update("price_too_cheap", v)} />
          </Q>
        </>
      )}

      <Q label={t("survey.q_preferred_pricing")}>
        <p style={{ fontSize: 12, color: MUTED, margin: "-4px 0 8px" }}>{t("survey.max_n_selections", { n: "2" })}</p>
        <MultiCheck name="preferred_pricing" values={answers.preferred_pricing ?? []} options={[
          t("survey.pricing_monthly"),
          t("survey.pricing_yearly"),
          t("survey.pricing_per_gift"),
          t("survey.pricing_premium"),
          t("survey.pricing_storage"),
          t("survey.pricing_free"),
        ]} max={2} onToggle={(v) => toggleMulti("preferred_pricing", v, 2)} />
      </Q>
    </div>
  );
}

function Section3({ answers, update, toggleMulti, t }: { answers: Answers; update: <K extends keyof Answers>(k: K, v: Answers[K]) => void; toggleMulti: (k: "preferred_pricing" | "online_purchase_sites", v: string, max?: number) => void; t: T }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: 0 }}
         dangerouslySetInnerHTML={{ __html: t("survey.voucher_intro") }} />

      <Q label={t("survey.q_voucher_interest")} required>
        <Radio name="voucher_interest" value={answers.voucher_interest} options={[
          { value: "very_useful",   label: t("survey.voucher_very_useful") },
          { value: "would_try",     label: t("survey.voucher_would_try") },
          { value: "not_for_me",    label: t("survey.voucher_not_for_me") },
          { value: "never_thought", label: t("survey.voucher_never_thought") },
        ]} onChange={(v) => update("voucher_interest", v)} />
      </Q>

      <Q label={t("survey.q_online_sites")}>
        <p style={{ fontSize: 12, color: MUTED, margin: "-4px 0 8px" }}>{t("survey.max_n_selections", { n: "5" })}</p>
        <MultiCheck name="online_purchase_sites" values={answers.online_purchase_sites ?? []} options={[
          t("survey.site_travel"),
          t("survey.site_transport"),
          t("survey.site_events"),
          t("survey.site_experiences"),
          t("survey.site_food"),
          t("survey.site_amazon"),
          t("survey.site_shopping"),
          t("survey.site_subscriptions"),
          t("survey.site_beauty"),
          t("survey.site_other"),
        ]} max={5} onToggle={(v) => toggleMulti("online_purchase_sites", v, 5)} />
      </Q>
    </div>
  );
}

function Section4({ answers, update, t }: { answers: Answers; update: <K extends keyof Answers>(k: K, v: Answers[K]) => void; t: T }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Q label={t("survey.q_reuse")} required>
        <Radio name="reuse" value={answers.reuse} options={[
          { value: "yes_for_sure",  label: t("survey.reuse_yes_for_sure") },
          { value: "maybe",         label: t("survey.reuse_maybe") },
          { value: "no",            label: t("survey.reuse_no") },
        ]} onChange={(v) => update("reuse", v)} />
      </Q>

      <Q label={t("survey.q_nps")} required>
        <Scale value={answers.nps_score} min={0} max={10} leftLabel={t("survey.nps_left")} rightLabel={t("survey.nps_right")} onChange={(v) => update("nps_score", v)} />
      </Q>

      <Q label={t("survey.q_nps_reason")}>
        <LongText value={answers.nps_reason} maxLength={300} placeholder={t("survey.ph_nps_reason")} onChange={(v) => update("nps_reason", v)} />
      </Q>
    </div>
  );
}

function Section5({ answers, update, t }: { answers: Answers; update: <K extends keyof Answers>(k: K, v: Answers[K]) => void; t: T }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: 0 }}>
        {t("survey.section5_intro")}
      </p>

      <Q label={t("survey.q_age")}>
        <Radio name="age_range" value={answers.age_range} options={[
          { value: t("survey.age_18_24"),    label: t("survey.age_18_24") },
          { value: t("survey.age_25_34"),    label: t("survey.age_25_34") },
          { value: t("survey.age_35_44"),    label: t("survey.age_35_44") },
          { value: t("survey.age_45_54"),    label: t("survey.age_45_54") },
          { value: t("survey.age_55_64"),    label: t("survey.age_55_64") },
          { value: t("survey.age_65_plus"),  label: t("survey.age_65_plus") },
          { value: t("survey.prefer_not_say"), label: t("survey.prefer_not_say") },
        ]} onChange={(v) => update("age_range", v)} />
      </Q>

      <Q label={t("survey.q_gender")}>
        <Radio name="gender" value={answers.gender} options={[
          { value: t("survey.gender_woman"),     label: t("survey.gender_woman") },
          { value: t("survey.gender_man"),       label: t("survey.gender_man") },
          { value: t("survey.gender_other"),     label: t("survey.gender_other") },
          { value: t("survey.prefer_not_say"),   label: t("survey.prefer_not_say") },
        ]} onChange={(v) => update("gender", v)} />
      </Q>

      <Q label={t("survey.q_call")}>
        <Radio name="willing_to_call" value={answers.willing_to_call} options={[
          { value: "yes", label: t("survey.call_yes") },
          { value: "no",  label: t("survey.call_no") },
        ]} onChange={(v) => update("willing_to_call", v)} />
      </Q>

      {answers.willing_to_call === "yes" && (
        <Q label={t("survey.q_email")}>
          <input
            type="email"
            value={answers.contact_email ?? ""}
            onChange={(e) => update("contact_email", e.target.value)}
            placeholder={t("survey.ph_email")}
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

function NumberE({ value, unit, onChange }: { value: number | null | undefined; unit: string; onChange: (v: number) => void }) {
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
        style={{ ...inputStyle, paddingRight: 56 }}
      />
      <span style={{
        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
        fontSize: 13, color: MUTED, fontWeight: 600,
        pointerEvents: "none",
      }}>{unit}</span>
    </div>
  );
}
