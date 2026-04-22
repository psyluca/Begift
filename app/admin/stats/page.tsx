/**
 * /admin/stats
 *
 * Dashboard admin. Il gate è delegato al client (AdminStatsClient
 * chiama /api/admin/stats con Bearer, gestisce 403 → diagnostica).
 * Server qui non fa check auth perché il cookie-based SSR auth
 * è flaky — il client con Bearer da localStorage è più affidabile.
 */

import AdminStatsClient from "./AdminStatsClient";

export const dynamic = "force-dynamic";

export default function AdminStatsPage() {
  return <AdminStatsClient />;
}
