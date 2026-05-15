/**
 * Ricerca YouTube come fallback quando l'HTML della mail non contiene
 * un'immagine "hero" usabile (es. mail TicketOne con solo logo
 * TicketOne, o mail testuali senza HTML).
 *
 * Strategia:
 *  1. Claude genera `suggested_youtube_query` (vedi prompts.ts)
 *  2. Chiamiamo YouTube Data API v3 (free 10K req/day)
 *  3. Prendiamo il primo video con durata > 60s (filtra short/clickbait)
 *  4. Restituiamo `https://www.youtube.com/watch?v=<videoId>`, formato
 *     gia' supportato dal renderer BeGift in GiftOpeningClient.tsx.
 *
 * Env var richiesta: YOUTUBE_API_KEY
 *   Console Google Cloud → APIs & Services → Enable "YouTube Data API
 *   v3" → Credentials → Create API key (restrict to YouTube Data API
 *   per sicurezza). Free tier: 10000 quota units/day; una search
 *   costa 100 unit, quindi 100 ricerche/giorno gratis. Enough per POC.
 *
 * Non blocca il flusso se la key non e' configurata o l'API fallisce:
 * ritorna null e il completion endpoint cade su content_type='message'.
 */

interface YouTubeSearchOptions {
  /** Max video duration filter (es. exclude shorts < 60s) */
  minDurationSeconds?: number;
  /** Max API response size, default 5 */
  maxResults?: number;
  /** Region code per il ranking (default IT) */
  regionCode?: string;
}

interface YouTubeVideo {
  videoId: string;
  watchUrl: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
}

/**
 * Cerca il top video YouTube per la query data.
 * Ritorna null in tutti i casi di errore (key mancante, no results, network).
 */
export async function searchYouTubeTopVideo(
  query: string,
  opts: YouTubeSearchOptions = {}
): Promise<YouTubeVideo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("[youtube-search] YOUTUBE_API_KEY not configured");
    return null;
  }
  if (!query || query.trim().length === 0) {
    return null;
  }

  const maxResults = opts.maxResults ?? 5;
  const regionCode = opts.regionCode ?? "IT";

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", query.trim());
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", String(maxResults));
  searchUrl.searchParams.set("regionCode", regionCode);
  searchUrl.searchParams.set("relevanceLanguage", "it");
  // videoEmbeddable=true filtra i video che NON possono essere embeddati
  // (essenziale: se l'utente apre il gift, vogliamo che l'iframe parta)
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("safeSearch", "moderate");
  searchUrl.searchParams.set("key", apiKey);

  let searchData: {
    items?: Array<{
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        publishedAt: string;
        thumbnails: { high?: { url: string }; medium?: { url: string } };
      };
    }>;
  };
  try {
    const res = await fetch(searchUrl.toString(), {
      // Timeout breve: se YouTube non risponde in 5s, skip
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(
        `[youtube-search] search HTTP ${res.status}: ${errText.slice(0, 200)}`
      );
      return null;
    }
    searchData = await res.json();
  } catch (e) {
    console.warn("[youtube-search] search exception", e);
    return null;
  }

  if (!searchData.items || searchData.items.length === 0) {
    return null;
  }

  // Filtra per durata se richiesto (richiede 2a chiamata videos.list)
  const minDuration = opts.minDurationSeconds ?? 60;
  if (minDuration > 0) {
    const videoIds = searchData.items.map((it) => it.id.videoId).join(",");
    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.searchParams.set("part", "contentDetails");
    detailsUrl.searchParams.set("id", videoIds);
    detailsUrl.searchParams.set("key", apiKey);

    try {
      const detRes = await fetch(detailsUrl.toString(), {
        signal: AbortSignal.timeout(5000),
      });
      if (detRes.ok) {
        const detData = (await detRes.json()) as {
          items?: Array<{ id: string; contentDetails: { duration: string } }>;
        };
        const durationsMap = new Map<string, number>();
        for (const v of detData.items || []) {
          durationsMap.set(v.id, parseIso8601Duration(v.contentDetails.duration));
        }
        // Filtra i risultati search per durata
        const filtered = searchData.items.filter((it) => {
          const d = durationsMap.get(it.id.videoId) ?? 0;
          return d >= minDuration;
        });
        if (filtered.length > 0) {
          searchData.items = filtered;
        }
        // Se nessuno passa il filtro durata, restiamo con la lista
        // originale per evitare di tornare null senza necessita'
      }
    } catch (e) {
      console.warn(
        "[youtube-search] details lookup failed, using unfiltered results",
        e
      );
    }
  }

  const top = searchData.items[0];
  if (!top) return null;

  return {
    videoId: top.id.videoId,
    watchUrl: `https://www.youtube.com/watch?v=${top.id.videoId}`,
    title: top.snippet.title,
    channelTitle: top.snippet.channelTitle,
    thumbnailUrl:
      top.snippet.thumbnails.high?.url ||
      top.snippet.thumbnails.medium?.url ||
      `https://i.ytimg.com/vi/${top.id.videoId}/hqdefault.jpg`,
    publishedAt: top.snippet.publishedAt,
  };
}

/**
 * Converte una durata ISO 8601 (es. "PT4M13S") in secondi totali.
 * YouTube usa questo formato in contentDetails.duration.
 */
function parseIso8601Duration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  const sec = parseInt(m[3] || "0", 10);
  return h * 3600 + min * 60 + sec;
}
