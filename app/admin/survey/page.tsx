/**
 * /admin/survey
 *
 * Pagina admin per visualizzare le risposte del sondaggio post-gift.
 * Stats aggregati in cima + tabella risposte + dettaglio modale +
 * export CSV. Gate via ADMIN_EMAILS server-side (gestito da
 * /api/admin/survey).
 */

import AdminSurveyClient from "./AdminSurveyClient";

export const dynamic = "force-dynamic";

export default function AdminSurveyPage() {
  return <AdminSurveyClient />;
}
