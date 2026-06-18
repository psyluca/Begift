/**
 * POST /api/push/register-native
 *
 * Registra un device token native (APNs iOS / FCM Android) per l'utente
 * corrente. Distinto da /api/push/subscribe che gestisce Web Push (PWA).
 *
 * Body atteso: { token: string, platform: 'ios' | 'android' }
 *
 * Idempotente via unique constraint su `token`.
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token: string | undefined = body?.token;
  const platform: string | undefined = body?.platform;

  if (!token || !platform) {
    return NextResponse.json(
      { error: "Missing token or platform" },
      { status: 400 }
    );
  }

  if (platform !== "ios" && platform !== "android") {
    return NextResponse.json(
      { error: "Invalid platform (must be 'ios' or 'android')" },
      { status: 400 }
    );
  }

  const userAgent = req.headers.get("user-agent") || null;

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("push_device_tokens")
    .upsert(
      {
        user_id: userId,
        token,
        platform,
        user_agent: userAgent,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    );

  if (error) {
    console.error("[push/register-native] upsert error", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
