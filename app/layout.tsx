import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNavWrapper from "@/components/BottomNavWrapper";
import TopBarWrapper from "@/components/TopBarWrapper";
import CookieBanner from "@/components/CookieBanner";
import { I18nProvider } from "@/lib/i18n";
import { GiftReceivedNotification } from "@/components/GiftReceivedNotification";
import Footer from "@/components/Footer";
// IOSInstallBanner rimosso dal layout: info di installazione
// spostata in /settings → sezione Installazione. Il componente
// è ancora in components/ per eventuale riuso futuro.
import { UsernameOnboarding } from "@/components/UsernameOnboarding";
import { PushAutoHeal } from "@/components/PushAutoHeal";
import { baseGraph } from "@/lib/structured-data";

export const viewport: Viewport = {
  themeColor: "#D4537E",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "BeGift — Regali digitali per ogni volta che pensi a qualcuno",
    template: "%s · BeGift",
  },
  description:
    "Web app gratuita per creare regali digitali personalizzati: messaggio, foto, video, PDF, link, esperienze, tutto in un pacco che si apre con animazione. Per le occasioni e anche per un pensiero quotidiano. Nessuna app da scaricare.",
  keywords: [
    "regalo digitale",
    "regali online",
    "idea regalo",
    "regalo a distanza",
    "regalo personalizzato",
    "regalo compleanno",
    "regalo anniversario",
    "biglietto concerto regalo",
    "video messaggio regalo",
  ],
  authors: [{ name: "Luca Galli", url: "https://begift.app" }],
  creator: "Luca Galli",
  publisher: "BeGift",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://begift.app"),
  alternates: {
    canonical: "/",
    languages: {
      "it-IT": "/",
      "en-US": "/",
      "ja-JP": "/",
      "zh-CN": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "/",
    siteName: "BeGift",
    title: "BeGift — Un regalo ogni volta che pensi a qualcuno",
    description:
      "Un messaggio, una canzone, due biglietti per un concerto — regalali in un pacco digitale che si apre con magia. Per un'occasione o per dire \"ti penso, ora\".",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Logo BeGift",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BeGift — Un regalo ogni volta che pensi a qualcuno",
    description:
      "Crea un regalo digitale personalizzato in 60 secondi. Gratis, nessuna app da scaricare.",
    images: ["/icon-512.png"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BeGift",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Lifestyle",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Plausible v2 loader: ogni sito ha uno script ID univoco
  // (es. "pa-C41qcDQ_sOn1XdnmFbmrd"). Non serve piu' data-domain.
  // Lo script ID e' fornito da Plausible nella dashboard del sito.
  const plausibleScriptId = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID;
  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
        <meta name="apple-mobile-web-app-title" content="BeGift"/>
        {/* JSON-LD grafo base (Organization + WebSite + SoftwareApplication).
            Renderizzato in ogni pagina via layout root, e' la base
            semantica letta da Google, Bing e crawler LLM. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(baseGraph) }}
        />
        {/* Plausible Analytics v2 - caricato solo se env var e' settata.
            Cookie-less, GDPR-compliant. Lo stub plausible() inline
            crea una queue per gli eventi custom chiamati prima che lo
            script async sia caricato — quando arriva, flush della queue
            + pageview iniziale. */}
        {plausibleScriptId && (
          <>
            <script
              async
              src={`https://plausible.io/js/${plausibleScriptId}.js`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html:
                  "window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init();",
              }}
            />
          </>
        )}
      </head>
      <body style={{ margin: 0, padding: 0, paddingBottom: 64 }}>
        <I18nProvider>
          <TopBarWrapper/>
          {children}
          <Footer/>
          <BottomNavWrapper/>
          <CookieBanner/>
          <GiftReceivedNotification/>
          {/* IOSInstallBanner disabilitato a livello globale: l'info
              "installa BeGift" è ora disponibile in /settings → sezione
              Installazione. Banner sticky fisso è invasivo sui primi
              visitatori; chi cerca info le trova nelle impostazioni. */}
          <UsernameOnboarding/>
          {/* PushAutoHeal: ghost component che ripara automaticamente
              il drift "permission granted ma 0 device in DB". Una volta
              per sessione browser. */}
          <PushAutoHeal/>
        </I18nProvider>
      </body>
    </html>
  );
}
