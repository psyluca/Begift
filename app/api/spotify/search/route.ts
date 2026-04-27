/**
 * GET /api/spotify/search?q=la+cura+battiato&limit=5
 *
 * Wrapper sull'API Spotify Search Track. Auth utente richiesta
 * (Bearer o cookie) per evitare uso anonimo che potrebbe esaurire
 * la quota Spotify (anche se generosa, ~180 req/min su Client
 * Credentials).
 *
 * Rate limit lato app: max 30 query/min per utente. Caching delle
 * query identiche per 5 minuti (in-memory, per istanza Vercel).
 *
 * Response shape:
 *   200 { tracks: [SpotifyTrack, ...] }
 *   400 { error: "missing_query" }
 *   401 { error: "unauthorized" }
 *   429 { error: "rate_limited" }
 *   503 { error: "spotify_unavailable" }  // env var mancanti
 */

import { searchTracks } from "@/lib/spotify";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Rate limit semplice in-memory per istanza Vercel.
// Per uso real-time multi-istanza servirebbe Redis, ma per beta
// (poche query parallele) e' piu' che sufficiente.
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;

const cacheMap = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60_000;

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) return data.user.id;
  }
  const supabase = createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Spotify creds presenti?
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return NextResponse.json({ error: "spotify_unavailable" }, { status: 503 });
  }

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ error: "missing_query" }, { status: 400 });
  const limit = Math.max(1, Math.min(10, Number(req.nextUrl.searchParams.get("limit")) || 5));

  // Rate limit per user
  const now = Date.now();
  const slot = rateMap.get(userId);
  if (slot && slot.resetAt > now) {
    if (slot.count >= RATE_MAX) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    slot.count++;
  } else {
    rateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
  }

  // Cache (per query+limit)
  const cacheKey = `${q.toLowerCase()}::${limit}`;
  const cached = cacheMap.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data);
  }

  const tracks = await searchTracks(q, limit);
  const payload = { tracks };
  cacheMap.set(cacheKey, { data: payload, expiresAt: now + CACHE_TTL_MS });

  // Cleanup occasionale (ogni 100 entry, butta le scadute).
  // Uso forEach per compatibilita' col target ES2015 di tsconfig
  // (downlevelIteration non e' attivo nel progetto).
  if (cacheMap.size > 200) {
    const toDelete: string[] = [];
    cacheMap.forEach((v, k) => {
      if (v.expiresAt < now) toDelete.push(k);
    });
    for (const k of toDelete) cacheMap.delete(k);
  }

  return NextResponse.json(payload);
}
