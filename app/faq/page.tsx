import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ BeGift — domande frequenti sui regali digitali",
  description:
    "Domande frequenti su BeGift: come funziona un regalo digitale, quanto costa, se serve un'app, se si può programmare l'apertura, regalare un biglietto per un concerto o farlo arrivare a distanza.",
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
    a: "È un contenuto (un messaggio, una foto, un video, un PDF o un link) avvolto da un packaging grafico personalizzato: colore della carta, nastro, fiocco, animazione di apertura e suono di scartatura. Il destinatario riceve un link, lo apre dal browser, vede il pacco scartarsi e accede al contenuto.",
  },
  {
    q: "Quanto costa usare BeGift?",
    a: "Al momento BeGift è completamente gratuito. In futuro introdurremo un piano a crediti per le funzionalità più avanzate (regali programmati su più mesi, più spazio per i media), ma le funzioni di base resteranno sempre gratuite.",
  },
  {
    q: "Devo scaricare un'app?",
    a: "No. BeGift è una Progressive Web App (PWA): funziona direttamente dal browser, sia per chi crea il regalo sia per chi lo riceve. Se vuoi, puoi installarla come app sul tuo iPhone o Android tramite la voce \"Aggiungi alla schermata Home\" del browser, ma non è obbligatorio.",
  },
  {
    q: "Il destinatario deve registrarsi o scaricare qualcosa per aprire il regalo?",
    a: "No. Chi riceve il regalo apre semplicemente il link che gli mandi (via WhatsApp, iMessage, email, Telegram o qualsiasi altra app) e vede il pacco scartarsi. Nessun account da creare, nessuna installazione.",
  },
  {
    q: "Posso fare un regalo a una persona che abita lontano?",
    a: "Sì, è uno dei casi d'uso principali. Tutto avviene tramite un link, quindi la distanza non conta. Parenti all'estero, amici emigrati, partner in trasferta: il regalo arriva all'istante.",
  },
  {
    q: "Posso regalare un biglietto per un concerto o un'esperienza?",
    a: "Sì. Carica il PDF del biglietto o incolla il link alla prenotazione nel contenuto del regalo, aggiungi una foto dell'artista o del luogo e un messaggio personale. Arriva \"impacchettato\" invece che come una fredda email di inoltro.",
  },
  {
    q: "Posso programmare l'apertura a una data o a un'ora specifica?",
    a: "Sì. Durante la creazione puoi scegliere una data futura: per esempio le 20 della Vigilia di Natale o la mezzanotte del compleanno. Fino a quel momento il destinatario vedrà un conto alla rovescia che fa crescere l'attesa.",
  },
  {
    q: "Posso mandare lo stesso regalo a più persone?",
    a: "Ogni regalo è personalizzato con il nome di un singolo destinatario. Se vuoi farlo a più persone, conviene creare regali separati, ciascuno con la sua dedica. In questo modo ognuno si sente davvero al centro del pensiero.",
  },
  {
    q: "Che tipi di contenuto posso mettere dentro un regalo?",
    a: "Un messaggio di testo, una foto, un video (mp4, mov o webm), un PDF (biglietti, prenotazioni, voucher) o un link (YouTube, Spotify, esperienze, siti). Puoi anche combinarne più di uno in un singolo regalo.",
  },
  {
    q: "C'è un limite di dimensione per i file?",
    a: "Le immagini possono arrivare fino a 25 MB, i video fino a 100 MB, i PDF fino a 20 MB. Sono limiti generosi per l'uso tipico: un video di un minuto in alta qualità sta tranquillamente sotto i 100 MB.",
  },
  {
    q: "Il destinatario può rispondere al regalo?",
    a: "Sì, con le reazioni: emoji, testo, foto o video. C'è anche una chat privata tra chi ha creato il regalo e chi lo riceve, utile per condividere altri ricordi o organizzarsi se il regalo include un'esperienza pratica da vivere insieme.",
  },
  {
    q: "Ricevo notifiche quando il mio regalo viene aperto?",
    a: "Sì, se hai attivato le notifiche push di BeGift. Ti avvisiamo quando il destinatario apre il pacco e quando reagisce. Le notifiche sono facoltative e si possono attivare o disattivare in qualsiasi momento dalle Impostazioni.",
  },
  {
    q: "I regali scadono?",
    a: "No. Restano accessibili dal link per sempre, come un ricordo salvato. È utile per riaprire le emozioni al compleanno o all'anniversario dell'anno successivo. Se vuoi, puoi comunque eliminare un regalo dalla tua dashboard.",
  },
  {
    q: "È sicuro? I miei dati sono protetti?",
    a: "Sì. BeGift è conforme al GDPR: i dati sono ospitati nell'Unione Europea (Supabase, region di Francoforte), non c'è pubblicità, non c'è tracciamento di profilazione e tutto il traffico è cifrato (TLS in transito, AES a riposo). Puoi esportare i tuoi dati o eliminare l'account in qualsiasi momento dalle Impostazioni.",
  },
  {
    q: "Le persone anziane o chi non è esperto di tecnologia riesce ad aprirlo?",
    a: "Sì. Il regalo è un semplice link: si tocca da WhatsApp o dall'email e il pacco si apre da solo. Nessun pulsante da premere, nessuna registrazione, nessuna app da installare. Se serve, si può anche aprire insieme in videochiamata.",
  },
  {
    q: "Posso abbinare un regalo digitale a uno fisico?",
    a: "Sì, e funziona molto bene. Molti mettono il link (o un QR code stampato) dentro al pacco fisico: il destinatario apre il pacco vero, trova il biglietto, lo scansiona e si apre il regalo digitale come secondo livello. L'effetto \"doppio regalo\" è davvero d'impatto.",
  },
  {
    q: "Posso salvare le ricorrenze (compleanni, anniversari) per non dimenticarle?",
    a: "Sì. Da Impostazioni → Ricorrenze puoi aggiungere una ricorrenza con nome e data. Ti avviseremo con una notifica push qualche giorno prima e, con un tocco, ti porteremo al flusso di creazione già pre-compilato.",
  },
  {
    q: "BeGift funziona su iPhone e Android?",
    a: "Sì, su entrambi. E anche su desktop. È una PWA, quindi gira nel browser (Safari, Chrome, Firefox, Edge). Su iPhone e Android puoi installarla come app dalla schermata Home, per un'esperienza simile a quella di un'app nativa.",
  },
  {
    q: "Posso fare un regalo a qualcuno che non conosco così bene (un collega, un vicino, il genitore di un amico)?",
    a: "Sì, ma scegli il tono giusto nel packaging e nel messaggio. Per i rapporti più formali consigliamo i template \"Ringraziamento\" (verde salvia, suono discreto) o \"Per tutti i giorni\" (crema), invece di quelli più festivi.",
  },
  {
    q: "Chi ha creato BeGift?",
    a: "Luca Galli, sviluppatore indipendente italiano. BeGift è progettato e sviluppato in Italia; i dati sono ospitati nell'Unione Europea (Germania). Per qualsiasi domanda puoi scrivere a info@begift.app.",
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
          Le domande più comuni di chi sta per creare il suo primo regalo digitale su BeGift.
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
