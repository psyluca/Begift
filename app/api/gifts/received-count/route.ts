export const dynamic = "force-dynamic";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get("since") ?? "1970-01-01";
  const admin = createSupabaseAdmin();

  let userId: string | null = null;
  const at = req.cookies.get("sb-access-token")?.value;
  if (at) { const { data } = await admin.auth.getUser(at); userId = data.user?.id ?? null; }
  if (!userId) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) { const { data } = await admin.auth.getUser(auth.slice(7)); userId = data.user?.id ?? null; }
  }
  if (!userId) return NextResponse.json({ count: 0 });

  const { count } = await admin
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "gift_received")
    .gt("created_at", since);

  return NextResponse.json({ count: count ?? 0 });
}
