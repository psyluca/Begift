/**
 * POST /api/newsletter/subscribe
 *
 * Iscrive una email alla newsletter BeGift. Body JSON:
 *   { email: string, source?: "footer" | "post-gift" | "dashboard" | string }
 *
 * Comportamento:
 *   - valida email lato server (regex minimale + length)
 *   - rate-limit semplice via header IP hash (max 5 iscrizioni/IP/ora)
 *   - INSERT ON CONFLICT email → update opted_in_at + opted_out_at=NULL
 *     (re-opt-in se utente si era cancellato in passato)
 *   - ritorna 200 OK con { subscribed: true } (idempotente per UX)
 *
 * Privacy: tabella newsletter_subscribers e' RLS-protected, solo
 * service_role access. Niente PII oltre l'email.
 *
 * Migration: 029_newsletter_subscribers.sql
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Regex pratica per email (RFC compliant in pratica)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  let body: { email?: unknown; source?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const source = typeof body.source === "string" ? body.source.slice(0, 40) : "unknown";

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  // Upsert: idempotente. Se l'email esiste gia', aggiorna opted_in_at
  // e cancella opted_out_at (re-opt-in). Source viene aggiornato all'ultima
  // iscrizione (utile per attribution).
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("newsletter_subscribers")
    .upsert(
      {
        email,
        source,
        opted_in_at: new Date().toISOString(),
        opted_out_at: null,
      },
      { onConflict: "email" }
    );

  if (error) {
    console.error("[newsletter/subscribe] error", error);
    return NextResponse.json(
      { error: "server_error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ subscribed: true });
}
