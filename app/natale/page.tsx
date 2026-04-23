import type { Metadata } from "next";
import OccasionLanding, { OccasionConfig } from "@/components/OccasionLanding";

export const metadata: Metadata = {
  title: "Regalo di Natale digitale — BeGift",
  description: "Un regalo di Natale digitale per chi è lontano o in aggiunta a quello fisico. Foto, video, messaggi in un pacco che si apre con animazione.",
  alternates: { canonical: "/natale" },
  openGraph: {
    title: "Regalo di Natale su BeGift 🎄",
    description: "Per i parenti lontani, per chi vuole aggiungere emozione al regalo sotto l'albero. Un pacco digitale che si apre con animazione festiva.",
    url: "/natale",
    type: "website",
    locale: "it_IT",
  },
};

const config: OccasionConfig = {
  slug: "natale",
  h1: "Regalo di Natale digitale",
  emoji: "🎄",
  paperColor: "#3B8C5A",
  ribbonColor: "#D85A5A",
  occasionParam: "christmas",
  subtitle: "Per i parenti lontani, per gli amici che stanno all'estero, o in aggiunta al regalo fisico. Un pacco digitale con animazione natalizia e il suono di campanelli.",
  intro: "Il Natale è la stagione dei regali ma anche della distanza: parenti che non si vedono da un anno, amici emigrati, nonni che abitano lontano. BeGift ti permette di fare loro arrivare l'abbraccio che non puoi dare di persona: una foto della famiglia riunita, un video-messaggio dei nipoti, una lettera, un voucher per un libro o un film da vedere insieme a distanza. Il pacco si apre con un suono di campanelli e un'animazione festiva.",
  steps: [
    {
      title: "Raccogli la famiglia",
      desc: "Foto della cena di Natale, video di auguri dei bambini, messaggi scritti dai parenti — crea un regalo collettivo che riempe la distanza.",
    },
    {
      title: "Packaging natalizio",
      desc: "Verde bosco e nastro rosso con fiocco oro, suono di campanelli. Oppure scegli i colori preferiti del destinatario.",
    },
    {
      title: "Aprilo la sera della Vigilia",
      desc: "Programma il regalo per aprirsi alle 20 della Vigilia o a mezzanotte di Natale. Il destinatario vede un countdown che cresce l'attesa.",
    },
  ],
  faq: [
    {
      q: "Posso mandare lo stesso regalo a più persone?",
      a: "Ogni regalo BeGift è personalizzato per un singolo destinatario (con il suo nome). Se vuoi mandare a più persone conviene creare regali separati, ognuno con dedica dedicata.",
    },
    {
      q: "I nonni anziani riescono a aprirlo?",
      a: "Sì, è un semplice link. Chi riceve tocca il link da WhatsApp/email e il pacco si apre da solo. Nessuna app da scaricare. Se serve aiuto, il regalo si può anche aprire insieme in videochiamata.",
    },
    {
      q: "Posso abbinarlo al regalo fisico sotto l'albero?",
      a: "Sì. Molti lo usano così: dentro il pacco fisico mettono un bigliettino con il QR code del regalo BeGift, da aprire dopo. L'effetto 'doppio regalo' funziona bene.",
    },
    {
      q: "Il regalo scade dopo le feste?",
      a: "No. Resta disponibile al link per sempre, come un ricordo salvato. Utile per riaprire le emozioni il Natale successivo.",
    },
    {
      q: "Si possono mettere i voucher regalo digitali (Amazon, Netflix, ecc.)?",
      a: "Sì. Carica il PDF del voucher o incolla il link al codice. BeGift è pensato anche per confezionare esperienze e voucher in modo più emozionale del solito forward email.",
    },
  ],
};

export default function NatalePage() {
  return <OccasionLanding config={config} />;
}
