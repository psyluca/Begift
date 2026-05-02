import type { Metadata } from "next";
import FestaMammaClient from "./FestaMammaClient";

export const metadata: Metadata = {
  title: "Regalo Festa della Mamma — la Lettera che cresce | BeGift",
  description:
    "Un regalo digitale per la Festa della Mamma diverso da una cartolina: rispondi a 5 domande emotive, BeGift le confeziona in una pagina con foto, dedica e canzone vostra. Pronto in 3 minuti, gratis.",
  alternates: { canonical: "/festa-mamma" },
  openGraph: {
    title: "Regalo Festa della Mamma — la Lettera che cresce",
    description:
      "5 domande emotive, una foto, una canzone. BeGift le confeziona in un regalo che mamma aprirà l'11 maggio. Gratis.",
    url: "/festa-mamma",
    type: "website",
    locale: "it_IT",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "BeGift Festa della Mamma",
      },
    ],
  },
};

// JSON-LD: WebPage + HowTo per featured snippet su "regalo festa mamma".
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://begift.app/festa-mamma#webpage",
      url: "https://begift.app/festa-mamma",
      name: "Regalo Festa della Mamma — BeGift",
      inLanguage: "it-IT",
      description:
        "Crea un regalo digitale emozionale per la Festa della Mamma in 3 minuti. Foto, dedica, canzone e voucher opzionale, confezionati in una lettera animata che mamma apre dal browser.",
    },
    {
      "@type": "HowTo",
      name: "Come creare un regalo per la Festa della Mamma con BeGift",
      totalTime: "PT3M",
      step: [
        { "@type": "HowToStep", name: "Una parola per descrivere mamma", text: "Scegli una sola parola — forte, dolce, ironica, paziente. Diventa il titolo del regalo aperto." },
        { "@type": "HowToStep", name: "Il tuo ricordo più nitido con lei", text: "Scrivi 2-3 righe su un ricordo che hai. Anche solo un odore, una frase, un pomeriggio." },
        { "@type": "HowToStep", name: "Una foto vostra", text: "Carica una foto che ami. Diventa una polaroid leggermente ruotata nel regalo aperto." },
        { "@type": "HowToStep", name: "Cosa ti ha insegnato senza dirtelo", text: "Una frase che racchiude qualcosa che hai imparato da lei in modo silenzioso." },
        { "@type": "HowToStep", name: "Una canzone che vi unisce", text: "Incolla un link Spotify o YouTube della vostra canzone." },
        { "@type": "HowToStep", name: "Voucher opzionale", text: "Vuoi aggiungere un buono per cena, spa o un libro? Carica PDF o link." },
      ],
    },
  ],
};

export default function FestaMammaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FestaMammaClient />
    </>
  );
}
