import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/** Risolve user_id da cookie sb-access-token o Bearer header. */
async function getUserId(req: NextRequest): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const at = req.cookies.get("sb-access-token")?.value;
  if (at) {
    const { data } = await admin.auth.getUser(at);
    if (data.user) return data.user.id;
  }
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const { data } = await admin.auth.getUser(auth.slice(7));
    if (data.user) return data.user.id;
  }
  return null;
}

/**
 * GET /api/gifts/[id]
 * Ritorna il gift se appartiene all'utente loggato. Usato dal flusso
 * /gift/[id]/edit per caricare i dati iniziali del packaging picker.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("gifts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (data.creator_id !== userId)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return NextResponse.json({ gift: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = createSupabaseAdmin();

  // Leggi utente dal token
  let userId: string | null = null;
  const at = req.cookies.get("sb-access-token")?.value;
  if (at) {
    const { data } = await admin.auth.getUser(at);
    userId = data.user?.id ?? null;
  }
  if (!userId) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data } = await admin.auth.getUser(auth.slice(7));
      userId = data.user?.id ?? null;
    }
  }

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await admin
    .from("gifts")
    .delete()
    .eq("id", params.id)
    .eq("creator_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = createSupabaseAdmin();
  let userId: string | null = null;
  const at = req.cookies.get("sb-access-token")?.value;
  if (at) { const { data } = await admin.auth.getUser(at); userId = data.user?.id ?? null; }
  if (!userId) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) { const { data } = await admin.auth.getUser(auth.slice(7)); userId = data.user?.id ?? null; }
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { error } = await admin.from("gifts").update({ packaging: body.packaging }).eq("id", params.id).eq("creator_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
