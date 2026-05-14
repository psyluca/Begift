/**
 * GET /api/drafts
 *
 * Lista i gift_drafts dell'utente loggato (esclusi quelli completati
 * e scaduti). Usato dalla pagina /drafts per mostrare i pacchi
 * pre-popolati in attesa di completamento.
 *
 * Response shape:
 *   {
 *     drafts: [
 *       {
 *         id, status, detected_merchant,
 *         parsed_content: { title, event_date, location, ... } | null,
 *         source_email_from, source_email_subject,
 *         source_email_received_at, expires_at, parser_confidence
 *       }
 *     ],
 *     count: number
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(_req: NextRequest) {
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
    .from("gift_drafts")
    .select(
      "id, status, detected_merchant, parsed_content, parser_confidence, source_email_from, source_email_subject, source_email_received_at, expires_at"
    )
    .eq("user_id", userData.user.id)
    .in("status", ["pending", "ready", "failed"])
    .order("source_email_received_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[api/drafts] query error", error);
    return NextResponse.json({ error: "server", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ drafts: data ?? [], count: (data ?? []).length });
}
