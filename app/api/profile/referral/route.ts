/**
 * POST /api/profile/referral
 *
 * Registra il referrer dell'utente loggato. Chiamato dal client
 * dopo il primo login, se nel cookie/localStorage è presente un
 * ?ref=@handle valido.
 *
 * Body: { referred_by_username: string }
 *
 * Logica idempotente: se referred_by_user_id è già settato, lo
 * lascia (primo referrer vince). Se il handle non esiste o è
 * invalido, salva comunque referred_by_username come "dato grezzo"
 * ma non attribuisce referred_by_user_id.
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { normalizeHandle } from "@/lib/username";

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
  const rawHandle: string = String(body?.referred_by_username ?? "");
  // Normalizza rimuovendo @ iniziale se presente, lowercase, ecc.
  const handle = normalizeHandle(rawHandle.replace(/^@/, ""));
  if (!handle || handle.length < 3) {
    return NextResponse.json({ error: "invalid handle" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Idempotenza: se già attribuito, non sovrascrivere (primo vince)
  const { data: currentProfile } = await admin
    .from("profiles")
    .select("referred_by_user_id")
    .eq("id", userId)
    .maybeSingle();
  if ((currentProfile as { referred_by_user_id?: string | null } | null)?.referred_by_user_id) {
    return NextResponse.json({ ok: true, already_attributed: true });
  }

  // Risolvi il referrer tramite handle
  const { data: referrer } = await admin
    .from("profiles")
    .select("id, username")
    .ilike("username", handle)
    .maybeSingle();

  const referrerId = (referrer as { id?: string } | null)?.id ?? null;

  // Non permettere auto-referral
  if (referrerId === userId) {
    return NextResponse.json({ error: "cannot self-refer" }, { status: 400 });
  }

  const { error } = await admin
    .from("profiles")
    .update({
      referred_by_username: handle,
      referred_by_user_id: referrerId,
      referred_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("[profile/referral] update error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, referrer_resolved: !!referrerId });
}
