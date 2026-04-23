import type { Metadata } from "next";
import OccasionLanding, { OccasionConfig } from "@/components/OccasionLanding";

export const metadata: Metadata = {
  title: "Regalo di compleanno digitale — BeGift",
  description: "Crea un regalo di compleanno digitale personalizzato in 60 secondi. Foto, video, messaggi, musica in un pacco animato che si apre sul telefono.",
  alternates: { canonical: "/compleanno" },
  openGraph: {
    title: "Regalo di compleanno digitale su BeGift 🎂",
    description: "Sorprendilo con un regalo che non si dimentica. Animazione di apertura, packaging personalizzato, messaggio speciale.",
    url: "/compleanno",
    type: "website",
    locale: "it_IT",
  },
};

const config: OccasionConfig = {
  slug: "compleanno",
  h1: "Regalo di compleanno digitale",
  emoji: "🎂",
  paperColor: "#E8C84A",
  ribbonColor: "#D85A5A",
  occasionParam: "birthday",
  subtitle: "Un pacco animato con dentro la tua foto, video o messaggio. Si apre sul telefono con un'animazione emozionante — lei non se lo aspetta.",
  intro: "Dimentica i biglietti anonimi su WhatsApp. Un regalo di compleanno digitale BeGift è un'esperienza: scartarlo è già parte del regalo. Scegli il contenuto (una foto che vi ritrae, il video della sorpresa che stai preparando, una playlist dedicata, un messaggio scritto con il cuore), personalizza il packaging con i colori giusti, mandi il link e il destinatario lo apre quando vuole — anche a mezzanotte precisa per ricevere l'augurio per primo.",
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
  faq: [
    {
      q: "Posso programmare l'apertura a mezzanotte del compleanno?",
      a: "Sì. In fase di creazione scegli la data e l'ora esatta: il regalo rimane 'sigillato' fino al momento giusto e il destinatario vede un countdown.",
    },
    {
      q: "Quanto costa fare un regalo di compleanno su BeGift?",
      a: "BeGift è gratuito per i tuoi primi regali. Nessuna carta di credito richiesta in fase di registrazione.",
    },
    {
      q: "Il destinatario deve installare un'app?",
      a: "No. Il regalo si apre con un semplice link dal browser del telefono. Il destinatario non deve scaricare nulla né registrarsi per riceverlo.",
    },
    {
      q: "Che tipo di contenuti posso mettere dentro?",
      a: "Foto, video (anche YouTube o Vimeo), PDF (es. biglietti concerto o voucher), link a pagine web, messaggi testuali. Puoi mescolare più elementi.",
    },
    {
      q: "Il destinatario può rispondere?",
      a: "Sì. Dopo l'apertura può inviarti una reazione (emoji, messaggio, foto, video) o chattare direttamente nel regalo.",
    },
  ],
};

export default function CompleannoPage() {
  return <OccasionLanding config={config} />;
}
