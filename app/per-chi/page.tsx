import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Per chi è BeGift — idee e casi d'uso per i regali digitali",
  description:
    "BeGift è pensato per chi vuole regalare un'emozione, a distanza o vicino, per un'occasione o per un pensiero quotidiano. 10 scenari reali: compleanno a distanza, anniversario, laurea, San Valentino, ringraziamento, nipote lontano, coppia, nonni, amici emigrati, pensiero del mattino.",
  alternates: { canonical: "/per-chi" },
  openGraph: {
    title: "Per chi è BeGift",
    description:
      "10 scenari reali per usare BeGift: dai compleanni a distanza ai pensieri quotidiani.",
    url: "/per-chi",
    type: "website",
    locale: "it_IT",
  },
};

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";
const LIGHT = "#f7f5f2";

interface UseCase {
  emoji: string;
  title: string;
  scenario: string;
  what: string;
  cta: { href: string; label: string };
}

const cases: UseCase[] = [
  {
    emoji: "🎂",
    title: "Compleanno a distanza",
    scenario:
      "Vivi lontano da un amico, un fratello o un genitore. Il compleanno si avvicina e un messaggio su WhatsApp ti sembra poco. Un regalo fisico arriverebbe tardi.",
    what: "Raccogli 5-10 foto vostre insieme, registra un video-messaggio, aggiungi la loro canzone preferita e impacchetta tutto in un pacco digitale che si apre con animazione festiva e suono di campanelli. Arriva istantaneamente via link.",
    cta: { href: "/compleanno", label: "Vedi la landing compleanno →" },
  },
  {
    emoji: "💍",
    title: "Anniversario di coppia",
    scenario:
      "Vi siete conosciuti anni fa. Vuoi fare qualcosa che non sia il solito mazzo di fiori o la cena a sorpresa.",
    what: "Una playlist dei brani importanti vostri, una timeline con 8-10 foto dei viaggi insieme, una lettera scritta da te, e dentro al pacco digitale anche i biglietti (PDF) per il concerto a cui la porterai tra un mese. Il packaging si apre con i vostri colori.",
    cta: { href: "/anniversario", label: "Vedi la landing anniversario →" },
  },
  {
    emoji: "🎓",
    title: "Laurea di un figlio/nipote",
    scenario:
      "Tuo nipote si laurea e tu non puoi esserci. La famiglia è sparsa. Tutti vorrebbero dirgli qualcosa.",
    what: "Chiedi a tutti i parenti di registrare un video di 30 secondi di auguri. Li raccogli insieme a foto dei suoi anni di studio, eventualmente aggiungi un voucher (Amazon, buono libreria) come regalo pratico. Il pacco si apre con un'animazione \"explode\" festa, si vede come se fossimo tutti lì.",
    cta: { href: "/laurea", label: "Vedi la landing laurea →" },
  },
  {
    emoji: "❤️",
    title: "San Valentino per una coppia a distanza",
    scenario:
      "Vivete in due città diverse, o lavorate in trasferta. San Valentino cadeva di mercoledì e tornare non è possibile.",
    what: "Una canzone che avete ballato la prima volta, un video di te in cui racconti cosa ti piace di lei/lui, una foto del prossimo viaggio che avete prenotato, un voucher per una cena per due da usare il prossimo weekend insieme. Tutto dentro a un pacco rubino con fiocco rosa.",
    cta: { href: "/san-valentino", label: "Vedi la landing San Valentino →" },
  },
  {
    emoji: "🎄",
    title: "Natale per parenti emigrati",
    scenario:
      "Tuo cugino vive a Berlino, tua zia in Australia, il fratello a Londra. Il Natale è il momento peggiore per la distanza.",
    what: "Un video della cena di Natale di famiglia appena fatta, le foto di chi è riunito, un audio-messaggio dei nonni, un voucher per un libro o un film da guardare in contemporanea la sera della Vigilia. Il pacco verde bosco con nastro rosso e suono di campanelli.",
    cta: { href: "/natale", label: "Vedi la landing Natale →" },
  },
  {
    emoji: "🙏",
    title: "Ringraziamento sincero",
    scenario:
      "Un collega, un vicino, un'amica hanno fatto qualcosa di importante per te. Dire \"grazie\" al telefono ti sembra poco. Un mazzo di fiori ti sembra troppo formale.",
    what: "Un messaggio scritto a mano (usa la funzione testo), una foto del momento per cui vuoi ringraziare, un piccolo voucher (caffè, libreria). Il packaging verde salvia con fiocco semplice trasmette gratitudine senza enfasi.",
    cta: { href: "/create?occasion=thanks", label: "Crea un regalo di ringraziamento →" },
  },
  {
    emoji: "👶",
    title: "Nascita di un nipote che non puoi vedere",
    scenario:
      "È nato tuo nipote, ma non abiti nella stessa città e la neomamma ha bisogno di tranquillità nei primi giorni.",
    what: "Un video con la tua voce che augura il benvenuto, una foto-collage della tua famiglia che \"saluta\" il piccolo, un voucher per un servizio utile (spesa a domicilio, notte di babysitter da usare quando serve). Il packaging rosa/azzurro con fiocco pompom.",
    cta: { href: "/create?occasion=birth", label: "Crea un regalo nascita →" },
  },
  {
    emoji: "💌",
    title: "Un pensiero quotidiano, senza occasione",
    scenario:
      "Ti è passata in mente una persona oggi. Un amico che stai perdendo di vista, tuo padre, la tua migliore amica. Nessun motivo particolare — vuoi solo farglielo sapere.",
    what: "Un messaggio corto e vero, una foto di un ricordo vostro, una canzone che vi lega. Il template \"Per tutti i giorni\" è fatto per questo: packaging crema, fiocco rosa, apertura morbida. Non serve una ricorrenza per dire \"ti penso, ora\".",
    cta: { href: "/create?occasion=everyday", label: "Manda un pensiero →" },
  },
  {
    emoji: "🎵",
    title: "Regalare un concerto o un'esperienza",
    scenario:
      "Hai comprato due biglietti per un concerto, un weekend in agriturismo, una degustazione. Vuoi regalarli in un modo che ricordi la cura, non \"forward email del voucher\".",
    what: "Carichi il PDF dei biglietti o incolli il link alla prenotazione, aggiungi una foto/video dell'artista o del posto, scrivi un breve messaggio \"ho pensato che ti sarebbe piaciuto\". Il pacco si apre davanti a chi riceve e rivela l'esperienza con emozione.",
    cta: { href: "/create?occasion=other", label: "Impacchetta un'esperienza →" },
  },
  {
    emoji: "🎊",
    title: "Onomastico, promozione, milestone",
    scenario:
      "Tua mamma si chiama Maria e l'8 dicembre è il suo onomastico. Un amico ha appena avuto una promozione. Una collega ha chiuso un progetto importante.",
    what: "Un pensiero dedicato all'occasione specifica — non una \"scheda auguri\" standard. Combina messaggio + 1-2 foto + magari un piccolo voucher di ricompensa. Il sistema di ricorrenze salva automaticamente le ricorrenze e ti avvisa qualche giorno prima l'anno successivo.",
    cta: { href: "/create", label: "Crea un regalo →" },
  },
];

