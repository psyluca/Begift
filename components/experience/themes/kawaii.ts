import type { Environment } from "./types";

/**
 * Kawaii environment — soft washi-paper textures, pastel palette,
 * Japanese folklore spirit (kitsune, maneki-neko, daruma, sakura).
 */
export const kawaiiEnvironment: Environment = {
  id: "kawaii",
  displayName: "Kawaii",
  description:
    "Carta washi, pastelli delicati, spirito del folclore giapponese.",
  palette: {
    primary: "#F8B8C8",    // sakura pink (box body)
    secondary: "#E8B8D8",  // muted lilac (ribbon + bow)
    accent: "#FFD4A8",     // peach (sparkle highlights)
    background: "#FFF8F5", // warm cream (scene backdrop)
    surface: "#FFEEF2",    // blush cream (behind the box)
    textOnBg: "#3A2A2A",
    textOnSurface: "#3A2A2A",
    glow: "#FFE0D0",       // soft peach halo
    confetti: [
      "#F8B8C8", // sakura pink
      "#E8B8D8", // lilac
      "#FFD4A8", // peach
      "#C8E8D8", // mint
      "#F8E0B8", // butter
      "#B8D8F8", // sky pastel
    ],
  },
};
