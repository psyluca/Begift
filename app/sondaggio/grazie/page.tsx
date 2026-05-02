/**
 * /sondaggio/grazie
 *
 * Pagina di conferma dopo il submit del sondaggio post-gift.
 * Tono: ringraziamento personale + invito leggero a tornare in app
 * (non spinto, l'utente ha appena fatto un favore, niente CTA forte).
 */

import type { Metadata } from "next";
import GrazieClient from "./GrazieClient";

export const metadata: Metadata = {
  title: "Thank you — BeGift",
  robots: { index: false, follow: false },
};

export default function SondaggioGraziePage() {
  return <GrazieClient />;
}
