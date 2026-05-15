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

  // Mapping parsed_content -> gift schema. Schema reale (vedi
  // types/index.ts + app/api/gifts/route.ts):
  //   - creator_id (NOT "created_by")
  //   - recipient_name, message, packaging (object NOT NULL)
  //   - content_type, content_text, content_url (nullable)
  // Per la mail forwardata, mettiamo i dati strutturati come testo
  // formato readable nel content_text (titolo, data, location, codici),
  // e usiamo content_type='message' per riusare il render esistente.
  const parsed = (draft.parsed_content || {}) as Record<string, unknown>;

  // Costruisci testo leggibile a partire dai dati parsati
  const lines: string[] = [];
  if (typeof parsed.title === "string") lines.push(parsed.title);
  if (typeof parsed.subtitle === "string") lines.push(parsed.subtitle);
  if (typeof parsed.event_date === "string") {
    try {
      lines.push(
        "🗓️ " +
          new Date(parsed.event_date).toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
      );
    } catch {
      lines.push("🗓️ " + parsed.event_date);
    }
  }
  if (typeof parsed.location === "string") lines.push("📍 " + parsed.location);
  if (typeof parsed.booking_code === "string")
    lines.push("Codice prenotazione: " + parsed.booking_code);
  if (typeof parsed.voucher_code === "string")
    lines.push("Voucher: " + parsed.voucher_code);
  const contentText = lines.join("\n\n");

  // Packaging default. Stessi colori di DEFAULT_PKG in
  // CreateGiftClient.tsx, scelto perche' il flusso di completion
  // attualmente non chiede all'utente di personalizzare il pacchetto.
  const defaultPackaging = {
    paperColor: "#D85A5A",
    ribbonColor: "#E8C84A",
    bowColor: "#E8C84A",
    bowType: "classic",
    openAnimation: "lift",
    sound: "bells",
  };

  // Prima immagine hero estratta dall'HTML della mail (foto reale del
  // posto/evento). Vedi lib/email-parser/extract-images.ts. Se presente,
  // diventa il contenuto principale del gift (image), altrimenti
  // fallback su content_type=message con solo il testo.
  const heroImageUrls = Array.isArray(parsed.suggested_image_urls)
    ? (parsed.suggested_image_urls as string[]).filter(
        (u) => typeof u === "string"
      )
    : [];
  const heroImage = heroImageUrls[0];
  // Le altre immagini (se ce ne sono) vanno in extra_media per
  // mostrarle come gallery secondaria (max 8 oltre la hero).
  const extraMedia = heroImageUrls
    .slice(1, 9)
    .map((url) => ({ type: "image", url }));

  // Video YouTube fallback (solo se non c'e' immagine hero).
  // suggested_video_url e' impostato in /api/email-inbox quando il
  // parser non trova immagini buone nell'HTML mail. Il renderer
  // BeGift (GiftOpeningClient) detecta automaticamente YouTube e
  // mostra l'iframe embed.
  const videoUrl =
    typeof parsed.suggested_video_url === "string"
      ? parsed.suggested_video_url
      : null;

  const insertRow: Record<string, unknown> = {
    creator_id: userData.user.id,
    recipient_name: recipientName,
    message,
    packaging: defaultPackaging,
  };
  if (heroImage) {
    insertRow.content_type = "image";
    insertRow.content_url = heroImage;
    if (contentText) insertRow.content_text = contentText;
  } else if (videoUrl) {
    // YouTube → BeGift gestisce gli URL link come embed video se YouTube
    insertRow.content_type = "link";
    insertRow.content_url = videoUrl;
    if (contentText) insertRow.content_text = contentText;
  } else if (contentText) {
    insertRow.content_type = "message";
    insertRow.content_text = contentText;
  }
  if (extraMedia.length > 0) {
    insertRow.extra_media = extraMedia;
  }

  const { data: gift, error: giftErr } = await admin
    .from("gifts")
    .insert(insertRow)
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
