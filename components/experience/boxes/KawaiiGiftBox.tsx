"use client";

import { useMemo } from "react";
import type { Environment, SceneBeat } from "../themes/types";

interface KawaiiGiftBoxProps {
  environment: Environment;
  beat: SceneBeat;
  size?: number;
  onClick?: () => void;
  accentOverride?: string;
}

/**
 * Kawaii-style gift box — soft washi-paper textures, pastel palette,
 * a simple flat bow. This V1 is geometrically similar to the Candy box
 * so animations and timing can be compared side-by-side; styling is
 * where they diverge (less gloss, no heavy shadows, softer colors).
 *
 * Future: add subtle ink/brushstroke texture and a tiny folded paper
 * crane or daruma charm attached to the bow.
 */
export function KawaiiGiftBox({
  environment,
  beat,
  size = 320,
  onClick,
  accentOverride,
}: KawaiiGiftBoxProps) {
  const uid = useMemo(() => `kb-${Math.random().toString(36).slice(2, 8)}`, []);
  const p = environment.palette;
  const bow = accentOverride ?? p.secondary;
  const ribbon = accentOverride ?? p.secondary;

  return (
    <div
      className={`kawaii-gift-box beat-${beat}`}
      style={{ width: size, height: size * 1.2, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? "Apri il regalo" : undefined}
    >
      <svg
        viewBox="0 0 200 240"
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={shade(p.primary, -0.08)} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`${uid}-lid`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={shade(p.primary, 0.05)} stopOpacity="1" />
            <stop offset="100%" stopColor={p.primary} stopOpacity="1" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.glow} stopOpacity="0.5" />
            <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          className="glow"
          cx="100"
          cy="165"
          r="110"
          fill={`url(#${uid}-glow)`}
        />

        <ellipse
          cx="100"
          cy="224"
          rx="60"
          ry="5"
          fill="#000"
          opacity="0.08"
          className="shadow"
        />

        {/* Box body */}
        <g className="body">
          <rect
            x="30"
            y="150"
            width="140"
            height="70"
            rx="3"
            fill={`url(#${uid}-body)`}
          />
          {/* Washi texture: faint vertical lines */}
          <g opacity="0.1" stroke="#fff" strokeWidth="0.5">
            <line x1="50" y1="152" x2="50" y2="218" />
            <line x1="80" y1="152" x2="80" y2="218" />
            <line x1="120" y1="152" x2="120" y2="218" />
            <line x1="150" y1="152" x2="150" y2="218" />
          </g>
          <rect
            x="92"
            y="150"
            width="16"
            height="70"
            fill={ribbon}
            opacity="0.92"
          />
        </g>

        {/* Lid */}
        <g className="lid">
          <rect
            x="26"
            y="112"
            width="148"
            height="42"
            rx="3"
            fill={`url(#${uid}-lid)`}
          />
          <rect
            x="92"
            y="112"
            width="16"
            height="42"
            fill={ribbon}
            opacity="0.92"
          />
        </g>

        {/* Bow — flat paper-style */}
        <g className="bow">
          {/* Left loop */}
          <path
            d="M 100 95 Q 72 78 58 95 Q 52 108 68 112 Q 88 112 100 100 Z"
            fill={bow}
            stroke={shade(bow, -0.15)}
            strokeWidth="1.2"
          />
          {/* Right loop */}
          <path
            d="M 100 95 Q 128 78 142 95 Q 148 108 132 112 Q 112 112 100 100 Z"
            fill={bow}
            stroke={shade(bow, -0.15)}
            strokeWidth="1.2"
          />
          {/* Knot */}
          <rect
            x="93"
            y="92"
            width="14"
            height="16"
            rx="2"
            fill={shade(bow, -0.1)}
            stroke={shade(bow, -0.25)}
            strokeWidth="1"
          />
          {/* Ribbon tails */}
          <path
            d="M 96 108 Q 90 120 86 114"
            stroke={bow}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 104 108 Q 110 120 114 114"
            stroke={bow}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Sparkles — sakura-like */}
        <g className="sparkles" opacity="0">
          <Petal x={55} y={80} color={bow} rot={-25} />
          <Petal x={150} y={85} color={p.accent} rot={20} />
          <Petal x={40} y={135} color={bow} rot={45} />
          <Petal x={165} y={140} color={p.accent} rot={-15} />
        </g>

        <circle
          className="flash"
          cx="100"
          cy="165"
          r="0"
          fill="#fff"
          opacity="0"
        />
      </svg>

      <style jsx>{`
        .kawaii-gift-box {
          display: inline-block;
          position: relative;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .kawaii-gift-box.beat-idle :global(.body),
        .kawaii-gift-box.beat-idle :global(.lid),
        .kawaii-gift-box.beat-idle :global(.bow) {
          animation: k-breathe 3s ease-in-out infinite;
          transform-origin: 100px 200px;
          transform-box: fill-box;
        }
        .kawaii-gift-box.beat-idle :global(.glow) {
          animation: k-halo 3s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes k-breathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50%      { transform: scale(1.02) translateY(-1.5px); }
        }
        @keyframes k-halo {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%      { opacity: 0.75; transform: scale(1.05); }
        }

        .kawaii-gift-box.beat-anticipation :global(.body),
        .kawaii-gift-box.beat-anticipation :global(.lid),
        .kawaii-gift-box.beat-anticipation :global(.bow) {
          animation: k-shake 0.25s ease-in-out infinite;
        }
        .kawaii-gift-box.beat-anticipation :global(.sparkles) {
          animation: k-sparkle-in 0.6s forwards;
        }
        @keyframes k-shake {
          0%, 100% { transform: translateX(0) rotate(0); }
          25%      { transform: translateX(-1px) rotate(-0.6deg); }
          75%      { transform: translateX(1px) rotate(0.6deg); }
        }
        @keyframes k-sparkle-in { from { opacity: 0; } to { opacity: 1; } }

        .kawaii-gift-box.beat-unlock :global(.bow) {
          animation: k-bow-launch 0.6s cubic-bezier(.36,.07,.19,.97) forwards;
          transform-origin: 100px 100px;
          transform-box: fill-box;
        }
        .kawaii-gift-box.beat-unlock :global(.lid) {
          animation: k-lid-lift 0.75s cubic-bezier(.36,.07,.19,.97) forwards;
          transform-origin: 30px 154px;
          transform-box: fill-box;
        }
        .kawaii-gift-box.beat-unlock :global(.sparkles) { opacity: 1; }
        @keyframes k-bow-launch {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          40%  { transform: translateY(-25px) rotate(-12deg) scale(1.08); }
          100% { transform: translateY(-130px) rotate(-30deg) scale(0.7); opacity: 0; }
        }
        @keyframes k-lid-lift {
          0%   { transform: translate(0,0) rotate(0); }
          100% { transform: translate(-30px,-55px) rotate(-35deg); }
        }

        .kawaii-gift-box.beat-burst :global(.flash) {
          animation: k-flash 0.5s ease-out forwards;
        }
        .kawaii-gift-box.beat-burst :global(.bow) { opacity: 0; }
        .kawaii-gift-box.beat-burst :global(.lid) {
          transform: translate(-30px,-55px) rotate(-35deg);
          transform-origin: 30px 154px;
          transform-box: fill-box;
        }
        @keyframes k-flash {
          0%   { r: 0;   opacity: 0.7; }
          50%  { r: 120; opacity: 0.5; }
          100% { r: 190; opacity: 0; }
        }

        .kawaii-gift-box.beat-emerge :global(.bow),
        .kawaii-gift-box.beat-settle :global(.bow) { opacity: 0; }
        .kawaii-gift-box.beat-emerge :global(.lid),
        .kawaii-gift-box.beat-settle :global(.lid) {
          transform: translate(-30px,-55px) rotate(-35deg);
          transform-origin: 30px 154px;
          transform-box: fill-box;
        }
        .kawaii-gift-box.beat-emerge :global(.sparkles),
        .kawaii-gift-box.beat-settle :global(.sparkles) {
          opacity: 1;
          animation: k-sparkle-float 2.4s ease-in-out infinite alternate;
        }
        @keyframes k-sparkle-float {
          from { opacity: 0.5; transform: translateY(0); }
          to   { opacity: 1;   transform: translateY(-4px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .kawaii-gift-box :global(.body),
          .kawaii-gift-box :global(.lid),
          .kawaii-gift-box :global(.bow),
          .kawaii-gift-box :global(.glow),
          .kawaii-gift-box :global(.sparkles),
          .kawaii-gift-box :global(.flash) {
            animation-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}

function Petal({ x, y, color, rot }: { x: number; y: number; color: string; rot: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path
        d="M 0 -5 Q 4 -2 3 3 Q 0 6 -3 3 Q -4 -2 0 -5 Z"
        fill={color}
        opacity="0.9"
      />
    </g>
  );
}

function shade(hex: string, factor: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const adjust = (c: number) => {
    const v = factor >= 0 ? c + (255 - c) * factor : c + c * factor;
    return Math.max(0, Math.min(255, Math.round(v)));
  };
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}
