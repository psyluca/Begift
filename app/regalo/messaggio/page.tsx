/**
 * /regalo/messaggio
 *
 * Sotto-route del flusso unificato /regalo. Redirect al /create
 * esistente con mode=text per atterrare sul tab "scrivi un messaggio".
 *
 * Stessa filosofia di /regalo/file: l'URL unificato sotto /regalo da'
 * coerenza al mental model dell'utente, il codice riusa CreateGiftClient.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function RegaloMessaggioPage() {
  redirect("/create?mode=text&from=regalo");
}
