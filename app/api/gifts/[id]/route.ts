import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
