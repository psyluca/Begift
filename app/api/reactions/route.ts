import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { CreateReactionBody } from "@/types";
import { sendPushToUser } from "@/lib/webPush";

// POST /api/reactions — inserisce una reazione (nessuna auth richiesta)
export async function POST(req: NextRequest) {
  const supabase = createSupabaseAdmin();
  const body: CreateReactionBody = await req.json();

  if (!body.giftId || !body.type) {
    return NextResponse.json({ error: "giftId and type are required" }, { status: 400 });
  }

  const senderName = body.senderName ?? "Destinatario";
  const { data, error } = await supabase
    .from("reactions")
    .insert({
      gift_id:       body.giftId,
      reaction_type: body.type,
      emoji:         body.emoji    ?? null,
      text:          body.text     ?? null,
      media_url:     body.mediaUrl ?? null,
      sender_name:   senderName,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Push notification al creator del gift (la persona che ha mandato
  // il regalo riceve una push quando qualcuno reagisce). Best-effort:
  // se il creatore non ha sub, o VAPID mancanti, la reazione viene
  // salvata comunque e appare in /reactions al prossimo load.
  try {
    const { data: gift } = await supabase
      .from("gifts")
      .select("creator_id, recipient_name")
      .eq("id", body.giftId)
      .maybeSingle();
    const creatorId = (gift as { creator_id?: string } | null)?.creator_id;
    if (creatorId) {
      // Corpo specifico per tipo di reazione: emoji inline, testo
      // troncato, media generico. Più concreto = più tap-rate.
      let bodyText = `${senderName} ha reagito al tuo regalo`;
      if (body.type === "emoji" && body.emoji) {
        bodyText = `${senderName} ha reagito ${body.emoji}`;
      } else if (body.type === "text" && body.text) {
        const preview = body.text.length > 60 ? body.text.slice(0, 57) + "…" : body.text;
        bodyText = `${senderName}: "${preview}"`;
      } else if (body.type === "photo") {
        bodyText = `${senderName} ti ha mandato una foto 📸`;
      } else if (body.type === "video") {
        bodyText = `${senderName} ti ha mandato un video 🎬`;
      }

      sendPushToUser(creatorId, {
        title: "💌 Hai ricevuto una reazione",
        body: bodyText,
        url: `/reactions`,
        giftId: body.giftId,
        tag: `begift-reaction-${body.giftId}`,
      }).catch((e) => console.error("[reactions] push failed", e));
    }
  } catch (e) {
    console.error("[reactions] push setup failed", e);
  }

  return NextResponse.json(data);
}

// GET /api/reactions?giftId=xxx — legge le reazioni (solo per il creatore)
export async function GET(req: NextRequest) {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const giftId = req.nextUrl.searchParams.get("giftId");
  if (!giftId) return NextResponse.json({ error: "giftId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("reactions")
    .select("*")
    .eq("gift_id", giftId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
