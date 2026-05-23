import type { Metadata } from "next";
import OccasionLanding, { OccasionConfig } from "@/components/OccasionLanding";

/**
 * /compleanno — landing SEO long-form per "regalo compleanno".
 *
 * Terza occasion-page del growth plan (insieme a /laurea e /matrimonio,
 * espansa dal config minimale del overnight 2026-05-16).
 *
 * Target keyword: "regalo compleanno originale", "regali compleanno
 * amica", "cosa regalare per il compleanno", "regalo compleanno a
 * distanza". Volume IT ~60-100k/mese aggregato sulla famiglia query.
 *
 * Evergreen: nessuna stagionalita' forte (i compleanni sono distribuiti
 * tutto l'anno). Picco minore in primavera/estate per matrimoni e
 * eventi sociali, ma globalmente piatto. Vantaggio: pagina costruita
 * una volta, traffico costante per anni.
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://begift.app";

export const metadata: Metadata = {
  title: "Regalo di compleanno originale e digitale — BeGift",
  description:
    "Un regalo di compleanno che lascia il segno: foto, video, messaggi, musica e voucher esperienza in un pacco animato che si apre sul telefono. Crealo in 60 secondi, anche a mezzanotte.",
  keywords: [
    "regalo compleanno",
    "regalo compleanno originale",
    "regali compleanno amica",
    "regali compleanno fidanzato",
    "regalo compleanno mamma",
    "regalo compleanno a distanza",
    "idee regalo compleanno",
    "cosa regalare per il compleanno",
    "regalo compleanno digitale",
    "regalo compleanno ultimo minuto",
  ],
  alternates: { canonical: `${baseUrl}/compleanno` },
  openGraph: {
    title: "Regalo di compleanno digitale — BeGift",
    description:
      "Un pacco animato con dentro foto, video, musica e auguri. Si apre sul telefono — emozione garantita.",
    url: `${baseUrl}/compleanno`,
    type: "website",
    locale: "it_IT",
    siteName: "BeGift",
  },
  twitter: {
    card: "summary_large_image",
    title: "Regalo di compleanno digitale — BeGift",
    description:
      "Crea un regalo di compleanno indimenticabile in 60 secondi.",
  },
};

const config: OccasionConfig = {
  slug: "compleanno",
  h1: "Regalo di compleanno originale",
  emoji: "🎂",
  paperColor: "#E8C84A",
  ribbonColor: "#D85A5A",
  occasionParam: "birthday",
  keyword: "regalo compleanno originale",
  howToName: "Come fare un regalo di compleanno originale online",
  subtitle:
    "Un pacco animato con dentro la tua foto, video o messaggio. Si apre sul telefono con un'animazione emozionante — lei non se lo aspetta.",
  intro:
    "Dimentica i biglietti anonimi su WhatsApp. Un regalo di compleanno digitale BeGift è un'esperienza: scartarlo è già parte del regalo. Scegli il contenuto (una foto che vi ritrae, il video della sorpresa che stai preparando, una playlist dedicata, un messaggio scritto con il cuore), personalizza il packaging con i colori giusti, mandi il link e il destinatario lo apre quando vuole — anche a mezzanotte precisa per ricevere l'augurio per primo.",
  longBody: [
    {
      h: "Perché un regalo di compleanno digitale funziona meglio di un classico",
      p: "Il compleanno è un'occasione paradossale: tutti vogliono fare un regalo speciale, ma quasi tutti finiscono per ripiegare su qualcosa di sicuro — fiori, cioccolatini, una bottiglia, un libro. Risultato: la persona festeggiata riceve dieci regali simili e nessuno la fa emozionare. BeGift cambia il gioco perché non compete con i regali fisici, li affianca. Crei un pacco digitale unico, mette dentro contenuti che solo tu conosci della persona, e lei lo apre dal telefono in un momento in cui sta scorrendo i messaggi. È il regalo che la sorprende davvero, perché è l'unico che parla di lei.",
    },
    {
      h: "Cosa puoi mettere dentro un regalo di compleanno digitale",
      p: "Le combinazioni vincenti dipendono dal tipo di rapporto. Per un'amica del cuore: una raccolta di foto che ripercorre la vostra amicizia, un video con le sue migliori reazioni filmate durante l'anno, una playlist Spotify con i suoi tormentoni del momento. Per un partner: una lettera animata con dentro pensieri e ricordi, un video-collage del vostro anno insieme, il QR code di un voucher esperienza per una serata. Per un genitore: messaggi audio dei figli/nipoti, una foto-album degli ultimi anni di famiglia, un video di auguri collettivo dai parenti lontani. Per un amico maschio meno emotivo: una playlist epica, una raccolta delle migliori foto in giro insieme, un voucher per una serata calcio o uno show. La regola: scegli cose che solo tu sai del festeggiato.",
    },
    {
      h: "Apertura a mezzanotte: il timing perfetto",
      p: "La funzione \"Programma per dopo\" di BeGift permette di far aprire il regalo a una data e ora esatta. La combinazione magica per i compleanni è programmare l'apertura per le 00:00 del giorno del compleanno. Il destinatario riceve il messaggio la sera prima, ci clicca, vede un countdown che scorre — alle 23:59:59 sa che a momenti il regalo si apre. A mezzanotte preciso, il pacco si apre con animazione e suono. Sei il primo a fare gli auguri, sei l'unico ricordato come \"quello che ha pensato per primo\", e il momento ha un'aura cinematografica che nessun WhatsApp testuale può replicare. Funziona soprattutto per persone con cui hai un rapporto stretto ma a distanza.",
    },
    {
      h: "Regalo di compleanno per amica: cosa funziona davvero",
      p: "Per un'amica, l'errore più comune è cercare di fare l'\"esperienza\" — la spa, il cocktail-bar elegante, il giorno in città. Sono bei regali ma faticosi da organizzare e spesso le agende non collimano. Quello che funziona molto meglio è il regalo emotivo, fatto di ricordi tangibili. Esempio concreto: una raccolta di foto della vostra amicizia presa dai vostri social degli ultimi 3-5 anni (Instagram archive aiuta), accompagnata da una voce registrata o un messaggio scritto che dice quanto la stimi e perché. Il pacco BeGift mostra tutto in scia, con animazione di apertura confetti e suono \"campanelle\". Si guarda in 4-5 minuti, si commuove tutti, resta nelle memorie. Costo: zero euro, due ore di lavoro tuo per raccogliere il materiale.",
    },
    {
      h: "Regalo di compleanno a distanza: idee originali",
      p: "Il regalo di compleanno a distanza è uno degli usi più potenti di BeGift. Quando la persona vive in un'altra città o paese e non puoi essere lì fisicamente, un mazzo di fiori consegnato da un corriere o un bonifico non bastano. Servono cura, presenza, qualcosa che dica \"sono qui anche se non in carne e ossa\". Un pacco digitale con dentro un video personale (registrato col telefono in 5 minuti), 10-15 foto recenti delle persone a cui la festeggiata tiene, una playlist dei vostri ricordi sonori condivisi, e magari il QR di un voucher esperienza nella sua città — vale 10 volte di più di qualsiasi regalo fisico spedito. E lei può rivederlo ogni volta che vuole, quando sente la mancanza.",
    },
    {
      h: "Compleanno di compleanni rotondi (18, 30, 40, 50)",
      p: "I compleanni \"rotondi\" hanno un peso emotivo diverso: la persona si ferma, fa bilanci, vorrebbe sentirsi riconosciuta nel suo percorso. Per questi compleanni il regalo BeGift dà il meglio. Per i 18 anni: una raccolta di video-messaggi da nonni, zii, professori, amici di sempre — frasi tipo \"da quando ti conosco hai sempre fatto X\" sono il formato vincente. Per i 30: un video-collage del decennio appena finito, riassunto in 2-3 minuti. Per i 40: messaggi di chi conosce la persona da prima (compagni di liceo, ex colleghi, amici di lunga data). Per i 50: una sorta di \"This is your life\" digitale, con persone che hanno fatto parte del percorso. Sono regali che durano e che il festeggiato rivede anni dopo con emozione.",
    },
    {
      h: "Quanto costa un regalo di compleanno digitale",
      p: "Il pacco digitale BeGift è gratuito per qualunque numero di regali tu voglia creare. Carichi contenuti, personalizzi il packaging, programmi l'apertura, condividi via WhatsApp o link diretto. L'unico costo eventuale è se aggiungi una parte concreta dal catalogo: voucher esperienza (cena, spa, weekend, biglietto evento) a partire da circa 25-30€. Nessuna commissione aggiuntiva da BeGift, paghi solo il fornitore dell'esperienza. Un regalo di compleanno BeGift puro (foto, video, messaggi, playlist link) può costare zero euro e valere emotivamente più di un regalo da 100€.",
    },
    {
      h: "Errori comuni e come evitarli",
      p: "Errore numero uno: il messaggio generico. \"Tanti auguri, ti voglio bene\" non emoziona nessuno — è il default delle chat di gruppo. Errore due: il regalo \"perché si deve\". Fai un regalo solo se hai veramente qualcosa da comunicare; altrimenti meglio un messaggio semplice. Errore tre: regalare la stessa cosa di tutti gli altri. Soldi, fiori, biglietto teatro generico — sono sicuri ma anonimi. Errore quattro: aspettare l'ultimo minuto e ripiegare. Con BeGift puoi creare un regalo in 60 secondi, ma se hai 2 ore davanti puoi creare qualcosa di indimenticabile — vale la pena investirle. Errore cinque: il regalo \"di gruppo\" mal coordinato. Se sei tu a coordinare un regalo collettivo, usa BeGift come collettore: ognuno manda il proprio pezzo a te, tu costruisci il pacco, lo presenti al festeggiato come regalo di tutti insieme.",
    },
    {
      h: "Compleanno e regalo fisico: come integrarli",
      p: "BeGift non sostituisce il regalo fisico, lo amplifica. Combinazioni che funzionano bene: un libro accuratamente scelto + biglietto cartaceo con QR che apre un video-messaggio personale; una bottiglia di vino + etichetta personalizzata col QR del pacco digitale; un mazzo di fiori consegnato da un corriere + link al pacco da aprire dopo aver ricevuto i fiori. La parte fisica dà tangibilità (\"ti ho mandato un oggetto vero\"), la parte digitale dà emozione (\"ed ecco quello che ti voglio dire\"). Il festeggiato apre il pacco fisico, poi apre il pacco digitale, e i due si rinforzano a vicenda nel ricordo.",
    },
  ],
  steps: [
    {
      title: "Scegli cosa metterci",
      desc: "Una foto che vale più di mille parole, un video-messaggio, una canzone che vi accomuna, una lettera — puoi mettere tutto quello che vuoi.",
    },
    {
      title: "Personalizza il pacco",
      desc: "Carta oro e nastro rosso per il compleanno classico, oppure scegli i suoi colori preferiti. Aggiungi un fiocco e seleziona il suono di apertura.",
    },
    {
      title: "Manda il link",
      desc: "Via WhatsApp, iMessage, email. Il destinatario tocca il link, il pacco si apre con animazione e suono. Emozione garantita.",
    },
  ],
  giftIdeas: [
    {
      title: "Lettera animata con musica",
      desc: "Una dedica scritta a mano e digitalizzata, animata in apertura con una traccia audio personalizzata. Per chi sa apprezzare le parole.",
      href: "/create?occasion=birthday&content=message",
      emoji: "✉️",
    },
    {
      title: "Album foto dell'anno",
      desc: "Le 10-15 foto migliori dell'ultimo anno insieme. Una linea del tempo emotiva che si apre come un libro digitale.",
      href: "/create?occasion=birthday&content=image",
      emoji: "📸",
    },
    {
      title: "Video-messaggio personale",
      desc: "Tu davanti alla camera, 60 secondi di auguri sinceri. Funziona soprattutto a distanza: arriva caldo come una telefonata.",
      href: "/create?occasion=birthday&content=video",
      emoji: "🎥",
    },
    {
      title: "Playlist Spotify dedicata",
      desc: "I brani della vostra storia, dei suoi momenti recenti, dei vostri viaggi insieme. Una colonna sonora che racconta lei.",
      href: "/create?occasion=birthday&content=link",
      emoji: "🎵",
    },
    {
      title: "Esperienza pensata per lei",
      desc: "Spa, cooking class, escape room, brunch a domicilio: una giornata da vivere, regalata in formato digitale animato.",
      href: "/regalo/catalogo?tipo=esperienze",
      emoji: "🧖",
    },
    {
      title: "Biglietto per concerto o show",
      desc: "Un evento dal vivo nelle settimane successive. Il compleanno diventa il pretesto per una serata da segnare in agenda.",
      href: "/regalo/catalogo?tipo=concerti",
      emoji: "🎤",
    },
  ],
  faq: [
    {
      q: "Posso programmare l'apertura a mezzanotte del compleanno?",
      a: "Sì. In fase di creazione scegli la data e l'ora esatta: il regalo rimane 'sigillato' fino al momento giusto e il destinatario vede un countdown. Programmare per le 00:00 è la combinazione più cinematografica: lei lo riceve la sera prima e a mezzanotte preciso il pacco si apre.",
    },
    {
      q: "Quanto costa fare un regalo di compleanno su BeGift?",
      a: "BeGift è gratuito per i tuoi primi regali. Nessuna carta di credito richiesta in fase di registrazione. Paghi solo se aggiungi una parte concreta dal catalogo (cena, spa, biglietto evento) — in quel caso paghi il valore del voucher, senza commissioni aggiuntive da BeGift.",
    },
    {
      q: "Il destinatario deve installare un'app?",
      a: "No. Il regalo si apre con un semplice link dal browser del telefono. Il destinatario non deve scaricare nulla né registrarsi per riceverlo.",
    },
    {
      q: "Che tipo di contenuti posso mettere dentro?",
      a: "Foto, video (anche YouTube o Vimeo), PDF (es. biglietti concerto o voucher), link a pagine web, messaggi testuali, audio MP3. Puoi mescolare più elementi nello stesso pacco.",
    },
    {
      q: "Il destinatario può rispondere?",
      a: "Sì. Dopo l'apertura può inviarti una reazione (emoji, messaggio, foto, video) o chattare direttamente nel regalo. Funzionalità chat integrata che ti notifica quando lei reagisce.",
    },
    {
      q: "Posso fare un regalo collettivo, raccogliendo contributi di tante persone?",
      a: "Sì. Una persona crea il pacco BeGift, raccoglie via WhatsApp i video di auguri di amici e parenti, e li mette tutti dentro. Il pacco finale rappresenta tutto il gruppo, ognuno con la propria firma video. Ideale per compleanni rotondi (30, 40, 50 anni).",
    },
    {
      q: "Il regalo resta accessibile dopo l'apertura?",
      a: "Sì, per sempre. Il destinatario può tornare al link in qualsiasi momento, riguardare i video, salvare le foto, ricondividere. Non c'è scadenza.",
    },
  ],
  relatedOccasions: [
    { slug: "anniversario", label: "Anniversario", emoji: "💍" },
    { slug: "matrimonio", label: "Matrimonio", emoji: "💒" },
    { slug: "laurea", label: "Laurea", emoji: "🎓" },
    { slug: "onomastico", label: "Onomastico", emoji: "🎊" },
    { slug: "san-valentino", label: "San Valentino", emoji: "❤️" },
  ],
};

export default function CompleannoPage() {
  return <OccasionLanding config={config} />;
}
