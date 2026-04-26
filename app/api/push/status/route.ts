/**
 * GET /api/push/status
 *
 * Diagnostica delle subscriptions push dell'utente loggato.
 * Restituisce:
 *  - count: numero di subscription mostrate al client
 *  - subscriptions: lista offuscata
 *  - debug: numeri di confronto (raw_count, alt_count) + eventuale
 *    error string per capire mismatch
 *
 * Auth: Bearer / cookie SSR.
 */

export const dynamic = "force-dynamic";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const admin = createSupabaseAdmin();

  // Resolve userId
  let userId: string | null = null;
  let authPath = "none";
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const { data, error } = await admin.auth.getUser(auth.slice(7));
    if (!error && data.user) {
      userId = data.user.id;
      authPath = "bearer";
    }
  }
  if (!userId) {
    const at = req.cookies.get("sb-access-token")?.value;
    if (at) {
      const { data, error } = await admin.auth.getUser(at);
      if (!error && data.user) {
        userId = data.user.id;
        authPath = "cookie";
      }
    }
  }
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  console.log(`[push/status] resolved userId=${userId} via ${authPath}`);

  // QUERY 1: lista completa con select campi
  const q1 = await admin
    .from("push_subscriptions")
    .select("id, endpoint, created_at, last_used_at, user_agent, user_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  console.log(`[push/status] Q1 (select+eq): rows=${q1.data?.length ?? "null"} error=${q1.error?.message ?? "none"}`);

  // QUERY 2: count exact con stesso filtro
  const q2 = await admin
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  console.log(`[push/status] Q2 (count exact eq): count=${q2.count ?? "null"} error=${q2.error?.message ?? "none"}`);

  // QUERY 3: select * senza filtro user_id, prendi solo prime 5 per ispezionare user_id values
  const q3 = await admin
    .from("push_subscriptions")
    .select("id, user_id")
    .limit(20);
  console.log(`[push/status] Q3 (sample 20): rows=${q3.data?.length ?? "null"} sample_user_ids=${JSON.stringify(q3.data?.map(r => (r as { user_id: string }).user_id?.slice(0, 8)).slice(0, 5))}`);

  // QUERY 4: count totale TUTTE le righe
  const q4 = await admin
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true });
  console.log(`[push/status] Q4 (count total): ${q4.count ?? "null"}`);

  const subs = q1.data ?? [];
  const summary = subs.map((s) => {
    const ep = (s as { endpoint: string }).endpoint;
    let provider = "unknown";
    if (ep.includes("fcm.googleapis.com")) provider = "Google FCM (Chrome/Android)";
    else if (ep.includes("web.push.apple.com")) provider = "Apple Push (iOS/macOS)";
    else if (ep.includes("updates.push.services.mozilla.com")) provider = "Mozilla (Firefox)";
    else if (ep.includes("notify.windows.com")) provider = "Windows Notification Service";
    return {
      id: (s as { id: string }).id,
      provider,
      token_suffix: ep.slice(-12),
      created_at: (s as { created_at: string }).created_at,
      last_used_at: (s as { last_used_at: string | null }).last_used_at,
      user_agent: (s as { user_agent: string | null }).user_agent ?? null,
      // Esponiamo user_id per ispezione (offuscato).
      stored_user_id_prefix: (s as { user_id?: string }).user_id?.slice(0, 8) ?? null,
    };
  });

  return NextResponse.json({
    count: summary.length,
    subscriptions: summary,
    debug: {
      resolved_user_id: userId,
      auth_path: authPath,
      q1_rows: q1.data?.length ?? 0,
      q1_error: q1.error?.message ?? null,
      q2_count_eq: q2.count ?? 0,
      q2_error: q2.error?.message ?? null,
      q3_sample_user_ids: q3.data?.map((r) => (r as { user_id: string }).user_id?.slice(0, 8) ?? "null").slice(0, 8) ?? [],
      q4_total_in_db: q4.count ?? 0,
    },
  });
}
