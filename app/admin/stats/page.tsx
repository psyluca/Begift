/**
 * /admin/stats
 *
 * Dashboard admin con numeri chiave del prodotto. Accessibile
 * SOLO alle email in ADMIN_EMAILS env var.
 *
 * Se l'utente non è admin mostriamo una pagina diagnostica con
 * email rilevata e stato env var, così Luca può capire al volo
 * se il problema è auth (cookie flaky, email non matchata) o
 * config (env var non settata o non picked-up dal deploy).
 */

import { createSupabaseServer } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import AdminStatsClient from "./AdminStatsClient";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const sb = createSupabaseServer();
  const { data } = await sb.auth.getUser();
  const email = data.user?.email ?? null;
  const isAdmin = isAdminEmail(email);

  if (!isAdmin) {
    const adminEmailsRaw = process.env.ADMIN_EMAILS || "";
    const configured = adminEmailsRaw.trim().length > 0;
    return (
      <main style={{
        minHeight: "100vh",
        background: "#f7f5f2",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "28px 28px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 4px 16px rgba(0,0,0,.05)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: "0 0 8px" }}>
            Area riservata
          </h1>
          <p style={{ color: "#888", fontSize: 14, lineHeight: 1.5, margin: "0 0 20px" }}>
            Questa pagina è visibile solo agli admin di BeGift.
          </p>

          <div style={{
            background: "#fafaf7",
            border: "1px solid #e8e4de",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 12,
            color: "#555",
            textAlign: "left",
            fontFamily: "ui-monospace, monospace",
            marginBottom: 16,
            wordBreak: "break-all",
          }}>
            <div>email server: <strong>{email ?? "(nessuna — non loggato)"}</strong></div>
            <div>ADMIN_EMAILS env: <strong>{configured ? "✓ configurata" : "✗ mancante"}</strong></div>
            <div>is_admin: <strong>{isAdmin ? "true" : "false"}</strong></div>
          </div>

          {!email && (
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 16px" }}>
              Fai login prima: il server non vede una sessione valida.
            </p>
          )}
          {email && !configured && (
            <p style={{ fontSize: 12, color: "#B71C1C", margin: "0 0 16px", lineHeight: 1.5 }}>
              La variabile <code>ADMIN_EMAILS</code> non è configurata sul server. Controlla su Vercel → Environment Variables e fai un redeploy.
            </p>
          )}
          {email && configured && (
            <p style={{ fontSize: 12, color: "#B71C1C", margin: "0 0 16px", lineHeight: 1.5 }}>
              La tua email (<code>{email}</code>) non è nella lista admin. Aggiungila a <code>ADMIN_EMAILS</code> su Vercel e redeploy.
            </p>
          )}

          <a href="/dashboard" style={{
            display: "inline-block",
            background: "#D4537E",
            color: "#fff",
            borderRadius: 40,
            padding: "10px 24px",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}>
            Torna alla dashboard
          </a>
        </div>
      </main>
    );
  }

  return <AdminStatsClient />;
}
