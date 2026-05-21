/**
 * /regalo/mail
 *
 * Sotto-route del flusso unificato /regalo. Redirect alla landing
 * pubblica /forward-mail che spiega il flusso "inoltra mail di
 * conferma → BeGift prepara il pacco".
 *
 * Niente codice nuovo: la pagina /forward-mail e' gia' completa
 * (indirizzo da copiare, istruzioni step-by-step, esempi). Qui
 * forniamo solo l'URL coerente sotto /regalo.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function RegaloMailPage() {
  redirect("/forward-mail?from=regalo");
}
