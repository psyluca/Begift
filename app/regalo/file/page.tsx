/**
 * /regalo/file
 *
 * Sotto-route del flusso unificato /regalo. Redirect server-side al
 * /create esistente con mode=upload, cosi' il sender atterra
 * direttamente sul tab "carica file" del CreateGiftClient.
 *
 * Mantenere la URL /regalo/file ha valore SEO + di mental model
 * coerente con gli altri 3 path di /regalo. Niente codice duplicato:
 * il flusso /create e' gia' validato e ricco di feature.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function RegaloFilePage() {
  redirect("/create?mode=upload&from=regalo");
}
