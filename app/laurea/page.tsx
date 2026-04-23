import type { Metadata } from "next";
import OccasionLanding, { OccasionConfig } from "@/components/OccasionLanding";

export const metadata: Metadata = {
  title: "Regalo di laurea digitale — BeGift",
  description: "Un regalo di laurea indimenticabile: foto del percorso, video di auguri collettivi, messaggi da amici lontani in un pacco animato.",
  alternates: { canonical: "/laurea" },
  openGraph: {
    title: "Regalo di laurea su BeGift 🎓",
    description: "Congratulazioni con un regalo digitale che apre ricordi, video e parole di chi ti vuole bene.",
    url: "/laurea",
    type: "website",
    locale: "it_IT",
  },
};

const config: OccasionConfig = {
  slug: "laurea",
  h1: "Regalo di laurea digitale",
  emoji: "🎓",
  paperColor: "#1A3A6B",
  ribbonColor: "#E8C84A",
  occasionParam: "graduation",
  subtitle: "Celebra la laurea con un regalo che raccoglie messaggi di amici e parenti. Un pacco digitale che si apre con emozione.",
  intro: "La laurea è uno di quei momenti in cui vorresti che tutte le persone importanti fossero lì. Con BeGift puoi raccogliere video di auguri da parenti lontani, foto del percorso universitario, un riassunto dei traguardi, link al diploma digitale, e metterli tutti in un pacco che il neo-dottore apre al termine della discussione. È un regalo che vale più di un oggetto: è la consapevolezza di essere circondato di affetto.",
  steps: [
    {
      title: "Raccogli i contributi",
      desc: "Chiedi a genitori, amici, compagni di corso di mandarti un video di auguri. Aggiungi una foto del percorso o un collage dei momenti migliori.",
    },
    {
      title: "Scegli colori istituzionali",
      desc: "Blu navy e nastro oro richiamano la toga accademica. Oppure personalizza coi colori della sua facoltà.",
    },
    {
      title: "Consegna al momento giusto",
      desc: "Invia il link via WhatsApp dopo la proclamazione, oppure programmalo per aprirsi nel momento esatto in cui esce dall'aula.",
    },
  ],
  faq: [
    {
      q: "Posso caricare il video del rettore che legge la proclamazione?",
      a: "Sì. Puoi caricare file video direttamente oppure incollare un link YouTube/Vimeo. Il video si vede dentro il regalo con player dedicato.",
    },
    {
      q: "C'è un limite di durata per i video?",
      a: "BeGift supporta video fino a qualche minuto (limite tecnico per il caricamento). Per contributi più lunghi, conviene caricare su YouTube e incollare il link.",
    },
    {
      q: "Posso fare un regalo collettivo, raccogliendo i contributi di tante persone?",
      a: "Sì. Puoi raccogliere singoli video/foto e combinarli nel regalo, oppure metterli in una playlist YouTube non in elenco e incollare quel link.",
    },
    {
      q: "Il regalo si può condividere dopo su Instagram/TikTok?",
      a: "Sì, il link è condivisibile ovunque. Per generare una clip della scartata (utile per Reel) sta per arrivare la funzione 'Condividi video'.",
    },
  ],
};

export default function LaureaPage() {
  return <OccasionLanding config={config} />;
}
