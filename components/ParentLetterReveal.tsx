"use client";

/**
 * ParentLetterReveal — vista "rivelata" generica del template
 * "Lettera che cresce" (per Festa della Mamma e Festa del Papa').
 *
 * Sostituisce / generalizza MothersDayLetterReveal: stessa struttura
 * cinematografica (parola -> polaroid -> ricordo -> lezione -> canzone
 * -> voucher -> firma), ma palette, microcopy e packaging vengono
 * presi dalla config (vedi lib/parent-templates.ts).
 *
 * Effetti polish:
 * - Animazione di entrata progressiva di ogni blocco
 * - Confetti rosa/oro o verde/oro che cadono al mount
 * - Suono carillon delicato 6 sec via Web Audio API
 */

import React, { useEffect, useRef, useState } from "react";
import type { ParentTemplateConfig } from "@/lib/parent-templates";

const DEEP = "#1a1a1a";
const MUTED = "#6a6a6a";

export interface ParentLetterData {
  word?: string | null;
  memory?: string | null;
  photo_url?: string | null;
  lesson?: string | null;
  song_url?: string | null;
  voucher_url?: string | null;
}

interface Props {
  data: ParentLetterData;
  recipientName: string;
  senderName?: string | null;
  config: ParentTemplateConfig;
}

function spotifyEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("spotify.com")) return null;
    return u.origin + "/embed" + u.pathname;
  } catch { return null; }
}
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
  } catch { return null; }
}

function playMusicBox() {
  if (typeof window === "undefined") return;
  const W = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = W.AudioContext || W.webkitAudioContext;
  if (!Ctor) return;
  try {
    const ctx = new Ctor();
    const notes = [659.25, 783.99, 1046.5, 1318.5, 1760, 1567.9, 1318.5, 1046.5, 1318.5, 1567.9];
    const beat = 0.45;
    const now = ctx.currentTime;
    notes.forEach((freq, i) => {
      const t = now + i * beat;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.3);
    });
    setTimeout(() => { try { ctx.close(); } catch { /* ignore */ } }, 1000 * (notes.length * beat + 2));
  } catch { /* silente */ }
}

function ConfettiRain({ palette }: { palette: string[] }) {
  const pieces = 28;
  return (
    <div aria-hidden style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      overflow: "hidden", borderRadius: 20,
    }}>
      {Array.from({ length: pieces }).map((_, i) => {
        const left = Math.round((i / pieces) * 100 + Math.random() * 6);
        const delay = Math.random() * 0.8;
        const duration = 2.4 + Math.random() * 1.6;
        const size = 6 + Math.random() * 6;
        const bg = palette[i % palette.length];
        const rotate = Math.round(Math.random() * 360);
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              top: -20,
              left: `${left}%`,
              width: size,
              height: size * 0.45,
              background: bg,
              transform: `rotate(${rotate}deg)`,
              animation: `confFall ${duration}s ${delay}s ease-in forwards`,
              opacity: 0.9,
              borderRadius: 1,
            }}
          />
        );
      })}
    </div>
  );
}

export function ParentLetterReveal({ data, recipientName, senderName, config }: Props) {
  const spotifySrc = data.song_url ? spotifyEmbed(data.song_url) : null;
  const youtubeSrc = data.song_url ? youtubeEmbed(data.song_url) : null;

  const playedRef = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    setShowConfetti(true);
    const t = setTimeout(() => playMusicBox(), 250);
    const t2 = setTimeout(() => setShowConfetti(false), 5000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  const confettiPalette = [config.paletteAccent, config.paperColor, "#fff", "#D4537E"];

  return (
    <div style={{
      maxWidth: 480,
      margin: "0 auto",
      padding: "32px 22px 60px",
      background: `linear-gradient(180deg, ${config.paletteBg} 0%, #FFFFFF 200px)`,
      borderRadius: 20,
      fontFamily: "system-ui, -apple-system, sans-serif",
      position: "relative",
    }}>
      <style>{`
        @keyframes confFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(620px) rotate(540deg); opacity: 0; }
        }
        @keyframes pLetterIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .p-fade-in { animation: pLetterIn .7s ease both; }
      `}</style>
      {showConfetti && <ConfettiRain palette={confettiPalette} />}

      {data.word && (
        <div className="p-fade-in" style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: "clamp(46px, 12vw, 72px)",
          color: config.paletteAccent,
          textAlign: "center",
          lineHeight: 1.05,
          margin: "12px 0 24px",
          letterSpacing: "-1px",
          animationDelay: "0.1s",
        }}>
          &ldquo;{data.word}&rdquo;
        </div>
      )}

      {data.photo_url && (
        <div className="p-fade-in" style={{ textAlign: "center", margin: "0 0 28px", animationDelay: "0.8s" }}>
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

      {data.memory && (
        <div className="p-fade-in" style={{ margin: "0 0 28px", animationDelay: "1.5s" }}>
          <div style={{ fontSize: 12, color: MUTED, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 10, textAlign: "center" }}>
            {config.revealCaptions.memoryHeader}
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

      {data.lesson && (
        <div className="p-fade-in" style={{
          margin: "0 0 28px",
          padding: "20px 22px",
          background: "#fffaf0",
          border: `1px solid ${config.paletteBg}`,
          borderRadius: 14,
          animationDelay: "2.2s",
        }}>
          <div style={{ fontSize: 12, color: MUTED, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
            {config.revealCaptions.lessonHeader}
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

      {(spotifySrc || youtubeSrc) && (
        <div className="p-fade-in" style={{ margin: "0 0 28px", animationDelay: "2.9s" }}>
          <div style={{ fontSize: 13, color: config.paletteAccent, textAlign: "center", marginBottom: 10, fontWeight: 600 }}>
            {config.revealCaptions.songHeader}
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

      {data.voucher_url && (
        <div className="p-fade-in" style={{ margin: "0 0 28px", textAlign: "center", animationDelay: "3.5s" }}>
          <a
            href={data.voucher_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: config.paletteAccent,
              color: "#fff",
              border: "none",
              borderRadius: 40,
              padding: "13px 28px",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: `0 8px 22px ${config.paletteAccent}55`,
            }}
          >
            {config.revealCaptions.voucherCta}
          </a>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>
            {config.revealCaptions.voucherSubtitle}
          </div>
        </div>
      )}

      <div className="p-fade-in" style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: `1px solid ${config.paletteBg}`,
        textAlign: "center",
        animationDelay: "4.2s",
      }}>
        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontSize: 17,
          color: DEEP,
          margin: "0 0 6px",
        }}>
          {config.revealCaptions.farewellLine}
        </p>
        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontSize: 19,
          color: config.paletteAccent,
          fontWeight: 700,
          margin: 0,
        }}>
          {senderName || config.revealCaptions.senderFallback}
        </p>
      </div>
    </div>
  );
}
