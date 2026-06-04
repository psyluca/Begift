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
import SupportConcierge from "@/components/SupportConcierge";
import { ToastProvider } from "@/components/ToastProvider";
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
  verification: {
    google: "auQIQhkfwZJ2ZOCrZJl-TAQmBU5vOT7Lwd405_RU0zQ",
  },
  category: "Lifestyle",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Plausible v2 loader (legacy, fino al 22 giugno 2026): script ID
  // fornito da Plausible nella dashboard del sito.
  const plausibleScriptId = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID;

  // PostHog Cloud EU loader (target dal 2026-06-04). Key fornita da
  // PostHog (settings → Project API key). Host EU per GDPR.
  // Per i prossimi 5-7 giorni entrambi i tracker sono attivi
  // (dual-write) per validare i numeri prima di disattivare Plausible.
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

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
        {/* Plausible Analytics v2 — caricato solo se env var e' settata.
            Cookie-less, GDPR-compliant. Da rimuovere dopo il cutover a
            PostHog (target: 12-15 giugno 2026). */}
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
        {/* PostHog Cloud EU — analytics di destinazione. Free tier 1M
            events/mese, host Frankfurt (GDPR). Person profiles disabilitati
            di default → niente cookie-banner aggiuntivo richiesto. */}
        {posthogKey && (
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init("${posthogKey}",{api_host:"${posthogHost}",person_profiles:"identified_only",capture_pageview:true,capture_pageleave:true,autocapture:false});`,
            }}
          />
        )}
      </head>
      <body style={{ margin: 0, padding: 0, paddingBottom: 64 }}>
        <I18nProvider>
          <ToastProvider>
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
            {/* SupportConcierge: FAB chat di aiuto AI. Self-gating via
                feature flag NEXT_PUBLIC_FEATURE_SUPPORT_CONCIERGE: se
                false ritorna null senza render del bottone. */}
            <SupportConcierge/>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
