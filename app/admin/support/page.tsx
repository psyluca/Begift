/**
 * /admin/support
 *
 * Dashboard admin per il Support Concierge AI agent (Agent 3).
 * Mostra:
 *   - Stats riassuntive (sessioni totali, escalation totali nei recenti 1000 turn)
 *   - Lista sessioni recenti con filtro "Solo escalation"
 *   - Click su una sessione → drawer con cronologia completa
 *
 * Auth: client-side via fetchAuthed (pattern uguale a /admin/stats).
 */
import AdminSupportClient from "./AdminSupportClient";

export const dynamic = "force-dynamic";

export default function AdminSupportPage() {
  return <AdminSupportClient />;
}
