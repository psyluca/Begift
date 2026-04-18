"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GiftMetadata, SceneBeat } from "../themes/types";
import { useExperienceTheme } from "../themes/ThemeProvider";
import { CandyGiftBox } from "../boxes/CandyGiftBox";
import { KawaiiGiftBox } from "../boxes/KawaiiGiftBox";
import { ConfettiBurst } from "../particles/ConfettiBurst";

interface GiftOpenSceneProps {
  /** Per-gift personalization inputs. All optional for V1. */
  gift?: GiftMetadata;
  /** If true, the box auto-opens after a brief delay. */
  autoOpen?: boolean;
  /** Called when the full sequence reaches `settle`. */
  onSettled?: () => void;
}

/**
 * Cinematic gift-opening scene — orchestrates a fixed sequence of beats:
 *   idle → anticipation → unlock → burst → emerge → settle
 *
 * The scene reads the current Environment from ExperienceThemeProvider and
 * swaps in the right box component (CandyGiftBox / KawaiiGiftBox). All
 * timings live here, in one place, so they can be tuned without touching
 * the individual box animations.
 *
 * Personalization (gift.recipientName, gift.message, etc.) is applied to
 * the text layers that appear during emerge/settle — the box itself reads
 * only gift.accentColor and gift.seed.
 */
const BEAT_DURATIONS: Record<Exclude<SceneBeat, "settle">, number> = {
  idle: 0,           // waits for user click (or autoOpen timer)
  anticipation: 600, // shake + stronger glow
  unlock: 650,       // bow launches + lid lifts
  burst: 350,        // white flash + confetti triggers
  emerge: 900,       // content rises, title fades in
};

export function GiftOpenScene({ gift, autoOpen = false, onSettled }: GiftOpenSceneProps) {
  const { theme } = useExperienceTheme();
  const env = theme.environment;
  const [beat, setBeat] = useState<SceneBeat>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /** Clear all pending beat transitions (safe to call at any time). */
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  /** Kick off the full opening sequence from idle. Idempotent. */
  const startOpening = useCallback(() => {
    setBeat((current) => {
      if (current !== "idle") return current;

      let t = 0;
      const schedule = (ms: number, fn: () => void) => {
        t += ms;
        timers.current.push(setTimeout(fn, t));
      };

      schedule(0, () => setBeat("anticipation"));
      schedule(BEAT_DURATIONS.anticipation, () => setBeat("unlock"));
      schedule(BEAT_DURATIONS.unlock, () => setBeat("burst"));
      schedule(BEAT_DURATIONS.burst, () => setBeat("emerge"));
      schedule(BEAT_DURATIONS.emerge, () => {
        setBeat("settle");
        onSettled?.();
      });

      return "anticipation";
    });
  }, [onSettled]);

  /** Return to idle and allow replay. */
  const replay = useCallback(() => {
    clearTimers();
    setBeat("idle");
  }, [clearTimers]);

  // Handle autoOpen
  useEffect(() => {
    if (!autoOpen) return;
    const id = setTimeout(() => startOpening(), 800);
    return () => clearTimeout(id);
  }, [autoOpen, startOpening]);

  // Clear timers on unmount
  useEffect(() => () => clearTimers(), [clearTimers]);

  const palette = env.palette;
  const boxAccent = gift?.accentColor;
  const showConfetti = beat === "burst" || beat === "emerge" || beat === "settle";
  const showContent = beat === "emerge" || beat === "settle";

  return (
    <div
      className="scene"
      style={{
        background: `radial-gradient(ellipse at center, ${palette.surface} 0%, ${palette.background} 75%)`,
        color: palette.textOnBg,
      }}
    >
      <div className="stage" aria-live="polite">
        {/* Confetti burst layer */}
        {showConfetti && (
          <div className="confetti-layer">
            <ConfettiBurst
              colors={palette.confetti}
              seed={gift?.seed}
              originY={62}
              radius={340}
              duration={1900}
            />
          </div>
        )}

        {/* Gift box */}
        <div className="box-layer">
          {env.id === "candy" ? (
            <CandyGiftBox
              environment={env}
              beat={beat}
              size={300}
              accentOverride={boxAccent}
              onClick={beat === "idle" ? startOpening : undefined}
            />
          ) : (
            <KawaiiGiftBox
              environment={env}
              beat={beat}
              size={300}
              accentOverride={boxAccent}
              onClick={beat === "idle" ? startOpening : undefined}
            />
          )}
        </div>

        {/* Content layer — revealed during emerge/settle */}
        {showContent && (
          <div className="content-layer">
            <ContentSlot gift={gift} palette={palette} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="controls">
        {beat === "idle" && (
          <p className="hint" style={{ color: palette.textOnBg, opacity: 0.75 }}>
            {gift?.recipientName
              ? `Tocca il pacco per aprire il regalo di ${gift.recipientName}`
              : "Tocca il pacco per aprirlo"}
          </p>
        )}
        {beat === "settle" && (
          <button className="replay-btn" onClick={replay} style={{ background: palette.primary }}>
            Rigioca l'apertura
          </button>
        )}
      </div>

      <style jsx>{`
        .scene {
          position: relative;
          min-height: 100dvh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 24px;
          box-sizing: border-box;
        }
        .stage {
          position: relative;
          width: 100%;
          max-width: 420px;
          aspect-ratio: 5 / 6;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .confetti-layer,
        .box-layer,
        .content-layer {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .box-layer { pointer-events: auto; }
        .content-layer {
          animation: content-rise 0.9s cubic-bezier(.1,.7,.2,1) forwards;
          pointer-events: none;
        }
        @keyframes content-rise {
          0%   { opacity: 0; transform: translateY(30px) scale(0.6); }
          60%  { opacity: 1; transform: translateY(-8px) scale(1.06); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .controls {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          min-height: 60px;
        }
        .hint {
          font-size: 15px;
          font-weight: 500;
          text-align: center;
          letter-spacing: 0.2px;
          animation: hint-pulse 2s ease-in-out infinite;
        }
        @keyframes hint-pulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 0.95; }
        }
        .replay-btn {
          color: #fff;
          border: none;
          border-radius: 40px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
          animation: btn-in 0.5s ease-out both;
        }
        @keyframes btn-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─────────── Content slot ───────────
 *
 * Displays what emerges from the box. V1 shows the recipient's name, the
 * sender's alias, and a short message — all optional. Later this will
 * become a proper plug-in system (money / voucher / photo / playlist).
 */
function ContentSlot({
  gift,
  palette,
}: {
  gift?: GiftMetadata;
  palette: { primary: string; textOnBg: string; accent: string };
}) {
  const recipient = gift?.recipientName;
  const sender = gift?.senderAlias;
  const message = gift?.message;

  return (
    <div
      style={{
        textAlign: "center",
        padding: "0 20px",
        pointerEvents: "auto",
        color: palette.textOnBg,
      }}
    >
      {recipient && (
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 6 }}>
          Per <span style={{ color: palette.accent, fontWeight: 700 }}>{recipient}</span>
        </div>
      )}
      <div
        style={{
          fontSize: 40,
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 10,
          textShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}
      >
        {message ?? "✨ Sorpresa!"}
      </div>
      {sender && (
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          da {sender}
        </div>
      )}
    </div>
  );
}
