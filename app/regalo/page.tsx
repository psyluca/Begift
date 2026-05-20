/**
 * /regalo
 *
 * Hub unificato del flusso "fai un regalo con BeGift". Una sola pagina
 * che presenta i 4 modi di entrare nel flow:
 *
 *   1. Catalogo  — scegli un'esperienza da regalare (GYG + VVT)
 *   2. File      — impacchetta qualcosa che hai sul computer
 *   3. Messaggio — scrivi un pensiero e lo presentiamo come regalo
 *   4. Mail      — inoltra una mail di conferma acquisto
 *
 * Tutti e 4 i path arrivano al medesimo "stato pacco regalo" che poi
 * passa per packaging customization e share link. Il valore di BeGift
 * non sta nel contenuto (il sender lo porta lui) ma nella confezione
 * digitale emozionale.
 *
 * Server component minimale: niente client JS, niente fetch DB.
 * Render statico = primo paint istantaneo. SEO-friendly: titolo,
 * meta description, copy editoriale (le 4 path sono parole-chiave
 * che la gente cerca quando vuole regalare).
 *
 * Design system invariato: ACCENT pink, INK quasi-nero, SOFT_BG beige,
 * card editoriali con border morbido invece di shadow harsh.
 */

import Link from "next/link";
import type { Metadata } from "next";

const ACCENT = "#D4537E";
const INK = "#1a1a1a";
const MUTED = "#7a7a7a";
const SOFT_BG = "#f7f5f2";
const BORDER = "#e8e4de";
const CARD = "#fff";

export const metadata: Metadata = {
  title: "Fai un regalo · BeGift",
  description:
    "Scegli un'esperienza, impacchetta un file, scrivi un messaggio o inoltra una mail di conferma — BeGift trasforma qualsiasi cosa in un regalo emozionale.",
};

interface PathCard {
  href: string;
  emoji: string;
  badge: string;
  title: string;
  description: string;
  details: string[];
  gradient: string;
  accentLine: string;
}

const PATHS: PathCard[] = [
  {
    href: "/regalo/catalogo",
    emoji: "🎁",
    badge: "Scopri",
    title: "Un'esperienza dal catalogo",
    description:
      "Concerti, tour, cene, partite, musical, weekend. Lo scegli qui, lo acquisti sul partner, BeGift lo trasforma in un pacco da aprire.",
    details: ["Concerti VivaTicket", "Esperienze GetYourGuide", "Eventi sportivi", "Musical & opera"],
    gradient: "linear-gradient(135deg, #FCE4EC 0%, #FFE0B2 100%)",
    accentLine: "#D4537E",
  },
  {
    href: "/regalo/file",
    emoji: "📁",
    badge: "Carica",
    title: "Un file dal tuo computer",
    description:
      "Una foto, un video, un audio, un PDF. Lo carichi, scegli la confezione, e diventa un regalo digitale.",
    details: ["Foto", "Video", "Audio", "PDF e voucher"],
    gradient: "linear-gradient(135deg, #EDE7F6 0%, #E1F5FE 100%)",
    accentLine: "#6B5BCC",
  },
  {
    href: "/regalo/messaggio",
    emoji: "💌",
    badge: "Scrivi",
    title: "Un messaggio scritto da te",
    description:
      "A volte la parola giusta vale più di un regalo. Scrivila e gliela consegniamo dentro un pacco animato.",
    details: ["Lettera digitale", "Dedica con foto", "Pensiero last-minute", "Auguri animati"],
    gradient: "linear-gradient(135deg, #FFF8E1 0%, #FCE4EC 100%)",
    accentLine: "#E8A04A",
  },
  {
    href: "/regalo/mail",
    emoji: "📧",
    badge: "Inoltra",
    title: "Una mail di conferma ricevuta",
    description:
      "Hai già comprato un biglietto, un cofanetto, una prenotazione? Inoltri la mail e prepariamo il pacco quasi pronto.",
    details: ["Biglietti acquistati", "Cofanetti esperienza", "Prenotazioni viaggio", "Conferme online"],
    gradient: "linear-gradient(135deg, #E0F2F1 0%, #F1F8E9 100%)",
    accentLine: "#3B8C5A",
  },
];

