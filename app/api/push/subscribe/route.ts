/**
 * POST /api/push/subscribe
 *
 * Registra una Web Push subscription per l'utente corrente.
 * Il client chiama questo endpoint dopo che:
 *   1. L'utente ha dato il permesso Notification.permission === 'granted'
 *   2. Il browser ha generato una subscription via
 *      registration.pushManager.subscribe({ userVisibleOnly: true,
 *      applicationServerKey: VAPID_PUBLIC_KEY })
 *
 * Il body è lo shape standard PushSubscription.toJSON():
 *   { endpoint, keys: { p256dh, auth } }
 *
 * Idempotente grazie al unique constraint su `endpoint`: stesso
 * device/permesso che si ri-sottoscrive → la riga esistente viene
 * aggiornata invece di duplicare (ON CONFLICT DO UPDATE).
 *
 * Autenticazione: Bearer token (dal localStorage client) O cookie
 * sessione Supabase. Rifiuta anonymous.
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Prova autenticazione Bearer token prima, poi cookie
  let userId: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) userId = data.user.id;
  }

  if (!userId) {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    if (data.user) userId = data.user.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const endpoint: string | undefined = body?.endpoint;
  const p256dh: string | undefined = body?.keys?.p256dh;
  const auth: string | undefined = body?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "Missing endpoint or keys" },
      { status: 400 }
    );
  }

  const userAgent = req.headers.get("user-agent") || null;

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

  if (error) {
    console.error("[push/subscribe] upsert error", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
