/**
 * GET  /api/settings/email-parser-optin
 *   Ritorna lo stato corrente del flag opt-in per l'utente loggato.
 *   Response: { opted_in: boolean }
 *
 * POST /api/settings/email-parser-optin
 *   Aggiorna il flag email_parser_opted_in del profilo utente loggato.
 *   Body: { opted_in: boolean }
 *
 *   Quando opted_in passa da false a true, registra timestamp di
 *   consenso (audit trail GDPR).
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("email_parser_opted_in")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    console.error("[api/settings/email-parser-optin GET] error", error);
    return NextResponse.json({ error: "server", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ opted_in: !!data?.email_parser_opted_in });
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let body: { opted_in?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.opted_in !== "boolean") {
    return NextResponse.json(
      { error: "invalid_input", detail: "opted_in must be boolean" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdmin();
  const update: Record<string, unknown> = { email_parser_opted_in: body.opted_in };

  // Se passa da false a true, registra timestamp consenso
  if (body.opted_in) {
    update.email_parser_opted_in_at = new Date().toISOString();
  }

  const { error } = await admin
    .from("profiles")
    .update(update)
    .eq("id", userData.user.id);

  if (error) {
    console.error("[api/settings/email-parser-optin] update error", error);
    return NextResponse.json({ error: "server", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, opted_in: body.opted_in });
}
