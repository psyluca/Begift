"use client";

/**
 * MothersDayLetterReveal — vista "rivelata" del template Festa della
 * Mamma "Lettera che cresce". Renderizzata dentro GiftOpeningClient
 * dopo che il pacco e' stato scartato (phase === "revealed") quando
 * gift.template_type === "mothers_day_letter".
 *
 * Si occupa SOLO del contenuto post-apertura: sequenza emotiva di
 * Parola grande -> Polaroid -> Ricordo -> Lezione -> Canzone (embed)
 * -> Voucher (link).
 *
 * Layout pensato per essere letto in sequenza, dall'alto verso il
 * basso, con un ritmo simile a una poesia. Stile Georgia per le
 * parti emotive (titolo + ricordo) per separarle visivamente
 * dall'UI dell'app.
 */

import React from "react";

const ROSE = "#F4DCD8";
const GOLD = "#D4A340";
const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";

export interface MothersDayLetterData {
  word?: string | null;
  memory?: string | null;
  photo_url?: string | null;
  lesson?: string | null;
  song_url?: string | null;
  voucher_url?: string | null;
}

interface Props {
  data: MothersDayLetterData;
  recipientName: string;
  senderName?: string | null;
}

/** Estrae l'embed-URL da un link Spotify track o playlist. */
function spotifyEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("spotify.com")) return null;
    // open.spotify.com/track/XYZ -> open.spotify.com/embed/track/XYZ
    return u.origin + "/embed" + u.pathname;
  } catch {
    return null;
  }
}

/** Estrae l'embed-URL da un link YouTube. */
function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function MothersDayLetterReveal({ data, recipientName, senderName }: Props) {
  const spotifySrc = data.song_url ? spotifyEmbed(data.song_url) : null;
  const youtubeSrc = data.song_url ? youtubeEmbed(data.song_url) : null;

  return (
    <div style={{
      maxWidth: 480,
      margin: "0 auto",
      padding: "32px 22px 60px",
      background: `linear-gradient(180deg, ${ROSE} 0%, #FFFFFF 200px)`,
      borderRadius: 20,
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Titolo: la parola in calligrafia oro */}
      {data.word && (
        <div style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: "clamp(46px, 12vw, 72px)",
          color: GOLD,
          textAlign: "center",
          lineHeight: 1.05,
          margin: "12px 0 24px",
          letterSpacing: "-1px",
        }}>
          &ldquo;{data.word}&rdquo;
        </div>
      )}

      {/* Polaroid */}
      {data.photo_url && (
        <div style={{ textAlign: "center", margin: "0 0 28px" }}>
          <div style={{
            display: "inline-block",
            padding: 10,
            background: "#fff",
            border: "10px solid #fff",
            boxShadow: "0 12px 30px rgba(0,0,0,.18)",
            transform: "rotate(-3deg)",
            position: "relative",
          }}>
            <img
              src={data.photo_url}
              alt={`Una foto di ${recipientName}`}
              style={{ display: "block", width: "min(260px, 70vw)", height: "min(260px, 70vw)", objectFit: "cover" }}
            />
            {/* Scotch carta in alto */}
            <div style={{
              position: "absolute",
              top: -10,
              left: "50%",
              transform: "translateX(-50%) rotate(-5deg)",
              width: 70,
              height: 18,
              background: "rgba(220,200,170,.7)",
              boxShadow: "0 1px 2px rgba(0,0,0,.1)",
            }}/>
          </div>
        </div>
      )}

      {/* Ricordo */}
      {data.memory && (
        <div style={{ margin: "0 0 28px" }}>
          <div style={{ fontSize: 12, color: MUTED, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 10, textAlign: "center" }}>
            Il mio ricordo più nitido con te
          </div>
          <p style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(17px, 4.5vw, 21px)",
            color: DEEP,
            lineHeight: 1.55,
            textAlign: "center",
            fontStyle: "italic",
            margin: 0,
          }}>
            &ldquo;{data.memory}&rdquo;
          </p>
        </div>
      )}

      {/* Lezione */}
      {data.lesson && (
        <div style={{
          margin: "0 0 28px",
          padding: "20px 22px",
          background: "#fffaf0",
          border: `1px solid ${ROSE}`,
          borderRadius: 14,
        }}>
          <div style={{ fontSize: 12, color: MUTED, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
            Quello che mi hai insegnato senza dirmelo
          </div>
          <p style={{
            fontSize: "clamp(15px, 4vw, 17px)",
            color: DEEP,
            lineHeight: 1.5,
            textAlign: "center",
            margin: 0,
          }}>
            {data.lesson}
          </p>
        </div>
      )}

      {/* Canzone */}
      {(spotifySrc || youtubeSrc) && (
        <div style={{ margin: "0 0 28px" }}>
          <div style={{ fontSize: 13, color: GOLD, textAlign: "center", marginBottom: 10, fontWeight: 600 }}>
            ♪ La nostra canzone
          </div>
          {spotifySrc && (
            <iframe
              src={spotifySrc}
              width="100%"
              height="152"
              frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: 12, border: "none", display: "block" }}
              title="Spotify track embed"
            />
          )}
          {youtubeSrc && !spotifySrc && (
            <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden" }}>
              <iframe
                src={youtubeSrc}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                title="YouTube video embed"
              />
            </div>
          )}
        </div>
      )}

      {/* Voucher allegato */}
      {data.voucher_url && (
        <div style={{ margin: "0 0 28px", textAlign: "center" }}>
          <a
            href={data.voucher_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: GOLD,
              color: "#fff",
              border: "none",
              borderRadius: 40,
              padding: "13px 28px",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 8px 22px rgba(212,163,64,.35)",
            }}
          >
            🎁 Apri il regalo allegato
          </a>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>
            Un piccolo extra che ho voluto aggiungere
          </div>
        </div>
      )}

      {/* Firma */}
      <div style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: `1px solid ${ROSE}`,
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontSize: 17,
          color: DEEP,
          margin: "0 0 6px",
        }}>
          Ti voglio bene,
        </p>
        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontSize: 19,
          color: GOLD,
          fontWeight: 700,
          margin: 0,
        }}>
          {senderName || "il/la tuo/a bambino/a"}
        </p>
      </div>
    </div>
  );
}
