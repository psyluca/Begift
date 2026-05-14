/**
 * POST /api/draft/[id]/complete
 *
 * Trasforma un gift_draft (pre-popolato dal parser email) in un gift
 * vero e proprio nella tabella `gifts`.
 *
 * Logica:
 *   1. Verifica ownership del draft
 *   2. Crea record in `gifts` con dati combinati (parsed_content +
 *      messaggio personalizzato dall'utente)
 *   3. Aggiorna gift_drafts.status='completed' e gift_id
 *   4. Restituisce gift_id per redirect
 *
 * NOTA POC: questo endpoint e' uno STUB. Il mapping parsed_content ->
 * gifts schema dipende dal formato finale di `gifts` (templates, blocks,
 * ecc.). Per il POC creiamo un gift "generico" e affidiamo all'utente la
 * personalizzazione successiva.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Feature flag
  if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_PARSER !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 503 });
  }

  // Auth
  const supabase = createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // Parse body
  let body: { recipientName?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const recipientName = body.recipientName?.trim();
  const message = body.message?.trim();
  if (!recipientName || !message) {
    return NextResponse.json(
      { error: "missing_fields", detail: "recipientName e message obbligatori" },
      { status: 400 }
    );
  }

  // Fetch draft
  const admin = createSupabaseAdmin();
  const { data: draft, error: draftErr } = await admin
    .from("gift_drafts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (draftErr || !draft) {
    return NextResponse.json({ error: "draft_not_found" }, { status: 404 });
  }
  if (draft.user_id !== userData.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (draft.status === "completed") {
    return NextResponse.json(
      { error: "already_completed", gift_id: draft.gift_id },
      { status: 409 }
    );
  }
  if (draft.status !== "ready") {
    return NextResponse.json(
      { error: "draft_not_ready", status: draft.status },
      { status: 409 }
    );
  }

  // TODO Luca: mappare parsed_content -> schema gift completo
  // Per ora creiamo un gift minimale con i campi essenziali.
  // Il mapping vero richiedera' di estendere `gifts` con un campo
  // `addon_metadata` o di passare attraverso `gift_addons` (tabella
  // del Pattern B affiliate, da sviluppare).
  const parsed = (draft.parsed_content || {}) as Record<string, unknown>;

  const { data: gift, error: giftErr } = await admin
    .from("gifts")
    .insert({
      created_by: userData.user.id,
      recipient_name: recipientName,
      template_type: "parent_letter", // default temporaneo, da affinare
      // Salviamo i dati strutturati in una colonna metadata
      // (assumendo esista; altrimenti questo va in gift_addons quando avremo Pattern B)
      // Per POC ignoriamo l'integrazione con gift schema e ci limitiamo a creare un gift base
    })
    .select("id")
    .single();

  if (giftErr || !gift) {
    console.error("[draft/complete] gift insert failed", giftErr);
    return NextResponse.json(
      { error: "gift_creation_failed", detail: giftErr?.message },
      { status: 500 }
    );
  }

  // Update draft con il gift_id e marca come completed
  await admin
    .from("gift_drafts")
    .update({
      status: "completed",
      gift_id: gift.id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", draft.id);

  return NextResponse.json({
    ok: true,
    gift_id: gift.id,
    parsed_data: parsed, // utile al client per pre-popolare il prossimo flusso
    custom_message: message,
  });
}
