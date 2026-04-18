import type { Environment } from "./types";

/**
 * Candy environment — inspired by match-3 / mobile game reward reveals.
 * Saturated colors, glossy surfaces, confetti explosions.
 */
export const candyEnvironment: Environment = {
  id: "candy",
  displayName: "Candy",
  description:
    "Gloss, zucchero, colori pieni. Ispirato ai momenti premio dei giochi mobile.",
  palette: {
    primary: "#FF3D8A",    // vibrant pink (box body)
    secondary: "#FFD43D",  // candy yellow (ribbon + bow)
    accent: "#7BE0FF",     // sky cyan (sparkle highlights)
    background: "#2A0A3E", // deep plum (scene backdrop)
    surface: "#4A1563",    // mid purple (behind the box)
    textOnBg: "#FFFFFF",
    textOnSurface: "#FFFFFF",
    glow: "#FFEA75",       // warm golden halo
    confetti: [
      "#FF3D8A", // pink
      "#FFD43D", // yellow
      "#7BE0FF", // cyan
      "#9EFF6E", // mint
      "#FFB347", // orange
      "#FFFFFF", // white
    ],
  },
};
