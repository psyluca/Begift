import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { CreateReactionBody } from "@/types";

// POST /api/reactions — inserisce una reazione (nessuna auth richiesta)
export async function POST(req: NextRequest) {
  const supabase = createSupabaseAdmin();
  const body: CreateReactionBody = await req.json();

  if (!body.giftId || !body.type) {
    return NextResponse.json({ error: "giftId and type are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reactions")
    .insert({
      gift_id:       body.giftId,
      reaction_type: body.type,
      emoji:         body.emoji    ?? null,
      text:          body.text     ?? null,
      media_url:     body.mediaUrl ?? null,
      sender_name:   body.senderName ?? "Destinatario",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
