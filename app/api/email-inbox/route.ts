/**
 * POST /api/email-inbox
 *
 * Endpoint webhook che riceve email forwardate dagli utenti tramite
 * SendGrid Inbound Parse (o servizio equivalente). Parsa il contenuto
 * con Claude, crea un draft in gift_drafts, notifica l'utente.
 *
 * NOTA POC: questo endpoint e' un STUB. La logica del parser e' completa
 * e testabile, ma il setup esterno (SendGrid + DNS + verifica firma)
 * deve essere completato da Luca prima del rollout.
 *
 * Body atteso (multipart/form-data da SendGrid Inbound Parse):
 *   - from: mittente originale dell'email
 *   - to: indirizzo BeGift (es. plans@begift.app)
 *   - subject: oggetto
 *   - text: body in plain text
 *   - html: body HTML
 *   - attachments: numero di allegati
 *   - attachment1, attachment2, ...: file
 *   - envelope: JSON con {from, to[]} effettivi
 *   - SPF: pass/fail
 *   - dkim: signature
 *
 * Header verifica:
 *   - X-SendGrid-Signature (o equivalente — da configurare)
 *
 * Feature flag:
 *   - EMAIL_PARSER_ENABLED=true su Vercel per attivare
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { parseEmail } from "@/lib/email-parser/parse";
import type { InboundEmail } from "@/lib/email-parser/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Feature flag check
  if (process.env.EMAIL_PARSER_ENABLED !== "true") {
    return NextResponse.json(
      { error: "feature_disabled" },
      { status: 503 }
    );
  }

  // Auth: verifica che la chiamata provenga da SendGrid
  // TODO Luca: implementare verifica firma una volta configurato SendGrid Inbound Parse
  // Per ora accettiamo se un header segreto e' presente (security through obscurity per il POC)
  const sharedSecret = process.env.EMAIL_PARSER_WEBHOOK_SECRET;
  if (sharedSecret) {
    const provided = req.headers.get("x-webhook-secret");
    if (provided !== sharedSecret) {
      console.warn("[email-inbox] missing or invalid webhook secret");
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // Parse multipart/form-data (SendGrid format)
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    return NextResponse.json(
      { error: "invalid_form_data", detail: (e as Error).message },
      { status: 400 }
    );
  }

  const fromHeader = (formData.get("from") as string) || "";
  const subject = (formData.get("subject") as string) || "";
  const text = (formData.get("text") as string) || "";
  const html = (formData.get("html") as string) || "";
  const envelope = (formData.get("envelope") as string) || "{}";

  let envelopeData: { from?: string; to?: string[] } = {};
  try {
    envelopeData = JSON.parse(envelope);
  } catch {
    /* ignore */
  }

  // Identifica utente BeGift dal sender della forward.
  // SendGrid Inbound Parse setta envelope.from al sender effettivo (utente
  // BeGift che ha forwardato), mentre il body "From" puo' essere il
  // mittente originale (es. noreply@ticketone.it).
  const forwardedByEmail = envelopeData.from?.toLowerCase().trim();
  if (!forwardedByEmail) {
    return NextResponse.json(
      { error: "missing_envelope_from" },
      { status: 400 }
    );
  }

  // Cerca user BeGift con quella email
  const admin = createSupabaseAdmin();
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", forwardedByEmail)
    .maybeSingle();
  if (profileErr || !profile) {
    console.warn(
      `[email-inbox] unknown forwarder: ${forwardedByEmail}, dropping email`
    );
    return NextResponse.json(
      { error: "unknown_forwarder" },
      { status: 403 }
    );
  }

  // Salva allegati su Supabase Storage (POC: stub minimal, solo metadata)
  // TODO Luca: implementare upload reale degli allegati al bucket
  // 'gift-draft-attachments' una volta creato.
  const attachmentMetadata: InboundEmail["attachments"] = [];
  const attCount = parseInt((formData.get("attachments") as string) || "0", 10);
  for (let i = 1; i <= attCount; i++) {
    const file = formData.get(`attachment${i}`) as File | null;
    if (file) {
      // Stub: per ora salviamo solo metadata
      attachmentMetadata.push({
        filename: file.name,
        contentType: file.type,
        storageUrl: "", // TODO: upload reale
        sizeBytes: file.size,
      });
    }
  }

  const email: InboundEmail = {
    fromAddress: extractEmailAddress(fromHeader),
    fromName: extractName(fromHeader),
    forwardedByEmail: profile.email!,
    subject,
    bodyText: text,
    bodyHtml: html || undefined,
    attachments: attachmentMetadata,
    receivedAt: new Date().toISOString(),
  };

  // Crea draft in stato 'pending'
  const { data: draft, error: insertErr } = await admin
    .from("gift_drafts")
    .insert({
      user_id: profile.id,
      status: "pending",
      source_email_from: email.fromAddress,
      source_email_subject: email.subject,
      raw_body: email.bodyText,
    })
    .select("id")
    .single();
  if (insertErr || !draft) {
    console.error("[email-inbox] insert draft failed", insertErr);
    return NextResponse.json(
      { error: "db_insert_failed", detail: insertErr?.message },
      { status: 500 }
    );
  }

  // Parse con Claude (async, non blocchiamo il response a SendGrid)
  // Per SLA SendGrid (timeout webhook 30s), eseguiamo parsing inline ma
  // gestiamo timeout con catch.
  try {
    const result = await parseEmail(email);

    if (result.status === "failed") {
      await admin
        .from("gift_drafts")
        .update({
          status: "failed",
          parsed_content: null,
          parser_confidence: 0,
        })
        .eq("id", draft.id);
      console.warn(
        `[email-inbox] parse failed for draft ${draft.id}: ${result.error}`
      );
    } else {
      await admin
        .from("gift_drafts")
        .update({
          status: "ready",
          detected_merchant: result.content?.merchant || "unknown",
          parsed_content: result.content,
          parser_confidence: result.content?.confidence ?? 0,
        })
        .eq("id", draft.id);

      // TODO Luca: trigger notifica push/email all'utente
      // ("Hai un nuovo regalo in bozza, completalo")
    }
  } catch (e) {
    console.error("[email-inbox] parser exception", e);
    await admin
      .from("gift_drafts")
      .update({ status: "failed" })
      .eq("id", draft.id);
  }

  return NextResponse.json({
    ok: true,
    draft_id: draft.id,
  });
}

function extractEmailAddress(value: string): string {
  const m = value.match(/<([^>]+)>/);
  return m ? m[1] : value.trim();
}

function extractName(value: string): string | undefined {
  const m = value.match(/^([^<]+?)\s*</);
  if (m) return m[1].trim().replace(/^"|"$/g, "");
  return undefined;
}
