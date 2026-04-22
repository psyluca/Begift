/**
 * /admin/stats
 *
 * Dashboard admin con numeri chiave del prodotto. Accessibile
 * SOLO alle email in ADMIN_EMAILS env var (default: nessuno).
 * Gli altri utenti ricevono 404 (nascosto, non 403 — rende l'URL
 * non scopribile).
 */

import { createSupabaseServer } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { notFound } from "next/navigation";
import AdminStatsClient from "./AdminStatsClient";

export const dynamic = "force-dynamic"; // sempre server-rendered (no cache)

export default async function AdminStatsPage() {
  const sb = createSupabaseServer();
  const { data } = await sb.auth.getUser();
  if (!isAdminEmail(data.user?.email)) notFound();
  return <AdminStatsClient />;
}
