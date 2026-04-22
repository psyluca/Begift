"use client";
import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { createBrowserClient } from "@supabase/ssr";
import SharedGiftSVG from "@/components/GiftSVG";
import GiftChat from "@/components/GiftChat";
import type { Gift, Reaction, ReactionType } from "@/types";

const ACCENT = "#D4537E";
const DEEP   = "#1a1a1a";
const MUTED  = "#888";
const LIGHT  = "#f7f5f2";

// ── Colour helpers ────────────────────────────────────────────────────────────
function adj(hex: string, amt: number): string {
  try {
    const n = parseInt(hex.replace("#", ""), 16);
    const c = (v: number) => Math.min(255, Math.max(0, v + Math.round(255 * amt)));
    const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
    return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
  } catch { return hex; }
}

// ── Audio ─────────────────────────────────────────────────────────────────────
const DEFAULT_SOUNDS: Record<string, string> = {
  bells: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/339822__inspectorj__hand-bells-cluster.wav",
  magic: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/350352__robinhood76__06741-good-news-magic-ding.wav",
  woosh: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/611475__jwsounddesign__woosh-long-cinematic.wav",
  chime: "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/660863__drooler__chime-improper.flac",
  pop:   "https://acoettfsxcfpvhjzreoy.supabase.co/storage/v1/object/public/gift-media/789793__quatricise__pop-4.wav",
};

function playSound(id: string, customUrl?: string) {
  if (id === "none") return null;

  // Usa URL predefinito o custom
  const url = customUrl || DEFAULT_SOUNDS[id];
  if (url) {
    try {
      const audio = new Audio(url);
      audio.volume = 0.7;
      audio.play().catch(() => {});
      return audio;
    } catch (_) {}
    return null;
  }

  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;

    // Reverb
    const convolver = ctx.createConvolver();
    const reverbLen = ctx.sampleRate * 1.8;
    const reverbBuf = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = reverbBuf.getChannelData(ch);
      for (let i = 0; i < reverbLen; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/reverbLen, 2.5);
    }
    convolver.buffer = reverbBuf;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);
    masterGain.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (id === "bells") {
      // Rich bell chord: C5 E5 G5 C6 + harmonics
      const notes = [523.25, 659.26, 783.99, 1046.5, 1318.5];
      const delays = [0, 0.08, 0.16, 0.28, 0.42];
      notes.forEach((freq, i) => {
        const t = now + delays[i];
        [1, 2, 3].forEach((harm, hi) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = hi === 0 ? "sine" : "triangle";
          o.frequency.value = freq * (hi === 0 ? 1 : hi + 1);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(hi === 0 ? 0.22 : 0.06, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + (hi === 0 ? 1.4 : 0.5));
          o.connect(g); g.connect(masterGain);
          o.start(t); o.stop(t + 1.5);
        });
      });
    } else if (id === "magic") {
      // Sparkle arpeggio ascending
      const scale = [880, 988, 1109, 1319, 1568, 1760, 2093, 2637];
      scale.forEach((freq, i) => {
        const t = now + i * 0.07;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(freq * 0.5, t);
        o.frequency.linearRampToValueAtTime(freq, t + 0.05);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        o.connect(g); g.connect(masterGain);
        o.start(t); o.stop(t + 0.5);
        // shimmer overtone
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = "sine"; o2.frequency.value = freq * 2.01;
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.06, t + 0.02);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o2.connect(g2); g2.connect(masterGain);
        o2.start(t); o2.stop(t + 0.3);
      });
    } else if (id === "pop") {
      // Party pop + confetti swoosh
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(80, now);
      o.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      g.gain.setValueAtTime(0.4, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      o.connect(g); g.connect(masterGain);
      o.start(now); o.stop(now + 0.2);
      // noise burst
      const bufLen = ctx.sampleRate * 0.15;
      const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) nd[i] = Math.random() * 2 - 1;
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;
      const noiseG = ctx.createGain();
      noiseG.gain.setValueAtTime(0.3, now + 0.05);
      noiseG.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      noiseSource.connect(noiseG); noiseG.connect(masterGain);
      noiseSource.start(now + 0.05);
      // rising whistles
      [800, 1200, 1600].forEach((f, i) => {
        const t = now + 0.1 + i * 0.06;
        const wo = ctx.createOscillator(), wg = ctx.createGain();
        wo.type = "sine";
        wo.frequency.setValueAtTime(f, t);
        wo.frequency.linearRampToValueAtTime(f * 1.5, t + 0.2);
        wg.gain.setValueAtTime(0.12, t);
        wg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        wo.connect(wg); wg.connect(masterGain);
        wo.start(t); wo.stop(t + 0.3);
      });
    } else if (id === "woosh") {
      // Smooth whoosh with pitch drop
      const bufLen = ctx.sampleRate * 0.8;
      const wBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const wd = wBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) wd[i] = (Math.random()*2-1) * Math.sin(i/bufLen * Math.PI);
      const ws = ctx.createBufferSource(); ws.buffer = wBuf;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.6);
      filter.Q.value = 1.5;
      const wg = ctx.createGain();
      wg.gain.setValueAtTime(0, now);
      wg.gain.linearRampToValueAtTime(0.5, now + 0.1);
      wg.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      ws.connect(filter); filter.connect(wg); wg.connect(masterGain);
      ws.start(now);
    } else if (id === "chime") {
      // Wind chime: pentatonic scale with soft attack
      const pentatonic = [523.25, 659.26, 783.99, 880, 1046.5, 1174.66, 1318.5];
      const order = [0,2,4,1,3,5,2,4];
      order.forEach((idx, i) => {
        const freq = pentatonic[idx];
        const t = now + i * 0.11 + Math.random() * 0.03;
        [1, 2.76, 5.4].forEach((harm, hi) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = "sine"; o.frequency.value = freq * harm;
          const vol = hi === 0 ? 0.18 : hi === 1 ? 0.07 : 0.03;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(vol, t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.001, t + (hi === 0 ? 1.2 : 0.5));
          o.connect(g); g.connect(masterGain);
          o.start(t); o.stop(t + 1.4);
        });
      });
    } else if (id === "kawaii") {
      // Music-box melody: C5 E5 G5 A5 G5 E5 C6 with sparkle overtones
      [523.25,659.26,783.99,880,783.99,659.26,1046.5].forEach((f,i)=>{
        const t=now+i*.12;
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.type="sine";o.frequency.value=f;
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.55);
        o.connect(g);g.connect(masterGain);o.start(t);o.stop(t+.6);
        // Sparkle overtone
        const o2=ctx.createOscillator(),g2=ctx.createGain();
        o2.type="sine";o2.frequency.value=f*3;
        g2.gain.setValueAtTime(0,t);g2.gain.linearRampToValueAtTime(.04,t+.01);g2.gain.exponentialRampToValueAtTime(.001,t+.3);
        o2.connect(g2);g2.connect(masterGain);o2.start(t);o2.stop(t+.35);
      });
    }
  } catch (_) {}
}

