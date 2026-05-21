/**
 * /admin/catalog
 *
 * Dashboard amministrativa per il sync del catalogo GetYourGuide.
 * Mostra:
 *   - Conteggi catalogo per source (manual vs imported_*)
 *   - Ultime 30 sync run con status + stats
 *   - Bottone "Sync ora" che triggera /api/admin/catalog/runs POST
 *
 * Gate auth: delegato al client (chiama /api/admin/catalog/runs con
 * Bearer da localStorage, gestisce 403 con UI dedicata). Stesso pattern
 * di /admin/stats per consistenza.
 */

import AdminCatalogClient from "./AdminCatalogClient";

export const dynamic = "force-dynamic";

export default function AdminCatalogPage() {
  return <AdminCatalogClient />;
}
