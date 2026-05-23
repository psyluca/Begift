import type { Metadata } from "next";
import OccasionLanding, { OccasionConfig } from "@/components/OccasionLanding";

/**
 * /laurea — landing SEO long-form per "regalo di laurea".
 *
 * Pillar page del growth plan 2026-05-23: occasione semi-stagionale
 * (picco luglio-ottobre) con keyword "regalo laurea" ~22k volume/mese
 * in IT secondo ricerca. Lanciata in maggio 2026 per avere 2-4 mesi
 * di indexing prima del picco luglio.
 *
 * Struttura:
 *  - Hero + intro corto
 *  - Long-body (paragrafi extra per arrivare ~1500-2000 parole)
 *  - "Come funziona" 3 step
 *  - Preview packaging blu+oro
 *  - 6 idee regalo concrete (linkano a /create con content pre-selezionato)
 *  - FAQ 5 domande
 *  - Internal linking ad altre occasioni
 *  - CTA finale
 *
 * Schema.org: WebPage + Breadcrumb + SoftwareApplication + FAQPage + HowTo.
 * OG image dedicata in app/laurea/opengraph-image.tsx.
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://begift.app";

export const metadata: Metadata = {
  title: "Regalo di laurea originale e digitale — BeGift",
  description:
    "Un regalo di laurea che resta nel tempo: video di auguri collettivi, foto del percorso, lettere di chi non c'era. Un pacco digitale che si apre con emozione.",
  keywords: [
    "regalo laurea",
    "regalo laurea originale",
    "regalo laurea triennale",
    "regalo laurea magistrale",
    "idee regalo laurea",
    "cosa regalare per la laurea",
    "regalo laurea digitale",
    "regalo laurea a distanza",
  ],
  alternates: { canonical: `${baseUrl}/laurea` },
  openGraph: {
    title: "Regalo di laurea digitale — BeGift",
    description:
      "Un pacco digitale che apre ricordi: video di auguri, foto del percorso, messaggi di chi non c'era.",
    url: `${baseUrl}/laurea`,
    type: "website",
    locale: "it_IT",
    siteName: "BeGift",
  },
  twitter: {
    card: "summary_large_image",
    title: "Regalo di laurea digitale — BeGift",
    description:
      "Un regalo che apre ricordi, video e parole di chi ti vuole bene.",
  },
};

const config: OccasionConfig = {
  slug: "laurea",
  h1: "Regalo di laurea digitale",
  emoji: "🎓",
  paperColor: "#1A3A6B",
  ribbonColor: "#E8C84A",
  occasionParam: "graduation",
  keyword: "regalo laurea originale",
  howToName: "Come fare un regalo di laurea originale e personale",
  subtitle:
    "Celebra la laurea con un regalo che raccoglie messaggi di amici e parenti. Un pacco digitale che si apre con emozione.",
  intro:
    "La laurea è uno di quei momenti in cui vorresti che tutte le persone importanti fossero lì. Con BeGift puoi raccogliere video di auguri da parenti lontani, foto del percorso universitario, un riassunto dei traguardi, link al diploma digitale, e metterli tutti in un pacco che il neo-dottore apre al termine della discussione. È un regalo che vale più di un oggetto: è la consapevolezza di essere circondato di affetto.",

  // Long-body: contenuto extra per portare la pagina a 1500-2000 parole.
  // Ogni blocco con h2 e' una keyword secondaria long-tail.
  longBody: [
    {
      h: "Perché un regalo di laurea digitale ha più senso oggi",
      p: "Negli ultimi anni i regali fisici per la laurea sono cambiati. La penna stilografica incisa, il libro tecnico, l'orologio commemorativo: tutti sembrano sempre più impersonali. Sono regali pensati per essere giusti, non per dire qualcosa. E il neo-laureato lo sente. Un regalo digitale BeGift va in direzione opposta: invece di un oggetto, raccoglie persone. Una compagna di corso che ricorda l'esame di analisi di terzo anno; un genitore che racconta in 30 secondi cosa significa per lui o lei vederti laureato; un professore che ha guidato la tesi e che lascia un saluto. Tutto dentro un pacco digitale che il festeggiato apre dal telefono, quando vuole, e che resta per sempre come ricordo condivisibile.",
    },
    {
      h: "Cosa puoi mettere dentro un regalo di laurea digitale",
      p: "Praticamente qualunque contenuto digitale. Video di auguri (registrati col telefono dai partecipanti — un video di 30 secondi a testa è il formato ideale), foto del percorso universitario (la prima foto del corso, la cabina di prova, la copertina della tesi, l'aula della discussione), audio messaggi WhatsApp salvati come file, link a una playlist Spotify del periodo universitario, link al diploma digitale o alla tesi su Academia.edu, e — se vuoi — un buono per un'esperienza vera (una cena celebrativa, un viaggio premio, una giornata in spa). Il pacco si apre con animazione e il destinatario sfoglia tutto in pochi minuti, ma il regalo resta accessibile per sempre tramite link.",
    },
    {
      h: "Quando consegnare il regalo: prima, durante o dopo la proclamazione",
      p: "BeGift permette di programmare l'apertura del regalo a una data/ora precisa. Tre scenari classici. Primo: programmazione al momento esatto della proclamazione, così quando il neo-dottore esce dall'aula e accende il telefono trova già il link su WhatsApp. Secondo: consegna alla cena di festeggiamento, magari proiettato sulla TV di casa o passato fra le mani sul telefono, per far girare i video di auguri durante il dolce. Terzo: consegna a sorpresa giorni dopo, quando l'adrenalina della laurea è passata e ricevere un regalo del genere fa l'effetto di rivivere il momento. Per esperienza, il timing che funziona meglio è quello immediatamente dopo la proclamazione: massima emozione, telefono in mano, voglia di condividere.",
    },
    {
      h: "Quanto costa fare un regalo di laurea con BeGift",
      p: "Creare il regalo è gratuito. Carica tutti i contenuti che vuoi (video, foto, audio, link), personalizza colori e animazione di apertura, programma la consegna, condividi via WhatsApp o link diretto. Se decidi di aggiungere un'esperienza vera (cena, weekend, voucher saltafila per un museo, biglietto per uno show), paghi solo quella, allo stesso prezzo che paga il fornitore. BeGift non aggiunge commissioni al destinatario. È un regalo che parte da zero euro e cresce solo se vuoi aggiungere qualcosa di tangibile.",
    },
    {
      h: "Idee per personalizzare il pacchetto",
      p: "Il pacco animato BeGift è il vero \"oggetto\" del regalo. Colori istituzionali: blu navy e nastro oro, riferimento esplicito alla toga accademica. Oppure, se conosci i colori della facoltà o dell'università, ricreali per un dettaglio in più (giallo Bocconi, rosso Sapienza, verde Cattolica, blu Politecnico). L'animazione di apertura può essere classica \"sollevamento\" o più dinamica con confetti — per una laurea il \"Confetti explode\" è il fit naturale (festa, festeggiamento, momento alto). Aggiungi un suono di campanelle o un brano breve registrato (es. \"Pomp and Circumstance\" o l'inno della facoltà), e l'effetto sorpresa è massimo. Tutto si fa in 60 secondi nel pannello di personalizzazione.",
    },
    {
      h: "Regalo di laurea a distanza: come renderlo speciale anche da lontano",
      p: "Una delle situazioni in cui BeGift dà il meglio è il regalo di laurea per chi è all'estero, o per chi non può essere presente alla proclamazione (genitori in viaggio, fratelli al lavoro fuori sede, amici trasferiti). Invece di un mazzo di fiori spedito con corriere o un bonifico anonimo, raccogli messaggi e video e li trasformi in un pacco unico. Il destinatario li apre quando si sente pronto, sa che la persona lontana c'è anche se non fisicamente, e ha un ricordo digitale che può rivedere ogni volta che vuole. Per ricorrenze come prima laurea della famiglia, prima laurea di un'amica, laurea \"con lode\", questo formato funziona meglio di qualunque regalo classico.",
    },
    {
      h: "Errori comuni nei regali di laurea (e come evitarli)",
      p: "Il primo errore è regalare un oggetto generico, senza un nesso col percorso o con la persona: un libro qualunque, una penna anonima, un buono spesa di un brand non legato a lei. Il secondo errore è puntare tutto sul valore monetario: una busta con dei contanti è pratica, ma comunica poco. Il terzo errore è il regalo \"di gruppo\" mal organizzato, dove qualcuno raccoglie i soldi e poi compra a nome di tutti — il neo-laureato riceve una cosa sola e non sa chi ha contribuito a cosa. Con BeGift questi tre problemi si risolvono in un colpo: ogni contributo dentro al pacco ha la firma di chi l'ha mandato, il valore percepito è altissimo (anche con zero euro spesi), e il messaggio personale arriva a destinazione senza filtri.",
    },
    {
      h: "Come affiancare il regalo digitale a un regalo fisico",
      p: "Niente vieta di combinare un regalo BeGift con qualcosa di tangibile. Anzi, è una delle combinazioni più efficaci. Esempio: una busta con soldi (classico per la laurea) accompagnata dal link BeGift stampato su un biglietto piegato. Quando il festeggiato apre la busta, c'è scritto \"Scansiona questo QR per vedere tutti gli auguri\". Il QR porta al pacco digitale che si apre con animazione e mostra video, foto, messaggi. La parte monetaria dà concretezza, quella digitale dà emozione. Funziona benissimo anche con una bottiglia di champagne — etichetta personalizzata con il QR, e il regalo si apre quando si stappa la bottiglia. La regola: BeGift non sostituisce il regalo fisico, lo amplifica.",
    },
  ],

  steps: [
    {
      title: "Raccogli i contributi",
      desc: "Chiedi a genitori, amici, compagni di corso di mandarti un video di auguri. Aggiungi una foto del percorso universitario o un collage dei momenti migliori.",
    },
    {
      title: "Scegli colori istituzionali",
      desc: "Blu navy e nastro oro richiamano la toga accademica. Oppure personalizza coi colori della sua facoltà o dell'università.",
    },
    {
      title: "Consegna al momento giusto",
      desc: "Invia il link via WhatsApp dopo la proclamazione, oppure programmalo per aprirsi nel momento esatto in cui esce dall'aula.",
    },
  ],

  // 6 idee regalo concrete: ognuna è un click verso /create o catalogo
  // con i filtri precompilati. Riduce il "blank canvas problem" per chi
  // arriva sulla pagina senza idee chiare. Tutte le label sono allineate
  // a query semantiche italiane reali ("video auguri laurea", ecc.).
  giftIdeas: [
    {
      title: "Video di auguri collettivo",
      desc: "Raccogli 10-15 video brevi (30 secondi a testa) da amici e parenti e mettili insieme. Il neo-dottore li sfoglia uno dopo l'altro.",
      href: "/create?occasion=graduation&content=video",
      emoji: "🎥",
    },
    {
      title: "Album foto del percorso",
      desc: "Dalla matricola alla discussione: una raccolta di foto che racconta cinque anni di università in un pacco animato.",
      href: "/create?occasion=graduation&content=image",
      emoji: "📸",
    },
    {
      title: "Lettera animata personalizzata",
      desc: "Una lettera scritta a mano, digitalizzata, con animazione di apertura che fa scorrere le parole con musica.",
      href: "/create?occasion=graduation&content=message",
      emoji: "✉️",
    },
    {
      title: "Playlist Spotify del periodo universitario",
      desc: "I brani delle serate in residenza, dei viaggi-studio, del periodo tesi. Un link che apre tutta la colonna sonora di un'era.",
      href: "/create?occasion=graduation&content=link",
      emoji: "🎵",
    },
    {
      title: "Esperienza saltafila per festeggiare",
      desc: "Cena, museo, tour di una città mai vista insieme: una giornata vera da fare dopo la laurea, regalata in formato digitale.",
      href: "/regalo/catalogo?tipo=esperienze",
      emoji: "🥂",
    },
    {
      title: "Biglietto per uno show o concerto",
      desc: "Un evento dal vivo nelle settimane successive — concerto, teatro, partita: il regalo della laurea diventa un momento da vivere.",
      href: "/regalo/catalogo?tipo=concerti",
      emoji: "🎤",
    },
  ],

  faq: [
    {
      q: "Posso caricare il video del rettore che legge la proclamazione?",
      a: "Sì. Puoi caricare file video direttamente oppure incollare un link YouTube/Vimeo. Il video si vede dentro il regalo con player dedicato, senza scaricare niente.",
    },
    {
      q: "C'è un limite di durata per i video?",
      a: "BeGift supporta video fino a qualche minuto per il caricamento diretto. Per contributi più lunghi (es. l'intera registrazione della discussione), conviene caricare su YouTube come video non in elenco e incollare il link.",
    },
    {
      q: "Posso fare un regalo collettivo, raccogliendo i contributi di tante persone?",
      a: "Sì, è uno degli usi più comuni per i regali di laurea. Puoi raccogliere singoli video/foto in WhatsApp e poi metterli insieme nel pacco BeGift. Oppure crei una playlist YouTube non in elenco coi video di tutti e incolli quel link.",
    },
    {
      q: "Il regalo si può rivedere dopo, o si \"consuma\" all'apertura?",
      a: "Il regalo resta accessibile sempre attraverso il link. Il neo-laureato può tornarci ogni volta che vuole, riguardare i video, salvare le foto, ricondividere con altri. Non c'è scadenza.",
    },
    {
      q: "Quanto costa creare il regalo?",
      a: "Creare il pacco digitale è gratuito. L'unico costo eventuale è se aggiungi un'esperienza vera dal catalogo (cena, weekend, biglietto): in quel caso paghi solo l'esperienza, senza commissioni aggiuntive da parte di BeGift.",
    },
    {
      q: "Posso programmare l'apertura per la data esatta della proclamazione?",
      a: "Sì. Nello step finale del flusso di creazione c'è un'opzione \"Programma per dopo\": scegli data e ora locali. Il destinatario vedrà un countdown fino all'orario impostato, poi il regalo si aprirà.",
    },
  ],

  relatedOccasions: [
    { slug: "compleanno", label: "Compleanno", emoji: "🎂" },
    { slug: "anniversario", label: "Anniversario", emoji: "💍" },
    { slug: "natale", label: "Natale", emoji: "🎄" },
    { slug: "festa-mamma", label: "Festa della Mamma", emoji: "💐" },
    { slug: "festa-papa", label: "Festa del Papà", emoji: "🌳" },
  ],
};

export default function LaureaPage() {
  return <OccasionLanding config={config} />;
}
