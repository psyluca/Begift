/**
 * GET /api/profile/gift-count
 *
 * Restituisce il numero totale di gift creati dall'utente loggato.
 * Usato dal MilestoneToast per decidere se mostrare un riconoscimento
 * di "soglia tonda raggiunta" (3, 5, 10, 25, 50, 100).
 *
 * Auth: Bearer (preferito) o cookie SSR. Senza auth { count: 0 }.
 */

export const dynamic = "force-dynamic";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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
  if (!userId) return NextResponse.json({ count: 0 });

  const { count, error } = await admin
    .from("gifts")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", userId);

  if (error) {
    console.error("[profile/gift-count] error", error);
    return NextResponse.json({ count: 0 });
  }
  return NextResponse.json({ count: count ?? 0 });
}
