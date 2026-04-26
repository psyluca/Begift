/**
 * GET /api/gifts/one-year-ago
 *
 * Restituisce UN regalo che l'utente loggato ha mandato esattamente
 * un anno fa (in una finestra di +/- 7 giorni). Se nessun match,
 * ritorna { gift: null }.
 *
 * Usato dal widget OneYearAgoWidget in dashboard come leva di retention
 * "replay del proprio archivio" + nudge a rifare il gesto per la stessa
 * persona.
 *
 * Auth: Bearer (preferito) o cookie SSR. Senza auth ritorna gift: null.
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
  if (!userId) return NextResponse.json({ gift: null });

  // Finestra +/- 7 giorni intorno alla data di "un anno fa esatto".
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const start = new Date(oneYearAgo);
  start.setDate(start.getDate() - 7);
  const end = new Date(oneYearAgo);
  end.setDate(end.getDate() + 7);

  const { data, error } = await admin
    .from("gifts")
    .select("id, recipient_name, created_at, packaging, template_type")
    .eq("creator_id", userId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[gifts/one-year-ago] error", error);
    return NextResponse.json({ gift: null });
  }
  return NextResponse.json({ gift: data ?? null });
}