export default function RegaloHubPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: SOFT_BG,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "32px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Breadcrumb soft */}
        <div style={{ marginBottom: 18 }}>
          <Link
            href="/"
            style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}
          >
            ← Home
          </Link>
        </div>

        {/* Hero compact: niente pretesa di rifare il claim,
            qui siamo gia' dentro il flow. Un single domanda. */}
        <header
          style={{
            textAlign: "center",
            padding: "16px 8px 40px",
          }}
        >
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: ACCENT,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              margin: "0 0 12px",
            }}
          >
            Inizia il regalo
          </p>
          <h1
            style={{
              fontSize: "clamp(28px, 6vw, 44px)",
              fontWeight: 900,
              color: INK,
              margin: "0 0 14px",
              letterSpacing: "-1px",
              lineHeight: 1.1,
            }}
          >
            Cosa ci metti nel pacco?
          </h1>
          <p
            style={{
              fontSize: 16,
              color: MUTED,
              lineHeight: 1.6,
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            Quattro modi diversi, una sola magia. Qualunque contenuto scegli,
            la confezione la prepari poi insieme a noi.
          </p>
        </header>

        {/* 4 path cards. Grid 2x2 desktop, 1 col mobile. */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 18,
            marginBottom: 48,
          }}
        >
          {PATHS.map((p, i) => (
            <PathCardComponent key={p.href} card={p} index={i} />
          ))}
        </section>

        {/* Footer note + cross-link rassicurante */}
        <section
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 18,
            padding: "20px 22px",
            textAlign: "center",
            maxWidth: 720,
            margin: "0 auto",
          }}
        >
          <p style={{ fontSize: 13, color: INK, margin: "0 0 6px", fontWeight: 600 }}>
            Tutto gratis durante il lancio
          </p>
          <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.6 }}>
            BeGift e' la confezione digitale. Se compri un'esperienza dal
            catalogo, paghi sul sito del partner: il prezzo e' lo stesso che
            troveresti diretto.{" "}
            <Link href="/privacy" style={{ color: ACCENT, textDecoration: "underline" }}>
              Privacy & partner
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

/**
 * Card editoriale per ogni path. Hover lifts + accent line in alto.
 * Server-rendered (no useState), tutti i micro-interaction via :hover
 * CSS-only — niente flash di rehydration al page load.
 *
 * Ogni card ha una classe unica path-card-{index} cosi' il selector
 * :hover applica il proprio accent color senza overwrite tra card.
 */
function PathCardComponent({ card, index }: { card: PathCard; index: number }) {
  const cardClass = `path-card-${index}`;
  return (
    <Link
      href={card.href}
      style={{
        position: "relative",
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 22,
        padding: 0,
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "transform .2s ease, box-shadow .2s ease, border-color .2s",
        boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
      }}
      className={cardClass}
    >
      {/* Hero visual area con gradient + emoji grande */}
      <div
        style={{
          height: 130,
          background: card.gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderBottom: `4px solid ${card.accentLine}`,
        }}
      >
        <div
          style={{
            fontSize: 56,
            lineHeight: 1,
            filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.08))",
          }}
          aria-hidden
        >
          {card.emoji}
        </div>
        <span
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "rgba(255,255,255,0.92)",
            color: INK,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "5px 10px",
            borderRadius: 999,
            backdropFilter: "blur(4px)",
          }}
        >
          {index + 1} · {card.badge}
        </span>
      </div>

      {/* Corpo testuale */}
      <div
        style={{
          padding: "20px 22px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
        }}
      >
        <h2
          style={{
            fontSize: 19,
            fontWeight: 800,
            color: INK,
            margin: 0,
            lineHeight: 1.25,
            letterSpacing: "-0.3px",
          }}
        >
          {card.title}
        </h2>
        <p
          style={{
            fontSize: 14.5,
            color: MUTED,
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {card.description}
        </p>

        {/* Tag-list dei contenuti tipici */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "6px 0 0",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {card.details.map((d) => (
            <li
              key={d}
              style={{
                fontSize: 11.5,
                color: MUTED,
                background: SOFT_BG,
                padding: "4px 10px",
                borderRadius: 999,
                fontWeight: 500,
              }}
            >
              {d}
            </li>
          ))}
        </ul>

        {/* CTA arrow allineato a destra */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 14,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 6,
            color: card.accentLine,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Continua <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
        </div>
      </div>

      <style>{`
        .${cardClass}:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 30px rgba(0,0,0,0.06);
          border-color: ${card.accentLine};
        }
      `}</style>
    </Link>
  );
}
