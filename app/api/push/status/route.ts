/**
 * GET /api/push/status
 *
 * Restituisce informazioni diagnostiche sulle subscriptions push
 * dell'utente loggato. Usato dalla pagina /settings/notifiche-test
 * per mostrare:
 *  - quanti device sono registrati
 *  - lista (offuscata) degli endpoint
 *  - last_used_at di ognuno
 *
 * Auth: Bearer / cookie SSR.
 */

export const dynamic = "force-dynamic";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const admin = createSupabaseAdmin();

  let userId: string | null = null;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const { data } = await admin.auth.getUser(auth.slice(7));
    userId = data.user?.id ?? null;
  }
  if (!userId) {
    const at = req.cookies.get("sb-access-token")?.value;
    if (at) {
      const { data } = await admin.auth.getUser(at);
      userId = data.user?.id ?? null;
    }
  }
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, created_at, last_used_at, user_agent")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[push/status] error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  // Offusca l'endpoint per privacy: mostra solo il provider (FCM/APNs/Mozilla)
  // e gli ultimi 8 char del token come identificatore univoco.
  const summary = (subs ?? []).map((s) => {
    const ep = (s as { endpoint: string }).endpoint;
    let provider = "unknown";
    if (ep.includes("fcm.googleapis.com")) provider = "Google FCM (Chrome/Android)";
    else if (ep.includes("web.push.apple.com")) provider = "Apple Push (iOS/macOS)";
    else if (ep.includes("updates.push.services.mozilla.com")) provider = "Mozilla (Firefox)";
    else if (ep.includes("notify.windows.com")) provider = "Windows Notification Service";
    const tokenSuffix = ep.slice(-12);
    return {
      id: (s as { id: string }).id,
      provider,
      token_suffix: tokenSuffix,
      created_at: (s as { created_at: string }).created_at,
      last_used_at: (s as { last_used_at: string | null }).last_used_at,
      user_agent: (s as { user_agent: string | null }).user_agent ?? null,
    };
  });

  // DEBUG: conteggio totale "raw" senza filtro RLS, per diagnosticare
  // mismatch user_id (es. sub salvate sotto un altro account, o RLS
  // cha blocca la SELECT). Dovrebbe combaciare con summary.length;
  // se diverge, sappiamo che c'e' un problema di filtraggio.
  const { count: rawCountSameUser } = await admin
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return NextResponse.json({
    count: summary.length,
    subscriptions: summary,
    debug: {
      resolved_user_id: userId,
      // Numero righe trovate con eq(user_id) tramite count(*) — deve
      // matchare summary.length. Se diverge -> bug query/RLS.
      raw_count_same_user: rawCountSameUser ?? 0,
    },
  });
}
