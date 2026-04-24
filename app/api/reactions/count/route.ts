/**
 * GET /api/reactions/count?since=ISO
 *
 * Conta le reazioni ricevute dall'utente loggato dopo il timestamp
 * `since`. Una "reazione ricevuta" e' una reaction sui gifts in cui
 * lui e' creator_id.
 *
 * BUG fix 2026-04-25: la versione precedente contava TUTTE le
 * reazioni del DB senza filtro user_id, quindi il badge mostrava
 * conteggi globali (le reazioni di altri utenti). Ora richiede auth
 * obbligatoria e filtra correttamente.
 *
 * Auth: Bearer token o cookie SSR. Senza auth ritorna 0.
 * Risposta: { count: number }
 */

export const dynamic = "force-dynamic";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createSupabaseAdmin();
  const since = req.nextUrl.searchParams.get("since") ?? "1970-01-01";

  // Resolve userId: Bearer prima, cookie SSR fallback
  let userId: string | null = null;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const { data } = await supabase.auth.getUser(auth.slice(7));
    userId = data.user?.id ?? null;
  }
  if (!userId) {
    const at = req.cookies.get("sb-access-token")?.value;
    if (at) {
      const { data } = await supabase.auth.getUser(at);
      userId = data.user?.id ?? null;
    }
  }
  if (!userId) return NextResponse.json({ count: 0 });

  // Step 1: prendi gli id dei gift di cui l'utente e' creator.
  // Un singolo round-trip e' piu' efficiente di un JOIN nel client SDK.
  const { data: myGifts, error: giftsErr } = await supabase
    .from("gifts")
    .select("id")
    .eq("creator_id", userId);

  if (giftsErr) {
    console.error("[reactions/count] gifts lookup error", giftsErr);
    return NextResponse.json({ count: 0 });
  }
  const giftIds = (myGifts ?? []).map((g) => (g as { id: string }).id);
  if (giftIds.length === 0) return NextResponse.json({ count: 0 });

  // Step 2: conta solo le reazioni su QUEI gift, dopo `since`.
  const { count, error } = await supabase
    .from("reactions")
    .select("*", { count: "exact", head: true })
    .in("gift_id", giftIds)
    .gt("created_at", since);

  if (error) {
    console.error("[reactions/count] count error", error);
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
