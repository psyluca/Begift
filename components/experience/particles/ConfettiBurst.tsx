"use client";

import { useMemo } from "react";

interface ConfettiBurstProps {
  /** Color palette to sample from */
  colors: string[];
  /** Total number of particles (default 48) */
  count?: number;
  /** Origin point relative to parent (in %). Defaults to center. */
  originX?: number;
  originY?: number;
  /** Radius of the burst in px (max travel distance) */
  radius?: number;
  /** Deterministic seed — same seed = identical burst */
  seed?: string;
  /** Total duration of particle animation, ms */
  duration?: number;
  /** Optional additional rotation (deg) */
  extraSpin?: number;
}

/**
 * Confetti burst — pure CSS animation, no canvas.
 *
 * Generates `count` small colored particles that explode outward from an
 * origin point, rotate, and fall with gravity. Each particle has its final
 * position precomputed (so CSS only has to interpolate start → end).
 *
 * Intended to be rendered inside a `position: relative` container, sized
 * to the scene — the burst fills that container.
 */
export function ConfettiBurst({
  colors,
  count = 48,
  originX = 50,
  originY = 50,
  radius = 280,
  seed,
  duration = 1800,
  extraSpin = 360,
}: ConfettiBurstProps) {
  const particles = useMemo(
    () => generateParticles(count, colors, radius, seed),
    [count, colors, radius, seed]
  );

  return (
    <div
      className="confetti-burst"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
      }}
      aria-hidden="true"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${originX}%`,
            top: `${originY}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animationDelay: `${p.delay}ms`,
            animationDuration: `${duration}ms`,
            // Custom properties consumed by keyframes
            ["--tx" as any]: `${p.tx}px`,
            ["--ty" as any]: `${p.ty}px`,
            ["--tyFall" as any]: `${p.ty + 120 + p.fallBonus}px`,
            ["--spin" as any]: `${extraSpin * p.spinDir}deg`,
          }}
        />
      ))}
      <style jsx>{`
        .particle {
          position: absolute;
          display: block;
          transform: translate(-50%, -50%);
          opacity: 0;
          animation-name: burst;
          animation-fill-mode: forwards;
          animation-timing-function: cubic-bezier(.1, .7, .2, 1);
          will-change: transform, opacity;
        }
        @keyframes burst {
          0% {
            transform: translate(-50%, -50%) scale(0.3) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          55% {
            transform: translate(
                calc(-50% + var(--tx)),
                calc(-50% + var(--ty))
              )
              scale(1)
              rotate(var(--spin));
            opacity: 1;
          }
          100% {
            transform: translate(
                calc(-50% + var(--tx)),
                calc(-50% + var(--tyFall))
              )
              scale(0.85)
              rotate(calc(var(--spin) * 1.3));
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .particle { animation-duration: 0.001s !important; opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}

/* ─────────── helpers ─────────── */

interface Particle {
  color: string;
  size: number;
  tx: number;
  ty: number;
  fallBonus: number;
  delay: number;
  shape: "square" | "circle";
  spinDir: 1 | -1;
}

function generateParticles(
  count: number,
  colors: string[],
  radius: number,
  seed?: string
): Particle[] {
  const rng = seededRng(seed ?? "default");
  const result: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const distance = radius * (0.45 + rng() * 0.55);
    const tx = Math.cos(angle) * distance;
    // Bias upward — confetti explodes up and then falls
    const ty = Math.sin(angle) * distance * 0.75 - rng() * 40;
    result.push({
      color: colors[Math.floor(rng() * colors.length)],
      size: 6 + Math.floor(rng() * 8),
      tx,
      ty,
      fallBonus: Math.floor(rng() * 80),
      delay: Math.floor(rng() * 120),
      shape: rng() > 0.55 ? "circle" : "square",
      spinDir: rng() > 0.5 ? 1 : -1,
    });
  }
  return result;
}

/**
 * Very small deterministic RNG (mulberry32-style) — same seed = same sequence.
 * Not cryptographically secure, intentionally.
 */
function seededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return ((h >>> 0) / 4294967295);
  };
}
