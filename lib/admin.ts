/**
 * Helper per riconoscere utenti "admin" (solo Luca e qualsiasi
 * altra email elencata in ADMIN_EMAILS). Usato per gate la pagina
 * /admin/stats e l'endpoint /api/admin/stats.
 *
 * L'env var ADMIN_EMAILS è una lista di email separate da virgola:
 *   ADMIN_EMAILS=psyluca@gmail.com,altro@example.com
 * Senza env var, l'admin è disabilitato (safer default — nessuno
 * può vedere le stats se non configurato esplicitamente).
 *
 * Match case-insensitive dell'email, trim dei whitespace.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS || "";
  if (!raw.trim()) return false;
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
