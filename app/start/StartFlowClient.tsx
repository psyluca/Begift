"use client";

/**
 * Intent picker guidato (client component, gestione step in-memory).
 *
 * Stato:
 *   - step: 0 (nome) | 1 (intent) | 2 (sub-intent, solo per "ho gia'")
 *   - recipientName: stringa dal step 0
 *   - intent: scelta dello step 1
 *
 * Routing finale (al click di una tap-card):
 *   music   -> /discover?category=music&for={name}
 *   food    -> /discover?category=food&for={name}
 *   travel  -> /discover?category=travel&for={name}
 *   message -> /create?for={name}
 *   ready   -> step 2 (sub-picker)
 *     ready_email -> /settings#email-parser  (con istruzioni)
 *     ready_file  -> /create?for={name}&mode=upload
 *
 * Il parametro for={name} viaggia col routing per pre-popolare il
 * destinatario nei flussi successivi. Solo lettura: i flow target
 * possono ignorarlo (per ora nessuno lo consuma, ma e' future-proof).
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const BORDER = "#e8e4de";
const CARD = "#fff";

type Intent = "music" | "food" | "travel" | "message" | "ready";
type ReadySubtype = "email" | "file";

interface IntentOption {
  value: Intent;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string;
}

const INTENTS: IntentOption[] = [
  {
    value: "music",
    emoji: "🎵",
    title: "Un concerto o evento",
    subtitle: "Biglietti per concerti, festival, teatro, opera",
    gradient: "linear-gradient(135deg,#c4407a 0%,#e87ba8 100%)",
  },
  {
    value: "food",
    emoji: "🍷",
    title: "Una cena o esperienza",
    subtitle: "Cooking class, degustazione vini, ristorante, spa",
    gradient: "linear-gradient(135deg,#d4537e 0%,#f4a04a 100%)",
  },
  {
    value: "travel",
    emoji: "✈️",
    title: "Un weekend o viaggio",
    subtitle: "Hotel, esperienze in giornata, tour multi-giorno",
    gradient: "linear-gradient(135deg,#3a78c2 0%,#7eb3ed 100%)",
  },
  {
    value: "message",
    emoji: "💌",
    title: "Un messaggio personalizzato",
    subtitle: "Una canzone, un video, una dedica scritta da te",
    gradient: "linear-gradient(135deg,#6b5bcc 0%,#a484e8 100%)",
  },
  {
    value: "ready",
    emoji: "📦",
    title: "Ho già qualcosa pronto",
    subtitle: "Una mail di conferma, un file, una prenotazione",
    gradient: "linear-gradient(135deg,#3b8c5a 0%,#7dbf63 100%)",
  },
];

export default function StartFlowClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [recipientName, setRecipientName] = useState("");
  const [, setIntent] = useState<Intent | null>(null);

  // Se l'utente arriva con ?for=NOME (es. da 'Cambia idea' su /discover)
  // salta direttamente allo step 1 (intent picker) col nome gia' compilato.
  // Fix UX feedback Luca 2026-05-16: prima 'Cambia idea' faceva hard reset
  // a step 0 perdendo il destinatario gia' scelto.
  useEffect(() => {
    const forParam = searchParams.get("for");
    if (forParam && forParam.trim().length > 0) {
      setRecipientName(forParam);
      setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trimmedName = recipientName.trim();
  const safeName = encodeURIComponent(trimmedName);

  const handleIntentClick = (value: Intent) => {
    setIntent(value);
    track("start_intent_picked", { intent: value });
    switch (value) {
      case "music":
        router.push(`/discover?category=music&for=${safeName}`);
        break;
      case "food":
        router.push(`/discover?category=food&for=${safeName}`);
        break;
      case "travel":
        router.push(`/discover?category=travel&for=${safeName}`);
        break;
      case "message":
        router.push(`/create?for=${safeName}`);
        break;
      case "ready":
        setStep(2);
        break;
    }
  };

  const handleReadySubtype = (subtype: ReadySubtype) => {
    track("start_ready_subtype_picked", { subtype });
    if (subtype === "email") {
      // Fix UX 2026-05-16: /settings richiede login + non spiega niente.
      // /forward-mail e' la landing pubblica con i 3 step + indirizzo da
      // copiare, perfetta per onboarding-soft anche a utenti non loggati.
      router.push("/forward-mail");
    } else {
      // file upload → /create con flag per pre-selezionare il path
      // "carica file" invece di "scrivi messaggio". Il flag mode=upload
      // viene passato a /create per future iterazioni che potranno
      // skipparci direttamente all'upload step.
      router.push(`/create?for=${safeName}&mode=upload`);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, sans-serif",
        padding: "48px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* Progresso */}
        <p
          style={{
            fontSize: 12,
            color: MUTED,
            textAlign: "center",
            margin: "0 0 24px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Passo {step === 2 ? 3 : step + 1} di {step === 2 ? 3 : 2}
        </p>

        {step === 0 && (
          <StepName
            value={recipientName}
            onChange={setRecipientName}
            onContinue={() => {
              if (trimmedName.length > 0) setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <StepIntent
            recipientName={trimmedName}
            onPick={handleIntentClick}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <StepReadySubtype
            recipientName={trimmedName}
            onPick={handleReadySubtype}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 0 — Nome destinatario
// ──────────────────────────────────────────────────────────────

function StepName({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  const canContinue = value.trim().length > 0;
  const handleContinue = () => {
    if (!canContinue) return;
    track("start_step1_completed");
    onContinue();
  };
  return (
    <div>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: INK,
          margin: "0 0 12px",
          letterSpacing: "-0.4px",
          lineHeight: 1.15,
          textAlign: "center",
        }}
      >
        A chi stai pensando?
      </h1>
      <p
        style={{
          fontSize: 15,
          color: MUTED,
          lineHeight: 1.5,
          textAlign: "center",
          margin: "0 0 32px",
        }}
      >
        Una persona, un nome qualsiasi. Anche un soprannome.
      </p>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canContinue) handleContinue();
        }}
        autoFocus
        placeholder="Mamma, Lucia, papà, mio fratello…"
        // Attributi anti-autocomplete: Chrome senza questi vede un input
        // 'name' generico e propone carte di credito/anagrafica salvate.
        // Fix UX Luca 2026-05-16. autocomplete="off" da solo non basta
        // in Chrome — usiamo name unico + data-form-type="other".
        name="begift-recipient-nickname"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore="true"
        style={{
          width: "100%",
          padding: "16px 18px",
          fontSize: 18,
          border: `1.5px solid ${BORDER}`,
          borderRadius: 14,
          background: CARD,
          boxSizing: "border-box",
          outline: "none",
          transition: "border-color .14s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = ACCENT;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = BORDER;
        }}
      />

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canContinue}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "16px 18px",
          background: canContinue ? ACCENT : "#ddd",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          border: "none",
          borderRadius: 50,
          cursor: canContinue ? "pointer" : "not-allowed",
          boxShadow: canContinue
            ? "0 10px 28px rgba(212,83,126,.28)"
            : "none",
          transition: "transform .14s",
        }}
      >
        Continua →
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 1 — Intent picker
// ──────────────────────────────────────────────────────────────

function StepIntent({
  recipientName,
  onPick,
  onBack,
}: {
  recipientName: string;
  onPick: (v: Intent) => void;
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
        ← Cambia destinatario
      </button>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: INK,
          margin: "0 0 12px",
          letterSpacing: "-0.3px",
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        Cosa vorresti regalare a{" "}
        <span style={{ color: ACCENT }}>{recipientName}</span>?
      </h1>
      <p
        style={{
          fontSize: 14,
          color: MUTED,
          textAlign: "center",
          margin: "0 0 28px",
        }}
      >
        Tocca quello che ti viene in mente. Possiamo sempre cambiare.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {INTENTS.map((it) => (
          <IntentCard key={it.value} option={it} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}

function IntentCard({
  option,
  onPick,
}: {
  option: IntentOption;
  onPick: (v: Intent) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(option.value)}
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "16px 18px",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 14,
        transition: "transform .14s, border-color .14s, box-shadow .14s",
        width: "100%",
      }}
      onMouseEnter={(ev) => {
        const t = ev.currentTarget;
        t.style.transform = "translateY(-1px)";
        t.style.borderColor = ACCENT;
        t.style.boxShadow = "0 8px 20px rgba(0,0,0,0.05)";
      }}
      onMouseLeave={(ev) => {
        const t = ev.currentTarget;
        t.style.transform = "translateY(0)";
        t.style.borderColor = BORDER;
        t.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: option.gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          flexShrink: 0,
        }}
        aria-hidden
      >
        {option.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: INK,
            margin: "0 0 2px",
            lineHeight: 1.25,
          }}
        >
          {option.title}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: MUTED,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {option.subtitle}
        </p>
      </div>
      <span style={{ color: MUTED, fontSize: 18, flexShrink: 0 }}>→</span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 2 — Sub-picker per "Ho gia' qualcosa pronto"
// ──────────────────────────────────────────────────────────────

function StepReadySubtype({
  recipientName,
  onPick,
  onBack,
}: {
  recipientName: string;
  onPick: (t: ReadySubtype) => void;
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
        ← Cambia tipo di regalo
      </button>

      <h1
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: INK,
          margin: "0 0 12px",
          letterSpacing: "-0.3px",
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        Cos'hai pronto per{" "}
        <span style={{ color: ACCENT }}>{recipientName}</span>?
      </h1>
      <p
        style={{
          fontSize: 14,
          color: MUTED,
          textAlign: "center",
          margin: "0 0 28px",
        }}
      >
        Ti accompagniamo da lì.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <IntentCard
          option={{
            value: "ready", // unused here
            emoji: "📧",
            title: "Una mail di conferma",
            subtitle:
              "Hai comprato online (TicketOne, Booking, Smartbox…). La inoltri a BeGift e prepariamo il pacco.",
            gradient: "linear-gradient(135deg,#3a78c2,#7eb3ed)",
          }}
          onPick={() => onPick("email")}
        />
        <IntentCard
          option={{
            value: "ready",
            emoji: "📁",
            title: "Un file dal computer",
            subtitle:
              "Una foto, un video, un PDF, un audio. Lo carichi e diventa parte del regalo.",
            gradient: "linear-gradient(135deg,#6b5bcc,#a484e8)",
          }}
          onPick={() => onPick("file")}
        />
      </div>
    </div>
  );
}
