import type { Metadata } from "next";
import OccasionLanding, { OccasionConfig } from "@/components/OccasionLanding";

/**
 * /matrimonio — landing SEO long-form per "regalo matrimonio".
 *
 * Seconda occasion-page del growth plan (dopo /laurea).
 * Target keyword: "regalo matrimonio originale", "regali sposi",
 * "cosa regalare al matrimonio". Volume IT ~40-60k/mese.
 *
 * Stagionalita': forte picco aprile-settembre (stagione matrimoni
 * italiana). Lancio fine maggio 2026 = catch della stagione attuale +
 * setup per stagione 2027. Per la Vergine non si pianta — qui si
 * pianta una pagina ed esce all'indicizzazione in 3-6 settimane.
 *
 * Differenza con /laurea: occasione "di coppia" — il regalo va agli
 * sposi (plurale), non a un singolo destinatario. Le idee regalo
 * sono diverse (esperienze di coppia, viaggio di nozze, contributo
 * lista nozze digitale).
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://begift.app";

export const metadata: Metadata = {
  title: "Regalo di matrimonio originale e digitale — BeGift",
  description:
    "Un regalo di matrimonio che non finisce a prendere polvere: messaggi e video dagli invitati che non c'erano, contributo per il viaggio di nozze, esperienze per la coppia. Un pacco digitale che gli sposi aprono insieme.",
  keywords: [
    "regalo matrimonio",
    "regalo matrimonio originale",
    "regalo sposi",
    "regali matrimonio digitale",
    "idee regalo matrimonio",
    "cosa regalare al matrimonio",
    "regalo nozze online",
    "regalo lista nozze",
    "regalo matrimonio amici",
    "regalo matrimonio a distanza",
  ],
  alternates: { canonical: `${baseUrl}/matrimonio` },
  openGraph: {
    title: "Regalo di matrimonio digitale — BeGift",
    description:
      "Un pacco digitale che gli sposi aprono insieme: messaggi degli invitati, contributo nozze, esperienze di coppia.",
    url: `${baseUrl}/matrimonio`,
    type: "website",
    locale: "it_IT",
    siteName: "BeGift",
  },
  twitter: {
    card: "summary_large_image",
    title: "Regalo di matrimonio digitale — BeGift",
    description:
      "Un regalo per gli sposi che resta. Messaggi, video, esperienze in un pacco animato.",
  },
};

const config: OccasionConfig = {
  slug: "matrimonio",
  // H1 con keyword principale "regalo matrimonio" e qualifying
  // ("originale" intercetta query commerciali alto-intent).
  h1: "Regalo di matrimonio originale",
  emoji: "💍",
  // Palette nuziale: bianco perla per la carta, oro per il nastro.
  // Distinto da /anniversario (rosa+oro) e /laurea (blu+oro).
  paperColor: "#F5E8D5",
  ribbonColor: "#E8C84A",
  occasionParam: "wedding",
  keyword: "regalo matrimonio originale",
  howToName: "Come fare un regalo di matrimonio originale agli sposi",
  subtitle:
    "Un pacco digitale che raccoglie messaggi e video di chi non c'era, contributo al viaggio di nozze, esperienze pensate per loro due. Gli sposi lo aprono insieme, dopo la festa.",
  intro:
    "I regali di matrimonio sono diventati uno dei momenti più stressanti dell'evento: vasellame mai usato, gadget che finiscono in cantina, buste di soldi anonime. Con BeGift puoi fare qualcosa di diverso: raccogliere in un unico pacco digitale i video di auguri di parenti lontani, foto della storia di coppia raccolte dai testimoni, un contributo per il viaggio di nozze o un'esperienza da vivere insieme. Lo apri come si apre un regalo vero, dal telefono, e resta accessibile per sempre come ricordo condivisibile.",
  longBody: [
    {
      h: "Perché un regalo di matrimonio digitale fa più effetto di un classico",
      p: "Il matrimonio è il giorno in cui gli sposi ricevono il maggior numero di regali della loro vita, e proprio per questo il singolo regalo \"si perde\". Una busta tra le buste, un servizio di piatti tra altri quattro servizi, un'argenteria che resterà nell'imballaggio per anni. Un regalo BeGift va in direzione opposta: non si confonde, non si replica, e ha un valore emotivo che nessun oggetto pareggia. Gli sposi lo aprono insieme, di solito la sera dopo la festa o nei giorni successivi, e ritrovano dentro le persone che hanno fatto parte del loro percorso — incluse quelle che non sono riuscite a esserci di persona.",
    },
    {
      h: "Cosa puoi mettere dentro il regalo di matrimonio",
      p: "Le combinazioni più riuscite mescolano contenuti emotivi e qualcosa di concreto. Lato emotivo: video di auguri dai parenti che non hanno potuto partecipare (zii all'estero, nonni anziani, amici trasferiti); raccolta di foto della storia di coppia (dal primo incontro all'anello); messaggi audio dei testimoni; un saluto registrato dei genitori che magari non se la sentono di parlare al microfono durante la cena. Lato concreto: un contributo per il viaggio di nozze (con link a un wallet condiviso o conto cointestato), un voucher esperienza per la coppia (cena, spa, weekend), il QR code della lista nozze digitale. Tutto convive nello stesso pacco animato.",
    },
    {
      h: "Quando consegnare il regalo: prima, durante o dopo il matrimonio",
      p: "Tre scenari hanno funzionato meglio nelle decine di matrimoni in cui BeGift è stato usato. Primo: consegna durante il ricevimento, proiettata sulla TV o sul muro durante il dolce — i video di auguri girano davanti a tutti gli invitati, gli sposi si commuovono in diretta. Secondo: consegna programmata per il giorno dopo, quando l'adrenalina della festa è passata e gli sposi possono aprire il regalo con calma, magari in viaggio o in hotel. Terzo: consegna pre-matrimonio (es. al fidanzamento o al pre-wedding party) per testimoni e amici stretti, come parte del regalo collettivo. Il timing più comune resta il primo, perché trasforma il regalo in un momento condiviso della festa.",
    },
    {
      h: "Quanto costa un regalo di matrimonio digitale",
      p: "Il pacco digitale BeGift è gratuito. Lo crei, carichi tutti i contenuti che vuoi, lo personalizzi, lo invii via WhatsApp o stampato come QR su un biglietto cartaceo. L'unico costo che decidi tu è quello dell'eventuale parte concreta: contributo viaggio di nozze (la cifra che ritieni), voucher esperienza dal catalogo BeGift (cene, weekend, esperienze a partire da 30€), o lista nozze digitale linkata. Per un regalo di gruppo (più colleghi, gruppo di amici, lato della famiglia che si organizza), una persona crea il pacco e tutti contribuiscono coi propri video — il valore percepito è altissimo anche con zero euro spesi totali.",
    },
    {
      h: "Idee per il packaging del matrimonio",
      p: "Lo stile del pacco BeGift può richiamare la palette del matrimonio. Il preset \"Elegante\" — carta avorio, nastro oro, fiocco a stella — è il default che proponiamo perché funziona per la maggior parte dei matrimoni classici. Per matrimoni più colorati o tematici, puoi scegliere palette ad hoc: il rosa cipria per matrimoni in primavera, il verde salvia per matrimoni country, il bordeaux per matrimoni autunnali. L'animazione di apertura più richiesta è \"Unwrap\" (svolgimento del nastro) — è la più solenne, adatta al tono del momento. Per matrimoni più festosi puoi alternare con \"Confetti\" (esplosione di coriandoli). Suono consigliato: \"Chime\" o \"Magic\" — sobri, eleganti, non kitsch.",
    },
    {
      h: "Regalo di matrimonio a distanza: come renderlo speciale",
      p: "Il regalo a distanza è uno dei casi d'uso più potenti di BeGift. Sempre più matrimoni hanno invitati che non possono partecipare (lavoro all'estero, salute, distanza geografica). Invece di mandare una busta col bonifico, queste persone possono registrare un video personale, mandarlo a un coordinatore di parte (un testimone, un genitore, un amico stretto), e quello costruisce un pacco BeGift collettivo che contiene tutti i contributi. Gli sposi ricevono un pacco unico ma con dentro 15-20 messaggi personalizzati, sa di chi è ogni messaggio, e lo apre nei giorni successivi come un \"messaggio collettivo dalle persone lontane\". Funziona benissimo anche per matrimoni in cui un nonno o un genitore è malato e non può essere presente — la sua presenza viene catturata nel regalo prima del matrimonio e arriva agli sposi nel giorno giusto.",
    },
    {
      h: "Errori comuni nei regali di matrimonio (e come evitarli)",
      p: "Primo errore classico: comprare un oggetto di valore senza sapere se gli sposi lo userebbero — il servizio di piatti, il vaso decorativo, la lampada di design. Probabilmente finisce in soffitta. Secondo errore: la busta anonima. Soldi sì, ma senza nessun segno di chi sei, e gli sposi neanche si ricordano da chi è arrivato. Terzo errore: il regalo di gruppo \"a sorpresa\" male organizzato — qualcuno raccoglie soldi e compra a nome di tutti, ma il regalo finale non rappresenta nessuno in particolare. Quarto errore: rispettare a tutti i costi la lista nozze. Le liste nozze sono ottime, ma il regalo \"giusto\" diventa quasi una transazione e perde valore emotivo. Con BeGift puoi unire la funzionalità della lista nozze (soldi pratici) con l'emotività di un messaggio personale — entrambi nello stesso pacco.",
    },
    {
      h: "Combinare regalo digitale e regalo concreto",
      p: "BeGift non sostituisce il regalo classico, lo amplifica. Un mix che funziona: una busta tradizionale con un assegno o un bonifico predefinito, dentro la busta un biglietto cartaceo con stampato un QR code. Il QR porta al pacco digitale BeGift che si apre con animazione e mostra video, foto, dediche personalizzate. La parte monetaria dà concretezza (\"abbiamo contribuito al viaggio di nozze con X euro\"), la parte digitale dà emozione (\"e questo è quello che ti vogliamo dire\"). Funziona anche con regali fisici tradizionali — etichetta personalizzata sul regalo con QR che apre il messaggio digitale. La stessa logica vale per la lista nozze: puoi linkare al pacco BeGift dalla scheda regalo della lista, così chi sceglie quel regalo dalla lista nozze viene direzionato anche al messaggio personale.",
    },
  ],
  steps: [
    {
      title: "Raccogli i contributi",
      desc: "Chiedi a parenti e amici (in particolare a chi non può essere presente) di mandarti un video di auguri di 30 secondi. Aggiungi foto della storia di coppia e una nota personale.",
    },
    {
      title: "Scegli stile elegante",
      desc: "Carta avorio + nastro oro è il default consigliato, oppure ricrea i colori del matrimonio. Animazione \"Unwrap\", suono \"Chime\" — sobri come l'occasione.",
    },
    {
      title: "Consegna durante o dopo la festa",
      desc: "Proiettalo durante il dolce come sorpresa, oppure programmalo per la mattina dopo. Manda il link via WhatsApp agli sposi quando vuoi tu.",
    },
  ],
  giftIdeas: [
    {
      title: "Video di auguri collettivo",
      desc: "Raccogli 10-20 video brevi da parenti, amici, colleghi che non potevano essere alla festa. Gli sposi li sfogliano insieme come ricordo.",
      href: "/create?occasion=wedding&content=video",
      emoji: "🎥",
    },
    {
      title: "Album foto della storia di coppia",
      desc: "Dal primo incontro alla proposta: una raccolta di foto che racconta gli sposi. Spesso preparata dai testimoni come sorpresa.",
      href: "/create?occasion=wedding&content=image",
      emoji: "📸",
    },
    {
      title: "Contributo per il viaggio di nozze",
      desc: "Un wallet digitale condiviso o un bonifico simbolico, dentro un pacco con messaggio personale. Più caldo della busta tradizionale.",
      href: "/create?occasion=wedding&content=message",
      emoji: "✈️",
    },
    {
      title: "Esperienza di coppia",
      desc: "Cena gourmet, weekend in un agriturismo, giornata in spa: un'esperienza da vivere insieme nei primi mesi di matrimonio.",
      href: "/regalo/catalogo?tipo=perdue",
      emoji: "🥂",
    },
    {
      title: "Voucher viaggio o week-end",
      desc: "Buono per un soggiorno o un'esperienza territoriale italiana — Venezia, Toscana, Costiera Amalfitana. Da usare nei mesi successivi.",
      href: "/regalo/catalogo?tipo=esperienze",
      emoji: "🏖️",
    },
    {
      title: "Concerto o show da vedere insieme",
      desc: "Biglietti per un evento che entrambi avrebbero voluto vedere: concerto, opera, teatro. Una serata da segnare in calendario.",
      href: "/regalo/catalogo?tipo=concerti",
      emoji: "🎭",
    },
  ],
  faq: [
    {
      q: "Posso fare un regalo di gruppo, raccogliendo contributi di tante persone?",
      a: "Sì, è uno degli usi più frequenti per i matrimoni. Una persona crea il pacco BeGift, raccoglie via WhatsApp i video di auguri di parenti e amici (anche di chi non sarà presente), e li mette tutti dentro. Il pacco finale rappresenta tutti i contribuenti, ognuno con la propria firma video.",
    },
    {
      q: "Si può mostrare il pacco durante il ricevimento, magari proiettandolo?",
      a: "Sì. Il link BeGift si apre da qualunque browser, quindi puoi mostrarlo sul telefono passato fra le mani, oppure connetterlo a una TV o proiettore della location. Molti sposi lo proiettano durante il dolce come momento collettivo della festa.",
    },
    {
      q: "Quanto costa creare il regalo?",
      a: "Creare il pacco è gratuito. L'unico costo eventuale è se aggiungi un'esperienza vera dal catalogo (cena, weekend, biglietto) o un contributo monetario — in quel caso paghi solo il valore aggiunto, senza commissioni di BeGift.",
    },
    {
      q: "Posso programmare l'apertura per una data specifica, tipo l'anniversario?",
      a: "Sì. Nello step finale di creazione c'è l'opzione \"Programma per dopo\": scegli data e ora. Molti usano questa funzione per programmare il regalo all'anniversario del primo matrimonio, in viaggio di nozze, o per il giorno dopo la festa.",
    },
    {
      q: "Il regalo si può rivedere dopo, o si \"consuma\" una volta aperto?",
      a: "Il regalo resta accessibile per sempre attraverso il link. Gli sposi possono tornarci negli anni, riguardare i video, mostrarli ai figli, ricondividere con altri parenti che li chiedono.",
    },
    {
      q: "Quanti contenuti posso mettere dentro?",
      a: "Non c'è un limite stretto, ma per matrimoni consigliamo di stare entro 15-20 video/foto totali — il destinatario li deve sfogliare tutti, oltre quel numero diventa stancante. Se devi gestire molti contributi, conviene raggrupparli in playlist YouTube non in elenco e linkare quello.",
    },
    {
      q: "Posso linkare al pacco BeGift dalla lista nozze digitale?",
      a: "Sì. Puoi mettere il link BeGift nel campo \"note\" o \"messaggio personale\" della maggior parte delle liste nozze digitali (Coupleidays, Mr&Mrs Wedding, etc.). Quando il regalo viene scelto dalla lista, chi compra vede anche il tuo messaggio personalizzato.",
    },
  ],
  relatedOccasions: [
    { slug: "anniversario", label: "Anniversario", emoji: "💍" },
    { slug: "laurea", label: "Laurea", emoji: "🎓" },
    { slug: "compleanno", label: "Compleanno", emoji: "🎂" },
    { slug: "san-valentino", label: "San Valentino", emoji: "❤️" },
    { slug: "natale", label: "Natale", emoji: "🎄" },
  ],
};

export default function MatrimonioPage() {
  return <OccasionLanding config={config} />;
}
