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

export const viewport: Viewport = {
  themeColor: "#D4537E",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "BeGift — Regali digitali emozionali",
  description: "Crea un regalo digitale con un'esperienza di apertura indimenticabile.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://begift.app"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BeGift",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
        <meta name="apple-mobile-web-app-title" content="BeGift"/>
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
        </I18nProvider>
      </body>
    </html>
  );
}
