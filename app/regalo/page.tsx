/**
 * /regalo
 *
 * Hub unificato del flusso "fai un regalo con BeGift". Una sola pagina
 * che presenta i 3 modi di entrare nel flow:
 *
 *   1. Catalogo  — scegli un'esperienza da regalare (GYG + VVT)
 *   2. Contenuto — qualcosa di tuo (file, foto, audio, PDF, messaggio scritto)
 *   3. Mail      — inoltra una mail di conferma acquisto
 *
 * Tutti e 3 i path arrivano al medesimo "stato pacco regalo" che poi
 * passa per packaging customization e share link. Il valore di BeGift
 * non sta nel contenuto (il sender lo porta lui) ma nella confezione
 * digitale emozionale.
 *
 * Nota storica: c'erano 4 path. File e Messaggio sono stati accorpati
 * il 2026-05-21 perche' atterravano sulla stessa schermata /create —
 * separarli creava aspettativa di 2 flussi diversi che poi diventava
 * confusione. Le rotte /regalo/file e /regalo/messaggio restano per
 * back-compat dei link condivisi (entrambe redirect a /create).
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
    "Scegli un'esperienza, impacchetta qualcosa di tuo, o inoltra una mail di conferma — BeGift trasforma qualsiasi cosa in un regalo emozionale.",
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

// Ordine aggiornato 2026-05-22 (decisione UX Luca):
// 1° "Qualcosa di tuo" — barriera piu' bassa, posizionamento "scatolatore magico"
// 2° "Esperienza dal catalogo" — esperienze digitali (GYG + VVT), affiliate
// 3° "Regalo prima del regalo" — oggetti fisici spediti (24Bottles via TradeDoubler)
//     Categoria editoriale distinta: il sender sa che l'oggetto arriva per posta
//     mentre il pacco BeGift digitale viene aperto subito → "anticipiamo l'emozione"
// 4° "Mail" — utente avanzato che gia' sa cosa fa, in fondo
const PATHS: PathCard[] = [
  {
    href: "/regalo/contenuto",
    emoji: "💌",
    badge: "Crea",
    title: "Qualcosa di tuo",
    description:
      "Una foto, un audio, un video, un PDF, oppure un messaggio scritto da te. Lo trasformiamo in un pacco animato pronto da aprire.",
    details: ["Foto e video", "Audio e voce", "PDF e voucher", "Messaggi e lettere"],
    gradient: "linear-gradient(135deg, #EDE7F6 0%, #FCE4EC 100%)",
    accentLine: "#6B5BCC",
  },
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
    href: "/regalo/fisici",
    emoji: "📦",
    badge: "Anticipa",
    title: "Il regalo prima del regalo",
    description:
      "Borracce, lunch box, accessori spediti a casa di chi li riceve. BeGift apre il pacco digitale oggi, l'oggetto arriva nei giorni successivi.",
    details: ["24Bottles", "Lunch box & snack", "Accessori", "Regalo da spedire"],
    gradient: "linear-gradient(135deg, #FFF3E0 0%, #FCE4EC 100%)",
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
            Tre vie diverse, una sola magia. Qualunque contenuto scegli,
            la confezione la prepari poi insieme a noi.
          </p>
        </header>

        {/* 3 path cards. Grid auto-fit, 1 col mobile. */}
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

        {/* Banda "Hai gia' inoltrato una mail?" — porta a /drafts senza
            dover entrare nelle impostazioni. Visibile sempre nel hub
            /regalo perche' il flusso mail e' uno dei 3 path principali
            e va comunicato esplicitamente.
            Update UX 2026-05-21 — prima /drafts era raggiungibile solo
            dalle impostazioni email parser, troppo nascosto. */}
        <section
          style={{
            background: "linear-gradient(135deg,#FFF3E0 0%,#FCE4EC 100%)",
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "16px 22px",
            maxWidth: 720,
            margin: "0 auto 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 auto" }}>
            <span style={{ fontSize: 28 }} aria-hidden>📬</span>
            <div>
              <p style={{ fontSize: 14, color: INK, margin: 0, fontWeight: 700, lineHeight: 1.35 }}>
                Hai gia&apos; inoltrato una mail di conferma?
              </p>
              <p style={{ fontSize: 12.5, color: MUTED, margin: "2px 0 0", lineHeight: 1.4 }}>
                Le tue bozze ti aspettano, pronte da personalizzare e inviare.
              </p>
            </div>
          </div>
          <Link
            href="/drafts"
            style={{
              background: ACCENT,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              padding: "9px 16px",
              borderRadius: 999,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Vedi le tue bozze →
          </Link>
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
