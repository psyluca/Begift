import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { giftId, deviceId } = await req.json();

  await supabase.from("gift_opens").insert({
    gift_id:   giftId,
    device_id: deviceId,
  });

  return NextResponse.json({ ok: true });
}
