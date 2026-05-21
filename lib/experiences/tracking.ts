/**
 * Tracking helper per click affiliate.
 *
 * - Hash IP/UA con SHA-256(salt + value) per privacy GDPR
 * - Generate tracking_id univoco per gift+experience+timestamp
 * - Insert click record (chiamato da /api/r/[token])
 *
 * Salt sale via env var EXPERIENCE_TRACKING_SALT (random 32+ char).
 * Cambiare salt = invalida i match storici → fare ATTENZIONE in
 * produzione (gestire come secret immutabile).
 */

import { createHash } from "crypto";
import type { ClickSource } from "@/types/experiences";

/** Hash deterministico privacy-safe (no PII raw in DB) */
export function hashWithSalt(value: string | null | undefined): string | null {
  if (!value) return null;
  const salt = process.env.EXPERIENCE_TRACKING_SALT;
  if (!salt) {
    console.warn(
      "[experiences/tracking] EXPERIENCE_TRACKING_SALT not configured, skipping hash"
    );
    return null;
  }
  return createHash("sha256")
    .update(salt + value)
    .digest("hex");
}

/** Genera tracking_id univoco per attribution con partner */
export function generateTrackingId(giftId: string): string {
  // Format: gift_{giftId8}_{ts36}
  // - giftId8 = primi 8 char del gift uuid (sufficient per match)
  // - ts36   = unix timestamp ms in base 36 (compatto)
  const short = giftId.replace(/-/g, "").slice(0, 8);
  const ts = Date.now().toString(36);
  return `g_${short}_${ts}`;
}

/** Builder helper per il payload da inserire in experience_clicks */
export interface LogClickPayload {
  experience_id: string;
  partner_id: string;
  gift_id: string | null;
  user_id: string | null;
  tracking_id: string;
  source: ClickSource | null;
  ip_hash: string | null;
  ua_hash: string | null;
}

export function buildClickPayload(args: {
  experienceId: string;
  partnerId: string;
  giftId?: string | null;
  userId?: string | null;
  trackingId: string;
  source?: ClickSource | null;
  ip?: string | null;
  userAgent?: string | null;
}): LogClickPayload {
  return {
    experience_id: args.experienceId,
    partner_id: args.partnerId,
    gift_id: args.giftId ?? null,
    user_id: args.userId ?? null,
    tracking_id: args.trackingId,
    source: args.source ?? null,
    ip_hash: hashWithSalt(args.ip ?? null),
    ua_hash: hashWithSalt(args.userAgent ?? null),
  };
}

/**
 * Anti-fraud check rudimentale: numero click dallo stesso ip_hash
 * nelle ultime 24h. Se sopra soglia → 429 e non redirect.
 *
 * Esempio uso:
 *   const count = await countRecentClicksByIp(supabase, ipHash);
 *   if (count > 30) return 429;
 *
 * Soglia 30/24h pensata per: legit user che apre 3-4 gift + curiosity
 * non eccede mai. Click farm di solito 100+/h.
 */
export async function countRecentClicksByIp(
  supabase: { from: (t: string) => unknown },
  ipHash: string | null,
  windowHours = 24
): Promise<number> {
  if (!ipHash) return 0;
  const since = new Date(
    Date.now() - windowHours * 60 * 60 * 1000
  ).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase.from("experience_clicks") as any)
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("clicked_at", since);
  return count ?? 0;
}