export default function PerChiPage() {
  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: DEEP, letterSpacing: "-1.5px", margin: "0 0 12px" }}>
          Per chi è BeGift
        </h1>
        <p style={{ fontSize: 17, color: MUTED, margin: "0 0 40px", lineHeight: 1.6, maxWidth: 680 }}>
          BeGift è pensato per chi vuole regalare un'emozione, a distanza o vicino, per un'occasione o per un
          pensiero quotidiano. Ecco dieci scenari reali in cui BeGift è la scelta giusta.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {cases.map((c, i) => (
            <article
              key={i}
              style={{
                background: "#fff",
                border: "1px solid #eadfd5",
                borderRadius: 16,
                padding: "22px 24px",
              }}
            >
              <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 28 }} aria-hidden>{c.emoji}</span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: DEEP, margin: 0 }}>
                  {c.title}
                </h2>
              </header>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: "0 0 10px" }}>
                <strong style={{ color: DEEP }}>Scenario — </strong>
                {c.scenario}
              </p>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: "0 0 14px" }}>
                <strong style={{ color: DEEP }}>Cosa metti dentro — </strong>
                {c.what}
              </p>
              <Link
                href={c.cta.href}
                style={{
                  display: "inline-block",
                  fontSize: 14,
                  color: ACCENT,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                {c.cta.label}
              </Link>
            </article>
          ))}
        </div>

        <section style={{ marginTop: 56, padding: "32px 28px", background: "#fff5f8", border: "1px solid #fadce7", borderRadius: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: DEEP, margin: "0 0 12px" }}>
            Non riesci a incasellare il tuo caso?
          </h2>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: "0 0 18px" }}>
            Non serve incasellarsi in un template. Se stai pensando a qualcuno e vuoi farglielo sapere
            con più cura di un messaggio, BeGift va bene. Il template "Per tutti i giorni" è fatto
            apposta per i pensieri senza occasione.
          </p>
          <Link
            href="/create"
            style={{
              display: "inline-block",
              background: ACCENT,
              color: "#fff",
              borderRadius: 40,
              padding: "14px 32px",
              fontSize: 15,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Crea il tuo regalo — è gratis
          </Link>
        </section>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid #e0dbd5" }}>
          <Link href="/" style={{ color: ACCENT, fontSize: 14, textDecoration: "none" }}>
            ← Torna alla home
          </Link>
        </div>
      </div>
    </main>
  );
}
