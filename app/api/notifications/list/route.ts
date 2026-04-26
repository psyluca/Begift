/**
 * GET /api/notifications/list?limit=50
 *
 * Lista notifiche dell'utente loggato in ordine cronologico discendente.
 * Per ogni notification arricchiamo i campi mancanti (title/body)
 * deducendoli dal type + gift collegato — la tabella notifications e'
 * minimal (user_id, type, gift_id, created_at, read_at) e i testi
 * vengono costruiti server-side in italiano.
 *
 * Auth: Bearer (preferito) o cookie SSR. Senza auth: 401.
 */

export const dynamic = "force-dynamic";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface NotifDb {
  id: string;
  user_id: string;
  type: string;
  gift_id: string | null;
  created_at: string;
  read_at: string | null;
}

interface NotifEnriched extends NotifDb {
  title: string;
  body: string;
  url: string;
  emoji: string;
}

function buildContent(
  n: NotifDb,
  giftMap: Record<string, { recipient_name?: string; sender_alias?: string }>
): { title: string; body: string; url: string; emoji: string } {
  const gift = n.gift_id ? giftMap[n.gift_id] : null;
  const sender = gift?.sender_alias || "Qualcuno";
  const recipient = gift?.recipient_name || "qualcuno";
  const giftUrl = n.gift_id ? `/gift/${n.gift_id}` : "/dashboard";

  switch (n.type) {
    case "gift_received":
      return {
        emoji: "🎁",
        title: `Hai ricevuto un regalo da ${sender}`,
        body: "Tocca per aprirlo.",
        url: giftUrl,
      };
    case "gift_opened":
      return {
        emoji: "🎉",
        title: `${recipient} ha aperto il tuo regalo`,
        body: "Vai a vedere se ha lasciato una reazione.",
        url: "/dashboard?tab=sent",
      };
    case "reaction":
      return {
        emoji: "💌",
        title: `${recipient} ha reagito al tuo regalo`,
        body: "Tocca per leggere la reazione.",
        url: giftUrl,
      };
    case "gift_chain":
      return {
        emoji: "🔁",
        title: `${recipient} ti ha ringraziato con un regalo`,
        body: "Aprilo, e' per te.",
        url: giftUrl,
      };
    default:
      return {
        emoji: "🔔",
        title: "Notifica",
        body: n.type,
        url: giftUrl,
      };
  }
}

export async function GET(req: NextRequest) {
  const admin = createSupabaseAdmin();
  const limit = Math.min(100, Number(req.nextUrl.searchParams.get("limit")) || 50);

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

  // Fetch notifiche
  const { data: notifs, error } = await admin
    .from("notifications")
    .select("id, user_id, type, gift_id, created_at, read_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[notifications/list] error", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  // Fetch gifts collegati per arricchire title/body
  const giftIds = Array.from(new Set((notifs ?? []).map((n) => n.gift_id).filter(Boolean))) as string[];
  let giftMap: Record<string, { recipient_name?: string; sender_alias?: string }> = {};
  if (giftIds.length > 0) {
    const { data: gifts } = await admin
      .from("gifts")
      .select("id, recipient_name, sender_alias")
      .in("id", giftIds);
    giftMap = Object.fromEntries(
      (gifts ?? []).map((g) => [
        (g as { id: string }).id,
        {
          recipient_name: (g as { recipient_name?: string }).recipient_name,
          sender_alias: (g as { sender_alias?: string }).sender_alias,
        },
      ])
    );
  }

  const enriched: NotifEnriched[] = (notifs ?? []).map((n: NotifDb) => ({
    ...n,
    ...buildContent(n, giftMap),
  }));

  // Conta non-letti totali (utile per badge)
  const { count: unreadCount } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return NextResponse.json({
    items: enriched,
    unread: unreadCount ?? 0,
  });
}
