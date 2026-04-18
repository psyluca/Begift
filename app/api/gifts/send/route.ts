import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { giftId, recipientId } = await req.json();

  if (!giftId || !recipientId) {
    return NextResponse.json({ error: "giftId e recipientId richiesti" }, { status: 400 });
  }

  // Crea notifica per il destinatario
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: recipientId,
      gift_id: giftId,
      type: "gift_received",
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
