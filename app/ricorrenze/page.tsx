/**
 * /ricorrenze
 *
 * Pagina top-level (raggiungibile dalla bottom nav) per la gestione
 * delle ricorrenze dell'utente. Promuove la feature dal sotto-livello
 * /settings/reminders perche' e' centrale per la retention: senza
 * promemoria, l'app si usa 1-2 volte all'anno; con i promemoria,
 * l'utente la apre ogni mese.
 *
 * Differenze rispetto a /settings/reminders (che resta come redirect):
 *  - Vista RAGGRUPPATA per tipo di occasione (compleanni / anniversari / etc)
 *  - "Prossima" in evidenza con countdown
 *  - Quick-add suggestions per stato vuoto (mamma, papa', partner...)
 *  - Stesso CRUD via /api/reminders (nessun cambio backend)
 */

import RicorrenzeClient from "./RicorrenzeClient";

export const dynamic = "force-dynamic";

export default function RicorrenzePage() {
  return <RicorrenzeClient />;
}
