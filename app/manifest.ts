import type { MetadataRoute } from "next";

/**
 * PWA manifest. Servito a /manifest.webmanifest da Next 14.
 *
 * Note importanti sulle icone (fix 2026-04-28):
 *
 * Esistono DUE set di icone con purpose differenti:
 *
 *  - icon-{192,512}.png con purpose "any":
 *      Per iOS / Apple home screen e per launcher Android che NON
 *      applicano maschera adaptive. L'icona viene mostrata come quadrato
 *      pieno, senza ritaglio. Layout originale BeGift (regalo nero + bow
 *      rosa + scritta "BeGift" sotto) è ottimizzato per questo modo.
 *
 *  - icon-maskable-{192,512}.png con purpose "maskable":
 *      Per Android adaptive icon (launcher moderni, da Android 8+).
 *      Il launcher applica una maschera (cerchio, squircle, ecc.) e
 *      taglia tutto fuori dalla "safe zone" centrale (~80% dell'area).
 *      Senza padding adeguato il contenuto sborda — la versione "any"
 *      con scritta che arriva ai bordi veniva tagliata.
 *      Soluzione: stesso logo ridotto al 62% del lato, su sfondo bianco
 *      uniforme. Il contenuto resta dentro la safe zone qualsiasi
 *      maschera il launcher applichi (cerchio, squircle, square round).
 *
 * Bug riportato da Luca 2026-04-28: icona Android tonda con bordi
 * dell'immagine tagliati. Causa: tutte le icone dichiarate "maskable"
 * ma senza padding di safe zone. Fix in questo commit.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BeGift",
    short_name: "BeGift",
    description: "Regali digitali emozionali",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f2",
    theme_color: "#D4537E",
    orientation: "portrait",
    icons: [
      // "any": iOS, fallback Android non-adaptive, link preview, OG
      { src: "/icon-192.png",          sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png",          sizes: "512x512", type: "image/png", purpose: "any" },
      // "maskable": Android adaptive (cerchio/squircle launcher)
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
