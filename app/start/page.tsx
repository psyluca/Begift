/**
 * /start
 *
 * Intent picker guidato: il sender risponde a 2-3 domande e atterra
 * direttamente sul flusso BeGift giusto (discover / create / parser).
 *
 * Obiettivo UX: ridurre cognitive load. Invece di mostrare 3 modalita'
 * tecniche (catalogo, manuale, parser) come scelta esplicita, l'utente
 * dice "a chi stai pensando" + "cosa vorresti regalare" e BeGift sceglie
 * il flow piu' adatto.
 *
 * Step:
 *  1. "A chi stai pensando?" (input nome destinatario)
 *  2. "Cosa vorresti regalare a {nome}?" (5 categorie tap-card)
 *  3. CONDIZIONALE su "Ho già qualcosa pronto" -> picker subtype:
 *     - Una mail di conferma -> redirect al settings parser con istruzioni
 *     - Un file (PDF/foto/video) -> redirect a /create in modalita' upload
 *
 * NON gating dietro feature flag: la home picker e' un "ramo" parallelo
 * alla home attuale. Quando Luca decide di promuoverlo, sostituisce la /.
 */

import StartFlowClient from "./StartFlowClient";

export const dynamic = "force-static";

export default function StartPage() {
  return <StartFlowClient />;
}

export const metadata = {
  title: "A chi stai pensando? · BeGift",
  description:
    "Bastano 2 risposte per trovare il regalo giusto. BeGift ti accompagna passo dopo passo a creare un pacco emozionale per chi ami.",
};
