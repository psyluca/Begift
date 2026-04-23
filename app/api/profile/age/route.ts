/**
 * POST /api/profile/age
 *
 * Conferma che l'utente ha dichiarato di avere >=16 anni
 * (GDPR art. 8). Chiamato dal modal di onboarding. Idempotente:
 * se già confermato, restituisce 200 senza modificare il timestamp.
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

  const admin = createSupabaseAdmin();

  // Verifica se già confermato (idempotente)
  const { data: existing } = await admin
    .from("profiles")
    .select("age_confirmed_at")
    .eq("id", userId)
    .maybeSingle();
  if ((existing as { age_confirmed_at?: string } | null)?.age_confirmed_at) {
    return NextResponse.json({ ok: true, age_confirmed_at: (existing as { age_confirmed_at: string }).age_confirmed_at });
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("profiles")
    .update({ age_confirmed_at: now })
    .eq("id", userId);

  if (error) {
    console.error("[profile/age] update error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, age_confirmed_at: now });
}
