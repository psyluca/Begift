import type { Metadata } from "next";
import OccasionLanding, { OccasionConfig } from "@/components/OccasionLanding";

export const metadata: Metadata = {
  title: "Regalo per onomastico — BeGift",
  description: "Un regalo digitale per onomastico: un pensiero raffinato per il giorno del santo del proprio nome. Foto, video, messaggi e voucher in un pacco lavanda con nastro oro.",
  alternates: { canonical: "/onomastico" },
  openGraph: {
    title: "Regalo per onomastico su BeGift 🎊",
    description: "Per il giorno del nome — un pensiero raffinato che arriva come un vero regalo.",
    url: "/onomastico",
    type: "website",
    locale: "it_IT",
  },
};

const config: OccasionConfig = {
  slug: "onomastico",
  h1: "Regalo per onomastico",
  emoji: "🎊",
  paperColor: "#C9B6E8",
  ribbonColor: "#E8C84A",
  occasionParam: "name_day",
  subtitle: "Un pensiero raffinato per il giorno del santo del proprio nome. Carta lavanda con nastro oro, apertura morbida, suono delicato — sobrio e festivo allo stesso tempo.",
  intro: "L'onomastico è una ricorrenza tipicamente italiana, meno chiassosa del compleanno ma altrettanto sentita: il giorno in cui si festeggia il santo del proprio nome. Per chi è legato alla tradizione, è un'occasione che merita un riconoscimento — ma con un tono più sobrio e raffinato. Un mazzetto di fiori, una telefonata, un pensiero che dimostri \"mi sono ricordato del tuo onomastico\".",
  steps: [
    {
      title: "Un messaggio personale",
      desc: "Una breve dedica per il giorno del nome, una citazione legata al santo, un ricordo della prima volta che hai festeggiato il suo onomastico.",
    },
    {
      title: "Packaging sobrio e festivo",
      desc: "Carta lavanda con nastro oro, fiocco classico, animazione morbida e suono di campanella delicato. Distinto dal compleanno chiassoso, ma comunque celebrativo.",
    },
    {
      title: "Aggiungi un voucher o un'esperienza",
      desc: "Un buono per un caffè, una libreria, un'esperienza gastronomica — qualcosa che suggerisca \"vorrei festeggiare con te\". Caricalo come PDF o link dentro al pacco.",
    },
  ],
  faq: [
    {
      q: "Che cos'è esattamente l'onomastico?",
      a: "L'onomastico è il giorno dedicato al santo del calendario cattolico che porta lo stesso nome della persona. È una ricorrenza tipicamente italiana e dei paesi cattolici. Diverso dal compleanno, che è il giorno della nascita.",
    },
    {
      q: "Come scoprire la data di onomastico di una persona?",
      a: "Cercando il nome su un calendario degli onomastici (online ce ne sono molti). Per nomi comuni come Maria, Giuseppe, Anna ci sono date principali ma anche varianti. Se non sei sicuro, chiedere è sempre rispettoso.",
    },
    {
      q: "L'onomastico è ancora sentito tra le generazioni più giovani?",
      a: "Meno del compleanno, ma in molte famiglie italiane resta una ricorrenza importante, soprattutto per le persone più legate alla tradizione (nonni, zii). Un piccolo regalo o una telefonata sono sempre apprezzati.",
    },
    {
      q: "Posso programmare l'apertura per il giorno esatto dell'onomastico?",
      a: "Sì. Imposta data e ora dell'onomastico durante la creazione e il pacco resta sigillato fino a quel momento. Il destinatario vede un countdown.",
    },
    {
      q: "BeGift mi ricorda gli onomastici dei miei familiari?",
      a: "Sì, tramite il sistema Ricorrenze: aggiungi nome e data, e ricevi una notifica push qualche giorno prima per avere il tempo di preparare il regalo.",
    },
  ],
};

export default function OnomasticoPage() {
  return <OccasionLanding config={config} />;
}
