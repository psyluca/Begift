import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ BeGift — domande frequenti sui regali digitali",
  description:
    "Domande frequenti su BeGift: come funziona un regalo digitale, quanto costa, serve un'app, si può programmare l'apertura, si può regalare un biglietto per un concerto, si può usare a distanza, ecc.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ BeGift",
    description: "Le domande più frequenti su come regalare con BeGift.",
    url: "/faq",
    type: "website",
    locale: "it_IT",
  },
};

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";
const LIGHT = "#f7f5f2";

interface QA {
  q: string;
  a: string;
}

const faqs: QA[] = [
  {
    q: "Cos'è esattamente un regalo digitale BeGift?",
    a: "È una combinazione di contenuto (messaggio testuale, foto, video, PDF, link) con un packaging grafico personalizzato (colore carta, nastro, fiocco, animazione di apertura e suono di scartatura). Il destinatario riceve un link: lo apre dal browser, vede l'animazione che scarta il pacco e accede al contenuto.",
  },
  {
    q: "Quanto costa usare BeGift?",
    a: "Al momento BeGift è completamente gratuito. Nel futuro introdurremo un piano a crediti per funzionalità avanzate (regali schedulati su più mesi, più spazio media) ma il nucleo resterà gratuito.",
  },
  {
    q: "Devo scaricare un'app?",
    a: "No. BeGift è una Progressive Web App (PWA): funziona direttamente dal browser sia per chi crea il regalo sia per chi lo riceve. Se vuoi, puoi installarla come app sul tuo iPhone/Android dalla voce \"Aggiungi a Home\" del browser, ma non è obbligatorio.",
  },
  {
    q: "Il destinatario deve registrarsi o scaricare qualcosa per aprire il regalo?",
    a: "No. Chi riceve il regalo apre semplicemente il link che gli mandi (via WhatsApp, iMessage, email, Telegram, qualsiasi app) e vede il pacco scartarsi. Nessun account, nessuna installazione.",
  },
  {
    q: "Posso regalare a una persona che abita lontano?",
    a: "Sì — è uno degli use case principali. Tutto avviene via link, quindi la distanza non conta. Parenti all'estero, amici emigrati, partner in trasferta: arriva istantaneamente.",
  },
  {
    q: "Posso regalare un biglietto per un concerto o un'esperienza?",
    a: "Sì. Carica il PDF del biglietto o incolla il link alla prenotazione nel contenuto del gift. Aggiungi una foto dell'artista/luogo e un messaggio. Arriva \"impacchettato\" invece di un freddo forward email.",
  },
  {
    q: "Posso programmare l'apertura a una data o ora specifica?",
    a: "Sì. Durante la creazione puoi scegliere una data futura (es. le 20 della Vigilia di Natale, la mezzanotte del compleanno). Il destinatario vede un countdown che sale l'attesa fino al momento scelto.",
  },
  {
    q: "Posso mandare lo stesso regalo a più persone?",
    a: "Ogni regalo è personalizzato con il nome di UN destinatario. Se vuoi mandare a più persone, conviene creare regali separati, ognuno con dedica dedicata. Le persone si sentono davvero a loro rivolte.",
  },
  {
    q: "Che tipi di contenuto posso mettere dentro un regalo?",
    a: "Messaggio testuale, foto, video (mp4/mov/webm), PDF (biglietti, prenotazioni, voucher), link (YouTube, Spotify, esperienze, siti). Si possono combinare più contenuti in un singolo regalo.",
  },
  {
    q: "C'è un limite di dimensione per i file?",
    a: "Le immagini massime 25 MB, i video massimi 100 MB, i PDF massimi 20 MB. Sono limiti generosi per l'uso tipico: un video di un minuto ad alta qualità sta bene sotto i 100 MB.",
  },
  {
    q: "Il destinatario può rispondere al regalo?",
    a: "Sì, con reazioni: emoji, testo, foto, video. Inoltre c'è una chat privata tra creatore e destinatario sul gift — utile per condividere ricordi aggiuntivi o organizzarsi se il regalo include un'esperienza pratica.",
  },
  {
    q: "Ricevo notifiche quando il mio regalo viene aperto?",
    a: "Sì, se hai attivato le notifiche push di BeGift. Vieni avvisato quando il destinatario apre il pacco e quando reagisce. Le notifiche sono opt-in e gestibili dalle Impostazioni.",
  },
  {
    q: "I regali scadono?",
    a: "No. Restano disponibili al link per sempre, come un ricordo salvato. Utile per riaprire le emozioni il compleanno/anniversario successivo. Puoi sempre cancellare un regalo dalla tua dashboard se vuoi.",
  },
  {
    q: "È sicuro? I miei dati sono protetti?",
    a: "Sì. BeGift è GDPR-compliant: dati in UE (Supabase region Frankfurt), nessuna pubblicità, nessun tracking di profilazione, crittografia TLS in transito e a riposo. Puoi esportare tutti i tuoi dati o cancellare il tuo account in qualsiasi momento dalle Impostazioni.",
  },
  {
    q: "Gli anziani o chi è poco esperto di tecnologia riescono a aprirlo?",
    a: "Sì. È un semplice link. Chi riceve tocca il link da WhatsApp o email e il pacco si apre da solo. Nessun pulsante da premere, nessuna registrazione, nessuna app. Se serve aiuto, si può anche aprire insieme in videochiamata.",
  },
  {
    q: "Posso abbinare un regalo digitale a uno fisico?",
    a: "Sì, funziona bene. Molti mettono il link (o un QR code stampato) dentro al pacco fisico — la persona apre il pacco \"vero\", trova il biglietto, lo scansiona e si apre il regalo digitale come secondo livello. Effetto \"doppio regalo\" molto forte.",
  },
  {
    q: "Posso salvarmi le ricorrenze (compleanni, anniversari) per non dimenticarle?",
    a: "Sì. Da Impostazioni → Ricorrenze aggiungi una ricorrenza con nome e data. Ti avvisiamo qualche giorno prima con una notifica push che ti porta direttamente al creatore pre-compilato.",
  },
  {
    q: "BeGift funziona su iPhone e Android?",
    a: "Sì, su entrambi. Anche su desktop. È una PWA quindi gira nel browser (Safari, Chrome, Firefox, Edge). Su iPhone e Android puoi installarla come app dalla home screen per un'esperienza più app-like.",
  },
  {
    q: "Posso regalare qualcosa a qualcuno che non conosco così bene (collega, vicino, genitore di un amico)?",
    a: "Sì, ma scegli il tono giusto nel packaging e nel messaggio. Per rapporti più formali consigliamo template \"Ringraziamento\" (verde salvia, suono discreto) o \"Per tutti i giorni\" (crema) invece dei template festivi.",
  },
  {
    q: "Chi ha creato BeGift?",
    a: "Luca Galli, indie developer italiano. BeGift è progettato e sviluppato in Italia; i dati sono ospitati in UE (Germania). Per qualsiasi domanda: info@begift.app.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

export default function FaqPage() {
  return (
    <main style={{ minHeight: "100vh", background: LIGHT, fontFamily: "system-ui, sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: DEEP, letterSpacing: "-1.5px", margin: "0 0 12px" }}>
          Domande frequenti
        </h1>
        <p style={{ fontSize: 17, color: MUTED, margin: "0 0 40px", lineHeight: 1.6 }}>
          Le cose che la maggior parte delle persone chiede prima di creare il primo regalo digitale su BeGift.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {faqs.map((f, i) => (
            <details
              key={i}
              style={{
                background: "#fff",
                border: "1px solid #eadfd5",
                borderRadius: 12,
                padding: "16px 20px",
              }}
            >
              <summary
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: DEEP,
                  cursor: "pointer",
                  listStyle: "none",
                  outline: "none",
                }}
              >
                {f.q}
              </summary>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: "10px 0 0" }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>

        <section style={{ marginTop: 40, padding: "28px 24px", background: "#fff5f8", border: "1px solid #fadce7", borderRadius: 16, textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: DEEP, margin: "0 0 10px" }}>
            Non hai trovato la tua risposta?
          </h2>
          <p style={{ fontSize: 14, color: MUTED, margin: "0 0 16px" }}>
            Scrivici: siamo reattivi, rispondiamo entro 1-2 giorni.
          </p>
          <a
            href="mailto:support@begift.app"
            style={{
              display: "inline-block",
              background: ACCENT,
              color: "#fff",
              borderRadius: 40,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            support@begift.app
          </a>
        </section>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #e0dbd5" }}>
          <Link href="/" style={{ color: ACCENT, fontSize: 14, textDecoration: "none" }}>
            ← Torna alla home
          </Link>
        </div>
      </div>
    </main>
  );
}
