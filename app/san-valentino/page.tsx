import type { Metadata } from "next";
import OccasionLanding, { OccasionConfig } from "@/components/OccasionLanding";

export const metadata: Metadata = {
  title: "Regalo di San Valentino digitale — BeGift",
  description: "Un regalo di San Valentino che si apre con animazione e contiene la tua lettera, una foto, una playlist. Niente biglietti anonimi.",
  alternates: { canonical: "/san-valentino" },
  openGraph: {
    title: "Regalo di San Valentino su BeGift ❤️",
    description: "Non regalare un biglietto impersonale. Un pacco digitale personalizzato con i vostri ricordi si apre con un'emozione.",
    url: "/san-valentino",
    type: "website",
    locale: "it_IT",
  },
};

const config: OccasionConfig = {
  slug: "san-valentino",
  h1: "Regalo di San Valentino digitale",
  emoji: "❤️",
  paperColor: "#D85A5A",
  ribbonColor: "#E8A0BC",
  occasionParam: "valentine",
  subtitle: "Un pacco rosso e rosa che si apre rivelando la tua lettera, una vostra foto, una playlist dedicata. Le parole e l'anima, non un oggetto.",
  intro: "San Valentino è la festa delle parole dette male: cioccolatini generici, fiori rapidi, biglietti pre-stampati. Con BeGift fai un regalo digitale che prende tempo ma nessun soldo: una lettera scritta con l'AI che ti aiuta a trovare le parole giuste, una foto del vostro momento preferito, un link alla vostra canzone, una playlist che avete ascoltato in auto. Tutto in un pacco che si apre sul suo telefono con il suono di un carillon.",
  steps: [
    {
      title: "Scegli il contenuto del cuore",
      desc: "Una foto scattata da te, un video-messaggio, la playlist di Spotify dei vostri ricordi, o una lettera — possiamo aiutarti a scriverla con l'AI.",
    },
    {
      title: "Packaging romantico",
      desc: "Rosso rubino e nastro rosa, fiocco a rosetta. Sfoglia anche il tema Kawaii per un tocco dolce e giocoso.",
    },
    {
      title: "Apertura programmata al 14 febbraio",
      desc: "Preparalo con qualche giorno di anticipo e programmalo per aprirsi a mezzanotte del 14. Lei vede un countdown e l'emozione cresce.",
    },
  ],
  faq: [
    {
      q: "Non so scrivere lettere romantiche, BeGift mi aiuta?",
      a: "Sì. C'è un assistente AI che, partendo dal suo nome, dal tono (affettuoso, scherzoso, poetico) e da una breve descrizione di chi è, ti propone 3 bozze di messaggio. Puoi prenderle, modificarle o ignorarle.",
    },
    {
      q: "Quanto costa un regalo di San Valentino con BeGift?",
      a: "BeGift è gratis per i primi regali che crei. Non serve carta di credito né abbonamento per iniziare.",
    },
    {
      q: "Posso inviarlo insieme a un regalo fisico?",
      a: "Certo. Molti lo usano come 'accompagnamento': dai il regalo fisico e dentro ci infili un biglietto con il QR code del link BeGift, da aprire dopo.",
    },
    {
      q: "E se preferisco farlo sorprendere via WhatsApp invece?",
      a: "Puoi condividere il link direttamente nella chat WhatsApp — il link mostra un'anteprima con cuore 🎁 e nome del destinatario. Lui/lei tocca e vive l'apertura.",
    },
    {
      q: "Il destinatario può rispondere?",
      a: "Sì. Dopo l'apertura può mandarti una reazione (video, foto, testo) direttamente nel regalo, oppure chattare con te.",
    },
  ],
};

export default function SanValentinoPage() {
  return <OccasionLanding config={config} />;
}