// ── Gift Box SVG ──────────────────────────────────────────────────────────────
function GiftSVG({ paper = "#D85A5A", ribbon = "#E8C84A", bow, bowType = "classic", lidY = 82, animated = false }: {
  paper?: string; ribbon?: string; bow?: string; bowType?: string; lidY?: number; animated?: boolean;
}) {
  const bw = bow || ribbon;
  const Pd = adj(paper, -0.16), Pdd = adj(paper, -0.26), Pl = adj(paper, 0.10);
  const Rd = adj(ribbon, -0.18), Rl = adj(ribbon, 0.14);
  return (
    <svg viewBox="0 0 200 220" style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}>
      <defs><style>{`
        @keyframes gF{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes bP{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        .gf{${animated?"animation:gF 3s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%":""}}
        .bp{${animated?"animation:bP 2s 0.4s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%":""}}
      `}</style></defs>
      <ellipse cx="100" cy="196" rx="62" ry="9" fill="#00000018"/>
      <g className="gf">
        <rect x="30" y="100" width="140" height="90" rx="6" fill={paper}/>
        <rect x="154" y="100" width="16" height="90" fill={Pd}/>
        <rect x="38" y="108" width="30" height="7" rx="3" fill={Pl} opacity="0.5"/>
        <rect x="90" y="100" width="20" height="90" fill={ribbon}/>
        <rect x="90" y="100" width="8"  height="90" fill={Rl} opacity="0.6"/>
        <rect x="30" y="136" width="140" height="18" fill={ribbon}/>
        <rect x="30" y="136" width="140" height="7"  fill={Rl} opacity="0.6"/>
        <rect x="30" y="100" width="140" height="90" rx="6" fill="none" stroke="#00000010" strokeWidth="1"/>
        <rect x="24" y={lidY} width="152" height="26" rx="5" fill={Pdd}/>
        <rect x="32" y={lidY+5} width="28" height="6" rx="3" fill={Pl} opacity="0.4"/>
        <rect x="90" y={lidY} width="20" height="26" fill={Rd}/>
        <rect x="90" y={lidY} width="8"  height="26" fill={Rl} opacity="0.5"/>
        <rect x="24" y={lidY+8} width="152" height="10" fill={Rd}/>
        <rect x="24" y={lidY} width="152" height="26" rx="5" fill="none" stroke="#00000012" strokeWidth="1"/>
      </g>
      <g className="bp" transform={`translate(0,${lidY-82})`}>
        <BowSVG type={bowType} color={bw} cx={100} cy={72} size={28}/>
      </g>
    </svg>
  );
}

function BowSVG({ type, color, cx, cy, size: s }: { type: string; color: string; cx: number; cy: number; size: number }) {
  const hl = adj(color, 0.26), dk = adj(color, -0.22);
  const T = `translate(${cx},${cy})`;
  if (type === "star") return (
    <g transform={T}>
      {[0,30,60,90,120,150].map(a => <ellipse key={a} rx={s*.68} ry={s*.19} fill={color} transform={`rotate(${a})`} opacity=".88"/>)}
      <circle r={s*.22} fill={hl}/>
    </g>
  );
  if (type === "rosette") return (
    <g transform={T}>
      {Array.from({length:10},(_,i) => <ellipse key={i} rx={s*.58} ry={s*.16} fill={color} cx={s*.2} transform={`rotate(${i*36})`} opacity=".85"/>)}
      <circle r={s*.23} fill={hl}/>
    </g>
  );
  if (type === "simple") return (
    <g transform={T}>
      <circle r={s*.38} fill="none" stroke={color} strokeWidth={s*.26}/>
      <circle r={s*.14} fill={hl}/>
    </g>
  );
  if (type === "pompom") return (
    <g transform={T}>
      {Array.from({length:12},(_,i) => { const a=(i/12)*Math.PI*2; return <circle key={i} cx={Math.cos(a)*s*.44} cy={Math.sin(a)*s*.44} r={s*.18} fill={i%2?color:dk} opacity=".88"/>; })}
      <circle r={s*.22} fill={hl}/>
    </g>
  );
  // classic (default)
  return (
    <g transform={T}>
      <ellipse rx={s*.75} ry={s*.30} fill={color} transform="rotate(-35)" opacity=".92"/>
      <ellipse rx={s*.48} ry={s*.14} fill={dk} transform="rotate(-35)" opacity=".55"/>
      <ellipse rx={s*.75} ry={s*.30} fill={color} transform="rotate(35)" opacity=".92"/>
      <ellipse rx={s*.48} ry={s*.14} fill={dk} transform="rotate(35)" opacity=".55"/>
      <ellipse rx={s*.21} ry={s*.40} fill={dk} transform="translate(0,5) rotate(-10)" opacity=".75"/>
      <ellipse rx={s*.21} ry={s*.40} fill={dk} transform="translate(0,5) rotate(12)" opacity=".75"/>
      <ellipse rx={s*.27} ry={s*.21} fill={hl}/>
    </g>
  );
}

// ── Gift content renderer ─────────────────────────────────────────────────────
function GiftContent({ gift }: { gift: Gift }) {
  const { t } = useI18n();
  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      {gift.content_type === "image" && gift.content_url && (
        <PolaroidPhoto src={gift.content_url} caption={gift.message} />
      )}
      {gift.content_type === "video" && gift.content_url && (
        <VideoFrame url={gift.content_url} />
      )}
      {/* Link: se punta a un video embeddabile (YouTube, Vimeo, file
          mp4/webm/mov, ecc.) lo mostriamo nel VideoFrame, non come
          link testuale. Molti utenti scelgono "🔗 Link" e incollano
          YouTube — deve funzionare lo stesso. */}
      {gift.content_type === "link" && gift.content_url && isEmbeddableVideo(gift.content_url) && (
        <VideoFrame url={gift.content_url} />
      )}
      {gift.content_type === "pdf" && gift.content_url && (
        <div style={{ marginBottom: 20, borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px #0000001e" }}>
          <iframe src={gift.content_url} style={{ width: "100%", height: 480, display: "block", border: "none" }} title={gift.content_file_name || "PDF"}/>
          <a href={gift.content_url} download={gift.content_file_name || "documento.pdf"}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: LIGHT, textDecoration: "none", color: DEEP, fontSize: 14, fontWeight: 600, borderTop: "1px solid #ede8e0" }}>
            {gift.content_file_name ? t("gift.download", { name: gift.content_file_name }) : t("gift.download_doc")}
          </a>
        </div>
      )}
      {gift.content_type === "link" && gift.content_url && !isEmbeddableVideo(gift.content_url) && (
        <a href={gift.content_url} target="_blank" rel="noopener noreferrer"
          style={{ display: "block", marginBottom: 20, padding: "24px 20px", background: "#f0f0f0", borderRadius: 16, textDecoration: "none", color: DEEP, fontSize: 16, boxShadow: "0 8px 32px #0000001e", wordBreak: "break-all" }}>
          🔗 {gift.content_url}
        </a>
      )}
      {gift.content_type === "message" && gift.content_text && (
        <div style={{ marginBottom: 20, padding: "28px 24px", background: "#fffef8", borderRadius: 16, fontSize: 16, lineHeight: 1.7, color: "#3d3d3d", whiteSpace: "pre-wrap", boxShadow: "0 8px 32px #0000001e" }}>
          {gift.content_text}
        </div>
      )}
      {/* Messaggio di accompagnamento — mostrato SOTTO il contenuto a
          meno che il contenuto sia già un'immagine (dove la didascalia
          è già integrata nella Polaroid), una message-gift (dove msg e
          content_text coincidono), o nullo. */}
      {gift.message && gift.content_type !== "image" && gift.content_type !== "message" && (
        <div style={{ background: "#fffef8", border: "1px solid #ede8e0", borderRadius: 16, padding: "24px 22px", fontSize: 16, lineHeight: 1.8, color: "#3d3d3d", fontStyle: "italic" }}>
          &ldquo;{gift.message}&rdquo;
        </div>
      )}
    </div>
  );
}

