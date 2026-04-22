/**
 * POST /api/push/test
 *
 * Invia una push di test all'utente loggato su tutti i suoi device
 * sottoscritti. Utile per verifica rapida: dopo aver installato la
 * PWA + abilitato le notifiche, colpisci questo endpoint e dovresti
 * vedere la notifica OS arrivare anche con l'app chiusa.
 *
 * Auth: Bearer token o cookie sessione. Nessun abuse limit (ma è
 * ristretto all'utente che chiama — puoi solo mandarti push a te
 * stesso).
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/webPush";

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

  const result = await sendPushToUser(userId, {
    title: "🎁 Test notifica BeGift",
    body: "Se vedi questo messaggio, le notifiche sono configurate correttamente!",
    url: "/dashboard",
    tag: "begift-test",
  });

  return NextResponse.json({ ok: true, ...result });
}
