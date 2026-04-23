/**
 * /admin/reports — moderazione segnalazioni (admin only)
 *
 * Auth gate lato client tramite fetchAuthed al /api/admin/reports.
 * Se 403, redirect a diagnostic page.
 */

import AdminReportsClient from "./AdminReportsClient";

export const dynamic = "force-dynamic";

export default function AdminReportsPage() {
  return <AdminReportsClient />;
}
