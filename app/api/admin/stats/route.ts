/**
 * GET /api/admin/stats
 *
 * Aggrega numeri chiave per la dashboard admin. Protetto da
 * ADMIN_EMAILS env var: solo le email in whitelist possono
 * accedere (altrimenti 403). Uso service_role per bypassare
 * RLS e fare aggregate queries.
 *
 * Response shape:
 *   {
 *     totals: {
 *       gifts_created, gifts_opened, users_total, reactions_total,
 *       push_subs, scheduled_future, opening_rate
 *     },
 *     activity_7d: { users_active, gifts_created, gifts_opened },
 *     trend_30d: [{ date, created, opened, new_users }, ...],
 *     content_types: [{ type, count }, ...],
 *     tiers: [{ tier, count }, ...],
 *     top_creators: [{ id, email, username, count }, ...]
 *   }
 */

import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Auth: Bearer token prima (robusto), cookie come fallback.
  // Il cookie-based auth di createSupabaseServer può essere flaky
  // su refresh/rotazione token; Bearer dal localStorage client è
  // più affidabile per queste API protette.
  let email: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) email = data.user.email ?? null;
  }
  if (!email) {
    const supabase = createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  }
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const now = new Date();
  const d1 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const d2 = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // ── Totali ─────────────────────────────────────────────────────
  const [
    giftsTotal,
    openedDistinct,
    usersTotal,
    reactionsTotal,
    pushSubs,
    scheduledFuture,
  ] = await Promise.all([
    admin.from("gifts").select("id", { count: "exact", head: true }),
    // Aperture distinte per gift_id (evitiamo di contare la stessa
    // persona che riapre più volte lo stesso gift)
    admin.rpc("count_distinct_opened_gifts").then(
      (r) => r,
      () => ({ data: null, error: { message: "rpc missing" } })
    ),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("reactions").select("id", { count: "exact", head: true }),
    admin.from("push_subscriptions").select("id", { count: "exact", head: true }).then(
      (r) => r,
      () => ({ count: 0, error: null as unknown })
    ),
    admin.from("gifts").select("id", { count: "exact", head: true }).gt("scheduled_at", now.toISOString()),
  ]);

  // Fallback per count_distinct_opened_gifts se la RPC non esiste:
  // fetch tutti gli opens e deduplichiamo in-memory
  let openedCount = 0;
  if (openedDistinct && typeof (openedDistinct as { data?: unknown }).data === "number") {
    openedCount = (openedDistinct as { data: number }).data;
  } else {
    const { data: opens } = await admin.from("gift_opens").select("gift_id");
    const set = new Set<string>();
    (opens ?? []).forEach((o: { gift_id: string }) => set.add(o.gift_id));
    openedCount = set.size;
  }

  const giftsTotalCount = giftsTotal.count ?? 0;
  const usersTotalCount = usersTotal.count ?? 0;
  const reactionsTotalCount = reactionsTotal.count ?? 0;
  const pushSubsCount = (pushSubs as { count?: number }).count ?? 0;
  const scheduledFutureCount = scheduledFuture.count ?? 0;

  const openingRate = giftsTotalCount > 0 ? openedCount / giftsTotalCount : 0;

  // ── Activity ultimi 7 giorni ───────────────────────────────────
  const [created7d, opens7d] = await Promise.all([
    admin.from("gifts").select("creator_id").gte("created_at", d7),
    admin.from("gift_opens").select("user_id, gift_id").gte("opened_at", d7),
  ]);
  const activeUsersSet = new Set<string>();
  (created7d.data ?? []).forEach((g: { creator_id: string }) => activeUsersSet.add(g.creator_id));
  (opens7d.data ?? []).forEach((o: { user_id: string | null }) => {
    if (o.user_id) activeUsersSet.add(o.user_id);
  });
  const opened7dSet = new Set<string>();
  (opens7d.data ?? []).forEach((o: { gift_id: string }) => opened7dSet.add(o.gift_id));

  // ── Trend 30 giorni ────────────────────────────────────────────
  const [created30d, opens30d, users30d] = await Promise.all([
    admin.from("gifts").select("created_at").gte("created_at", d30),
    admin.from("gift_opens").select("opened_at, gift_id").gte("opened_at", d30),
    admin.from("profiles").select("created_at").gte("created_at", d30),
  ]);

  // Genera array di 30 giorni (oggi incluso, più indietro) con
  // contatori inizializzati a 0. Date format YYYY-MM-DD (locale).
  const trendMap = new Map<string, { created: number; opened: number; new_users: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    trendMap.set(key, { created: 0, opened: 0, new_users: 0 });
  }
  (created30d.data ?? []).forEach((g: { created_at: string }) => {
    const k = g.created_at.slice(0, 10);
    const b = trendMap.get(k);
    if (b) b.created++;
  });
  // Aperture: contiamo distinct gift_id per giorno (stessa logica
  // del totale — un gift riaperto non conta di nuovo)
  const openedByDay = new Map<string, Set<string>>();
  (opens30d.data ?? []).forEach((o: { opened_at: string; gift_id: string }) => {
    const k = o.opened_at.slice(0, 10);
    if (!openedByDay.has(k)) openedByDay.set(k, new Set());
    openedByDay.get(k)!.add(o.gift_id);
  });
  openedByDay.forEach((set, k) => {
    const b = trendMap.get(k);
    if (b) b.opened = set.size;
  });
  (users30d.data ?? []).forEach((u: { created_at: string }) => {
    const k = u.created_at.slice(0, 10);
    const b = trendMap.get(k);
    if (b) b.new_users++;
  });

  const trend30d = Array.from(trendMap.entries()).map(([date, v]) => ({
    date,
    created: v.created,
    opened: v.opened,
    new_users: v.new_users,
  }));

  // ── Breakdown content type ─────────────────────────────────────
  const { data: contentData } = await admin.from("gifts").select("content_type");
  const contentCounts = new Map<string, number>();
  (contentData ?? []).forEach((g: { content_type: string | null }) => {
    const t = g.content_type || "unknown";
    contentCounts.set(t, (contentCounts.get(t) || 0) + 1);
  });
  const contentTypes = Array.from(contentCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // ── Breakdown tier (se colonna esiste) ─────────────────────────
  let tiers: { tier: string; count: number }[] = [];
  try {
    const { data: tierData } = await admin.from("profiles").select("tier");
    if (tierData) {
      const tierCounts = new Map<string, number>();
      (tierData as { tier: string | null }[]).forEach((p) => {
        const t = p.tier || "free";
        tierCounts.set(t, (tierCounts.get(t) || 0) + 1);
      });
      tiers = Array.from(tierCounts.entries())
        .map(([tier, count]) => ({ tier, count }))
        .sort((a, b) => b.count - a.count);
    }
  } catch {
    // Colonna tier non ancora presente — ignora
  }

  // ── Top 10 creator per numero gift ─────────────────────────────
  const { data: allGifts } = await admin.from("gifts").select("creator_id");
  const creatorCounts = new Map<string, number>();
  (allGifts ?? []).forEach((g: { creator_id: string }) => {
    creatorCounts.set(g.creator_id, (creatorCounts.get(g.creator_id) || 0) + 1);
  });
  const topIds = Array.from(creatorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const topCreators: { id: string; email: string | null; username: string | null; count: number }[] = [];
  if (topIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, username")
      .in("id", topIds.map(([id]) => id));
    const profileMap = new Map<string, { email: string | null; username: string | null }>();
    (profiles ?? []).forEach((p: { id: string; email: string | null; username: string | null }) => {
      profileMap.set(p.id, { email: p.email, username: p.username });
    });
    for (const [id, count] of topIds) {
      const p = profileMap.get(id);
      topCreators.push({
        id,
        email: p?.email ?? null,
        username: p?.username ?? null,
        count,
      });
    }
  }

  // ── Health pre-launch (post 2026-04-27) ───────────────────────
  // Metriche per il founder per monitorare la prima settimana di
  // lancio. Pensate per essere "actionable" — se un numero e'
  // brutto, c'e' qualcosa da fare subito.
  const [
    reportsOpenRes,
    reports24hRes,
    created24hRes,
    createdYesterdayRes,
    opens24hRes,
    users24hRes,
  ] = await Promise.all([
    // Segnalazioni DSA aperte (status pending/open) — devono essere
    // gestite in tempi ragionevoli per non perdere safe harbor.
    admin.from("reports").select("id", { count: "exact", head: true }).in("status", ["pending", "open"]).then(
      (r) => r,
      () => ({ count: 0, error: null as unknown })
    ),
    admin.from("reports").select("id", { count: "exact", head: true }).gte("created_at", d1).then(
      (r) => r,
      () => ({ count: 0, error: null as unknown })
    ),
    admin.from("gifts").select("id", { count: "exact", head: true }).gte("created_at", d1),
    admin.from("gifts").select("id", { count: "exact", head: true }).gte("created_at", d2).lt("created_at", d1),
    admin.from("gift_opens").select("gift_id").gte("opened_at", d1),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d1),
  ]);

  const reportsOpen = (reportsOpenRes as { count?: number }).count ?? 0;
  const reports24h = (reports24hRes as { count?: number }).count ?? 0;
  const created24h = created24hRes.count ?? 0;
  const createdYesterday = createdYesterdayRes.count ?? 0;
  const opens24hSet = new Set<string>();
  (opens24hRes.data ?? []).forEach((o: { gift_id: string }) => opens24hSet.add(o.gift_id));
  const opened24h = opens24hSet.size;
  const newUsers24h = users24hRes.count ?? 0;

  // Variazione % oggi vs ieri (clip a +/-999% per evitare numeri
  // ridicoli quando ieri = 0). Se entrambi sono 0, e' "—".
  let createdVsYesterdayPct: number | null = null;
  if (createdYesterday > 0) {
    createdVsYesterdayPct = Math.round(((created24h - createdYesterday) / createdYesterday) * 100);
    createdVsYesterdayPct = Math.max(-999, Math.min(999, createdVsYesterdayPct));
  } else if (created24h > 0) {
    createdVsYesterdayPct = 999; // novita' (da 0 a qualcosa)
  }

  // Funnel signup → primo gift (utenti registrati negli ultimi 7gg
  // che hanno creato almeno un gift). Indicatore di onboarding.
  const { data: newUsers7d } = await admin
    .from("profiles")
    .select("id")
    .gte("created_at", d7);
  const newUserIds = (newUsers7d ?? []).map((u: { id: string }) => u.id);
  let funnelFirstGift = 0;
  if (newUserIds.length > 0) {
    const { data: theirGifts } = await admin
      .from("gifts")
      .select("creator_id")
      .in("creator_id", newUserIds);
    const creatorsWithGift = new Set<string>();
    (theirGifts ?? []).forEach((g: { creator_id: string }) => creatorsWithGift.add(g.creator_id));
    funnelFirstGift = creatorsWithGift.size;
  }
  const funnelConversionRate = newUserIds.length > 0 ? funnelFirstGift / newUserIds.length : 0;

  return NextResponse.json({
    totals: {
      gifts_created: giftsTotalCount,
      gifts_opened: openedCount,
      opening_rate: openingRate,
      users_total: usersTotalCount,
      reactions_total: reactionsTotalCount,
      push_subs: pushSubsCount,
      scheduled_future: scheduledFutureCount,
    },
    activity_7d: {
      users_active: activeUsersSet.size,
      gifts_created: created7d.data?.length ?? 0,
      gifts_opened: opened7dSet.size,
    },
    activity_24h: {
      gifts_created: created24h,
      gifts_opened: opened24h,
      new_users: newUsers24h,
      gifts_created_vs_yesterday_pct: createdVsYesterdayPct,
    },
    health: {
      reports_open: reportsOpen,
      reports_24h: reports24h,
      funnel_signup_to_first_gift_7d: {
        new_users: newUserIds.length,
        with_first_gift: funnelFirstGift,
        rate: funnelConversionRate,
      },
    },
    trend_30d: trend30d,
    content_types: contentTypes,
    tiers,
    top_creators: topCreators,
  });
}
