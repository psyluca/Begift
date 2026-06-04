import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config per BeGift app nativa.
 *
 * Strategia: "Hosted Web App"
 * ──────────────────────────────────────────────────────────────
 * L'app Capacitor punta al sito live begift.app come server.
 * NON facciamo bundle statico locale perché BeGift usa Next.js
 * App Router con SSR, dynamic routes, API routes — incompatibili
 * con `output: export` statico.
 *
 * Vantaggi di questo approccio:
 *  ✓ Update istantanei (cambio sul server → app aggiornata immediatamente)
 *  ✓ Codebase unico (la stessa Next.js serve web e app)
 *  ✓ Niente refactor dei componenti esistenti
 *  ✓ SEO inalterato (web sempre indicizzabile)
 *
 * Trade-off: l'app non funziona offline (richiede connessione).
 * Accettabile per BeGift dato che il prodotto è online-by-design
 * (link da condividere, contenuti da caricare, etc.).
 *
 * Per Apple Rule 4.2 (no wrapping puri), aggiungeremo plugin
 * device-native:
 *  - @capacitor/camera (foto picker nativo)
 *  - @capacitor/push-notifications (APNs)
 *  - @capacitor/share (share sheet iOS nativo)
 *  - @capacitor/app (deeplinks)
 * Questi plugin offrono capability che il browser web non ha,
 * giustificando l'app native sotto Rule 4.2.
 */
const config: CapacitorConfig = {
  appId: 'app.begift.mobile',
  appName: 'BeGift',
  // webDir è obbligatorio per Capacitor anche se usiamo server remoto.
  // Punta a public/ come fallback minimal.
  webDir: 'public',
  server: {
    // URL produzione: app punta sempre a begift.app.
    // Per test in development con server locale: settare CAPACITOR_DEV_URL.
    url: process.env.CAPACITOR_DEV_URL || 'https://begift.app',
    // Niente HTTP cleartext: solo HTTPS (importante per App Store)
    cleartext: false,
    // androidScheme: garantisce che i deeplink http(s):// si aprano in app
    androidScheme: 'https',
    iosScheme: 'https',
    // Domini fidati per navigazione interna (deeplinks).
    // Senza questa lista, click su link esterni aprono Safari/Chrome
    // invece di restare in-app.
    allowNavigation: [
      'begift.app',
      '*.begift.app',
      'eu.i.posthog.com',
      'eu-assets.i.posthog.com',
      'plausible.io',
    ],
  },
  ios: {
    // contentInset 'always' = WebView rispetta safe area iPhone
    // (notch, dynamic island, home indicator). Senza, il contenuto
    // andrebbe sotto la status bar.
    contentInset: 'always',
    // Permettiamo zoom (accessibility, anziani che ingrandiscono testo).
    // Apple Review preferisce app accessibili.
    limitsNavigationsToAppBoundDomains: false,
    // Background color visibile durante il caricamento (prima del rendering web).
    backgroundColor: '#FFF5F8', // cream BeGift, coerente con brand
  },
  android: {
    // Niente HTTP cleartext, no mixed content
    allowMixedContent: false,
    // Background color (vedi sopra)
    backgroundColor: '#FFF5F8',
    // Captures back button: gestiamo il routing in-app invece di chiudere app
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      // Splash screen mostrata fino al caricamento di begift.app.
      // 2.5 secondi è il sweet spot: abbastanza per il brand awareness,
      // non abbastanza per essere fastidioso.
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#D4537E', // rosa BeGift
      androidScaleType: 'CENTER_CROP',
      showSpinner: false, // pulito, niente spinner generico
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      // Presentation options quando una push arriva mentre l'app è in foreground:
      // mostra l'alert + badge + suono. Senza, le push in foreground sarebbero
      // silenziose (utente non le vede).
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      // Status bar style: 'dark' = testo nero su sfondo chiaro (default iOS).
      // Coerente col cream chiaro della home BeGift.
      style: 'dark',
      backgroundColor: '#FFF5F8',
    },
  },
};

export default config;
