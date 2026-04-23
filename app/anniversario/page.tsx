import type { Metadata } from "next";
import OccasionLanding, { OccasionConfig } from "@/components/OccasionLanding";

export const metadata: Metadata = {
  title: "Regalo per anniversario digitale — BeGift",
  description: "Crea un regalo digitale d'anniversario che lascia senza parole. Foto, video, messaggi in un pacco animato personalizzato.",
  alternates: { canonical: "/anniversario" },
  openGraph: {
    title: "Regalo d'anniversario su BeGift 💍",
    description: "Per celebrare il vostro tempo insieme. Un pacco digitale che si apre con animazione e contiene i vostri ricordi.",
    url: "/anniversario",
    type: "website",
    locale: "it_IT",
  },
};

const config: OccasionConfig = {
  slug: "anniversario",
  h1: "Regalo per anniversario digitale",
  emoji: "💍",
  paperColor: "#E8A0A0",
  ribbonColor: "#E8C84A",
  occasionParam: "anniversary",
  subtitle: "Celebra il vostro tempo insieme con un regalo che racchiude i vostri ricordi. Si apre con un'animazione e il suo suono preferito.",
  intro: "Un anniversario merita qualcosa di più di un messaggio di auguri. Con BeGift puoi preparare un regalo digitale che contiene la foto del primo viaggio insieme, il video della proposta, la canzone del primo ballo, una lettera scritta pensando a cosa siete diventati in questi anni. Il destinatario lo apre con un'animazione curata e un suono evocativo — è un'esperienza, non un semplice messaggio.",
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
  faq: [
    {
      q: "Posso programmare il regalo per il giorno esatto?",
      a: "Sì. BeGift ti permette di schedulare l'apertura a una data e ora precise: il regalo rimane 'sigillato' fino al momento giusto.",
    },
    {
      q: "Il regalo scade dopo un tempo?",
      a: "No. Una volta aperto, il regalo resta disponibile al link per consultarlo in futuro, come un ricordo salvato in un cassetto digitale.",
    },
    {
      q: "Posso mettere una canzone intera?",
      a: "Sì, caricando il link YouTube o Vimeo. La canzone parte automaticamente all'apertura (puoi anche caricare un MP3 per un suono di apertura più breve).",
    },
    {
      q: "Se il regalo è a sorpresa, come faccio a non rovinare l'effetto?",
      a: "Il link non rivela il contenuto finché non viene toccato. Puoi anche programmare l'apertura: finché non arriva la data, il destinatario vede solo un countdown.",
    },
    {
      q: "Posso aggiungere una dedica che appare prima dell'apertura?",
      a: "Sì, c'è un messaggio opzionale che il destinatario vede mentre carica il regalo — perfetto per un 'Buon anniversario, amore mio'.",
    },
  ],
};

export default function AnniversarioPage() {
  return <OccasionLanding config={config} />;
}
