/**
 * GET /api/drafts
 *
 * Lista i gift_drafts dell'utente loggato (esclusi quelli completati
 * e scaduti). Usato dalla pagina /drafts per mostrare i pacchi
 * pre-popolati in attesa di completamento.
 *
 * Auth: accetta sia Bearer token (header Authorization) sia cookie SSR
 * di Supabase, allineato al pattern di /api/profile/me e
 * /api/settings/email-parser-optin. Necessario perche' il client usa
 * fetchAuthed che invia Bearer; senza fallback su cookie il client
 * loggato via localStorage riceveva 401.
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

/** Risolve l'userId da Bearer o da cookie; null se nessuna delle due funziona. */
async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) return data.user.id;
  }
  const supabase = createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (data.user) return data.user.id;
  return null;
}

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("gift_drafts")
    .select(
      "id, status, detected_merchant, parsed_content, parser_confidence, source_email_from, source_email_subject, source_email_received_at, expires_at"
    )
    .eq("user_id", userId)
    .in("status", ["pending", "ready", "failed"])
    .order("source_email_received_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[api/drafts] query error", error);
    return NextResponse.json({ error: "server", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ drafts: data ?? [], count: (data ?? []).length });
}
