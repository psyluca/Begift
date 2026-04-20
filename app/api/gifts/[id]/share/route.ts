import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/gifts/:id/share
 *
 * Chiamato quando il destinatario clicca "Condividi" dopo aver aperto
 * il gift. Setta `gifts.shared_at` alla prima condivisione
 * (idempotente via IS NULL). La transizione fa scattare il trigger
 * `gift_events_credits_trg` che assegna 3 crediti al creator.
 *
 * Non richiede auth — i destinatari sono tipicamente anonimi.
 * Usa admin client per bypassare RLS.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const giftId = params.id;
  if (!giftId) {
    return NextResponse.json({ error: "missing_gift_id" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin
      .from("gifts")
      .update({ shared_at: new Date().toISOString() })
      .eq("id", giftId)
      .is("shared_at", null);

    if (error) {
      console.error("[gifts/share] update failed:", error);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
  } catch (e) {
    console.error("[gifts/share] exception:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
