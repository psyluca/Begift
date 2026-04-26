/**
 * POST /api/notifications/mark-read
 *
 * Marca come lette le notifiche dell'utente loggato. Body:
 *   { ids?: string[] }   -- se ids fornito, marca solo quelle
 *                          (anche se non sono dell'utente, il filtro
 *                          su user_id evita scrittura cross-user)
 *   {}                    -- senza ids, marca TUTTE le non-lette
 *                          dell'utente (uso "mark all as read")
 *
 * Auth: Bearer / cookie SSR. Senza auth: 401.
 */

export const dynamic = "force-dynamic";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const admin = createSupabaseAdmin();

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
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as { ids?: string[] }));
  const ids = Array.isArray(body?.ids) ? (body.ids as string[]).filter(Boolean) : null;

  let query = admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  const { error } = await query;
  if (error) {
    console.error("[notifications/mark-read] error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
