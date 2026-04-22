/**
 * /settings — Hub unificato per tutte le impostazioni utente.
 *
 * Sezioni:
 *   1. Profilo (handle, email, link a /settings/profile per cambiare)
 *   2. Notifiche (3 toggle + status permesso browser)
 *   3. Ricorrenze (lista + aggiungi)
 *   4. Lingua (selettore inline)
 *   5. Installazione (se non standalone su iOS)
 *   6. Legale (privacy + termini)
 *   7. Esci
 *
 * Nessun gate server-side: il client carica con fetchAuthed e
 * gestisce 401 mostrando "Accedi per vedere le impostazioni".
 */

import SettingsHubClient from "./SettingsHubClient";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return <SettingsHubClient />;
}
