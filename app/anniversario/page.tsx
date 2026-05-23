import type { Metadata } from "next";
import OccasionLanding, { OccasionConfig } from "@/components/OccasionLanding";

/**
 * /anniversario — landing SEO long-form per "regalo anniversario".
 *
 * Quarta occasion-page del growth plan (dopo /laurea, /matrimonio,
 * /compleanno). Target keyword: "regalo anniversario", "regalo
 * anniversario fidanzato/fidanzata", "regali anniversario matrimonio",
 * "anniversario di fidanzamento". Volume IT ~25-35k/mese aggregato.
 *
 * Evergreen, nessuna stagionalita' forte. Picco minore in autunno
 * (mesi tradizionali di matrimoni piu' anniversari di un anno dopo).
 *
 * Distinzione semantica con /matrimonio: anniversario riguarda la
 * coppia gia' insieme (1 anno, 5, 10, 25, 50). Idee centrate su
 * "celebrare la persistenza", non su "celebrare l'inizio".
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://begift.app";

export const metadata: Metadata = {
  title: "Regalo per anniversario originale e digitale — BeGift",
  description:
    "Un regalo per il vostro anniversario che racchiude i ricordi: foto del primo viaggio, video di momenti speciali, canzone del primo ballo, lettera. Un pacco digitale che si apre con animazione.",
  keywords: [
    "regalo anniversario",
    "regalo anniversario originale",
    "regalo anniversario fidanzato",
    "regalo anniversario fidanzata",
    "regali anniversario matrimonio",
    "anniversario di fidanzamento",
    "regalo primo anniversario",
    "regalo 10 anni insieme",
    "idee regalo anniversario",
    "regalo anniversario a distanza",
  ],
  alternates: { canonical: `${baseUrl}/anniversario` },
  openGraph: {
    title: "Regalo d'anniversario digitale — BeGift",
    description:
      "Un pacco con dentro i vostri ricordi: foto, video, canzoni, parole. Si apre con animazione.",
    url: `${baseUrl}/anniversario`,
    type: "website",
    locale: "it_IT",
    siteName: "BeGift",
  },
  twitter: {
    card: "summary_large_image",
    title: "Regalo d'anniversario digitale — BeGift",
    description:
      "Celebra il vostro tempo insieme con un regalo che racchiude i ricordi.",
  },
};

const config: OccasionConfig = {
  slug: "anniversario",
  h1: "Regalo per anniversario originale",
  emoji: "💞",
  // Palette rosa antico + oro — diversa da /matrimonio (avorio+oro,
  // piu' istituzionale) e da /san-valentino (rosso, piu' passionale).
  paperColor: "#E8A0A0",
  ribbonColor: "#E8C84A",
  occasionParam: "anniversary",
  keyword: "regalo anniversario originale",
  howToName: "Come fare un regalo di anniversario originale alla coppia",
  subtitle:
    "Celebra il vostro tempo insieme con un regalo che racchiude i ricordi. Si apre con un'animazione e il vostro suono preferito.",
  intro:
    "Un anniversario merita qualcosa di più di un messaggio di auguri. Con BeGift puoi preparare un regalo digitale che contiene la foto del primo viaggio insieme, il video della proposta, la canzone del primo ballo, una lettera scritta pensando a cosa siete diventati in questi anni. Il destinatario lo apre con un'animazione curata e un suono evocativo — è un'esperienza, non un semplice messaggio.",
  longBody: [
    {
      h: "Perché un regalo digitale di anniversario funziona meglio di un classico",
      p: "Gli anniversari hanno un problema strutturale: dopo i primi tre o quattro, le idee finiscono. La cena al ristorante della prima volta, il weekend a Parigi, il gioiello — sono regali bellissimi ma si ripetono. E ogni anno l'asticella si alza: cosa puoi fare di nuovo che non hai già fatto? Un regalo BeGift cambia approccio: invece di un singolo gesto da \"piazzare\", costruisci un piccolo archivio del vostro anno. Mette insieme foto, video, voci, canzoni — cose che esistono già e che messe insieme acquistano un significato che il singolo elemento non aveva. È un regalo che vale come un libro di famiglia, scritto in cinque minuti.",
    },
    {
      h: "Cosa puoi mettere dentro un regalo di anniversario",
      p: "Le cose che funzionano meglio sono quelle che parlano del vostro \"specifico\". Foto: le 10 migliori dell'anno appena trascorso, ordinate cronologicamente — il viaggio, la cena per il compleanno di lui, la sorpresa per il vostro \"mese-versario\", la foto rubata in metropolitana. Video: il momento esatto della proposta (se c'è), un video-collage di 60 secondi che riassume l'anno, voci registrate di amici comuni che ti raccontano cosa hanno notato di voi due. Canzoni: la playlist Spotify dei vostri brani — quello che ballate in cucina, quello del primo viaggio in macchina insieme, quello della discoteca quando vi siete conosciuti. Lettera: scritta a mano, fotografata, dentro il pacco animato. Voucher: una cena, un weekend, una giornata in spa per il vostro \"prossimo anniversario\" — programmate ora qualcosa per il futuro, è il regalo che continua.",
    },
    {
      h: "Anniversari speciali: 1, 5, 10, 25, 50",
      p: "Per ogni anniversario \"rotondo\" il formato BeGift si adatta. Primo anniversario: focus su \"il nostro primo anno insieme\" — raccogli foto dei dodici mesi appena trascorsi, una lettera sui momenti che ricordi di più, un video di 60 secondi che riassume il viaggio. Quinto: \"i cinque anni del nostro tempo\" — coinvolgi amici e familiari che hanno assistito al vostro percorso, fai mandare a ciascuno un video o un audio messaggio breve. Decimo: \"un decennio insieme\" — un mini-documentario in 3 minuti del vostro percorso, costruito coi materiali che hai accumulato in dieci anni. Venticinquesimo: \"nozze d'argento\" — coinvolgere figli, genitori, fratelli che possono raccontare cosa avete rappresentato per loro come coppia. Cinquantesimo: \"nozze d'oro\" — un vero archivio digitale, magari registrato anche con interviste video preparate prima.",
    },
    {
      h: "Anniversario di fidanzamento: cosa funziona davvero",
      p: "L'anniversario di fidanzamento (\"siamo insieme da X mesi/anni\") è una categoria diversa dall'anniversario di matrimonio: spesso più giovane, meno istituzionale, più giocoso. Per questa coppia il regalo BeGift dà il meglio in formato \"contenuto leggero ma curato\". Una raccolta delle vostre foto Instagram dell'anno (anche solo da Instagram Archive si scarica facilmente), accompagnata da una colonna sonora dei vostri brani Spotify, e un video registrato da te (60 secondi, davanti al telefono) in cui dici tre cose specifiche che hai imparato di lui o lei nell'anno. Costo: zero euro. Tempo: due ore. Effetto: lacrime di gioia e il regalo girato anche agli amici per mostrare quanto sei attento.",
    },
    {
      h: "Anniversario di matrimonio: regali classici contro regali digitali",
      p: "I regali tradizionali per gli anniversari di matrimonio seguono nomi convenzionali — carta per il primo, cotone per il secondo, pelle per il terzo, eccetera fino all'oro per il cinquantesimo. È un sistema con valore simbolico, ma anche un po' rigido: il \"regalo di carta\" finisce a essere un blocco note, il \"regalo di cotone\" un asciugamano. Un regalo BeGift può convivere con quello tradizionale: il regalo simbolico di carta resta (un libro, una lettera, un quadernino), ma in più hai il pacco digitale animato che contiene la storia vera. Funziona ancora meglio se programmi l'apertura per il giorno esatto dell'anniversario, con countdown: lo rendi un momento atteso, non un'aggiunta laterale.",
    },
    {
      h: "Anniversario a distanza: come renderlo speciale",
      p: "Se per l'anniversario non potete essere fisicamente insieme (lavoro all'estero, viaggio di uno solo, situazione temporanea), il regalo BeGift è probabilmente il modo migliore per colmare la distanza. Mandare un mazzo di fiori da un corriere è impersonale; un bonifico è transazionale; un messaggio scritto è troppo poco. Un pacco BeGift programmato per le 21:00 della data dell'anniversario (così potete aprirlo insieme in videochiamata) trasforma il momento in un evento. Contenuti consigliati: un video di te che spiega perché stai pensando a lui/lei in quel preciso istante, foto del vostro ultimo periodo insieme, una promessa concreta per quando vi rivedete (\"appena torno facciamo X\"). Apertura sincrona via videochiamata = 10 volte più forte di qualunque altro formato.",
    },
    {
      h: "Idee per il packaging dell'anniversario",
      p: "Lo stile del pacco BeGift per un anniversario è di solito più sobrio e caldo. Il preset \"Romantico\" — carta rosa antica, nastro oro, fiocco classico — è il default. Per coppie più moderne, alternative valide: \"Elegante\" (navy + oro, riferimento a vestiti formali), \"Classico\" (rosso intenso + nastro oro, riferimento al rosso passione senza essere kitsch), \"Natura\" (verde salvia + oro, per coppie che amano l'outdoor o il minimal). L'animazione più scelta è \"Solleva\" (lift) — lenta, solenne, da regalo importante. Per anniversari giocosi va bene anche \"Apri\" (unfold). Suono: \"Chime\" o \"Magic\" — sobri, eleganti. Suono custom (MP3): la vostra canzone del cuore caricata direttamente.",
    },
    {
      h: "Errori comuni nei regali di anniversario",
      p: "Errore numero uno: il regalo \"di rito\". Lo si fa perché si deve, senza pensiero specifico. Si compra un fiore al volo, un gioiello casuale, una cena qualunque. La persona se ne accorge sempre. Errore due: la sorpresa generica. \"Voglio sorprenderti\" diventa \"ho prenotato un weekend\" — il weekend in sé può essere bellissimo, ma se non è legato a qualcosa di vostro, è una sorpresa standardizzata. Errore tre: il regalo costoso ma anonimo. Un anello, un orologio, una borsa firmata sono bellissimi ma non comunicano nulla del rapporto se non \"ho speso tanto\". Errore quattro: trascurare l'aspetto \"tempo\". Gli anniversari sono il tempo che passa, non il presente che si compra — un regalo che racconta il tempo (foto degli anni, video del passato, lettera del futuro) vince su qualunque oggetto.",
    },
    {
      h: "Combinare regalo digitale e regalo concreto",
      p: "Come per le altre occasioni, il regalo BeGift può essere standalone o affiancato a un regalo fisico. Combinazioni che hanno funzionato bene: anello (anniversario di fidanzamento) consegnato con un biglietto cartaceo che ha un QR code stampato — il QR apre il pacco BeGift che mostra il video della prima volta in cui hai pensato \"voglio sposare questa persona\". Cena al ristorante (anniversario di matrimonio) prenotata con un biglietto della prenotazione + QR code che apre il pacco digitale: lei apre il pacco mentre aspettate il dolce, momento collettivo. Weekend romantico: il regalo BeGift contiene la prenotazione + foto del posto + playlist di canzoni per il viaggio. La regola: la parte digitale aggiunge significato a quella fisica, non la sostituisce.",
    },
  ],
  steps: [
    {
      title: "Raccogli i ricordi",
      desc: "Scegli una foto che vi ritrae, il video di un momento speciale, la vostra canzone, una lettera. Metti quello che parla di voi.",
    },
    {
      title: "Vesti il pacco con i vostri colori",
      desc: "Rosa tenue e nastro oro per un classico romantico, o scegli le sfumature che vi rappresentano. Aggiungi un suono di campanelli o un carillon.",
    },
    {
      title: "Falle trovare il link",
      desc: "Inviato via WhatsApp, messo sotto il guanciale con un QR code, lasciato in macchina — l'importante è la sorpresa quando lo apre.",
    },
  ],
  giftIdeas: [
    {
      title: "Album dell'anno appena trascorso",
      desc: "10-15 foto dei dodici mesi appena passati, ordinate cronologicamente. Una linea del tempo emotiva del vostro anno.",
      href: "/create?occasion=anniversary&content=image",
      emoji: "📸",
    },
    {
      title: "Video-collage di 60 secondi",
      desc: "Un riassunto cinematografico dell'anno: clip da viaggi, momenti casa, sorprese. Si guarda in un fiato, resta nel cuore.",
      href: "/create?occasion=anniversary&content=video",
      emoji: "🎥",
    },
    {
      title: "Lettera animata con dedica",
      desc: "Una lettera scritta a mano, fotografata o digitalizzata, dentro un pacco con musica della vostra canzone. Per coppie che si parlano con le parole.",
      href: "/create?occasion=anniversary&content=message",
      emoji: "💌",
    },
    {
      title: "Playlist della vostra storia",
      desc: "I brani che vi accompagnano: il primo ballo, la canzone del viaggio, quella che ballate in cucina. Linkata da Spotify.",
      href: "/create?occasion=anniversary&content=link",
      emoji: "🎵",
    },
    {
      title: "Cena romantica come voucher",
      desc: "Una cena gourmet, un'esperienza di degustazione, una serata in un posto speciale. Da vivere il giorno dell'anniversario o nei mesi successivi.",
      href: "/regalo/catalogo?tipo=esperienze",
      emoji: "🥂",
    },
    {
      title: "Weekend o esperienza di coppia",
      desc: "Un'avventura di coppia: weekend in agriturismo, spa, città mai vista insieme. Da scegliere dal catalogo e regalare animato.",
      href: "/regalo/catalogo?tipo=perdue",
      emoji: "🌅",
    },
  ],
  faq: [
    {
      q: "Posso programmare il regalo per il giorno esatto dell'anniversario?",
      a: "Sì. BeGift ti permette di schedulare l'apertura a una data e ora precise: il regalo rimane 'sigillato' fino al momento giusto. Programmare per le 21:00 del giorno è la combinazione più comune — la sera, dopo cena, momento di raccoglimento.",
    },
    {
      q: "Il regalo scade dopo un tempo?",
      a: "No. Una volta aperto, il regalo resta disponibile al link per consultarlo in futuro, come un ricordo salvato in un cassetto digitale. Molte coppie tornano al link gli anni successivi per ri-guardarlo all'anniversario.",
    },
    {
      q: "Posso mettere una canzone intera?",
      a: "Sì, caricando il link YouTube o Vimeo. La canzone parte automaticamente all'apertura. Puoi anche caricare un MP3 (file audio fino a 10MB) per un suono di apertura più breve e impattante.",
    },
    {
      q: "Se il regalo è a sorpresa, come faccio a non rovinare l'effetto?",
      a: "Il link non rivela il contenuto finché non viene toccato. Puoi anche programmare l'apertura: finché non arriva la data, il destinatario vede solo un countdown elegante. Per anniversari a sorpresa, mandare il link la sera prima con messaggio \"apri domani alle 21:00\" funziona benissimo.",
    },
    {
      q: "Posso aggiungere una dedica che appare prima dell'apertura?",
      a: "Sì, c'è un messaggio opzionale che il destinatario vede mentre carica il regalo — perfetto per un 'Buon anniversario, amore mio'. Resta visibile finché non si apre il pacco animato.",
    },
    {
      q: "Quanto costa un regalo di anniversario su BeGift?",
      a: "Creare il pacco digitale è gratuito. L'unico costo eventuale è se aggiungi un'esperienza vera dal catalogo (cena, weekend, voucher) — in quel caso paghi solo il fornitore, senza commissioni di BeGift.",
    },
    {
      q: "Posso fare il regalo come un'aggiunta a un anello o altro regalo fisico?",
      a: "Sì, è uno degli usi più comuni. Stampi un QR code col link sul biglietto che accompagna il regalo fisico, oppure metti il link in un messaggio dopo l'apertura del fisico. La parte digitale amplifica quella fisica.",
    },
  ],
  relatedOccasions: [
    { slug: "matrimonio", label: "Matrimonio", emoji: "💍" },
    { slug: "san-valentino", label: "San Valentino", emoji: "❤️" },
    { slug: "compleanno", label: "Compleanno", emoji: "🎂" },
    { slug: "laurea", label: "Laurea", emoji: "🎓" },
    { slug: "natale", label: "Natale", emoji: "🎄" },
  ],
};

export default function AnniversarioPage() {
  return <OccasionLanding config={config} />;
}
