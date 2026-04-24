/**
 * Generatori di JSON-LD (schema.org) per BeGift.
 *
 * Scopo AEO: fornire ai crawler e agli LLM un grafo semantico ricco
 * del sito. Schema.org e' lo standard de facto per i dati strutturati
 * ed e' consumato da Google, Bing, Perplexity, Claude, ChatGPT Search.
 *
 * Come usare: import { baseGraph } from "@/lib/structured-data"
 * e renderizzare in <head> con dangerouslySetInnerHTML su un
 * <script type="application/ld+json">.
 */

const SITE_URL = "https://begift.app";

/**
 * Grafo base del sito (da includere nelle pagine principali, non
 * necessariamente in ogni rotta — basta che sia presente sulle
 * landing che i crawler visitano piu' spesso).
 */
export const baseGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "BeGift",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
        width: 512,
        height: 512,
      },
      sameAs: [
        // TODO Luca: aggiungi qui i profili social quando attivi.
        // Esempio: "https://instagram.com/begiftapp",
      ],
      foundingDate: "2025",
      founder: {
        "@type": "Person",
        name: "Luca Galli",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          email: "info@begift.app",
          contactType: "customer support",
          availableLanguage: ["Italian", "English"],
        },
        {
          "@type": "ContactPoint",
          email: "privacy@begift.app",
          contactType: "privacy",
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: "BeGift — Regali digitali emozionali",
      description:
        "Crea un regalo digitale personalizzato (messaggio, foto, video, PDF, link, esperienze) da condividere con un'animazione di apertura emozionale. Web app gratuita, nessuna installazione per il destinatario.",
      inLanguage: "it-IT",
      publisher: { "@id": `${SITE_URL}#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/create?recipient={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}#app`,
      name: "BeGift",
      operatingSystem: "Web, iOS (PWA), Android (PWA)",
      applicationCategory: "LifestyleApplication",
      applicationSubCategory: "Gift creation",
      url: SITE_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
      },
      creator: { "@id": `${SITE_URL}#organization` },
      inLanguage: ["it-IT", "en-US", "ja-JP", "zh-CN"],
      featureList: [
        "Messaggi testuali, foto, video, PDF e link come contenuto",
        "Packaging personalizzabile con colori, fiocco, animazione, suono",
        "Apertura programmata a data/ora futura",
        "Reazioni del destinatario (emoji, testo, foto, video)",
        "Chat privata tra creatore e destinatario",
        "Notifiche push native",
        "Ricorrenze (compleanni e anniversari) con promemoria automatico",
        "Template pronti per occasioni comuni",
        "Multilingua (IT, EN, JA, ZH)",
        "Installabile come PWA su iOS e Android",
      ],
    },
  ],
};

/**
 * HowTo schema per la creazione di un regalo. Ottimo per featured
 * snippet e per dare agli LLM una descrizione step-by-step del flow.
 */
export const howToCreateGift = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Come creare un regalo digitale con BeGift",
  description:
    "Crea un regalo digitale personalizzato in circa 60 secondi: scegli il destinatario, scegli il contenuto, personalizza il packaging, manda il link.",
  totalTime: "PT1M",
  supply: [],
  tool: [
    {
      "@type": "HowToTool",
      name: "Browser web (iPhone, Android o computer)",
    },
  ],
  step: [
    {
      "@type": "HowToStep",
      name: "Scegli il destinatario",
      text: "Inserisci il nome della persona a cui vuoi regalare. Puoi scegliere una delle occasioni predefinite (compleanno, anniversario, laurea, San Valentino, Natale) oppure \"Per tutti i giorni\" per un pensiero senza occasione specifica.",
      url: `${SITE_URL}/create`,
    },
    {
      "@type": "HowToStep",
      name: "Scegli il contenuto",
      text: "Carica una foto, un video, un PDF (biglietti, prenotazioni, voucher), incolla un link (YouTube, Spotify, esperienze) o scrivi un messaggio. Puoi combinarli.",
      url: `${SITE_URL}/create`,
    },
    {
      "@type": "HowToStep",
      name: "Personalizza il packaging",
      text: "Scegli colore della carta, nastro, fiocco, animazione di apertura e suono di scartatura. Oppure usa uno dei template pronti per l'occasione scelta.",
      url: `${SITE_URL}/create`,
    },
    {
      "@type": "HowToStep",
      name: "Condividi il link",
      text: "Al termine ottieni un link univoco. Lo condividi via WhatsApp, iMessage, Telegram, email o qualsiasi app. Il destinatario apre il link dal browser, vede l'animazione di scartatura e accede al contenuto. Nessuna app da installare.",
      url: `${SITE_URL}/create`,
    },
  ],
};
