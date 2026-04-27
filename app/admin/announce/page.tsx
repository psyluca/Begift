/**
 * /admin/announce
 *
 * Pagina admin per lanciare campagne email "one-shot". Per ora solo
 * la campagna festa_mamma_2026 e' configurata; quando ne serviranno
 * altre, si aggiungera' una scelta in cima.
 *
 * Flusso pensato:
 *  1. Click "Anteprima destinatari" → dry-run: mostra count e sample
 *  2. Verifica numeri e prima email del sample
 *  3. Click "Invia per davvero" → conferma JS → POST con confirm:true
 *  4. Mostra report con sent / skipped / errors
 *
 * Auth: server NON gate; la API e' gated da ADMIN_EMAILS. Se non sei
 * admin, la pagina si carica ma le chiamate API ritornano 403 e il
 * client mostra il messaggio.
 */

import AdminAnnounceClient from "./AdminAnnounceClient";

export const dynamic = "force-dynamic";

export default function AdminAnnouncePage() {
  return <AdminAnnounceClient />;
}
