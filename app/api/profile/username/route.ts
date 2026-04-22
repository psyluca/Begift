/**
 * POST /api/profile/username
 *
 * Imposta o aggiorna lo username dell'utente loggato. L'unique
 * constraint del DB gestisce le race condition (due utenti che
 * scelgono contemporaneamente lo stesso handle → uno vince, l'altro
 * riceve 409 Conflict).
 *
 * Auth: Bearer token o cookie. Obbligatorio.
 * Body: { handle: string }
 * Response:
 *   200 { ok: true, username }
 *   400 { error: "invalid" | "reserved" }
 *   401 { error: "unauthorized" }
 *   409 { error: "taken" }
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { validateUsername, normalizeHandle } from "@/lib/username";

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
  const handle = normalizeHandle(String(body?.handle ?? ""));
  const validation = validateUsername(handle);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.reason === "reserved" ? "reserved" : "invalid" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .update({ username: handle })
    .eq("id", userId)
    .select("username")
    .single();

  if (error) {
    // Unique violation = 23505 Postgres code
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "taken" }, { status: 409 });
    }
    // Check violation (regex fallita malgrado normalize+validate)
    if ((error as { code?: string }).code === "23514") {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    console.error("[profile/username] update error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username: data?.username });
}
