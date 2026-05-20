/**
 * /picker
 *
 * Smart Gift Picker: 3-step flow per arrivare a 4 idee regalo curate.
 *
 *   Step 1 — nome destinatario + interessi (tap multi-select)
 *   Step 2 — occasione + budget tier
 *   Step 3 — 4 suggerimenti mix GYG + VivaTicket via algoritmo picker
 *
 * Positioning: BeGift come consulente regalo intelligente, non come
 * marketplace. Il sender non vede un catalogo gigante ma 4 idee
 * pertinenti. Il valore percepito sta nel filtro, non nel volume.
 *
 * Feature flag: NEXT_PUBLIC_FEATURE_EXPERIENCES_SHOP (= /discover).
 * Se disattivo la pagina e' raggiungibile ma vede 4 placeholder e un
 * messaggio "stiamo preparando il catalogo".
 */

import PickerFlowClient from "./PickerFlowClient";

export const dynamic = "force-static";

export default function PickerPage() {
  return <PickerFlowClient />;
}

export const metadata = {
  title: "Trova il regalo giusto · BeGift",
  description:
    "Tre domande veloci e BeGift ti suggerisce quattro idee regalo pertinenti — esperienze ed eventi pensati per chi vuoi sorprendere.",
};
