/**
 * POST /api/g/[token]/reaction
 *
 * Reazione anonima sulla pagina apertura cliente business (/g/[token]).
 * Risolve token → gift_id internamente (no client-side gift_id leak)
 * e inserisce una reaction con relativo push/email al sender (la
 * massaggiatrice riceve la notifica come per i gift normali).
 *
 * MVP: solo reazioni emoji. Estendibile a "text" facile.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/webPush";
import { sendReactionEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReactionBody {
  type?: "emoji" | "text";
  emoji?: string;
  text?: string;
  sender_name?: string;
}

const ALLOWED_EMOJI = ["❤️", "🙏", "✨", "😍", "🥰", "🎁"];

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  if (!token || token.length < 10 || token.length > 32) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  let body: ReactionBody;
  try {
    body = (await req.json()) as ReactionBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const reactionType = body.type === "text" ? "text" : "emoji";
  let emoji: string | null = null;
  let text: string | null = null;

  if (reactionType === "emoji") {
    if (!body.emoji || !ALLOWED_EMOJI.includes(body.emoji)) {
      return NextResponse.json(
        { error: "invalid_emoji", detail: `allowed: ${ALLOWED_EMOJI.join(" ")}` },
        { status: 400 }
      );
    }
    emoji = body.emoji;
  } else {
    if (!body.text?.trim()) {
      return NextResponse.json({ error: "missing_text" }, { status: 400 });
    }
    text = body.text.trim().slice(0, 500);
  }

  // Risolvi token → gift (no leak gift_id al client)
  const admin = createSupabaseAdmin();
  const { data: gift, error: giftErr } = await admin
    .from("gifts")
    .select("id, creator_id, recipient_name")
    .eq("open_token", token)
    .eq("is_business_gift", true)
    .maybeSingle();

  if (giftErr) {
    console.error("[api/g/reaction] lookup error", giftErr.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  if (!gift) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const senderName = body.sender_name?.trim().slice(0, 50) || gift.recipient_name;

  // Insert reaction
  const { data: reactionRow, error: insertErr } = await admin
    .from("reactions")
    .insert({
      gift_id: gift.id,
      reaction_type: reactionType,
      emoji,
      text,
      media_url: null,
      sender_name: senderName,
    })
    .select()
    .single();

  if (insertErr) {
    console.error("[api/g/reaction] insert error", insertErr.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Push + email al business owner (best-effort, non blocca)
  void notifyBusinessOwner({
    creatorId: gift.creator_id,
    giftId: gift.id,
    senderName,
    reactionType,
    emoji,
    text,
  }).catch((e) => console.error("[api/g/reaction] notify failed", e));

  return NextResponse.json({ ok: true, reaction_id: reactionRow.id });
}

async function notifyBusinessOwner(opts: {
  creatorId: string;
  giftId: string;
  senderName: string;
  reactionType: "emoji" | "text";
  emoji: string | null;
  text: string | null;
}): Promise<void> {
  let bodyText = `${opts.senderName} ha reagito al pacco`;
  if (opts.reactionType === "emoji" && opts.emoji) {
    bodyText = `${opts.senderName} ha reagito ${opts.emoji}`;
  } else if (opts.reactionType === "text" && opts.text) {
    const preview =
      opts.text.length > 60 ? opts.text.slice(0, 57) + "…" : opts.text;
    bodyText = `${opts.senderName}: "${preview}"`;
  }

  await Promise.all([
    sendPushToUser(
      opts.creatorId,
      {
        title: "💌 Reazione da un cliente",
        body: bodyText,
        url: "/business",
        giftId: opts.giftId,
        tag: `begift-business-reaction-${opts.giftId}`,
      },
      "reaction"
    ).catch((e) => console.error("[api/g/reaction] push", e)),
    sendReactionEmail(opts.creatorId, {
      recipientName: opts.senderName,
      giftId: opts.giftId,
      reactionType: opts.reactionType,
      preview:
        opts.reactionType === "emoji"
          ? opts.emoji ?? ""
          : opts.text ?? "",
    }).catch((e) => console.error("[api/g/reaction] email", e)),
  ]);
}
