/**
 * DELETE /api/profile/delete
 *
 * Cancellazione dell'account utente — implementazione del "diritto
 * all'oblio" (GDPR art. 17).
 *
 * Effetto: chiama admin.auth.admin.deleteUser(userId). Le altre
 * tabelle referenziano auth.users(id) ON DELETE CASCADE, quindi
 * tutto ciò che è dell'utente si cancella automaticamente:
 *   - profiles (cascade da auth.users)
 *   - gifts creati dall'utente (cascade da profiles.id → creator_id)
 *   - notifications di cui è destinatario
 *   - push_subscriptions
 *   - reminders
 *   - user_blocks (in entrambi i lati)
 *   - reactions inviate (se collegate a user_id — attualmente usano
 *     solo sender_name text, quindi restano orfane ma anonime)
 *
 * Conservazione: la tabella reports conserva reporter_user_id NULL
 * dopo la cancellazione (grazie a ON DELETE SET NULL) per non
 * perdere le segnalazioni storiche necessarie in caso di indagini.
 *
 * Auth: Bearer/cookie + conferma esplicita nel body ("confirm": true).
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
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== true) {
    return NextResponse.json(
      { error: "confirmation_required", message: "Invia { confirm: true } per procedere" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdmin();

  // Cancella l'utente auth (cascade farà il resto)
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[profile/delete] auth.admin.deleteUser error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
