import type { Metadata } from "next";
import OccasionLanding, { OccasionConfig } from "@/components/OccasionLanding";

/**
 * /natale — landing SEO long-form per "regalo Natale".
 *
 * Quinta occasion-page del growth plan (dopo /laurea, /matrimonio,
 * /compleanno, /anniversario). Target keyword principale: "regalo Natale",
 * "regalo Natale originale", "idee regalo Natale", "regalo Natale a
 * distanza", "regalo Natale ultimo minuto", "regalo Natale digitale".
 *
 * Volume IT: ~200k/mese a dicembre, 150k a novembre, 80k a ottobre.
 * E' la singola keyword gifting a maggior volume dell'anno in Italia,
 * motivo per cui pubblichiamo a giugno: tempo di indicizzazione
 * 4-12 settimane = pagina utile in top 20 entro fine settembre.
 *
 * Stagionalita': fortissima. Picco 1-24 dicembre. Crescita dolce da
 * fine ottobre. Sitemap mantiene priority 0.9 evergreen ma la pagina
 * lavora veramente solo Q4.
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://begift.app";

export const metadata: Metadata = {
  title: "Regalo di Natale originale e digitale — BeGift",
  description:
    "Un regalo di Natale digitale per parenti lontani, regali last-minute, regalo a chi ha già tutto. Foto, video, lettere, voucher esperienza in un pacco che si apre con animazione natalizia.",
  keywords: [
    "regalo Natale",
    "regalo Natale originale",
    "regalo Natale digitale",
    "idee regalo Natale",
    "regalo Natale ultimo minuto",
    "regalo Natale a distanza",
    "regalo Natale per chi è lontano",
    "regalo Natale economico",
    "regalo Natale per chi ha tutto",
    "regalo Natale bambini",
    "regalo Natale nonni",
    "regalo digitale Natale",
  ],
  alternates: { canonical: `${baseUrl}/natale` },
  openGraph: {
    title: "Regalo di Natale digitale — BeGift",
    description:
      "Foto, video, lettere e voucher in un pacco che si apre la Vigilia con animazione natalizia.",
    url: `${baseUrl}/natale`,
    type: "website",
    locale: "it_IT",
    siteName: "BeGift",
  },
  twitter: {
    card: "summary_large_image",
    title: "Regalo di Natale digitale — BeGift",
    description:
      "Per chi è lontano, per chi ha già tutto, per l'ultimo minuto. Un pacco animato che racconta.",
  },
};

const config: OccasionConfig = {
  slug: "natale",
  h1: "Regalo di Natale originale",
  emoji: "🎄",
  // Palette verde bosco + nastro rosso classico Natale.
  // Distinto da /san-valentino (rosso passione + rosa) e /anniversario
  // (rosa antico + oro): qui il verde domina, il rosso accenta.
  paperColor: "#3B8C5A",
  ribbonColor: "#D85A5A",
  occasionParam: "christmas",
  keyword: "regalo Natale originale",
  howToName: "Come fare un regalo di Natale originale e digitale",
  subtitle:
    "Per i parenti lontani, per chi ha già tutto, per l'ultimo minuto. Un pacco digitale che si apre la Vigilia con suono di campanelli.",
  intro:
    "Il Natale è la stagione dei regali ma anche delle complicazioni: parenti che vivono all'estero e non li vedi da un anno, nipoti che non sai cosa regalare, colleghi a cui devi fare un pensiero senza spendere troppo, l'idea last-minute alle 22 della Vigilia. Con BeGift prepari un regalo digitale che funziona in tutti questi casi: ci metti dentro foto della famiglia, video di auguri dei bambini, una lettera, una playlist di canzoni di Natale, un voucher esperienza per il nuovo anno. Si apre con un'animazione natalizia e il suono di campanelli. Gratis, senza app per chi riceve, anche a notte fonda.",
  longBody: [
    {
      h: "Perché un regalo digitale di Natale funziona davvero",
      p: "I regali di Natale tradizionali hanno tre problemi che peggiorano ogni anno. Primo: l'inflazione delle aspettative — ogni anno il regalo deve essere \"più bello\" del precedente, e dopo dieci Natali in famiglia hai già regalato tutto il regalabile, e cominci a comprare oggetti che la persona aprirà, sorriderà, e metterà in un cassetto. Secondo: la logistica — spedire pacchetti via corriere a metà dicembre significa pregare che arrivino, pagare costi di spedizione gonfiati, gestire i resi. Terzo: il costo ambientale ed economico — l'Italia produce ogni dicembre tonnellate di imballaggi non riciclati per regali che spesso valgono meno della loro confezione. Un regalo BeGift cambia approccio: invece di un singolo oggetto, costruisci un piccolo archivio emotivo che il destinatario apre come un pacco vero — col fiocco animato che si scioglie, il suono dei campanelli, il contenuto dentro. Costa zero, arriva in tempo anche dalla Vigilia, e ha più probabilità di essere ricordato a marzo del solito set di profumi.",
    },
    {
      h: "Cosa puoi mettere dentro un regalo di Natale",
      p: "Le cose che funzionano davvero a Natale sono quelle che parlano dell'anno appena passato e del legame con la persona. Foto: 10 immagini dei dodici mesi appena trascorsi che hanno coinvolto chi riceve — la cena dell'estate, il compleanno di marzo, la gita di settembre. Per parenti lontani, foto della famiglia riunita per il Natale stesso (anche scattate quella mattina prima di mandare il regalo). Video: i bambini di casa che cantano \"Bianco Natale\" o leggono la letterina, registrati col telefono. Funziona meglio di qualunque biglietto cartaceo, soprattutto per nonni e zii lontani. Lettera: la classica letterina di Natale, fotografata e inserita nel pacco. Per ragazzi adolescenti, una lettera vera scritta dai genitori dice più di mille regali. Playlist: i brani di Natale che la famiglia canta a tavola, le canzoni che ognuno ricorda dell'anno, la colonna sonora del prossimo Natale. Voucher: per chi ha già tutto, regala un'esperienza per il nuovo anno — una cena, un weekend, un'attività insieme nei mesi successivi. Estende il regalo oltre il 26 dicembre.",
    },
    {
      h: "Regalo di Natale a chi vive lontano",
      p: "È probabilmente l'uso più potente di BeGift a Natale. Hai famiglia all'estero — figli emigrati per lavoro, parenti che vivono in altra città, nipoti studenti universitari fuori sede, nonni in una casa di cura. La spedizione fisica è cara, lenta, impersonale. Un regalo BeGift programmato per aprirsi la Vigilia alle 21:00 (mentre voi siete a tavola e loro stanno cenando dovunque siano) crea un momento sincronizzato. Cosa metterci: video di ognuno della famiglia che fa gli auguri (60 secondi a testa), foto della tavola apparecchiata, una lettera dai genitori o dai nonni, la playlist dei canti natalizi che ascoltate insieme. Se i destinatari sono nonni, considera anche l'opzione di registrare un breve audio dei nipoti che leggono la letterina di Natale — è la cosa che porta più lacrime, anche meglio di un video. Apertura sincrona via videochiamata: appena aprono, parte la chiamata di gruppo. Il regalo diventa un evento.",
    },
    {
      h: "Regalo di Natale all'ultimo minuto — il caso 24 dicembre, ore 22",
      p: "BeGift è probabilmente l'unico strumento al mondo che ti permette di fare un regalo di Natale serio alle 22 della Vigilia, gratis, senza ordinare niente. Il caso reale: ti sei dimenticato di un parente importante. Sono le 22, i negozi sono chiusi, Amazon non consegna fino al 27. Apri begift.app dal telefono, in 5 minuti carichi 5 foto del vostro anno (le hai già nel rullino, basta che gliele riguardi), scrivi quattro righe oneste tipo \"mi sono accorto solo adesso di non averti detto buon Natale, e mi sembrava brutto fartelo arrivare scritto, quindi ho fatto questo\", aggiungi una canzone di Natale dal link Spotify, scegli il packaging verde bosco con campanelli, mandi il link via WhatsApp. Ricevuto. La persona apre, vede l'animazione, legge le quattro righe, capisce che ci hai pensato davvero, ti chiama. Funziona perché la sincerità batte la programmazione. Quasi mai un regalo last-minute viene percepito come tale se ha contenuto vero.",
    },
    {
      h: "Regalo di Natale per chi ha già tutto",
      p: "Il problema dei regali per chi \"ha già tutto\" — di solito genitori, zii, nonni con casa attrezzata e poche reali necessità materiali — si risolve invertendo la logica: invece di aggiungere un oggetto al loro mondo, ricostruisci con loro un pezzo di tempo. Funziona così: video-collage di 60 secondi della vostra famiglia dell'anno (anche solo scaricato da Foto del telefono via funzione \"Memorie\"), audio di tre amici di lunga data registrati di nascosto in cui raccontano cosa si ricordano di lui o lei, lettera dei figli scritta a mano, voucher esperienza scelto specifico (cena nel ristorante dove portavate i nipoti, weekend in agriturismo dove andavate quando eravate giovani). Costo: zero per la parte digitale, eventuale voucher esperienza dal catalogo. Effetto: chi ha tutto si commuove proprio per il fatto che hai pensato a qualcosa che non ha già in casa — il tempo.",
    },
    {
      h: "Regalo di Natale economico ma curato",
      p: "Il regalo \"economico\" è una categoria delicata: spesso percepito come segno di poco interesse. BeGift cambia questa percezione perché il valore percepito di un pacco digitale ben curato è sproporzionato rispetto al costo (zero). Il caso d'uso classico: studenti universitari che vogliono regalare ai genitori senza spendere, neoassunti che devono fare cinque regali ai colleghi e non possono permettersi un Smartbox a testa, famiglie che dopo le spese di Natale arrivano alla Befana col conto in rosso. Strategia: pacco BeGift con foto dell'anno scolastico/lavorativo, lettera che dice qualcosa di specifico (non \"buon Natale a te\" ma \"ti ringrazio per X cosa precisa\"), playlist di Natale comune. Aggiunta opzionale: un solo voucher esperienza modesto (cena, ingresso parco) preso dal catalogo invece di cinque regali fisici. Risparmio: 100-300 euro a stagione. Percezione: più curato del solito.",
    },
    {
      h: "Quando aprire il regalo — Vigilia o 25 mattina",
      p: "Tradizionalmente in Italia si aprono i regali la Vigilia (24 sera) al Nord, il 25 mattina al Centro-Sud. Il bello di BeGift è che puoi programmare l'apertura per il momento esatto. Tre opzioni che funzionano. Vigilia ore 21: appena dopo cena, dopo gli auguri formali, momento di raccoglimento. Va bene per regali emotivi (lettera ai genitori, video-collage). Mezzanotte del 24/25: il momento più magico, quando si scambiano gli auguri ufficiali. Funziona per regali di coppia o regali importanti che vuoi marcare. 25 mattina ore 9-10: dopo aver aperto i regali fisici sotto l'albero, il regalo BeGift diventa l'estensione digitale del momento. Per famiglie con bambini, considera anche un'apertura giorno-dopo-giorno: invece di un unico pacco grande, mandi una serie di mini-regali BeGift dal 20 al 25 (uno al giorno, ognuno con un piccolo contenuto). Crea attesa, è il \"calendario dell'avvento digitale\".",
    },
    {
      h: "Combinare regalo digitale e regalo sotto l'albero",
      p: "Il regalo BeGift funziona benissimo affiancato al regalo fisico tradizionale. Combinazioni che hanno funzionato bene: pacchetto fisico sotto l'albero + biglietto cartaceo con QR code che apre il pacco digitale (lo apri quando hai già aperto il regalo fisico, momento di seconda sorpresa). Cofanetto Smartbox preso al negozio + pacco BeGift che contiene il \"perché ho scelto proprio questa esperienza per te\" (foto, dedica, contesto). Buono regalo Amazon + lettera digitale BeGift che spiega tre cose specifiche che vorresti regalare ma non sai se le hai indovinate, lasciando libera scelta. Funziona anche all'inverso: regalo BeGift come regalo principale + piccolo regalo simbolico fisico per dare la \"presa\" della scatola da aprire (una bustina con un biglietto, una candela, un cioccolatino). La parte digitale dà significato, la parte fisica dà tangibilità.",
    },
    {
      h: "Idee per il packaging natalizio",
      p: "Lo stile del pacco BeGift per Natale ha tre presetting popolari, tutti coerenti con la palette stagionale. Il preset \"Natale\" — verde bosco, nastro rosso, fiocco oro, suono campanelli, animazione 'unfold' — è il default e funziona universalmente. Per famiglie più \"warm/rural\" (case di campagna, agriturismo, parenti in zone montane), il preset \"Natura\" — verde salvia + oro + nastro rosso opzionale — è più sobrio e meno commerciale. Per coppie giovani e contemporanee, sperimenta \"Elegante\" (navy + oro, lontano dai cliché natalizi). Sound: \"Bells\" (campanelli) per il classico, \"Magic\" (suono fatato) per regali ai bambini, \"Chime\" per chi vuole più sobrio. Suono custom (MP3): carica un breve estratto della canzone di Natale preferita della famiglia o un audio registrato dai bambini che dicono \"Buon Natale [nome]\". Animazione: \"Lift\" (coperchio si solleva, classica) è il default natalizio; \"Unfold\" se vuoi più senso di scoperta.",
    },
    {
      h: "Errori comuni nei regali di Natale digitali",
      p: "Errore uno: il PDF dei coupon Amazon. Tecnicamente un regalo digitale, in pratica freddo e dimenticato in 5 secondi. Se devi regalare un buono Amazon, mettilo dentro un pacco BeGift accompagnato da una lettera che spiega perché. Errore due: il messaggio collettivo. Mandare lo stesso messaggio di auguri a 30 persone via WhatsApp impersonalizza tutto. BeGift richiede un attimo di pensiero per ogni regalo — è il suo vantaggio. Errore tre: troppo testo. Il pacco BeGift va guardato in 90 secondi al massimo. 8 righe di lettera, 5 foto, una canzone, un voucher. Più di così diventa pesante. Errore quattro: dimenticare la stagione. Un regalo natalizio aperto a Capodanno o all'Epifania ha già perso il momentum. Programmare l'apertura per il 24-25-26 è essenziale. Errore cinque: il regalo \"riciclo\". Usare lo stesso pacco BeGift modificato per più persone (cambiando solo il nome) — la persona se ne accorge. Ogni pacco va costruito specifico.",
    },
  ],
  steps: [
    {
      title: "Raccogli un anno con la famiglia",
      desc: "Foto del cenone, video di auguri dei bambini, lettera dai genitori, playlist dei canti natalizi — costruisci un piccolo archivio del vostro Natale.",
    },
    {
      title: "Vesti il pacco coi colori del Natale",
      desc: "Verde bosco e nastro rosso, suono di campanelli. Oppure scegli i colori della casa o della tradizione di famiglia.",
    },
    {
      title: "Apriamolo la Vigilia",
      desc: "Programma il regalo per le 21:00 del 24 o la mezzanotte del 25. Il destinatario vede un countdown che cresce l'attesa.",
    },
  ],
  giftIdeas: [
    {
      title: "Album di Natale della famiglia",
      desc: "10-15 foto dell'anno appena trascorso: cene, viaggi, momenti casa. Per chi vive lontano, vedere il vostro anno da fuori è il regalo migliore.",
      href: "/create?occasion=christmas&content=image",
      emoji: "📸",
    },
    {
      title: "Video di auguri dei bambini",
      desc: "I nipoti che cantano 'Bianco Natale' o leggono la letterina, registrati col telefono. Per nonni e zii lontani, vale più di qualunque oggetto.",
      href: "/create?occasion=christmas&content=video",
      emoji: "🎥",
    },
    {
      title: "Letterina di Natale animata",
      desc: "La classica letterina fotografata o scritta digitalmente, dentro un pacco con musica e campanelli. Per ragazzi adolescenti, una lettera vera dai genitori dice più di mille regali.",
      href: "/create?occasion=christmas&content=message",
      emoji: "💌",
    },
    {
      title: "Playlist dei vostri canti natalizi",
      desc: "I brani che cantate a tavola, le canzoni che vi ricordano un Natale specifico, la colonna sonora di quest'anno. Linkata da Spotify.",
      href: "/create?occasion=christmas&content=link",
      emoji: "🎵",
    },
    {
      title: "Cena di Capodanno o esperienza per il nuovo anno",
      desc: "Per chi ha già tutto: un'esperienza vera per gennaio-febbraio. Cena, spa, weekend o concerto. Da scegliere dal catalogo BeGift.",
      href: "/regalo/catalogo?tipo=esperienze",
      emoji: "🥂",
    },
    {
      title: "Biglietto evento per il nuovo anno",
      desc: "Un concerto, uno spettacolo, una partita per il 2027. Il regalo che dura oltre il 26 dicembre e costruisce un'attesa.",
      href: "/regalo/catalogo?tipo=concerti",
      emoji: "🎭",
    },
  ],
  faq: [
    {
      q: "Posso programmare l'apertura per la Vigilia di Natale alle 21:00?",
      a: "Sì. BeGift ti permette di schedulare l'apertura a qualsiasi data e ora precise: il regalo rimane 'sigillato' fino al momento giusto, con un countdown elegante. Le combinazioni più comuni sono la Vigilia alle 21:00 (dopo cena), la mezzanotte tra 24 e 25, o il mattino del 25 alle 9:00.",
    },
    {
      q: "Funziona per i nonni che non usano WhatsApp?",
      a: "Sì. Il regalo è un semplice link cliccabile da qualunque browser o app di messaggistica — Messenger, SMS, email. Per nonni che non hanno smartphone, puoi stampare un foglietto con il link più breve o un QR code da scansionare con la fotocamera del telefono di un familiare. Il regalo si apre dentro il browser, senza scaricare niente.",
    },
    {
      q: "Posso fare un regalo collettivo per tutta la famiglia, intestato a più persone?",
      a: "Sì. Imposta il destinatario come 'Famiglia [cognome]' o 'A tutti voi' invece di una persona singola. Il pacco si apre allo stesso modo, ma il contenuto è pensato per essere guardato insieme — perfetto per cenoni in cui tutti i parenti sono presenti.",
    },
    {
      q: "È adatto anche ai bambini?",
      a: "Sì. Per i bambini funziona meglio se affiancato a un regalo fisico (il pacco BeGift è la 'parte magica' che si apre col fiocco animato, il regalo fisico è la sorpresa concreta). Il packaging \"Magia\" con animazione esplosione e suoni festivi è particolarmente apprezzato dai bambini sotto i 10 anni.",
    },
    {
      q: "Quanto costa un regalo di Natale su BeGift?",
      a: "Creare il pacco digitale è completamente gratuito. Se aggiungi un voucher esperienza dal catalogo (cena, weekend, biglietto evento), paghi solo il fornitore al prezzo che vedi, senza commissioni di BeGift.",
    },
    {
      q: "Posso aggiungerlo al regalo fisico sotto l'albero?",
      a: "Sì, è uno degli usi più potenti. Stampi un QR code col link sul biglietto che accompagna il regalo fisico — quando lo apre il 25 mattina, scansiona e trova il pacco digitale. Doppia sorpresa, due livelli di significato.",
    },
    {
      q: "Posso crearlo all'ultimo minuto, alle 23 della Vigilia?",
      a: "Sì. È letteralmente uno degli use case principali. In 5-10 minuti dal telefono carichi 3-5 foto, scrivi un messaggio breve, scegli il packaging natalizio, mandi il link via WhatsApp. Arriva istantaneo, senza spedizioni, e ha più probabilità di essere percepito come pensato del solito regalo dell'ultimo minuto comprato in fretta.",
    },
  ],
  relatedOccasions: [
    { slug: "san-valentino", label: "San Valentino", emoji: "❤️" },
    { slug: "compleanno", label: "Compleanno", emoji: "🎂" },
    { slug: "anniversario", label: "Anniversario", emoji: "💞" },
    { slug: "festa-mamma", label: "Festa Mamma", emoji: "💐" },
    { slug: "laurea", label: "Laurea", emoji: "🎓" },
  ],
};

export default function NatalePage() {
  return <OccasionLanding config={config} />;
}
