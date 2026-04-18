import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { CreateGiftBody } from "@/types";

async function getUserId(req: NextRequest): Promise<string | null> {
  const admin = createSupabaseAdmin();

  // Prova 1: Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const { data } = await admin.auth.getUser(authHeader.slice(7));
    if (data.user) return data.user.id;
  }

  // Prova 2: cookie sb-access-token
  const at = req.cookies.get("sb-access-token")?.value;
  if (at) {
    const { data } = await admin.auth.getUser(at);
    if (data.user) return data.user.id;
  }

  // Prova 3: cookie begift-session
  const session = req.cookies.get("begift-session")?.value;
  if (session) {
    try {
      const val = session.startsWith("base64-") ? atob(session.slice(7)) : session;
      const parsed = JSON.parse(decodeURIComponent(val));
      if (parsed.access_token) {
        const { data } = await admin.auth.getUser(parsed.access_token);
        if (data.user) return data.user.id;
      }
    } catch {}
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateGiftBody = await req.json();
    if (!body.recipientName?.trim()) {
      return NextResponse.json({ error: "recipientName is required" }, { status: 400 });
    }

    const userId = await getUserId(req);
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("gifts")
      .insert({
        creator_id:        userId,
        recipient_name:    body.recipientName.trim(),
        sender_alias:      body.senderAlias ?? null,
        message:           body.message ?? null,
        packaging:         body.packaging,
        content_type:      body.contentType ?? null,
        content_url:       body.contentUrl ?? null,
        content_text:      body.contentText ?? null,
        content_file_name: body.contentFileName ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return NextResponse.json({ id: data.id, url: `${appUrl}/gift/${data.id}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("gifts")
    .select("*, reactions(id, reaction_type, emoji, text, media_url, sender_name, created_at)")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
