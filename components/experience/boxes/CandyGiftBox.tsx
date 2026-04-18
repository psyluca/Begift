"use client";

import { useMemo } from "react";
import type { Environment, SceneBeat } from "../themes/types";

interface CandyGiftBoxProps {
  environment: Environment;
  beat: SceneBeat;
  size?: number;
  onClick?: () => void;
  accentOverride?: string;
}

/**
 * Candy-style gift box — glossy, saturated, with a chunky bow on top.
 *
 * Visual anatomy (viewBox 200x240):
 *  - bow (top): 60..140, 30..110
 *  - lid: 30..170, 110..150
 *  - body: 30..170, 150..220
 *  - vertical ribbon stripe runs through center: 95..105, 110..220
 *
 * All animations are driven by the `beat` prop, applied as a CSS class so
 * keyframes can be sequenced without JS timing logic.
 */
export function CandyGiftBox({
  environment,
  beat,
  size = 320,
  onClick,
  accentOverride,
}: CandyGiftBoxProps) {
  // Stable-per-instance id for SVG gradient refs (avoids collisions if
  // multiple boxes are rendered on the same page).
  const uid = useMemo(() => `cb-${Math.random().toString(36).slice(2, 8)}`, []);

  const p = environment.palette;
  const bow = accentOverride ?? p.secondary;
  const ribbon = accentOverride ?? p.secondary;

  return (
    <div
      className={`candy-gift-box beat-${beat}`}
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
            <stop offset="100%" stopColor={shade(p.primary, -0.25)} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`${uid}-lid`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={shade(p.primary, 0.12)} stopOpacity="1" />
            <stop offset="100%" stopColor={p.primary} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`${uid}-ribbon`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={shade(ribbon, -0.15)} stopOpacity="1" />
            <stop offset="50%" stopColor={shade(ribbon, 0.2)} stopOpacity="1" />
            <stop offset="100%" stopColor={shade(ribbon, -0.15)} stopOpacity="1" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.glow} stopOpacity="0.6" />
            <stop offset="60%" stopColor={p.glow} stopOpacity="0.15" />
            <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Halo / glow behind the box ─────────────────── */}
        <circle
          className="glow"
          cx="100"
          cy="165"
          r="110"
          fill={`url(#${uid}-glow)`}
        />

        {/* ── Drop shadow ─────────────────────────────────── */}
        <ellipse
          cx="100"
          cy="224"
          rx="62"
          ry="6"
          fill="#000"
          opacity="0.25"
          className="shadow"
        />

        {/* ── Box body (bottom half) ─────────────────────── */}
        <g className="body">
          <rect
            x="30"
            y="150"
            width="140"
            height="70"
            rx="6"
            fill={`url(#${uid}-body)`}
          />
          {/* glossy highlight on body */}
          <rect
            x="36"
            y="154"
            width="128"
            height="14"
            rx="4"
            fill="#fff"
            opacity="0.18"
          />
          {/* vertical ribbon on body */}
          <rect
            x="93"
            y="150"
            width="14"
            height="70"
            fill={`url(#${uid}-ribbon)`}
          />
        </g>

        {/* ── Lid (tilts up on opening) ──────────────────── */}
        <g className="lid">
          <rect
            x="26"
            y="110"
            width="148"
            height="44"
            rx="5"
            fill={`url(#${uid}-lid)`}
          />
          {/* glossy highlight on lid */}
          <rect
            x="32"
            y="114"
            width="136"
            height="10"
            rx="3"
            fill="#fff"
            opacity="0.22"
          />
          {/* vertical ribbon on lid */}
          <rect
            x="93"
            y="110"
            width="14"
            height="44"
            fill={`url(#${uid}-ribbon)`}
          />
        </g>

        {/* ── Bow on top (flies off on opening) ──────────── */}
        <g className="bow">
          {/* Left loop */}
          <ellipse
            cx="78"
            cy="92"
            rx="24"
            ry="18"
            fill={bow}
            stroke={shade(bow, -0.2)}
            strokeWidth="1.5"
            transform="rotate(-18 78 92)"
          />
          <ellipse
            cx="78"
            cy="92"
            rx="8"
            ry="6"
            fill={shade(bow, -0.15)}
            transform="rotate(-18 78 92)"
          />
          {/* Right loop */}
          <ellipse
            cx="122"
            cy="92"
            rx="24"
            ry="18"
            fill={bow}
            stroke={shade(bow, -0.2)}
            strokeWidth="1.5"
            transform="rotate(18 122 92)"
          />
          <ellipse
            cx="122"
            cy="92"
            rx="8"
            ry="6"
            fill={shade(bow, -0.15)}
            transform="rotate(18 122 92)"
          />
          {/* Knot in the middle */}
          <rect
            x="92"
            y="84"
            width="16"
            height="22"
            rx="3"
            fill={shade(bow, -0.1)}
            stroke={shade(bow, -0.3)}
            strokeWidth="1"
          />
          <rect
            x="94"
            y="86"
            width="12"
            height="5"
            rx="1"
            fill="#fff"
            opacity="0.35"
          />
          {/* Ribbon tails */}
          <path
            d="M 96 104 Q 88 115 82 108"
            stroke={bow}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 104 104 Q 112 115 118 108"
            stroke={bow}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* ── Sparkles (only visible during anticipation/burst) ─ */}
        <g className="sparkles" opacity="0">
          <Sparkle x={55} y={75} color={p.accent} />
          <Sparkle x={150} y={80} color={p.accent} />
          <Sparkle x={40} y={130} color="#fff" />
          <Sparkle x={165} y={135} color="#fff" />
          <Sparkle x={100} y={55} color={p.accent} />
        </g>

        {/* ── Flash overlay (burst beat) ─────────────────── */}
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
        .candy-gift-box {
          display: inline-block;
          position: relative;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        /* ───── IDLE ─ gentle breathing ───── */
        .candy-gift-box.beat-idle :global(.body),
        .candy-gift-box.beat-idle :global(.lid),
        .candy-gift-box.beat-idle :global(.bow) {
          animation: breathe 2.6s ease-in-out infinite;
          transform-origin: 100px 200px;
          transform-box: fill-box;
        }
        .candy-gift-box.beat-idle :global(.glow) {
          animation: halo-pulse 2.6s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50%      { transform: scale(1.025) translateY(-2px); }
        }
        @keyframes halo-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.85; transform: scale(1.08); }
        }

        /* ───── ANTICIPATION ─ stronger glow + tiny shake + sparkles ───── */
        .candy-gift-box.beat-anticipation :global(.body),
        .candy-gift-box.beat-anticipation :global(.lid),
        .candy-gift-box.beat-anticipation :global(.bow) {
          animation: shake 0.22s ease-in-out infinite;
        }
        .candy-gift-box.beat-anticipation :global(.glow) {
          animation: halo-intensify 0.7s ease-in-out infinite alternate;
        }
        .candy-gift-box.beat-anticipation :global(.sparkles) {
          animation: sparkle-in 0.5s forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25%      { transform: translateX(-1.5px) rotate(-0.8deg); }
          75%      { transform: translateX(1.5px) rotate(0.8deg); }
        }
        @keyframes halo-intensify {
          from { opacity: 0.7; transform: scale(1.05); }
          to   { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes sparkle-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ───── UNLOCK ─ bow flies off, lid tilts back ───── */
        .candy-gift-box.beat-unlock :global(.bow) {
          animation: bow-launch 0.55s cubic-bezier(.36,.07,.19,.97) forwards;
          transform-origin: 100px 100px;
          transform-box: fill-box;
        }
        .candy-gift-box.beat-unlock :global(.lid) {
          animation: lid-lift 0.7s cubic-bezier(.36,.07,.19,.97) forwards;
          transform-origin: 30px 154px;
          transform-box: fill-box;
        }
        .candy-gift-box.beat-unlock :global(.sparkles) {
          opacity: 1;
        }
        @keyframes bow-launch {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          40%  { transform: translateY(-30px) rotate(-15deg) scale(1.1); opacity: 1; }
          100% { transform: translateY(-140px) rotate(-35deg) scale(0.7); opacity: 0; }
        }
        @keyframes lid-lift {
          0%   { transform: translate(0,0) rotate(0deg); }
          100% { transform: translate(-30px,-55px) rotate(-35deg); }
        }

        /* ───── BURST ─ white flash expands ───── */
        .candy-gift-box.beat-burst :global(.flash) {
          animation: flash 0.45s ease-out forwards;
        }
        .candy-gift-box.beat-burst :global(.bow) {
          opacity: 0;
        }
        .candy-gift-box.beat-burst :global(.lid) {
          transform: translate(-30px,-55px) rotate(-35deg);
          transform-origin: 30px 154px;
          transform-box: fill-box;
        }
        @keyframes flash {
          0%   { r: 0;   opacity: 0.9; }
          50%  { r: 130; opacity: 0.7; }
          100% { r: 200; opacity: 0; }
        }

        /* ───── EMERGE / SETTLE ─ lid remains open, sparkles linger ───── */
        .candy-gift-box.beat-emerge :global(.bow),
        .candy-gift-box.beat-settle :global(.bow) {
          opacity: 0;
        }
        .candy-gift-box.beat-emerge :global(.lid),
        .candy-gift-box.beat-settle :global(.lid) {
          transform: translate(-30px,-55px) rotate(-35deg);
          transform-origin: 30px 154px;
          transform-box: fill-box;
        }
        .candy-gift-box.beat-emerge :global(.sparkles),
        .candy-gift-box.beat-settle :global(.sparkles) {
          opacity: 1;
          animation: sparkle-twinkle 1.6s ease-in-out infinite alternate;
        }
        @keyframes sparkle-twinkle {
          from { opacity: 0.6; }
          to   { opacity: 1;   }
        }

        /* Respect users who prefer less motion */
        @media (prefers-reduced-motion: reduce) {
          .candy-gift-box :global(.body),
          .candy-gift-box :global(.lid),
          .candy-gift-box :global(.bow),
          .candy-gift-box :global(.glow),
          .candy-gift-box :global(.sparkles),
          .candy-gift-box :global(.flash) {
            animation-duration: 0.001s !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ─────────── helpers ─────────── */

function Sparkle({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M 0 -6 L 1.2 -1.2 L 6 0 L 1.2 1.2 L 0 6 L -1.2 1.2 L -6 0 L -1.2 -1.2 Z"
        fill={color}
      />
    </g>
  );
}

/** Lightens (+n) or darkens (-n) a hex color by a 0..1 factor. */
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
