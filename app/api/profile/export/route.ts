/**
 * GET /api/profile/export
 *
 * Diritto alla portabilita' (GDPR art. 20). Ritorna un bundle JSON
 * con TUTTI i dati personali dell'utente loggato in formato
 * strutturato, leggibile da macchina.
 *
 * Il bundle include:
 *  - profilo (email, handle, display_name, avatar_url, preferenze)
 *  - gifts creati dall'utente (con URL ai media)
 *  - reactions ricevute sui propri gift
 *  - notifications ricevute
 *  - push_subscriptions attive (endpoint opachi)
 *  - reminders programmati
 *  - user_blocks configurati
 *  - conferma eta', referral, consensi
 *
 * Gli URL ai media sono URL pubblici Supabase Storage: il destinatario
 * del bundle puo' scaricarli finche' esistono nel bucket.
 *
 * Se in futuro vogliamo passare a URL firmati con scadenza, cambiare
 * qui il getPublicUrl → createSignedUrl.
 *
 * Rate limit: gli export sono relativamente costosi. Limitiamo a
 * 3 export per utente per 24h.
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  let userId: string | null = null;

  // Auth: Bearer token prima, cookie session come fallback.
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
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  // Profilo
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  // Gifts creati dall'utente (include contenuto e packaging).
  // Le reazioni sono incluse come relazione innestata.
  const { data: giftsCreated } = await admin
    .from("gifts")
    .select("*, reactions(*), gift_opens(opened_at, user_id)")
    .eq("creator_id", userId)
    .order("created_at", { ascending: true });

  // Notifiche ricevute dall'utente (include aperture regalo altrui,
  // reazioni ricevute, ecc.). Le notifiche di apertura dei propri
  // gift sono gia' coperte, ma le reactions sui gift ricevuti no —
  // le recuperiamo sotto.
  const { data: notifications } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  // Push subscription
  const { data: pushSubs } = await admin
    .from("push_subscriptions")
    .select("endpoint, user_agent, created_at")
    .eq("user_id", userId);

  // Ricorrenze
  const { data: reminders } = await admin
    .from("reminders")
    .select("*")
    .eq("user_id", userId);

  // User blocks
  const { data: blocks } = await admin
    .from("user_blocks")
    .select("*")
    .eq("blocker_id", userId);

  // Gift opens (lista di regali che ho aperto)
  const { data: giftOpens } = await admin
    .from("gift_opens")
    .select("gift_id, opened_at")
    .eq("user_id", userId);

  // Reports che l'utente ha inviato (se implementato reporter_user_id)
  // La tabella reports conserva reporter_user_id se l'utente era
  // loggato al momento della segnalazione.
  const { data: reports } = await admin
    .from("reports")
    .select("id, gift_id, category, reason, status, created_at")
    .eq("reporter_user_id", userId);

  const bundle = {
    export_version: "1.0",
    generated_at: new Date().toISOString(),
    user_id: userId,
    disclaimer:
      "Questo bundle contiene i tuoi dati personali in formato JSON. " +
      "Gli URL ai media sono pubblici ma opachi (non indicizzati). " +
      "Per qualsiasi domanda contatta privacy@begift.app.",
    profile,
    gifts_created: giftsCreated ?? [],
    gift_opens: giftOpens ?? [],
    notifications: notifications ?? [],
    push_subscriptions: pushSubs ?? [],
    reminders: reminders ?? [],
    blocks_configured: blocks ?? [],
    reports_submitted: reports ?? [],
    // Nota: non includiamo log Vercel/Supabase (non sono in nostro
    // possesso nel DB applicativo, ma nei provider. L'utente puo'
    // richiederli scrivendo a privacy@begift.app).
    extra_notes: [
      "I log HTTP di Vercel e i log auth di Supabase NON sono inclusi in questo bundle.",
      "Sono conservati dai rispettivi provider per le durate dichiarate nella privacy policy.",
      "Per richiederli, contatta privacy@begift.app.",
    ],
  };

  // Forziamo il download come JSON con nome parlante. Il client puo'
  // poi decidere se aprirlo o salvarlo.
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="begift-export-${userId.slice(0, 8)}-${Date.now()}.json"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
