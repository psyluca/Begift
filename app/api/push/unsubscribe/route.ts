/**
 * POST /api/push/unsubscribe
 *
 * Rimuove una Web Push subscription. Invocato quando:
 *  - L'utente disabilita manualmente le notifiche dal browser
 *  - L'utente fa logout (opzionale — le push non arriverebbero
 *    comunque se l'utente non è loggato lato client)
 *  - Il service worker rileva endpoint scaduto e vuole ripulire
 *
 * Body: { endpoint: string }
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

  const { endpoint } = await req.json();
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  await admin
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);

  return NextResponse.json({ ok: true });
}
