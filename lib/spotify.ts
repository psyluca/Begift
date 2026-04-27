/**
 * Client per Spotify Web API — solo "Search Track" via Client
 * Credentials Flow (NO consenso utente richiesto).
 *
 * Auth pattern:
 *   1. POST https://accounts.spotify.com/api/token con
 *      grant_type=client_credentials e Basic auth (client_id:client_secret)
 *   2. Spotify ritorna access_token (durata ~3600s)
 *   3. Cacheamo in memoria (modulo) per evitare di richiamare
 *      l'auth endpoint a ogni search
 *
 * Configurazione via env var:
 *   SPOTIFY_CLIENT_ID      — obbligatoria (settata su Vercel)
 *   SPOTIFY_CLIENT_SECRET  — obbligatoria
 *
 * Se le env var sono assenti, le funzioni qui ritornano arrays vuoti
 * silenziosamente (graceful degradation per dev senza credenziali).
 */

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const SEARCH_URL = "https://api.spotify.com/v1/search";

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

let tokenCache: CachedToken | null = null;

/** Ottiene un access_token valido, riusando la cache se possibile.
 *  Margine di 60s di sicurezza prima dell'expire dichiarato. */
async function getAccessToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) {
      console.error("[spotify] token request failed", res.status);
      return null;
    }
    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    const expiresIn = (data.expires_in ?? 3600) * 1000;
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + expiresIn,
    };
    return tokenCache.token;
  } catch (e) {
    console.error("[spotify] token request error", e);
    return null;
  }
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string;          // Joined "Artist1, Artist2"
  album: string;
  imageUrl: string | null;  // Album cover (640px o piu' piccolo)
  spotifyUrl: string;       // open.spotify.com/track/{id} — ben formattato per il player
  durationMs: number;
  previewUrl: string | null; // Snippet 30s (puo' essere null per alcuni paesi)
}

interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string; width: number; height: number }[] };
  external_urls: { spotify: string };
  duration_ms: number;
  preview_url: string | null;
}

/** Cerca tracce per query libera. Ritorna max `limit` risultati.
 *  Se le credenziali non sono settate o c'e' un errore, ritorna []. */
export async function searchTracks(query: string, limit = 5, market = "IT"): Promise<SpotifyTrack[]> {
  const q = query.trim();
  if (!q) return [];
  const token = await getAccessToken();
  if (!token) return [];

  const params = new URLSearchParams({
    q,
    type: "track",
    limit: String(Math.max(1, Math.min(20, limit))),
    market,
  });

  try {
    const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error("[spotify] search failed", res.status);
      // 401 = token scaduto/invalido. Invalida cache e prossima richiesta riproverà.
      if (res.status === 401) tokenCache = null;
      return [];
    }
    const data = await res.json() as { tracks?: { items?: SpotifyApiTrack[] } };
    const items = data.tracks?.items ?? [];
    return items.map((t): SpotifyTrack => {
      // Cover: prendiamo la piu' piccola >= 200px, fallback alla prima.
      const images = t.album.images || [];
      const cover = images.find((i) => i.width >= 200 && i.width <= 400)
        ?? images[Math.floor(images.length / 2)]
        ?? images[0];
      return {
        id: t.id,
        name: t.name,
        artists: t.artists.map((a) => a.name).join(", "),
        album: t.album.name,
        imageUrl: cover?.url ?? null,
        spotifyUrl: t.external_urls.spotify,
        durationMs: t.duration_ms,
        previewUrl: t.preview_url,
      };
    });
  } catch (e) {
    console.error("[spotify] search error", e);
    return [];
  }
}
