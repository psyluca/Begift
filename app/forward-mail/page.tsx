/**
 * /forward-mail
 *
 * Pagina pubblica che spiega come funziona la feature "forwarda una
 * mail di conferma acquisto e BeGift pre-prepara il regalo".
 *
 * Pattern Tripit applicato al gifting: il sender forwarda mail di
 * conferma (concerto, esperienza, viaggio) a un indirizzo BeGift, e
 * trova un pacco regalo gia' 80% pronto, da personalizzare solo col
 * messaggio emozionale.
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_EMAIL_PARSER
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#888";
const SOFT_BG = "#f7f5f2";
const CARD = "#fff";
const BORDER = "#e8e4de";

const FORWARD_ADDRESS =
  process.env.NEXT_PUBLIC_EMAIL_PARSER_ADDRESS || "plans@begift.app";

export const metadata: Metadata = {
  title: "Inoltra una mail, regala in un click",
  description:
    "Hai comprato un biglietto, un cofanetto, un'esperienza? Inoltra la mail di conferma a BeGift e troverai il regalo digitale gia' pronto da inviare. Pattern Tripit applicato al gifting.",
};

export default function ForwardMailPage() {
  if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER !== "true") {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, sans-serif",
        padding: "32px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", padding: "24px 8px 32px" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>📧✨🎁</div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: INK,
              margin: "0 0 12px",
              letterSpacing: "-0.5px",
              lineHeight: 1.15,
            }}
          >
            Hai comprato un regalo?
            <br />
            <span style={{ color: ACCENT }}>Inoltracelo, ci pensiamo noi.</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: MUTED,
              lineHeight: 1.6,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            Concerti, cofanetti esperienza, prenotazioni viaggio. Inoltra la
            mail di conferma a BeGift e trovi il pacco regalo gia&apos; pronto
            da personalizzare.
          </p>
        </div>

        {/* Indirizzo da forwardare — card prominente */}
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            padding: "24px 20px",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 13, color: MUTED, margin: "0 0 8px" }}>
            Inoltra le mail a questo indirizzo
          </p>
          <code
            style={{
              fontSize: 20,
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              color: ACCENT,
              fontWeight: 700,
              background: "#fef0f5",
              padding: "8px 14px",
              borderRadius: 8,
              display: "inline-block",
            }}
          >
            {FORWARD_ADDRESS}
          </code>
          <p style={{ fontSize: 12, color: MUTED, margin: "12px 0 0" }}>
            Tocca per copiare · funziona da Gmail, Outlook, qualsiasi client mail
          </p>
        </div>

        {/* Come funziona — 3 step */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: INK,
            margin: "32px 0 16px",
            textAlign: "center",
          }}
        >
          Come funziona
        </h2>
        <div style={{ display: "grid", gap: 16, marginBottom: 32 }}>
          <Step
            n={1}
            title="Compri qualcosa per qualcuno"
            text="Un'esperienza, un tour, un biglietto, una notte in hotel: ricevi la conferma via mail."
            emoji="🎫"
          />
          <Step
            n={2}
            title="Inoltra la mail a BeGift"
            text={`Usa il tasto "Inoltra" del tuo client e mandala a ${FORWARD_ADDRESS}. Pochi secondi.`}
            emoji="📤"
          />
          <Step
            n={3}
            title="Trovi il pacco quasi pronto"
            text="BeGift estrae automaticamente data, posti, codici. Tu aggiungi solo il messaggio emozionale e invii."
            emoji="✨"
          />
        </div>

        {/* Cosa supportiamo */}
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: INK,
            margin: "32px 0 12px",
          }}
        >
          Cosa riconosciamo
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 8,
            marginBottom: 32,
          }}
        >
          {[
            { icon: "🌍", label: "Esperienze GetYourGuide" },
            { icon: "🎫", label: "Biglietti per eventi" },
            { icon: "🎁", label: "Cofanetti esperienza" },
            { icon: "🏨", label: "Hotel e soggiorni" },
            { icon: "🚄", label: "Treni Trenitalia" },
            { icon: "✉️", label: "Altre mail di acquisto" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: "12px 10px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 12, color: INK, fontWeight: 500 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: MUTED, textAlign: "center", margin: "-8px 0 32px" }}>
          Anche se non &egrave; nella lista, ci proviamo. Il parsing intelligente
          riconosce molti altri formati.
        </p>

        {/* Privacy */}
        <div
          style={{
            background: "#fbf9f5",
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "16px 18px",
            marginBottom: 32,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: INK,
              margin: "0 0 8px",
            }}
          >
            🔒 Privacy &amp; consenso
          </h3>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>
            La feature &egrave; opt-in: devi attivarla esplicitamente in{" "}
            <Link href="/settings" style={{ color: ACCENT }}>
              Impostazioni
            </Link>
            . Le mail vengono processate da un sistema di intelligenza artificiale
            (Anthropic Claude) per estrarre dati strutturati. I draft scaduti
            (&gt;30 giorni) vengono cancellati automaticamente. Puoi disattivare
            il servizio in qualsiasi momento.{" "}
            <Link href="/privacy" style={{ color: ACCENT }}>
              Privacy policy
            </Link>
            .
          </p>
        </div>

        {/* CTA finale */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link
            href="/settings#email-parser"
            style={{
              display: "inline-block",
              background: ACCENT,
              color: "#fff",
              padding: "14px 32px",
              borderRadius: 50,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 10px 32px rgba(212,83,126,.35)",
            }}
          >
            Attiva la feature in Impostazioni →
          </Link>
          <p style={{ fontSize: 12, color: MUTED, margin: "16px 0 0" }}>
            Gratuita durante il periodo di lancio
          </p>
        </div>
      </div>
    </main>
  );
}

function Step({
  n,
  title,
  text,
  emoji,
}: {
  n: number;
  title: string;
  text: string;
  emoji: string;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "20px 18px",
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: ACCENT,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: INK,
            margin: "0 0 4px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>{emoji}</span>
          {title}
        </h3>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: 0 }}>
          {text}
        </p>
      </div>
    </div>
  );
}
