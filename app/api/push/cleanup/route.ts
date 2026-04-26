/**
 * POST /api/push/cleanup
 *
 * Pulisce le push_subscriptions dell'utente loggato:
 *  - Mantiene solo la piu' recente (per created_at desc)
 *  - Cancella tutte le altre
 *
 * Razionale: dopo molti reconnect (drift di endpoint stale su iOS,
 * PushAutoHeal in loop, ecc.) il DB puo' accumulare decine di
 * subscription per lo stesso device. Solo l'ultima e' funzionante.
 * Le altre fanno solo overhead nel send (sendPushToUser le itera
 * tutte) e numeri inflated nelle metriche.
 *
 * Auth: Bearer / cookie SSR.
 */

export const dynamic = "force-dynamic";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

  // Conta tutte le sub dell'utente, ordinate per created_at desc.
  const { data: all, error } = await admin
    .from("push_subscriptions")
    .select("id, created_at, endpoint")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[push/cleanup] query error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  // Nuovo comportamento (2026-04-26): cancella TUTTE le sub
  // dell'utente. Il client deve poi richiamare ensurePushSubscription
  // con forceRefresh per crearne una fresca. In questo modo non c'e'
  // ambiguita' su quale sia la "buona" e si esce dal loop di
  // ricreazione automatica che capita su iOS PWA dopo cleanup
  // parziale.
  console.log(`[push/cleanup] user=${userId} found ${all?.length ?? 0} subs to delete`);

  if (!all || all.length === 0) {
    return NextResponse.json({ ok: true, before: 0, after: 0, deleted: 0 });
  }

  const { error: delError } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId);

  if (delError) {
    console.error("[push/cleanup] delete error", delError);
    return NextResponse.json({ error: "server", detail: delError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    before: all.length,
    after: 0,
    deleted: all.length,
    note: "All subs deleted. Client should call ensurePushSubscription({forceRefresh:true}) to create a fresh one.",
  });
}
