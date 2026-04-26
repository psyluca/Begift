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

  if (!all || all.length <= 1) {
    return NextResponse.json({ ok: true, before: all?.length ?? 0, after: all?.length ?? 0, deleted: 0 });
  }

  // Mantieni solo l'id piu' recente, cancella tutto il resto.
  const keepId = (all[0] as { id: string }).id;
  const toDelete = (all as { id: string }[]).slice(1).map((s) => s.id);

  const { error: delError } = await admin
    .from("push_subscriptions")
    .delete()
    .in("id", toDelete);

  if (delError) {
    console.error("[push/cleanup] delete error", delError);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    before: all.length,
    after: 1,
    deleted: toDelete.length,
    kept: keepId,
  });
}
