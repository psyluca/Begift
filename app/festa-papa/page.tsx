import type { Metadata } from "next";
import FestaPapaClient from "./FestaPapaClient";

export const metadata: Metadata = {
  title: "Regalo Festa del Papà — la Lettera che cresce | BeGift",
  description:
    "Un regalo digitale per la Festa del Papà che non sia il solito biglietto: rispondi a 5 domande emotive, BeGift le confeziona in una pagina con foto, dedica e canzone vostra. Pronto in 3 minuti, gratis.",
  alternates: { canonical: "/festa-papa" },
  openGraph: {
    title: "Regalo Festa del Papà — la Lettera che cresce",
    description:
      "5 domande emotive, una foto, una canzone. BeGift le confeziona in un regalo che papà aprirà il 19 giugno. Gratis.",
    url: "/festa-papa",
    type: "website",
    locale: "it_IT",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "BeGift Festa del Papà" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://begift.app/festa-papa#webpage",
      url: "https://begift.app/festa-papa",
      name: "Regalo Festa del Papà — BeGift",
      inLanguage: "it-IT",
      description:
        "Crea un regalo digitale emozionale per la Festa del Papà in 3 minuti. Foto, dedica, canzone e voucher opzionale, confezionati in una lettera animata che papà apre dal browser.",
    },
    {
      "@type": "HowTo",
      name: "Come creare un regalo per la Festa del Papà con BeGift",
      totalTime: "PT3M",
      step: [
        { "@type": "HowToStep", name: "Una parola per descrivere papà", text: "Roccia, riferimento, silenzioso, capitano. Una sola. Diventa il titolo del regalo aperto." },
        { "@type": "HowToStep", name: "Il tuo ricordo più nitido con lui", text: "Anche solo un gesto, un viaggio in macchina, una mattina silenziosa." },
        { "@type": "HowToStep", name: "Una foto vostra", text: "Diventa una polaroid leggermente ruotata nel regalo aperto." },
        { "@type": "HowToStep", name: "Cosa ti ha insegnato senza dirtelo", text: "Una frase che racchiude un'eredità silenziosa." },
        { "@type": "HowToStep", name: "Una canzone che vi unisce", text: "Incolla un link Spotify o YouTube della vostra canzone." },
        { "@type": "HowToStep", name: "Voucher opzionale", text: "Vuoi aggiungere un buono per cena, vino o un libro? Carica PDF o link." },
      ],
    },
  ],
};

export default function FestaPapaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FestaPapaClient />
    </>
  );
}