/**
 * PolaroidPhoto — cornice polaroid stile anni '70: bordo bianco
 * spesso, bottone più alto per caption in italico, leggera
 * rotazione (-1.5°), ombra profonda, animazione di apparizione
 * che simula l'istantanea che si sviluppa.
 *
 * Se la caption è troppo lunga (>140 char) viene troncata con
 * ellipsis per preservare il layout Polaroid. Le didascalie medie
 * funzionano meglio per l'effetto visivo.
 */
function PolaroidPhoto({ src, caption }: { src: string; caption: string | null }) {
  const shortCaption = caption && caption.length > 140 ? caption.slice(0, 137) + "…" : caption;
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, perspective: 1000 }}>
      <div style={{
        background: "#fff",
        padding: "14px 14px 0",
        borderRadius: 4,
        boxShadow: "0 20px 40px -12px rgba(0,0,0,0.35), 0 8px 16px -8px rgba(0,0,0,0.2)",
        transform: "rotate(-1.5deg)",
        maxWidth: 360,
        width: "100%",
        animation: "polaroidIn .7s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        <style>{`
          @keyframes polaroidIn {
            from { opacity: 0; transform: rotate(-8deg) scale(.85) translateY(40px); }
            60%  { transform: rotate(0.5deg) scale(1.02) translateY(-6px); }
            to   { opacity: 1; transform: rotate(-1.5deg) scale(1) translateY(0); }
          }
        `}</style>
        {/* Bordo scuro sottile per suggerire l'istantanea */}
        <div style={{ background: "#1a1a1a", padding: 0, borderRadius: 1 }}>
          <img
            src={src}
            alt=""
            style={{
              width: "100%",
              display: "block",
              aspectRatio: "4/3",
              objectFit: "cover",
              borderRadius: 1,
            }}
          />
        </div>
        {/* Spazio caption — sempre presente per carattere Polaroid,
            anche se la caption è vuota l'istantanea ha il margine
            bianco in basso tipico */}
        <div style={{
          padding: "18px 8px 22px",
          textAlign: "center",
          minHeight: 24,
          fontFamily: "'Caveat', 'Kalam', 'Brush Script MT', cursive",
          fontSize: 20,
          color: "#2a2a2a",
          lineHeight: 1.3,
          fontStyle: "italic",
        }}>
          {shortCaption || ""}
        </div>
      </div>
    </div>
  );
}

/**
 * VideoFrame — cornice TV/schermo per video (YouTube embed o file MP4).
 * Auto-detect YouTube: estrae l'ID dal link e costruisce un embed
 * iframe con parametri ottimizzati (no suggested videos, modest branding).
 * Per MP4/WebM/MOV usa <video controls> nativo. Aspect 16:9 fisso, bordo
 * accent color, ombra profonda.
 */
function VideoFrame({ url }: { url: string }) {
  const youtubeId = extractYoutubeId(url);
  const vimeoId = extractVimeoId(url);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Strategia "muted-autoplay + tap-to-unmute" (come Instagram/TikTok):
  // partiamo SEMPRE muted perché autoplay muted è accettato da TUTTI i
  // browser — incluso iOS Safari PWA standalone. Overlay "🔊 Tocca per
  // audio" in alto a destra: al click ricarichiamo l'iframe senza &mute=1
  // (il click è user-gesture fresca, quindi l'audio parte). Per <video>
  // nativi proviamo prima con audio, fallback muted+overlay se il browser
  // rifiuta. Dove l'autoplay fallisce del tutto, l'utente vede il pulsante
  // play standard — nessuna situazione in cui il video resta "bloccato".
  const [iframeMuted, setIframeMuted] = useState(true);
  const [needsTapToUnmute, setNeedsTapToUnmute] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    v.play().catch(() => {
      v.muted = true;
      setNeedsTapToUnmute(true);
      v.play().catch(() => { /* se fallisce anche muted, utente clicca play */ });
    });
  }, []);

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setNeedsTapToUnmute(false);
    }
    setIframeMuted(false);
  };

  return (
    <div style={{
      marginBottom: 20,
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "0 16px 40px -12px rgba(0,0,0,0.35), 0 6px 16px -6px rgba(0,0,0,0.2)",
      border: `3px solid ${ACCENT}`,
      background: "#000",
      animation: "videoFrameIn .55s cubic-bezier(.34,1.56,.64,1) both",
    }}>
      <style>{`
        @keyframes videoFrameIn {
          from { opacity: 0; transform: scale(.92) translateY(30px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulseAudio {
          0%,100% { transform: scale(1); box-shadow: 0 2px 8px rgba(0,0,0,.3); }
          50%     { transform: scale(1.05); box-shadow: 0 4px 14px rgba(212,83,126,.5); }
        }
      `}</style>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000" }}>
        {youtubeId ? (
          <iframe
            key={`yt-${youtubeId}-${iframeMuted ? "m" : "a"}`}
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1${iframeMuted ? "&mute=1" : ""}`}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          />
        ) : vimeoId ? (
          <iframe
            key={`vm-${vimeoId}-${iframeMuted ? "m" : "a"}`}
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0${iframeMuted ? "&muted=1" : ""}`}
            title="Video"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <video
            ref={videoRef}
            src={url}
            controls
            playsInline
            autoPlay
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
          />
        )}
        {/* Overlay "Tocca per audio": visibile se iframe muted o se il
            <video> nativo è stato forzato a muted dal browser. Sparisce
            al primo click. */}
        {((youtubeId || vimeoId) && iframeMuted) || (!youtubeId && !vimeoId && needsTapToUnmute) ? (
          <button
            onClick={handleUnmute}
            style={{
              position: "absolute", top: 12, right: 12, zIndex: 5,
              background: "rgba(0,0,0,.75)", color: "#fff",
              border: "1px solid rgba(255,255,255,.3)",
              borderRadius: 20, padding: "8px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "inherit",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              animation: "pulseAudio 2s ease-in-out infinite",
            }}
          >
            🔊 Tocca per audio
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Rileva se un URL punta a un video che il VideoFrame può embeddare:
 * - YouTube (youtube.com / youtu.be / shorts)
 * - Vimeo (vimeo.com/ID)
 * - File video diretti (estensioni .mp4 .webm .mov .ogg .m4v,
 *   anche con query string tipo ?sig=...)
 */
function isEmbeddableVideo(url: string): boolean {
  if (extractYoutubeId(url)) return true;
  if (extractVimeoId(url)) return true;
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (/\.(mp4|webm|mov|ogg|m4v|avi|mkv)$/.test(path)) return true;
  } catch { /* invalid URL */ }
  return false;
}

/**
 * Estrae l'ID Vimeo da URL standard vimeo.com/12345678 o
 * player.vimeo.com/video/12345678.
 */
function extractVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("vimeo.com")) return null;
    const m = u.pathname.match(/(?:\/video)?\/(\d+)/);
    return m ? m[1] : null;
  } catch { return null; }
}

/**
 * Estrae l'ID video YouTube da URL di varia forma:
 * - youtube.com/watch?v=ID
 * - youtu.be/ID
 * - youtube.com/embed/ID
 * - youtube.com/shorts/ID
 * Ritorna null se l'URL non è YouTube.
 */
function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id.length >= 8 ? id : null;
    }
    if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id && id.length >= 8 ? id : null;
      }
      const m = u.pathname.match(/\/(embed|shorts)\/([^/?#]+)/);
      if (m && m[2].length >= 8) return m[2];
    }
    return null;
  } catch { return null; }
}

// ── Reaction Builder ──────────────────────────────────────────────────────────
const QUICK_EMOJIS = ["❤️","🥹","🤩","😭","🎉"];
const ALL_EMOJIS   = ["❤️","🥹","🤩","😭","🎉","😍","💯","🔥","👏","🫶","✨","🙏"];

function ReactionBuilder({ gift, onSent, senderName = "Destinatario" }: { gift: Gift; onSent: (r: any) => void; senderName?: string }) {
  const { t } = useI18n();
  const [step,     setStep]     = useState<"pick"|"compose"|"preview"|"sent">("pick");
  const [rType,    setRType]    = useState<ReactionType | null>(null);
  const [emoji,    setEmoji]    = useState("");
  const [text,     setText]     = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading,  setLoading]  = useState(false);

  const reaction = { type: rType, emoji, text, mediaUrl };
  const isValid  = rType === "emoji" ? !!emoji : rType === "text" ? text.trim().length > 0
    : rType === "photo" || rType === "video" ? !!mediaUrl : rType === "gift";

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      // Upload al bucket reaction-media
      const base64 = ev.target?.result as string;
      const blob   = await fetch(base64).then(r => r.blob());
      const form   = new FormData();
      form.append("file", blob, f.name);
      form.append("bucket", "reaction-media");
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      setMediaUrl(data.url);
      setLoading(false);
    };
    reader.readAsDataURL(f);
  };

  const send = async () => {
    setLoading(true);
    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        giftId:    gift.id,
        type:      rType,
        emoji:     emoji || null,
        text:      text  || null,
        mediaUrl:  mediaUrl || null,
        senderName: senderName,
      }),
    });
    setLoading(false);
    if (res.ok) { setStep("sent"); onSent(reaction); }
  };

  const INP: React.CSSProperties = { width: "100%", padding: "13px 15px", fontSize: 15, border: "1.5px solid #e0dbd5", borderRadius: 11, outline: "none", boxSizing: "border-box", background: "#fff", color: DEEP, fontFamily: "inherit", marginBottom: 14 };

  if (step === "sent") return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>
        {rType === "emoji" ? emoji : rType === "text" ? "💌" : rType === "photo" ? "📸" : rType === "video" ? "🎬" : "🎁"}
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: DEEP, margin: "0 0 8px" }}>{t("reaction_builder.sent_title")}</h3>
      <p style={{ color: MUTED, fontSize: 14 }}>{t("reaction_builder.sent_desc")}</p>
    </div>
  );

  if (step === "preview") return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: DEEP, margin: "0 0 14px" }}>{t("reaction_builder.preview")}</h3>
      <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", boxShadow: "0 4px 24px #0000001a", border: "1px solid #ede8e0", marginBottom: 16, textAlign: "center" }}>
        {rType === "emoji" && <div style={{ fontSize: 72 }}>{emoji}</div>}
        {rType === "text"  && <div style={{ fontSize: 16, lineHeight: 1.7, color: "#3d3d3d", fontStyle: "italic" }}>"{text}"</div>}
        {rType === "photo" && mediaUrl && <img src={mediaUrl} alt="" style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 12, display: "block" }}/>}
        {rType === "video" && mediaUrl && <video src={mediaUrl} controls style={{ width: "100%", borderRadius: 12, display: "block" }}/>}
        {rType === "gift"  && <div style={{ fontSize: 48 }}>🎁</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={send} disabled={loading} style={{ width: "100%", background: ACCENT, color: "#fff", border: "none", borderRadius: 40, padding: "15px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          {loading ? t("reaction_builder.sending") : t("reaction_builder.send_reaction")}
        </button>
        <button onClick={() => setStep("compose")} style={{ width: "100%", background: "#fff", color: DEEP, border: "1.5px solid #e0dbd5", borderRadius: 40, padding: "14px", fontSize: 14, cursor: "pointer" }}>
          {t("reaction_builder.edit")}
        </button>
      </div>
    </div>
  );

  if (step === "compose") return (
    <div>
      <button onClick={() => setStep("pick")} style={{ background: "none", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0 }}>{t("reaction_builder.pick_other")}</button>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: DEEP, margin: "0 0 14px" }}>
        {rType === "emoji" ? t("reaction_builder.pick_emoji") : rType === "text" ? t("reaction_builder.write_message") : rType === "photo" ? t("reaction_builder.add_photo") : rType === "video" ? t("reaction_builder.upload_video") : t("reaction_builder.gift_package")}
      </h3>
      {rType === "emoji" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 16 }}>
            {ALL_EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)} style={{ fontSize: 28, padding: "8px 0", borderRadius: 12, border: `2px solid ${emoji === e ? ACCENT : "#e0dbd5"}`, background: emoji === e ? "#fff5f8" : "#fff", cursor: "pointer" }}>{e}</button>
            ))}
          </div>
          {emoji && <div style={{ textAlign: "center", fontSize: 56, marginBottom: 14 }}>{emoji}</div>}
        </div>
      )}
      {rType === "text" && (
        <textarea style={{ ...INP, minHeight: 140, resize: "vertical" }}
          placeholder={t("reaction_builder.text_placeholder")}
          value={text} onChange={e => setText(e.target.value)} autoFocus/>
      )}
      {(rType === "photo" || rType === "video") && (
        !mediaUrl ? (
          <label style={{ display: "block", background: "#fff", border: "1.5px dashed #d5cfc8", borderRadius: 14, padding: "36px 20px", textAlign: "center", cursor: "pointer" }}>
            {loading ? <><div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div><div style={{ color: MUTED }}>{t("reaction_builder.uploading")}</div></> : <><div style={{ fontSize: 44, marginBottom: 8 }}>{rType === "photo" ? "📸" : "🎬"}</div><div style={{ fontWeight: 700, color: DEEP, fontSize: 14 }}>{rType === "photo" ? t("reaction_builder.select_photo") : t("reaction_builder.select_video")}</div></>}
            <input type="file" accept={rType === "photo" ? "image/*" : "video/*"} capture="environment" style={{ display: "none" }} onChange={onFile}/>
          </label>
        ) : (
          <div style={{ position: "relative" }}>
            {rType === "photo" ? <img src={mediaUrl} alt="" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 14, display: "block" }}/> : <video src={mediaUrl} controls style={{ width: "100%", borderRadius: 14, display: "block" }}/>}
            <button onClick={() => setMediaUrl("")} aria-label={t("reaction_builder.remove_media") || "Rimuovi"} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.5)", color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: "pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, lineHeight:1 }}>×</button>
          </div>
        )
      )}
      {rType === "gift" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 52, marginBottom: 12 }}>🎁</div><p style={{ color: MUTED, fontSize: 14 }}>{t("reaction_builder.gift_desc")}</p></div>}
      <button onClick={() => setStep("preview")} disabled={!isValid} style={{ width: "100%", marginTop: 18, background: isValid ? ACCENT : "#e0dbd5", color: "#fff", border: "none", borderRadius: 40, padding: "15px", fontSize: 15, fontWeight: 700, cursor: isValid ? "pointer" : "not-allowed" }}>
        {t("reaction_builder.preview_btn")}
      </button>
    </div>
  );

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: DEEP, margin: "0 0 4px" }}>{t("reaction_builder.respond_title")}</h3>
      <p style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>{t("reaction_builder.respond_desc")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* "gift" rimosso dalle reazioni: ora esiste la CTA dedicata
            "Ringrazia con un regalo" post-apertura che apre direttamente
            /create con recipient pre-compilato. La mini-reazione 🎁 era
            ridondante e meno chiara. Il tipo "gift" resta nel ReactionType
            per compat con eventuali reazioni storiche in DB. */}
        {([
          { id: "emoji", icon: "😄", label: t("reaction_builder.emoji_label"), desc: t("reaction_builder.emoji_desc") },
          { id: "text",  icon: "✍️",  label: t("reaction_builder.message_label"), desc: t("reaction_builder.message_desc") },
          { id: "photo", icon: "📸", label: t("reaction_builder.photo_label"), desc: t("reaction_builder.photo_desc") },
          { id: "video", icon: "🎬", label: t("reaction_builder.video_label"), desc: t("reaction_builder.video_desc") },
        ] as {id: ReactionType; icon: string; label: string; desc: string}[]).map(r => (
          <button key={r.id} onClick={() => { setRType(r.id); setStep("compose"); }}
            style={{ background: "#fff", border: "1.5px solid #e0dbd5", borderRadius: 16, padding: "18px 12px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>{r.icon}</div>
            <div style={{ fontWeight: 700, color: DEEP, fontSize: 14, marginBottom: 2 }}>{r.label}</div>
            <div style={{ fontSize: 11, color: MUTED }}>{r.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────
export default function GiftOpeningClient({ gift }: { gift: Gift }) {
  const { t } = useI18n();
  const [phase,   setPhase]   = useState<"idle"|"opening"|"revealed">("idle");
  const [lidY,    setLidY]    = useState(82);
  const [opened,  setOpened]  = useState(false);
  const [loggedIn,  setLoggedIn]  = useState(false);
  const [senderName, setSenderName] = useState("Destinatario");
  const [playing,   setPlaying]   = useState(false);
  const audioRef = useRef<HTMLAudioElement|null>(null);

  // Schedulazione: se il gift è programmato per il futuro, mostriamo
  // la waiting page con countdown invece del contenuto — per TUTTI i
  // visitatori, inclusi i creator. Il creator vede anche un banner
  // "Sei il mittente, puoi aprire in anteprima" con bottone di bypass.
  // Questo evita il flash di countdown (che succedeva quando isCreator
  // era undefined durante l'async auth load e poi veniva risolto a true,
  // facendo passare istantaneamente dal waiting al gift aperto).
  const scheduledAt = gift.scheduled_at ? new Date(gift.scheduled_at) : null;
  const [tick, setTick] = useState(0);
  const [bypassSchedule, setBypassSchedule] = useState(false);
  useEffect(() => {
    if (!scheduledAt) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  const stopMusic = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; }
    setPlaying(false);
  };
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    sb.auth.getUser().then(({ data }) => {
      const user = data.user;
      setLoggedIn(!!user);
      if (user && gift.creator_id === user.id) setIsCreator(true);
      if (user?.email) setSenderName(user.email.split("@")[0]);
    });
    try {
      const stored = localStorage.getItem("sb-acoettfsxcfpvhjzreoy-auth-token");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.user?.email) setSenderName(p.user.email.split("@")[0]);
      }
    } catch(_) {}
    // Preferisci l'@handle come identità per le reazioni inviate:
    // è l'ID univoco dell'utente nell'app, quindi il mittente della
    // reazione vedrà una label riconoscibile e unica ("@luca ha
    // reagito ❤️"), non l'email-split generica. Fetch best-effort
    // con fetchAuthed (Bearer da localStorage se sessione SDK non
    // ancora inizializzata).
    (async () => {
      try {
        const { fetchAuthed } = await import("@/lib/clientAuth");
        const res = await fetchAuthed("/api/profile/me");
        if (!res.ok) return;
        const profile = await res.json();
        if (profile?.username) setSenderName(`@${profile.username}`);
      } catch { /* ignore */ }
    })();
  }, []);
  const [showReact, setShowReact] = useState(false);
  const [sentReaction, setSentReaction] = useState<any>(null);
  const raf = useRef<number>(0);
  const t0  = useRef<number | null>(null);

  const pkg        = gift.packaging;
  // fromCreate: non calcolarlo inline — `typeof window` restituisce
  // valori diversi tra SSR (false) e client (true) → hydration mismatch
  // sul banner "preview". Stato inizializzato a false, letto da
  // window.location.search solo DOPO il mount.
  const [fromCreate, setFromCreate] = useState(false);
  // previewMode: se ?preview=1 nella URL (dalla dashboard del mittente),
  // NON registriamo l'apertura (niente riga in gift_opens) e NON
  // salviamo in begift_received localStorage. Il mittente può vedere
  // il regalo come apparirà al destinatario senza "consumare" l'apertura
  // reale. Banner ambrato avvisa che è modalità preview.
  const [previewMode, setPreviewMode] = useState(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setFromCreate(params.get("from") === "create");
      setPreviewMode(params.get("preview") === "1");
    } catch { /* ignore */ }
  }, []);
  const fromName   = (gift as any).sender_alias || null;
  const songTitle  = (pkg as any)?.customSoundTitle || null;
  const paper   = pkg?.paperColor  || "#D85A5A";
  const ribbon  = pkg?.ribbonColor || "#E8C84A";
  const bow     = pkg?.bowColor    || ribbon;
  const anim    = pkg?.openAnimation || "lift";

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const openGift = () => {
    if (phase !== "idle") return;
    if (pkg?.sound && pkg.sound !== "none") {
      const aud = playSound(pkg.sound, (pkg as any).customSoundUrl);
      if (aud) { audioRef.current = aud; setPlaying(true); aud.addEventListener("ended", () => setPlaying(false)); }
    }
    setPhase("opening");

    if (anim === "lift") {
      t0.current = null;
      const tick = (now: number) => {
        if (!t0.current) t0.current = now;
        const raw  = Math.min(1, (now - t0.current) / 900);
        const ease = 1 - Math.pow(1 - raw, 3);
        setLidY(82 - ease * 72);
        if (raw < 1) { raf.current = requestAnimationFrame(tick); }
        else { setTimeout(() => {
          setPhase("revealed"); setOpened(true);
          // Save to localStorage — SKIP in preview mode (mittente che
          // sta vedendo l'anteprima, non deve apparire in 'ricevuti')
          if (!previewMode) {
            try {
              const stored = JSON.parse(localStorage.getItem("begift_received") || "[]");
              if (!stored.find((g: any) => g.id === gift.id)) {
                localStorage.setItem("begift_received", JSON.stringify([{ ...gift, receivedAt: new Date().toISOString() }, ...stored]));
              }
            } catch {}
            // Save to DB — anche qui skip in preview mode (niente
            // riga in gift_opens, il contatore aperture resta genuino)
            try {
              let deviceId = localStorage.getItem("begift_device_id");
              if (!deviceId) { deviceId = Math.random().toString(36).slice(2); localStorage.setItem("begift_device_id", deviceId); }
              // Save device_id in cookie for login callback
              document.cookie = `begift_device_id=${deviceId}; path=/; max-age=86400; SameSite=Lax`;
              fetch("/api/gift-opens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ giftId: gift.id, deviceId }) });
            } catch {}
          }
        }, 280); }
      };
      raf.current = requestAnimationFrame(tick);
    } else {
      setTimeout(() => {
        setPhase("revealed"); setOpened(true);
        if (!previewMode) {
          try {
            const stored = JSON.parse(localStorage.getItem("begift_received") || "[]");
            if (!stored.find((g: any) => g.id === gift.id)) {
              localStorage.setItem("begift_received", JSON.stringify([{ ...gift, receivedAt: new Date().toISOString() }, ...stored]));
            }
          } catch {}
          try {
            let deviceId = localStorage.getItem("begift_device_id");
            if (!deviceId) { deviceId = Math.random().toString(36).slice(2); localStorage.setItem("begift_device_id", deviceId); }
            fetch("/api/gift-opens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ giftId: gift.id, deviceId }) });
          } catch {}
        }
      }, 1250);
    }
  };

  const exitStyle: React.CSSProperties = {};

  // Gift programmato nel futuro → waiting page per tutti (evita flash).
  // Il creator ha un bottone extra "apri in anteprima" che setta
  // bypassSchedule=true e skippa la waiting. tick forza re-render
  // ogni secondo per aggiornare il countdown.
  if (scheduledAt && scheduledAt.getTime() > Date.now() && !bypassSchedule) {
    void tick;
    return (
      <WaitingPage
        scheduledAt={scheduledAt}
        recipientName={gift.recipient_name}
        senderAlias={(gift as any).sender_alias ?? null}
        isCreator={isCreator}
        onBypass={() => setBypassSchedule(true)}
      />
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes breathe{0%,100%{transform:translateY(0)}40%{transform:translateY(-8px) rotate(-1deg)}75%{transform:translateY(-4px) rotate(.7deg)}}
        @keyframes revealUp{from{opacity:0;transform:translateY(36px) scale(.93)}55%{transform:translateY(-4px) scale(1.02)}to{opacity:1;transform:none}}
        @keyframes glowP{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:.7;transform:scale(1.1)}}
        @keyframes cfPop{from{opacity:1;transform:translate(0,0) rotate(0)}to{opacity:0;transform:translate(var(--tx),var(--ty)) rotate(var(--rot))}}
        @keyframes riIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spinOut{0%{transform:scale(1) rotate(0deg);opacity:1}30%{transform:scale(1.2) rotate(360deg);opacity:1}100%{transform:scale(0) rotate(1080deg);opacity:0}}
        @keyframes shatterOut{0%{transform:scale(1) skew(0deg);opacity:1}25%{transform:scale(1.15) skew(0deg);opacity:1}60%{transform:scale(0.8) skew(15deg);opacity:.7}100%{transform:scale(0) skew(45deg) translateY(40px);opacity:0}}
        @keyframes unfoldOut{0%{transform:scaleY(1) rotate(0deg);opacity:1;transform-origin:bottom center}40%{transform:scaleY(1.1) rotate(-3deg);opacity:1;transform-origin:bottom center}100%{transform:scaleY(0) rotate(-8deg);opacity:0;transform-origin:bottom center}}
        @keyframes explodeOut{0%{transform:scale(1);opacity:1}40%{transform:scale(1.4);opacity:1}100%{transform:scale(3) rotate(8deg);opacity:0}}
        .breathe{animation:breathe 3s ease-in-out infinite}
        .reveal{animation:revealUp .9s cubic-bezier(.34,1.56,.64,1) both}
        .ri{animation:riIn .4s cubic-bezier(.34,1.56,.64,1) both}
        .boxExit{animation-duration:1.1s;animation-fill-mode:both;animation-timing-function:cubic-bezier(.4,0,.2,1)}
        .boxExit.spin{animation-name:spinOut}
        .boxExit.shatter{animation-name:shatterOut}
        .boxExit.unfold{animation-name:unfoldOut}
        .boxExit.explode{animation-name:explodeOut}
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", paddingTop: 32, marginBottom: 10 }}>
        <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.5px", color: DEEP }}>
          Be<span style={{ color: ACCENT }}>Gift</span>
        </span>
        {gift.recipient_name && (
          <p style={{ fontSize: 14, color: MUTED, marginTop: 7, fontStyle: "italic" }}>
            {t("gift.gift_for")} <strong style={{ color: DEEP }}>{gift.recipient_name}</strong>
            {fromName && <span> {t("gift.from")} <strong style={{ color: DEEP }}>{fromName}</strong></span>}
          </p>
        )}
      </div>

      {fromCreate && (
        <div style={{ background:"#fff8e1", borderBottom:"1px solid #ffe082", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <span style={{ fontSize:13, color:"#5d4037", fontWeight:600 }}>{t("gift.preview_banner")}</span>
          <button onClick={() => window.close()} style={{ background:"#5d4037", color:"#fff", border:"none", borderRadius:20, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
            {t("gift.close_preview")}
          </button>
        </div>
      )}
      {previewMode && !fromCreate && (
        <div style={{ background:"#fff8e1", borderBottom:"1px solid #ffe082", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <span style={{ fontSize:13, color:"#5d4037", fontWeight:600 }}>👀 {t("gift.preview_mode_banner")}</span>
          <a href="/dashboard" style={{ background:"#5d4037", color:"#fff", border:"none", borderRadius:20, padding:"8px 16px", fontSize:12, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap" }}>
            {t("gift.close_preview")}
          </a>
        </div>
      )}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 24px" }}>
        {/* Opening stage */}
        {phase !== "revealed" && (
          <div style={{ display: "inline-block", position: "relative", textAlign: "center", width: "100%" }}>
            {phase === "idle" && (
              <div style={{ position: "absolute", top: -24, left: -24, right: -24, bottom: -24, borderRadius: "50%", pointerEvents: "none", zIndex: 0, background: `radial-gradient(circle,${adj(paper,.22)}60 0%,transparent 68%)`, animation: "glowP 2.8s ease-in-out infinite" }}/>
            )}
            {/* Confetti for explode */}
            {phase === "opening" && anim === "explode" && (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
                {Array.from({ length: 24 }, (_, i) => {
                  const cols = ["#E8C84A","#D85A5A","#5DCAA5","#E8A0BC","#85B7EB"];
                  const ang  = (i/24)*360, dist = 65+(i%5)*16;
                  const tx   = (Math.cos(ang*Math.PI/180)*dist).toFixed(1);
                  const ty   = (Math.sin(ang*Math.PI/180)*dist-18).toFixed(1);
                  const rot  = ((i%2?1:-1)*(200+i*43)).toFixed(0);
                  const sz   = 6+(i%4)*3;
                  return <div key={i} style={{ position:"absolute", top:"50%", left:"50%", width:sz, height:i%2?sz:sz*.6, marginLeft:-sz/2, marginTop:-sz/2, background:cols[i%cols.length], borderRadius:["2px","50%","0px"][i%3], animation:`cfPop 1.1s ${(i*.023).toFixed(3)}s ease-out both`, "--tx":`${tx}px`, "--ty":`${ty}px`, "--rot":`${rot}deg` } as any}/>;
                })}
              </div>
            )}
            <div
              className={phase === "idle" ? "breathe" : phase === "opening" && anim !== "lift" ? `boxExit ${anim}` : ""}
              onClick={openGift}
              style={{ cursor: phase === "idle" ? "pointer" : "default", position: "relative", zIndex: 1, userSelect: "none", width: 200, height: 220, margin: "0 auto", ...exitStyle }}
            >
              {(pkg as any)?.theme && (pkg as any)?.theme !== "standard"
                ? <SharedGiftSVG paper={paper} ribbon={ribbon} bow={bow} bowType={pkg?.bowType} animated={false} theme={(pkg as any).theme}/>
                : <GiftSVG paper={paper} ribbon={ribbon} bow={bow} bowType={pkg?.bowType} animated={false} lidY={lidY}/>
              }
            </div>
            {phase === "idle" && <p style={{ marginTop: 8, color: MUTED, fontSize: 14, fontStyle: "italic", textAlign: "center" }}>{t("gift.tap_to_open")}</p>}
          </div>
        )}

        {/* Revealed */}
        {phase === "revealed" && isCreator && (
          <div className="ri" style={{ marginTop: 32, paddingTop: 28, borderTop: "1px solid #ede8e0", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: MUTED, margin: "0 0 12px" }}>{t("gift.created_by_you")}</p>
            <a href="/dashboard" style={{ display: "inline-block", background: "#fff", border: "1.5px solid #e0dbd5", color: DEEP, borderRadius: 40, padding: "10px 22px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              {t("gift.go_to_gifts")}
            </a>
          </div>
        )}
        {phase === "revealed" && playing && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, margin:"0 0 12px" }}>
            {songTitle && <p style={{ fontSize:13, color:"#888", margin:0 }}>🎵 {songTitle}</p>}
            <button onClick={stopMusic} style={{ display:"flex", alignItems:"center", gap:8, background:"#fff5f8", border:"1.5px solid #f9c8d9", borderRadius:40, padding:"8px 16px", fontSize:13, fontWeight:600, color:"#D4537E", cursor:"pointer" }}>
              <span>⏹</span> {t("gift.stop_music")}
            </button>
          </div>
        )}
        {phase === "revealed" && (
          <div className="reveal">
            <div style={{ fontSize: 22, letterSpacing: 8, color: ACCENT, marginBottom: 10, textAlign: "center" }}>✦ ✦ ✦</div>
            <GiftContent gift={gift}/>
          </div>
        )}

        {/* Back to received gifts */}
        {opened && !isCreator && loggedIn && (
          <div style={{ textAlign:"center", marginTop:16 }}>
            <a href="/dashboard?tab=received" style={{ display:"inline-block", background:"#fff", border:"1.5px solid #e0dbd5", color:MUTED, borderRadius:40, padding:"9px 20px", fontSize:13, fontWeight:600, textDecoration:"none" }}>
              {t("gift.back_to_received")}
            </a>
          </div>
        )}

        {/* Reaction zone */}
        {opened && !showReact && !isCreator && (
          <div className="ri" style={{ marginTop: 32, paddingTop: 28, borderTop: "1px solid #ede8e0" }}>
            {sentReaction ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: MUTED, fontSize: 13, marginBottom: 12 }}>{t("reactions.reaction_sent")}</p>
                <button onClick={() => setShowReact(true)} style={{ background: "transparent", border: "1.5px solid #e0dbd5", color: MUTED, borderRadius: 40, padding: "9px 20px", fontSize: 13, cursor: "pointer" }}>{t("reactions.modify_reaction")}</button>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 700, color: DEEP, fontSize: 16, margin: "0 0 6px" }}>{t("gift.liked_gift")}</p>
                <p style={{ color: MUTED, fontSize: 14, margin: "0 0 16px" }}>{t("gift.send_reaction_to_sender")}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  {QUICK_EMOJIS.map(e => (
                    <button key={e} onClick={async () => {
                      await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ giftId: gift.id, type: "emoji", emoji: e, senderName: senderName }) });
                      setSentReaction({ type: "emoji", emoji: e });
                    }} style={{ fontSize: 32, padding: "8px", borderRadius: 50, border: "1.5px solid #e0dbd5", background: "#fff", cursor: "pointer", lineHeight: 1 }}>
                      {e}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowReact(true)} style={{ background: ACCENT, color: "#fff", border: "none", borderRadius: 40, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {t("gift.react_differently")}
                </button>
              </div>
            )}
          </div>
        )}

        {showReact && !isCreator && (
          <div className="ri" style={{ marginTop: 32, paddingTop: 28, borderTop: "1px solid #ede8e0" }}>
            <ReactionBuilder
              gift={gift}
              senderName={senderName}
              onSent={(r) => { setSentReaction(r); setShowReact(false); }}
            />
          </div>
        )}

        {/* Gift Chain — "Ringrazia con un regalo".
            Loop di viralità: dopo aver ricevuto un regalo, il destinatario
            può ringraziare creando un nuovo regalo per il mittente, con
            recipient + (eventualmente) riferimento al gift originale già
            pre-compilati nell'URL di /create. Solo per utenti loggati
            non-creator con un sender_alias disponibile. */}
        {opened && !isCreator && loggedIn && fromName && !previewMode && (
          <div style={{ marginTop: 32, paddingTop: 28, borderTop: "1px solid #ede8e0" }}>
            <ThankWithGiftCTA senderName={fromName} originalGiftId={gift.id} />
          </div>
        )}
      </div>

      {opened && !loggedIn && (
        <div style={{ margin: "24px 24px 0", background: "linear-gradient(135deg, #fff5f8, #ffeef4)", border: "1px solid #f9c8d9", borderRadius: 20, padding: "24px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: DEEP, margin: "0 0 6px" }}>{t("gift.liked_begift")}</h3>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: "0 0 16px" }}>
            {t("gift.create_free_account")}
          </p>
          <a href="/auth/login" style={{ display: "inline-block", background: ACCENT, color: "#fff", borderRadius: 40, padding: "12px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none", marginBottom: 8 }}>
            {t("gift.create_account_cta")}
          </a>
          <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>{t("auth.no_password")}</div>
        </div>
      )}
      <div style={{ marginTop: 24, padding: "14px 24px 80px", textAlign: "center" }}>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#bbb" }}>Made with ❤️ by BeGift</p>
      </div>
      {/* GiftChat nascosto in preview mode: il mittente sta solo guardando
          l'anteprima, non deve aprire/interagire con la chat reale */}
      {!previewMode && (
        <GiftChat
          giftId={gift.id}
          isCreator={isCreator}
          recipientName={gift.recipient_name}
          creatorName={(gift as any).sender_alias || undefined}
        />
      )}
    </main>
  );
}

/**
 * WaitingPage — mostrata al destinatario quando il gift è programmato
 * per una data/ora futura. Grande orologio + countdown D/H/M/S che
 * si aggiorna live, messaggio "arriva il [data]", call-to-action
 * discreta (niente spoiler sul contenuto).
 */
function WaitingPage({
  scheduledAt,
  recipientName,
  senderAlias,
  isCreator,
  onBypass,
}: {
  scheduledAt: Date;
  recipientName: string;
  senderAlias: string | null;
  isCreator: boolean;
  onBypass: () => void;
}) {
  const ACCENT = "#D4537E";
  const DEEP = "#1a1a1a";
  const MUTED = "#888";

  const now = Date.now();
  const diff = Math.max(0, scheduledAt.getTime() - now);
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  const arrivalLocal = scheduledAt.toLocaleString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <main style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 20, animation: "floatWait 3s ease-in-out infinite" }}>🎁</div>
      <style>{`@keyframes floatWait { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>

      <h1 style={{ fontSize: 28, fontWeight: 800, color: DEEP, margin: "0 0 10px" }}>
        {recipientName ? <>Un regalo per <span style={{ color: ACCENT }}>{recipientName}</span></> : "Un regalo in arrivo"}
      </h1>
      {senderAlias && (
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 28px" }}>
          da <strong style={{ color: DEEP }}>{senderAlias}</strong>
        </p>
      )}

      <p style={{ fontSize: 14, color: MUTED, margin: "0 0 18px", maxWidth: 400, lineHeight: 1.5 }}>
        Il tuo regalo si aprirà il<br/>
        <strong style={{ color: DEEP, fontSize: 15 }}>{arrivalLocal}</strong>
      </p>

      <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap", justifyContent: "center" }}>
        {[{v:d,l:"giorni"},{v:h,l:"ore"},{v:m,l:"minuti"},{v:s,l:"secondi"}].map(({v,l}) => (
          <div key={l} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", minWidth: 70, border: "1px solid #e0dbd5", boxShadow: "0 2px 8px #0000000a" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: DEEP, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {v.toString().padStart(2, "0")}
            </div>
            <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>
              {l}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: MUTED, maxWidth: 340, lineHeight: 1.5, margin: 0 }}>
        Torna su questo link all&apos;orario indicato. Salva la pagina nei preferiti per non perdertelo.
      </p>

      {/* Banner per il creator: può aprire in anteprima per verificare */}
      {isCreator && (
        <div style={{
          marginTop: 32, padding: "14px 18px",
          background: "#fff5e1", border: "1px solid #f4d88a",
          borderRadius: 14, maxWidth: 400,
          textAlign: "left",
        }}>
          <div style={{ fontSize: 12, color: "#8a6520", fontWeight: 700, marginBottom: 6 }}>
            👋 Sei tu il mittente
          </div>
          <div style={{ fontSize: 12, color: "#5d4a15", lineHeight: 1.5, marginBottom: 10 }}>
            Il destinatario vedrà questo countdown fino all&apos;arrivo del regalo.
            Tu puoi aprirlo in anteprima per verificare.
          </div>
          <button
            onClick={onBypass}
            style={{
              background: "#8a6520", color: "#fff", border: "none",
              borderRadius: 20, padding: "8px 16px",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            👁️ Apri in anteprima →
          </button>
        </div>
      )}

      <div style={{ marginTop: 40, fontSize: 11, color: "#bbb" }}>
        Made with ❤️ by Be<span style={{ color: ACCENT }}>Gift</span>
      </div>
    </main>
  );
}

/**
 * ThankWithGiftCTA — bottone "Ringrazia {sender} con un regalo" che appare
 * dopo l'apertura per il destinatario loggato, quando conosciamo il nome
 * del mittente (sender_alias). Porta a /create con `recipient` e `thankFor`
 * pre-compilati via query-string, così CreateGiftClient può:
 *  - riempire subito il campo `name`
 *  - mostrare un banner "Stai ringraziando {name}"
 *  - tracciare in futuro la gift-chain (thankFor = id del gift originale)
 *
 * Copy + CTA separati dal blocco "crea account gratis" (che è per non-loggati)
 * e dalla reaction zone (reazione leggera vs regalo vero e proprio).
 */
function ThankWithGiftCTA({ senderName, originalGiftId }: { senderName: string; originalGiftId: string }) {
  const { t } = useI18n();
  const ACCENT = "#D4537E";
  const DEEP = "#1a1a1a";
  const MUTED = "#888";
  const href = `/create?thankFor=${encodeURIComponent(originalGiftId)}&recipient=${encodeURIComponent(senderName)}`;
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #fff5f8, #ffeef4)",
        border: "1px solid #f9c8d9",
        borderRadius: 20,
        padding: "22px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>💝</div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: DEEP, margin: "0 0 6px" }}>
        {t("gift.thank_with_gift_title", { name: senderName })}
      </h3>
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, margin: "0 0 16px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
        {t("gift.thank_with_gift_desc")}
      </p>
      <a
        href={href}
        style={{
          display: "inline-block",
          background: ACCENT,
          color: "#fff",
          border: "none",
          borderRadius: 40,
          padding: "13px 26px",
          fontSize: 14,
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 4px 14px rgba(212, 83, 126, 0.25)",
        }}
      >
        {t("gift.thank_with_gift_cta")}
      </a>
    </div>
  );
}
