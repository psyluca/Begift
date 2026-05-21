/**
 * /regalo/contenuto
 *
 * Sotto-route canonical del flusso unificato /regalo per il path
 * "Qualcosa di tuo" (file + messaggio accorpati il 2026-05-21).
 *
 * Redirect a /create (l'esperienza esistente per upload file o
 * scrittura messaggio, gestita dal CreateGiftClient).
 *
 * Le rotte /regalo/file e /regalo/messaggio restano per back-compat
 * dei link gia' condivisi: redirezionano direttamente a /create con
 * i loro vecchi mode hint.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function RegaloContenutoPage() {
  redirect("/create?from=regalo");
}
