/**
 * GET /api/gifts/received-count?since=ISO
 *
 * Conta i gift ricevuti dall'utente loggato dopo `since`. La fonte
 * di verita' sono le notifications type='gift_received' dirette al
 * suo user_id.
 *
 * Auth: Bearer token (preferito) o cookie SSR (fallback). Coerente
 * con /api/reactions/count.
 */

export const dynamic = "force-dynamic";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get("since") ?? "1970-01-01";
  const admin = createSupabaseAdmin();

  // Bearer prima (piu' affidabile), cookie SSR come fallback.
  let userId: string | null = null;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const { data } = await admin.auth.getUser(auth.slice(7));
    userId = data.user?.id ?? null;
  }
  if (!userId) {
    const at = req.cookies.get("sb-access-token")?.value;
    if (at) {
      const { data } = await admin.auth.getUser(at);
      userId = data.user?.id ?? null;
    }
  }
  if (!userId) return NextResponse.json({ count: 0 });

  const { count, error } = await admin
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "gift_received")
    .gt("created_at", since);

  if (error) {
    console.error("[gifts/received-count] error", error);
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
