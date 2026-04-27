"use client";

/**
 * SongPicker — campo cerca canzone via Spotify Search API.
 *
 * UX:
 *  - Input "Cerca canzone" con debounce 300ms
 *  - Risultati cliccabili (cover 56x56, titolo, artista, durata)
 *  - Click → setta value (URL Spotify) + mostra preview compatta
 *  - Snippet "preview" 30s in audio se disponibile
 *  - Fallback: link "preferisci incollare un URL?" che mostra input
 *    libero per chi ha gia' un link Spotify/YouTube/Apple Music
 *
 * API: GET /api/spotify/search?q=...&limit=5 (auth required).
 *
 * Quando l'env var SPOTIFY_CLIENT_ID non e' settata, l'API ritorna
 * 503 → mostriamo solo l'input URL libero.
 */

import { useEffect, useState, useRef } from "react";
import { fetchAuthed } from "@/lib/clientAuth";

const ACCENT = "#D4537E";
const DEEP = "#1a1a1a";
const MUTED = "#888";
const BORDER = "#e0dbd5";

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string;
  album: string;
  imageUrl: string | null;
  spotifyUrl: string;
  durationMs: number;
  previewUrl: string | null;
}

interface Props {
  /** URL canzone selezionata (Spotify, YouTube, Apple Music, ecc.). */
  value: string;
  /** Callback chiamato sempre dopo selezione/rimozione: per default
   *  passa lo spotifyUrl. Se serve la track completa (es. previewUrl
   *  per usare l'mp3 30s come packaging sound), passa anche
   *  onPickTrack. */
  onChange: (url: string) => void;
  /** Callback opzionale con la track completa, chiamato dopo onChange
   *  quando l'utente clicca un risultato. Non viene chiamato in
   *  modalita' URL libero. */
  onPickTrack?: (track: SpotifyTrack) => void;
  /** Filtro opzionale: se true, mostra SOLO le tracks che hanno
   *  previewUrl (utile per packaging sound dove serve l'mp3). */
  requirePreview?: boolean;
  /** Hint sotto al campo. Default: "Cerca per titolo o artista". */
  hint?: string;
}

export function SongPicker({ value, onChange, onPickTrack, requirePreview, hint }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUrlMode, setShowUrlMode] = useState(false);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
  const [selected, setSelected] = useState<SpotifyTrack | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchAuthed(`/api/spotify/search?q=${encodeURIComponent(q)}&limit=5`);
        if (res.status === 503) {
          // Spotify non configurato server-side → fallback a input URL
          setSearchUnavailable(true);
          setShowUrlMode(true);
          setResults(null);
          return;
        }
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = await res.json();
        const tracks = (data.tracks ?? []) as SpotifyTrack[];
        // Se il chiamante richiede previewUrl (modalita' packaging sound),
        // filtriamo le tracks che ne sono prive (~10-15% in IT).
        setResults(requirePreview ? tracks.filter((t) => !!t.previewUrl) : tracks);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Se l'utente ha un value gia' settato (gia' compilato in passi precedenti
  // o link incollato manualmente in modalita' URL), non lo sovrascriviamo.
  // Mostriamo lo stato selezionato se proviene da un click sui risultati.
  const handlePick = (t: SpotifyTrack) => {
    setSelected(t);
    onChange(t.spotifyUrl);
    onPickTrack?.(t);
    setQuery("");
    setResults(null);
  };

  const clearSelection = () => {
    setSelected(null);
    onChange("");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 12,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    color: DEEP,
    fontFamily: "inherit",
  };

  // Stato selezionato → mostra card della canzone
  if (selected && value === selected.spotifyUrl) {
    return (
      <div>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#fff", border: `1.5px solid ${ACCENT}55`,
          borderRadius: 14, padding: "10px 12px",
          boxShadow: "0 4px 12px rgba(212,83,126,.1)",
        }}>
          {selected.imageUrl ? (
            <img src={selected.imageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 8, background: "#eee", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>♪</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: DEEP, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selected.name}
            </div>
            <div style={{ fontSize: 12, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
              {selected.artists}
            </div>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Rimuovi canzone"
            style={{
              background: "transparent", border: "none",
              color: MUTED, fontSize: 18, cursor: "pointer",
              padding: 6, lineHeight: 1, flexShrink: 0,
            }}
          >×</button>
        </div>
        {selected.previewUrl && (
          <audio
            src={selected.previewUrl}
            controls
            style={{ width: "100%", marginTop: 8, height: 32 }}
          />
        )}
      </div>
    );
  }

  // Modalita' URL libero (legacy / fallback)
  if (showUrlMode) {
    return (
      <div>
        <input
          type="url"
          placeholder="https://open.spotify.com/track/…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="url"
          style={inputStyle}
          autoFocus
        />
        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>
          {searchUnavailable
            ? "Cerca canzone non disponibile al momento. Incolla un link Spotify, YouTube o Apple Music."
            : "Incolla un link Spotify, YouTube o Apple Music."}
        </div>
        {!searchUnavailable && (
          <button
            type="button"
            onClick={() => { setShowUrlMode(false); setQuery(""); }}
            style={{
              background: "transparent", border: "none",
              color: ACCENT, fontSize: 12, fontWeight: 600,
              cursor: "pointer", marginTop: 8, padding: 0,
              textDecoration: "underline",
            }}
          >
            ← Torna a cerca canzone
          </button>
        )}
      </div>
    );
  }

  // Modalita' search (default)
  return (
    <div>
      <input
        type="text"
        placeholder="Cerca canzone (titolo, artista, album)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        style={inputStyle}
      />

      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>
        {hint ?? "Cerca per titolo, artista o album. Tocca per scegliere."}
      </div>

      {loading && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, textAlign: "center", padding: 10 }}>
          Cerco…
        </div>
      )}

      {!loading && results && results.length === 0 && query.trim().length >= 2 && (
        <div style={{ marginTop: 10, fontSize: 12, color: MUTED, textAlign: "center", padding: 10 }}>
          Nessun risultato per <strong>"{query}"</strong>. Prova con un titolo o artista diverso.
        </div>
      )}

      {!loading && results && results.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {results.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handlePick(t)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "#fff", border: `1px solid ${BORDER}`,
                borderRadius: 12, padding: "8px 10px",
                cursor: "pointer", fontFamily: "inherit",
                textAlign: "left", width: "100%",
                transition: "border-color .15s, background .15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = "#fff9fb"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "#fff"; }}
            >
              {t.imageUrl ? (
                <img src={t.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 6, background: "#eee", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>♪</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: DEEP, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name}
                </div>
                <div style={{ fontSize: 11.5, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                  {t.artists}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowUrlMode(true)}
        style={{
          background: "transparent", border: "none",
          color: ACCENT, fontSize: 12, fontWeight: 600,
          cursor: "pointer", marginTop: 12, padding: 0,
          textDecoration: "underline",
        }}
      >
        Preferisci incollare un URL? →
      </button>
    </div>
  );
}
